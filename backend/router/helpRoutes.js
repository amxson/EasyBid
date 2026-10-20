import express from "express";
import mongoose from "mongoose";
import { Auction } from "../models/auctionSchema.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { rateLimit } from "../middlewares/rateLimit.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { moneyAmount } from "../utils/validation.js";
import { auctionContext, guideAnswer, aiAnswer } from "../services/bidHelp.js";
const router = express.Router();
const enabled = () =>
  Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL);
router.get("/status", (req, res) =>
  res.json({ success: true, aiAvailable: enabled() }),
);
router.post(
  "/ask",
  isAuthenticated,
  rateLimit("help", 20, 3600000),
  catchAsyncErrors(async (req, res) => {
    const { message, auctionId, budget, useAI, history = [] } = req.body;
    if (typeof message !== "string" || !message.trim() || message.length > 1000)
      throw new ErrorHandler("Ask a question of 1 to 1000 characters.", 400);
    if (!mongoose.isObjectIdOrHexString(auctionId))
      throw new ErrorHandler("Invalid auction ID.", 400);
    if (
      !Array.isArray(history) ||
      history.length > 6 ||
      history.some(
        (item) =>
          !item ||
          !["user", "assistant"].includes(item.role) ||
          typeof item.content !== "string" ||
          item.content.length > 6000,
      )
    )
      throw new ErrorHandler("Invalid conversation.", 400);
    const auction = await Auction.findById(auctionId);
    if (!auction) throw new ErrorHandler("Auction not found.", 404);
    const limit =
      budget === undefined || budget === "" ? undefined : moneyAmount(budget);
    const fallback = guideAnswer(message, auction, limit);
    if (useAI === true && enabled()) {
      try {
        const answer = await aiAnswer(
          message,
          auctionContext(auction),
          limit,
          history.map(({ role, content }) => ({ role, content })),
        );
        return res.json({ success: true, answer, mode: "ai" });
      } catch {
        return res.json({
          success: true,
          answer: fallback,
          mode: "guide",
          notice: "AI help is unavailable. Showing the auction guide.",
        });
      }
    }
    res.json({ success: true, answer: fallback, mode: "guide" });
  }),
);
export default router;
