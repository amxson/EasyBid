import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { Auction } from "../models/auctionSchema.js";
import { Bid } from "../models/bidSchema.js";
import { startTestServer, makeUser, makeAuction } from "./helpers.js";
let api, seller, bidder, other;
before(async () => {
  api = await startTestServer();
  seller = await makeUser("Auctioneer");
  bidder = await makeUser();
  other = await makeUser();
});
after(async () => {
  await api?.close();
});
const bid = (id, amount, user = bidder) =>
  api.request(`/api/v1/bid/place/${id}`, {
    method: "POST",
    user,
    body: { amount },
  });

test("two simultaneous equal bids accept exactly one and persist one winner", async () => {
  for (let run = 0; run < 5; run++) {
    const auction = await makeAuction(seller);
    const results = await Promise.all([
      bid(auction.id, 150),
      bid(auction.id, 150, other),
    ]);
    assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
    const saved = await Auction.findById(auction.id);
    const records = await Bid.find({ auctionItem: auction.id });
    assert.equal(saved.currentBid, 150);
    assert.equal(saved.bids.length, 1);
    assert.equal(records.length, 1);
    assert.equal(String(saved.highestBidder), String(records[0].bidder.id));
  }
});

test("competing amounts never lower the price; repeated bids update one bidder", async () => {
  const auction = await makeAuction(seller);
  const results = await Promise.all([
    bid(auction.id, 150),
    bid(auction.id, 200, other),
  ]);
  assert.equal(results[1].status, 201);
  assert.ok([201, 409].includes(results[0].status));
  assert.equal((await Auction.findById(auction.id)).currentBid, 200);
  assert.equal((await bid(auction.id, "250.25", other)).status, 201);
  assert.equal(
    await Bid.countDocuments({
      auctionItem: auction.id,
      "bidder.id": other._id,
    }),
    1,
  );
  assert.equal(
    (await Auction.findById(auction.id)).bids.filter((b) =>
      b.userId.equals(other._id),
    ).length,
    1,
  );
});

test("a Bid write failure rolls back the auction update", async () => {
  const auction = await makeAuction(seller);
  const original = Bid.updateOne;
  Bid.updateOne = async () => {
    throw new Error("simulated storage failure");
  };
  try {
    assert.equal((await bid(auction.id, 150)).status, 500);
  } finally {
    Bid.updateOne = original;
  }
  assert.equal((await Auction.findById(auction.id)).currentBid, 0);
  assert.equal(await Bid.countDocuments({ auctionItem: auction.id }), 0);
});

test("invalid amounts are 400 without changing the auction", async () => {
  const auction = await makeAuction(seller);
  for (const amount of [
    undefined,
    null,
    "",
    -1,
    0,
    "Infinity",
    "NaN",
    true,
    {},
    [],
    "1e3",
    "150.001",
    99,
  ]) {
    assert.equal((await bid(auction.id, amount)).status, 400, String(amount));
  }
  assert.equal((await Auction.findById(auction.id)).currentBid, 0);
});

test("HTTP errors distinguish invalid, absent, unauthenticated, forbidden and closed resources", async () => {
  const auction = await makeAuction(seller);
  assert.equal((await bid("bad-id", 150)).status, 400);
  assert.equal((await bid(new mongoose.Types.ObjectId(), 150)).status, 404);
  assert.equal((await bid(auction.id, 150, null)).status, 401);
  assert.equal((await bid(auction.id, 150, seller)).status, 403);
  const future = await makeAuction(seller, {
    startTime: new Date(Date.now() + 60000).toISOString(),
  });
  const ended = await makeAuction(seller, {
    endTime: new Date(Date.now() - 1).toISOString(),
  });
  assert.equal((await bid(future.id, 150)).status, 409);
  assert.equal((await bid(ended.id, 150)).status, 409);
  assert.equal((await api.request("/api/missing")).status, 404);
});

test("the database write rejects a bid if the deadline passes after validation", async () => {
  const auction = await makeAuction(seller, {
    endTime: new Date(Date.now() + 150).toISOString(),
  });
  const original = Auction.findOneAndUpdate;
  Auction.findOneAndUpdate = async (...args) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return original.apply(Auction, args);
  };
  try {
    assert.equal((await bid(auction.id, 150)).status, 409);
  } finally {
    Auction.findOneAndUpdate = original;
  }
  assert.equal((await Auction.findById(auction.id)).currentBid, 0);
  assert.equal(await Bid.countDocuments({ auctionItem: auction.id }), 0);
});
