import { createHash } from "node:crypto";
import { RateLimit } from "../models/rateLimitSchema.js";
import { catchAsyncErrors } from "./catchAsyncErrors.js";
import ErrorHandler from "./error.js";

// Database-backed counters survive serverless cold starts and multiple workers.
export function rateLimit(name, limit, windowMs) {
  return catchAsyncErrors(async (req, res, next) => {
    const now = Date.now();
    const window = Math.floor(now / windowMs);
    const subject = req.user?.id || req.ip;
    const id = createHash("sha256")
      .update(`${name}:${subject}:${window}`)
      .digest("hex");
    let counter;
    try {
      counter = await RateLimit.findOneAndUpdate(
        { _id: id },
        {
          $inc: { count: 1 },
          $setOnInsert: { expiresAt: new Date((window + 1) * windowMs) },
        },
        { upsert: true, new: true },
      );
    } catch (error) {
      if (error.code !== 11000) throw error;
      counter = await RateLimit.findOneAndUpdate(
        { _id: id },
        { $inc: { count: 1 } },
        { new: true },
      );
    }
    if (counter.count > limit) {
      res.set(
        "Retry-After",
        String(Math.ceil(((window + 1) * windowMs - now) / 1000)),
      );
      throw new ErrorHandler("Too many attempts. Please try again later.", 429);
    }
    next();
  });
}
