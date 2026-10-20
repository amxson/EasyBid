import "dotenv/config";
import { MongoMemoryReplSet } from "mongodb-memory-server-core";
import mongoose from "mongoose";
import { seedDemoData } from "./seed.js";

const mongo = await MongoMemoryReplSet.create({
  replSet: { count: 1 },
  instanceOpts: [
    {
      args: [
        "--nounixsocket",
        "--setParameter",
        "diagnosticDataCollectionEnabled=false",
      ],
    },
  ],
});
process.env.MONGO_URI = mongo.getUri();
process.env.DISABLE_CRON = "true";
await seedDemoData(process.env.MONGO_URI, { allowReset: true });
await mongoose.disconnect();
await import("../server.js");

const shutdown = async () => {
  await mongoose.disconnect();
  await mongo.stop();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
