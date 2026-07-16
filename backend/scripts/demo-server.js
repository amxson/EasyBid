import "dotenv/config";
import { MongoMemoryServer } from "mongodb-memory-server-core";
import mongoose from "mongoose";
import { seedDemoData } from "./seed.js";

const mongo = await MongoMemoryServer.create({ instance: { dbName: "MERN_AUCTION_PLATFORM" } });
process.env.MONGO_URI = mongo.getUri();
process.env.DISABLE_CRON = "true";
await seedDemoData(process.env.MONGO_URI);
await mongoose.disconnect();
await import("../server.js");

const shutdown = async () => {
  await mongoose.disconnect();
  await mongo.stop();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
