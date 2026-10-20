import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { v2 as cloudinary } from "cloudinary";
import { User } from "../models/userSchema.js";
import { RateLimit } from "../models/rateLimitSchema.js";
import { startTestServer, makeUser } from "./helpers.js";

let api, seller, originalUpload, image, uploads = [];
before(async () => {
  api = await startTestServer();
  seller = await makeUser("Auctioneer");
  seller.unpaidCommission = 200;
  await seller.save();
  image = await readFile(new URL("../../frontend/public/imageHolder.jpg", import.meta.url));
  originalUpload = cloudinary.uploader.upload;
});
beforeEach(async () => {
  uploads = [];
  await RateLimit.deleteMany({});
  cloudinary.uploader.upload = async (path, options) => {
    uploads.push(options);
    return { public_id: "test-upload", secure_url: "https://example.com/profile.jpg" };
  };
});
after(async () => {
  cloudinary.uploader.upload = originalUpload;
  await api?.close();
});
const details = {
  userName: "Test Registration", email: "signup@example.com", phone: "+12025550123",
  address: "Test address", password: "Registration123!", role: "Bidder",
};
function form(values, field = "profileImage", bytes = image, mime = "image/jpeg", name = "photo.jpg") {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  data.set(field, new Blob([bytes], { type: mime }), name);
  return data;
}
const register = (body) => api.request("/api/v1/user/register", { method: "POST", body });

test("registration rejects missing or blank required fields before uploading", async () => {
  for (const values of [{ role: "Bidder" }, { ...details, userName: "   " }, { ...details, phone: "123" }, { ...details, password: "short" }]) {
    assert.equal((await register(form(values))).status, 400);
  }
  assert.equal(uploads.length, 0);
  assert.equal(await User.countDocuments({ email: details.email }), 0);
});
test("registration rejects videos, empty files, and videos relabeled as JPEG", async () => {
  for (const [bytes, mime, name] of [[Buffer.from('video'), 'video/mp4', 'video.mp4'], [Buffer.alloc(0), 'image/jpeg', 'empty.jpg'], [Buffer.from('0000ftypmp42video'), 'image/jpeg', 'fake.jpg']]) {
    const response = await register(form(details, 'profileImage', bytes, mime, name));
    assert.equal(response.status, 400);
    assert.match(response.data.message, /image|video/i);
  }
  assert.equal(uploads.length, 0);
});
test("uploads over 4 MB return 413 without creating a user", async () => {
  const response = await register(form(details, 'profileImage', Buffer.alloc(4 * 1024 * 1024 + 1)));
  assert.equal(response.status, 413);
  assert.match(response.data.message, /4 MB/);
  assert.equal(uploads.length, 0);
});
test("auctioneer signup requires complete and valid receiving details", async () => {
  for (const payment of [{}, { bankName: 'CBE' }, { TelebirrAccountNumber: 'bad' }, { paypalEmail: 'bad' }]) {
    assert.equal((await register(form({ ...details, role: 'Auctioneer', ...payment }))).status, 400);
  }
  assert.equal(uploads.length, 0);
});
test("valid signup uploads only an image with a bounded provider timeout", async () => {
  const result = await register(form(details));
  assert.equal(result.status, 201);
  assert.equal(result.data.user.password, undefined);
  assert.equal(uploads[0].resource_type, 'image');
  assert.equal(uploads[0].timeout, 30000);
  assert.equal((await register(form(details))).status, 409);
  assert.equal(uploads.length, 1);
});
test("provider image rejection and unavailability return useful errors without creating accounts", async () => {
  for (const [code, expected] of [[400, 400], [500, 503]]) {
    cloudinary.uploader.upload = async () => { throw { http_code: code, message: 'provider diagnostic' }; };
    const result = await register(form({ ...details, email: `failure${code}@example.com` }));
    assert.equal(result.status, expected);
    assert.match(result.data.message, /image|upload/i);
    assert.doesNotMatch(result.data.message, /provider diagnostic/);
  }
});
test("auction photos and payment proofs also reject videos and spoofed image types", async () => {
  const auctioneer = await makeUser('Auctioneer');
  const auction = { title: 'Valid title', description: 'Valid description', category: 'Electronics', condition: 'Used', startingBid: '100.50', startTime: new Date(Date.now() + 3600000).toISOString(), endTime: new Date(Date.now() + 7200000).toISOString() };
  for (const [path, values, field] of [['/api/v1/auctionitem/create', auction, 'image'], ['/api/v1/commission/proof', { amount: '100.50', comment: 'Receipt attached' }, 'proof']]) {
    for (const mime of ['video/mp4', 'image/jpeg']) {
      const result = await api.request(path, { method: 'POST', user: field === 'image' ? auctioneer : seller, body: form(values, field, Buffer.from('not an image'), mime) });
      assert.equal(result.status, 400);
    }
  }
  assert.equal(uploads.length, 0);
});

test("valid auction and payment images still create their intended records", async () => {
  const auctioneer = await makeUser('Auctioneer');
  const auction = { title: 'Valid title', description: 'Valid description', category: 'Electronics', condition: 'Used', startingBid: '100.50', startTime: new Date(Date.now() + 3600000).toISOString(), endTime: new Date(Date.now() + 7200000).toISOString() };
  const listing = await api.request('/api/v1/auctionitem/create', { method: 'POST', user: auctioneer, body: form(auction, 'image') });
  assert.equal(listing.status, 201);
  const proof = await api.request('/api/v1/commission/proof', { method: 'POST', user: seller, body: form({ amount: '100.50', comment: 'Receipt attached' }, 'proof') });
  assert.equal(proof.status, 201);
  assert.deepEqual(uploads.map(value => value.folder), ['MERN_AUCTION_PLATFORM_AUCTIONS', 'MERN_AUCTION_PAYMENT_PROOFS']);
});
