import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import { User } from "../models/userSchema.js";
import { Auction } from "../models/auctionSchema.js";
import { RateLimit } from "../models/rateLimitSchema.js";
import { startTestServer, makeUser, makeAuction } from "./helpers.js";
let api, user, seller, stranger;
before(async () => {
  api = await startTestServer();
  user = await makeUser();
  seller = await makeUser("Auctioneer");
  stranger = await makeUser("Auctioneer");
});
after(async () => {
  await api?.close();
});
const login = (email, password) =>
  api.request("/api/v1/user/login", {
    method: "POST",
    body: { email, password },
  });

test("login rejects missing and invalid credentials without leaking password hashes", async () => {
  assert.equal((await login(user.email, undefined)).status, 400);
  assert.equal((await login(user.email, "wrong-password")).status, 401);
  assert.equal((await login({ $ne: null }, "TestPassword123!")).status, 400);
  const response = await login(user.email.toUpperCase(), "TestPassword123!");
  assert.equal(response.status, 200);
  assert.equal(response.data.user.password, undefined);
  assert.equal(response.data.token, undefined);
  assert.equal((await User.findById(user.id)).password, undefined);
  assert.equal(
    (await api.request("/api/v1/user/me", { user })).data.user.tokenVersion,
    undefined,
  );
});

test("public signup cannot create an administrator", async () => {
  assert.equal(
    (
      await api.request("/api/v1/user/register", {
        method: "POST",
        body: { role: "Super Admin" },
      })
    ).status,
    400,
  );
});

test("saving a profile does not rehash the existing password", async () => {
  const before = (await User.findById(user.id).select("+password")).password;
  user.address = "Addis Ababa";
  await user.save();
  assert.equal(
    (await User.findById(user.id).select("+password")).password,
    before,
  );
});

test("public leaderboard includes no private account fields", async () => {
  await User.updateOne({ _id: user.id }, { $set: { moneySpent: 150 } });
  const { data } = await api.request("/api/v1/user/leaderboard");
  assert.ok(data.leaderboard.length);
  for (const item of data.leaderboard)
    for (const key of [
      "email",
      "phone",
      "address",
      "paymentMethods",
      "password",
    ])
      assert.equal(item[key], undefined);
});

test("password recovery sends a hashed, expiring token and reset revokes old sessions", async () => {
  const original = nodemailer.createTransport;
  let mail;
  nodemailer.createTransport = () => ({
    sendMail: async (value) => {
      mail = value;
    },
  });
  const oldCookie = `token=${user.generateJsonWebToken()}`;
  try {
    const known = await api.request("/api/v1/user/password/forgot", {
      method: "POST",
      body: { email: user.email },
    });
    const unknown = await api.request("/api/v1/user/password/forgot", {
      method: "POST",
      body: { email: "unknown@example.com" },
    });
    assert.deepEqual(known.data, unknown.data);
    const token = mail.text.match(/reset-password\/([a-f0-9]{64})/)[1];
    const record = await User.findById(user.id).select(
      "+resetPasswordToken +resetPasswordExpires",
    );
    assert.notEqual(record.resetPasswordToken, token);
    assert.equal(
      record.resetPasswordToken,
      createHash("sha256").update(token).digest("hex"),
    );
    assert.ok(record.resetPasswordExpires > new Date());
    const body = {
      password: "Replacement123!",
      confirmPassword: "Replacement123!",
    };
    const responses = await Promise.all(
      [1, 2].map(() =>
        api.request(`/api/v1/user/password/reset/${token}`, {
          method: "PUT",
          body,
        }),
      ),
    );
    assert.deepEqual(responses.map((r) => r.status).sort(), [200, 400]);
    assert.equal(
      (await api.request("/api/v1/user/me", { cookie: oldCookie })).status,
      401,
    );
    assert.equal((await login(user.email, "TestPassword123!")).status, 401);
    const fresh = await login(user.email, "Replacement123!");
    assert.equal(fresh.status, 200);
    assert.equal(
      (
        await api.request("/api/v1/user/me", {
          cookie: fresh.headers.get("set-cookie").split(";")[0],
        })
      ).status,
      200,
    );
  } finally {
    nodemailer.createTransport = original;
  }
});

test("expired reset links cannot change passwords", async () => {
  const token = randomBytes(32).toString("hex");
  await User.updateOne(
    { _id: user.id },
    {
      $set: {
        resetPasswordToken: createHash("sha256").update(token).digest("hex"),
        resetPasswordExpires: new Date(Date.now() - 1000),
      },
    },
  );
  assert.equal(
    (
      await api.request(`/api/v1/user/password/reset/${token}`, {
        method: "PUT",
        body: {
          password: "AnotherPassword1",
          confirmPassword: "AnotherPassword1",
        },
      })
    ).status,
    400,
  );
});

test("invalid and deleted-user sessions return 401", async () => {
  assert.equal(
    (await api.request("/api/v1/user/me", { cookie: "token=invalid" })).status,
    401,
  );
  const deleted = await makeUser();
  const token = jwt.sign({ id: deleted.id }, process.env.JWT_SECRET_KEY);
  await deleted.deleteOne();
  assert.equal(
    (await api.request("/api/v1/user/me", { cookie: `token=${token}` })).status,
    401,
  );
});

test("seller mutations require ownership and preserve auctions with bids", async () => {
  const auction = await makeAuction(seller);
  const path = `/api/v1/auctionitem/delete/${auction.id}`;
  assert.equal(
    (await api.request(path, { method: "DELETE", user: stranger })).status,
    403,
  );
  assert.ok(await Auction.findById(auction.id));
  assert.equal(
    (await api.request(path, { method: "DELETE", user: seller })).status,
    200,
  );
  const withBids = await makeAuction(seller, {
    bids: [{ userId: user._id, amount: 150 }],
    currentBid: 150,
  });
  assert.equal(
    (
      await api.request(`/api/v1/auctionitem/delete/${withBids.id}`, {
        method: "DELETE",
        user: seller,
      })
    ).status,
    409,
  );
  const body = {
    startTime: new Date(Date.now() + 60000).toISOString(),
    endTime: new Date(Date.now() + 600000).toISOString(),
  };
  assert.equal(
    (
      await api.request(`/api/v1/auctionitem/item/republish/${withBids.id}`, {
        method: "PUT",
        user: stranger,
        body,
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await api.request(`/api/v1/auctionitem/item/republish/${withBids.id}`, {
        method: "PUT",
        user: seller,
        body,
      })
    ).status,
    409,
  );
});

test("rate limits survive separate requests and return Retry-After", async () => {
  await RateLimit.deleteMany({});
  for (let i = 0; i < 5; i++)
    assert.equal(
      (
        await api.request("/api/v1/user/password/forgot", {
          method: "POST",
          body: { email: "none@example.com" },
        })
      ).status,
      200,
    );
  const result = await api.request("/api/v1/user/password/forgot", {
    method: "POST",
    body: { email: "none@example.com" },
  });
  assert.equal(result.status, 429);
  assert.ok(Number(result.headers.get("Retry-After")) > 0);
});

test("logout clears the production cookie with matching security attributes", async () => {
  const current = await makeUser();
  process.env.NODE_ENV = "production";
  try {
    const result = await api.request("/api/v1/user/logout", {
      method: "POST",
      user: current,
    });
    assert.equal(result.status, 200);
    const cookie = result.headers.get("set-cookie");
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /Secure/);
    assert.match(cookie, /SameSite=None/);
  } finally {
    process.env.NODE_ENV = "test";
  }
});
