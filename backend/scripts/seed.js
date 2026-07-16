import "dotenv/config";
import mongoose from "mongoose";
import { fileURLToPath } from "node:url";
import { User } from "../models/userSchema.js";
import { Auction } from "../models/auctionSchema.js";
import { Bid } from "../models/bidSchema.js";
import { Commission } from "../models/commissionSchema.js";
import { PaymentProof } from "../models/commissionProofSchema.js";

const avatar = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=d6482b&color=fff&size=256`;

export async function seedDemoData(mongoUri = process.env.MONGO_URI) {
  if (!mongoUri) throw new Error("MONGO_URI is required to seed demo data.");
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri, { dbName: "MERN_AUCTION_PLATFORM" });
  }

  await Promise.all([
    User.deleteMany({}),
    Auction.deleteMany({}),
    Bid.deleteMany({}),
    Commission.deleteMany({}),
    PaymentProof.deleteMany({}),
  ]);

  const common = {
    password: "Demo1234!",
    phone: "09123456789",
    address: "Addis Ababa, Ethiopia",
  };
  const [admin, auctioneer, bidder, bidderTwo, bidderThree] = await User.create([
    { ...common, userName: "EasyBid Admin", email: "admin@easybid.demo", role: "Super Admin", profileImage: { public_id: "demo-admin", url: avatar("EasyBid Admin") } },
    { ...common, userName: "Maya Auctions", email: "auctioneer@easybid.demo", role: "Auctioneer", unpaidCommission: 2450, profileImage: { public_id: "demo-auctioneer", url: avatar("Maya Auctions") }, paymentMethods: { bankTransfer: { bankAccountNumber: "1000123456789", bankAccountName: "Maya Auctions", bankName: "Commercial Bank of Ethiopia" }, Telebirr: { TelebirrAccountNumber: 911223344 }, paypal: { paypalEmail: "maya@example.com" } } },
    { ...common, userName: "Noah Bekele", email: "bidder@easybid.demo", role: "Bidder", auctionsWon: 4, moneySpent: 184000, profileImage: { public_id: "demo-bidder", url: avatar("Noah Bekele") } },
    { ...common, userName: "Liya Tesfaye", email: "liya@easybid.demo", role: "Bidder", auctionsWon: 3, moneySpent: 137500, profileImage: { public_id: "demo-liya", url: avatar("Liya Tesfaye") } },
    { ...common, userName: "Samuel Kassa", email: "samuel@easybid.demo", role: "Bidder", auctionsWon: 2, moneySpent: 98200, profileImage: { public_id: "demo-samuel", url: avatar("Samuel Kassa") } },
  ]);

  const now = Date.now();
  const auctionSpecs = [
    ["Sony Alpha Mirrorless Camera", "Professional 4K mirrorless camera. Includes 28-70mm lens, battery and carrying case. Excellent condition for creators and photographers", 42000, "Electronics", "Used", "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=85", -2, 120],
    ["MacBook Pro 14-inch", "Powerful Apple laptop with a brilliant Liquid Retina XDR display. Ideal for design, development and video production", 78000, "Computers", "Used", "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=85", -1, 150],
    ["Vintage Automatic Watch", "Classic automatic timepiece with stainless steel case. Recently serviced and presented in a premium gift box", 12500, "Collectibles", "Used", "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1200&q=85", -3, 90],
    ["Modern Lounge Chair", "Statement lounge chair with solid wood frame and premium upholstery. A refined centerpiece for a modern interior", 18000, "Home & Furniture", "New", "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1200&q=85", 3, 45],
    ["Classic Road Bicycle", "Lightweight road bicycle with responsive handling. Tuned, inspected and ready for city rides or weekend training", 26000, "Sports", "Used", "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1200&q=85", -30, -7],
  ];

  const auctions = [];
  for (let index = 0; index < auctionSpecs.length; index += 1) {
    const [title, description, startingBid, category, condition, url, startDays, endDays] = auctionSpecs[index];
    const active = endDays > 0 && startDays < 0;
    auctions.push(await Auction.create({
      title, description, startingBid, category, condition,
      currentBid: active ? startingBid + 8500 + index * 1200 : index === 4 ? 33500 : 0,
      startTime: new Date(now + startDays * 86400000).toISOString(),
      endTime: new Date(now + endDays * 86400000).toISOString(),
      image: { public_id: `demo-auction-${index + 1}`, url },
      createdBy: auctioneer._id,
      highestBidder: active || index === 4 ? bidder._id : undefined,
      commissionCalculated: index === 4,
    }));
  }

  for (const [auctionIndex, amounts] of [[0, [50500, 48750, 46100]], [1, [88900, 86100, 82500]], [2, [24600, 22800, 20250]]]) {
    const auction = auctions[auctionIndex];
    const people = [bidder, bidderTwo, bidderThree];
    auction.bids = people.map((person, index) => ({ userId: person._id, userName: person.userName, profileImage: person.profileImage.url, amount: amounts[index] }));
    auction.currentBid = amounts[0];
    auction.highestBidder = bidder._id;
    await auction.save();
    await Bid.insertMany(people.map((person, index) => ({ amount: amounts[index], bidder: { id: person._id, userName: person.userName, profileImage: person.profileImage.url }, auctionItem: auction._id })));
  }

  await Commission.insertMany([
    { amount: 1850, user: auctioneer._id, createdAt: new Date(now - 120 * 86400000) },
    { amount: 2450, user: auctioneer._id, createdAt: new Date(now - 60 * 86400000) },
    { amount: 1675, user: auctioneer._id, createdAt: new Date(now - 15 * 86400000) },
  ]);
  await PaymentProof.insertMany([
    { userId: auctioneer._id, proof: { public_id: "demo-proof-1", url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1000&q=85" }, amount: 1850, comment: "Bank transfer for completed bicycle auction commission.", status: "Approved", uploadedAt: new Date(now - 8 * 86400000) },
    { userId: auctioneer._id, proof: { public_id: "demo-proof-2", url: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1000&q=85" }, amount: 2450, comment: "Telebirr payment confirmation for current commission balance.", status: "Pending", uploadedAt: new Date(now - 86400000) },
  ]);

  console.log(`Seeded ${await User.countDocuments()} users, ${await Auction.countDocuments()} auctions, ${await Bid.countDocuments()} bids and ${await PaymentProof.countDocuments()} payment proofs.`);
  return { admin, auctioneer, bidder, auctions };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  seedDemoData().then(() => mongoose.disconnect()).catch((error) => { console.error(error); process.exit(1); });
}
