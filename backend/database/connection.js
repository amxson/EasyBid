import mongoose from "mongoose";

let pending;
export async function connection() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required.");
  if (!pending) {
    pending = mongoose
      .connect(process.env.MONGO_URI, {
        dbName: process.env.MONGO_DB_NAME || "MERN_AUCTION_PLATFORM",
        serverSelectionTimeoutMS: 10000,
        autoIndex: process.env.NODE_ENV !== "production",
      })
      .catch((error) => {
        pending = undefined;
        throw error;
      });
  }
  return pending;
}
