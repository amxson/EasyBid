import mongoose from "mongoose";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { Auction } from "../models/auctionSchema.js";
import { Bid } from "../models/bidSchema.js";
import { moneyAmount } from "../utils/validation.js";

export const placeBid = catchAsyncErrors(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isObjectIdOrHexString(id))
    throw new ErrorHandler("Invalid auction ID.", 400);
  const amount = moneyAmount(req.body.amount);
  let currentBid;
  // A conflicting transaction is retried against a fresh snapshot. The price,
  // embedded bidder list, and Bid record either all commit or all roll back.
  await mongoose.connection.transaction(async (session) => {
    const auction = await Auction.findById(id).session(session);
    if (!auction) throw new ErrorHandler("Auction not found.", 404);
    if (auction.createdBy.equals(req.user._id))
      throw new ErrorHandler("You cannot bid on your own auction.", 403);
    const now = Date.now();
    if (
      ![auction.startTime, auction.endTime].every((value) =>
        Number.isFinite(new Date(value).getTime()),
      )
    )
      throw new ErrorHandler(
        "Auction times need to be corrected by the seller.",
        409,
      );
    if (new Date(auction.startTime).getTime() > now)
      throw new ErrorHandler("Auction has not started yet.", 409);
    if (
      new Date(auction.endTime).getTime() <= now ||
      auction.commissionCalculated
    )
      throw new ErrorHandler("Auction has ended.", 409);
    if (amount < auction.startingBid)
      throw new ErrorHandler("Bid must meet the starting price.", 400);
    if (amount <= auction.currentBid)
      throw new ErrorHandler(
        "The price has changed. Bid above the current bid.",
        409,
      );
    const bidder = {
      userId: req.user._id,
      userName: req.user.userName,
      profileImage: req.user.profileImage?.url,
      amount,
    };
    const bids = auction.bids.filter((bid) => !bid.userId.equals(req.user._id));
    bids.push(bidder);
    const updated = await Auction.findOneAndUpdate(
      {
        _id: id,
        currentBid: auction.currentBid,
        commissionCalculated: false,
        // Check the deadline again using database time, including legacy dates.
        $expr: {
          $and: [
            {
              $lte: [
                {
                  $convert: { input: "$startTime", to: "date", onError: null },
                },
                "$$NOW",
              ],
            },
            {
              $gt: [
                { $convert: { input: "$endTime", to: "date", onError: null } },
                "$$NOW",
              ],
            },
          ],
        },
      },
      { $set: { currentBid: amount, highestBidder: req.user._id, bids } },
      { new: true, session, runValidators: true },
    );
    if (!updated)
      throw new ErrorHandler(
        "Auction changed or ended. Refresh and try again.",
        409,
      );
    await Bid.updateOne(
      { auctionItem: auction._id, "bidder.id": req.user._id },
      {
        $set: {
          amount,
          bidder: {
            id: req.user._id,
            userName: bidder.userName,
            profileImage: bidder.profileImage,
          },
        },
      },
      { upsert: true, session, runValidators: true },
    );
    currentBid = updated.currentBid;
  });
  res.status(201).json({ success: true, message: "Bid placed.", currentBid });
});
