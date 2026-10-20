import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server-core";
import { User } from "../models/userSchema.js";
import { Auction } from "../models/auctionSchema.js";
import app from "../app.js";

export async function startTestServer() {
  process.env.JWT_SECRET_KEY = "test-only-secret-with-sufficient-length";
  process.env.JWT_EXPIRE = "1h";
  process.env.COOKIE_EXPIRE = "1";
  const mongo = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
    instanceOpts: [
      {
        args: [
          ...(process.platform === "win32" ? [] : ["--nounixsocket"]),
          "--setParameter",
          "diagnosticDataCollectionEnabled=false",
        ],
      },
    ],
  });
  await mongoose.connect(mongo.getUri());
  await User.init();
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  return {
    async request(path, { user, cookie, method = "GET", body } = {}) {
      const multipart = body instanceof FormData;
      const response = await fetch(`${url}${path}`, {
        method,
        headers: {
          ...(body && !multipart ? { "Content-Type": "application/json" } : {}),
          ...(user || cookie
            ? { Cookie: cookie || `token=${user.generateJsonWebToken()}` }
            : {}),
        },
        body: multipart ? body : body ? JSON.stringify(body) : undefined,
      });
      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { message: text }; }
      return {
        status: response.status,
        data,
        headers: response.headers,
      };
    },
    async close() {
      await new Promise((resolve) => server.close(resolve));
      await mongoose.disconnect();
      await mongo.stop();
    },
  };
}
let sequence = 0;
export function makeUser(role = "Bidder") {
  sequence++;
  return User.create({
    userName: `Test User ${sequence}`,
    email: `user${sequence}@example.com`,
    password: "TestPassword123!",
    role,
    phone: "09123456789",
    profileImage: { public_id: "test", url: "https://example.com/avatar.png" },
  });
}
export function makeAuction(user, overrides = {}) {
  return Auction.create({
    title: "Test auction",
    startingBid: 100,
    currentBid: 0,
    startTime: new Date(Date.now() - 60000).toISOString(),
    endTime: new Date(Date.now() + 600000).toISOString(),
    createdBy: user._id,
    image: { public_id: "test", url: "https://example.com/item.png" },
    ...overrides,
  });
}
