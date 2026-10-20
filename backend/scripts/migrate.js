import "dotenv/config";
import mongoose from "mongoose";
import { connection } from "../database/connection.js";
import { User } from "../models/userSchema.js";
import { Auction } from "../models/auctionSchema.js";
import { RateLimit } from "../models/rateLimitSchema.js";
import { EmailJob } from "../models/emailJobSchema.js";

try {
  await connection();
  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  if (!hello.setName && hello.msg !== "isdbgrid")
    throw new Error(
      "Use a MongoDB replica set or Atlas. Bidding and settlement require transactions.",
    );
  const users = await User.find().select("email").lean();
  const seen = new Set();
  for (const user of users) {
    const email = user.email?.trim().toLowerCase();
    if (!email || seen.has(email))
      throw new Error(
        `Missing or duplicate email at user ${user._id}. Resolve it before migrating; no records have been deleted.`,
      );
    seen.add(email);
  }
  const auctions = await Auction.find().select("startTime endTime").lean();
  for (const auction of auctions) {
    if (
      ![auction.startTime, auction.endTime].every((value) =>
        Number.isFinite(new Date(value).getTime()),
      )
    )
      throw new Error(
        `Invalid dates on auction ${auction._id}. Repair them before migrating.`,
      );
  }
  // Preflight above completes before any writes. These updates are safe to rerun.
  for (const user of users)
    await User.updateOne(
      { _id: user._id },
      { $set: { email: user.email.trim().toLowerCase() } },
    );
  for (const auction of auctions)
    await Auction.updateOne(
      { _id: auction._id },
      {
        $set: {
          startTime: new Date(auction.startTime).toISOString(),
          endTime: new Date(auction.endTime).toISOString(),
        },
      },
    );
  await User.createIndexes();
  await RateLimit.createIndexes();
  await EmailJob.createIndexes();
  console.log(
    `Migration complete: checked ${users.length} users and ${auctions.length} auctions; indexes are ready.`,
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
