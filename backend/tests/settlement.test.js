import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { Auction } from "../models/auctionSchema.js";
import { User } from "../models/userSchema.js";
import { PaymentProof } from "../models/commissionProofSchema.js";
import { Commission } from "../models/commissionSchema.js";
import { EmailJob } from "../models/emailJobSchema.js";
import {
  settleAuction,
  settleProof,
  deliverEmails,
} from "../services/settlement.js";
import { startTestServer, makeUser, makeAuction } from "./helpers.js";
let api, seller, bidder;
before(async () => {
  api = await startTestServer();
  await Promise.all([EmailJob.init(), Commission.init(), PaymentProof.init()]);
  seller = await makeUser("Auctioneer");
  bidder = await makeUser();
});
after(async () => {
  await api?.close();
});
const ended = (overrides = {}) =>
  makeAuction(seller, {
    endTime: new Date(Date.now() - 1000).toISOString(),
    ...overrides,
  });

test("simultaneous settlement workers record one win and add commission without losing previous debt", async () => {
  await User.updateOne({ _id: seller.id }, { $set: { unpaidCommission: 20 } });
  const auction = await ended({
    currentBid: 150,
    bids: [{ userId: bidder.id, amount: 150 }],
  });
  const results = await Promise.all([
    settleAuction(auction.id),
    settleAuction(auction.id),
  ]);
  assert.deepEqual(results.sort(), [false, true]);
  assert.equal((await User.findById(seller.id)).unpaidCommission, 27.5);
  assert.equal((await User.findById(bidder.id)).auctionsWon, 1);
  assert.equal((await User.findById(bidder.id)).moneySpent, 150);
  assert.equal(
    await EmailJob.countDocuments({ key: `auction:${auction.id}` }),
    1,
  );
});

test("no-bid auctions close once and active auctions stay open", async () => {
  const auction = await ended();
  assert.equal(await settleAuction(auction.id), true);
  assert.equal(await settleAuction(auction.id), false);
  assert.equal((await Auction.findById(auction.id)).commissionCalculated, true);
  const active = await makeAuction(seller);
  assert.equal(await settleAuction(active.id), false);
});

test("settlement failure rolls back the flag, balance and win count", async () => {
  const auction = await ended({
    currentBid: 200,
    bids: [{ userId: bidder.id, amount: 200 }],
  });
  const debt = (await User.findById(seller.id)).unpaidCommission;
  const wins = (await User.findById(bidder.id)).auctionsWon;
  const original = EmailJob.create;
  EmailJob.create = async () => {
    throw new Error("queue unavailable");
  };
  try {
    await assert.rejects(settleAuction(auction.id));
  } finally {
    EmailJob.create = original;
  }
  assert.equal(
    (await Auction.findById(auction.id)).commissionCalculated,
    false,
  );
  assert.equal((await User.findById(seller.id)).unpaidCommission, debt);
  assert.equal((await User.findById(bidder.id)).auctionsWon, wins);
});

test("two workers settle an approved proof exactly once", async () => {
  const proof = await PaymentProof.create({
    userId: seller.id,
    amount: 10,
    status: "Approved",
    proof: { public_id: "test", url: "https://example.com/proof.png" },
  });
  const debt = (await User.findById(seller.id)).unpaidCommission;
  const results = await Promise.all([
    settleProof(proof.id),
    settleProof(proof.id),
  ]);
  assert.deepEqual(results.sort(), [false, true]);
  assert.equal((await User.findById(seller.id)).unpaidCommission, debt - 10);
  assert.equal(await Commission.countDocuments({ user: seller.id }), 1);
  assert.equal((await PaymentProof.findById(proof.id)).status, "Settled");
});

test("an overpayment is left for review without clearing debt or recording revenue", async () => {
  const proof = await PaymentProof.create({
    userId: seller.id,
    amount: 9999,
    status: "Approved",
    proof: { public_id: "test", url: "https://example.com/proof.png" },
  });
  const debt = (await User.findById(seller.id)).unpaidCommission;
  await assert.rejects(settleProof(proof.id));
  assert.equal((await User.findById(seller.id)).unpaidCommission, debt);
  assert.equal((await PaymentProof.findById(proof.id)).status, "Approved");
});

test("mail failures leave a retryable queued job without changing settled balances", async () => {
  await EmailJob.deleteMany({});
  const job = await EmailJob.create({
    key: "test-mail",
    email: "test@example.com",
    subject: "Test",
    message: "Test",
  });
  await deliverEmails(async () => {
    throw new Error("SMTP unavailable");
  });
  assert.equal((await EmailJob.findById(job.id)).sentAt, undefined);
  await EmailJob.updateOne({ _id: job.id }, { $unset: { lockedUntil: 1 } });
  let sent = 0;
  await Promise.all([
    deliverEmails(async () => {
      sent++;
    }),
    deliverEmails(async () => {
      sent++;
    }),
  ]);
  assert.equal(sent, 1);
  assert.ok((await EmailJob.findById(job.id)).sentAt);
});
