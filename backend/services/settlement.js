import mongoose from "mongoose";
import { Auction } from "../models/auctionSchema.js";
import { User } from "../models/userSchema.js";
import { PaymentProof } from "../models/commissionProofSchema.js";
import { Commission } from "../models/commissionSchema.js";
import { EmailJob } from "../models/emailJobSchema.js";
import { sendEmail } from "../utils/sendEmail.js";

export async function settleAuction(id) {
  return mongoose.connection.transaction(async (session) => {
    const auction = await Auction.findOneAndUpdate(
      {
        _id: id,
        commissionCalculated: false,
        $expr: {
          $lte: [
            { $convert: { input: "$endTime", to: "date", onError: null } },
            "$$NOW",
          ],
        },
      },
      { $set: { commissionCalculated: true } },
      { new: true, session },
    );
    if (!auction) return false;
    const winner = [...auction.bids].sort((a, b) => b.amount - a.amount)[0];
    if (!winner) return true;
    const seller = await User.findById(auction.createdBy).session(session);
    const bidder = await User.findById(winner.userId).session(session);
    if (!seller || !bidder || winner.amount !== auction.currentBid)
      throw new Error("Auction settlement data is incomplete.");
    const commission = Math.round(auction.currentBid * 5) / 100;
    await User.updateOne(
      { _id: seller._id },
      { $inc: { unpaidCommission: commission } },
      { session },
    );
    await User.updateOne(
      { _id: bidder._id },
      { $inc: { moneySpent: winner.amount, auctionsWon: 1 } },
      { session },
    );
    await Auction.updateOne(
      { _id: id },
      { $set: { highestBidder: bidder._id } },
      { session },
    );
    await EmailJob.create(
      [
        {
          key: `auction:${id}`,
          email: bidder.email,
          subject: `You won: ${auction.title}`,
          message: `Hello ${bidder.userName},\n\nYou won ${auction.title} for ${winner.amount} Birr. Contact the seller at ${seller.email} to arrange payment and collection. Confirm the item and payment details with the seller before paying.\n\nEasyBid`,
        },
      ],
      { session },
    );
    return true;
  });
}

export async function settleProof(id) {
  return mongoose.connection.transaction(async (session) => {
    const proof = await PaymentProof.findOneAndUpdate(
      { _id: id, status: "Approved" },
      { $set: { status: "Settled" } },
      { new: true, session },
    );
    if (!proof) return false;
    if (!Number.isFinite(proof.amount) || proof.amount <= 0)
      throw new Error("Proof amount must be positive.");
    const user = await User.findOneAndUpdate(
      { _id: proof.userId, unpaidCommission: { $gte: proof.amount } },
      { $inc: { unpaidCommission: -proof.amount } },
      { new: true, session },
    );
    if (!user)
      throw new Error(
        "Approved payment exceeds outstanding commission; review the proof.",
      );
    await Commission.create([{ amount: proof.amount, user: user._id }], {
      session,
    });
    await EmailJob.create(
      [
        {
          key: `proof:${id}`,
          email: user.email,
          subject: "EasyBid commission payment settled",
          message: `Hello ${user.userName},\n\nYour payment of ${proof.amount} Birr has been verified. Outstanding commission: ${user.unpaidCommission} Birr.\n\nEasyBid`,
        },
      ],
      { session },
    );
    return true;
  });
}

export async function deliverEmails(sender = sendEmail) {
  for (let i = 0; i < 25; i++) {
    const job = await EmailJob.findOneAndUpdate(
      {
        sentAt: null,
        attempts: { $lt: 5 },
        $or: [{ lockedUntil: null }, { lockedUntil: { $lt: new Date() } }],
      },
      {
        $set: { lockedUntil: new Date(Date.now() + 300000) },
        $inc: { attempts: 1 },
      },
      { new: true },
    );
    if (!job) break;
    try {
      await sender({
        email: job.email,
        subject: job.subject,
        message: job.message,
      });
      await EmailJob.updateOne(
        { _id: job._id },
        { $set: { sentAt: new Date() }, $unset: { lockedUntil: 1 } },
      );
    } catch {
      // Keep the lease for five minutes before retrying. Settlement is already durable.
      console.error(
        `Email job ${job.id} delivery failed (attempt ${job.attempts}).`,
      );
    }
  }
}

export async function processEndedAuctions() {
  const auctions = await Auction.find({
    commissionCalculated: false,
    $expr: {
      $lte: [
        { $convert: { input: "$endTime", to: "date", onError: null } },
        "$$NOW",
      ],
    },
  })
    .select("_id")
    .limit(100);
  for (const auction of auctions) {
    try {
      await settleAuction(auction.id);
    } catch (error) {
      console.error(`Auction ${auction.id} could not settle:`, error.message);
    }
  }
}
export async function processApprovedProofs() {
  const proofs = await PaymentProof.find({ status: "Approved" })
    .select("_id")
    .limit(100);
  for (const proof of proofs) {
    try {
      await settleProof(proof.id);
    } catch (error) {
      console.error(`Proof ${proof.id} could not settle:`, error.message);
    }
  }
}
