import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    key: { type: String, unique: true },
    email: String,
    subject: String,
    message: String,
    sentAt: Date,
    lockedUntil: Date,
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true },
);
export const EmailJob = mongoose.model("EmailJob", schema);
