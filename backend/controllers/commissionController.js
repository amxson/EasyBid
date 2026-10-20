import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { PaymentProof } from "../models/commissionProofSchema.js";
import { User } from "../models/userSchema.js";
import { Auction } from "../models/auctionSchema.js";
import mongoose from "mongoose";
import { moneyAmount } from "../utils/validation.js";
import { validateImage, uploadImage } from "../utils/imageUpload.js";

export const calculateCommission = async (auctionId) => {
  if (!mongoose.Types.ObjectId.isValid(auctionId)) {
    throw new ErrorHandler("Invalid Auction Id format.", 400);
  }
  const auction = await Auction.findById(auctionId);
  if (!auction) throw new ErrorHandler("Auction not found.", 404);
  const commissionRate = 0.05;
  const commission =
    Math.round(auction.currentBid * commissionRate * 100) / 100;
  return commission;
};

export const proofOfCommission = catchAsyncErrors(async (req, res, next) => {
  if (!req.files?.proof || Array.isArray(req.files.proof)) {
    return next(new ErrorHandler("Payment Proof Screenshot required.", 400));
  }
  const { proof } = req.files;
  const { comment } = req.body;
  const amount = moneyAmount(req.body.amount);
  const user = await User.findById(req.user._id);

  if (typeof comment !== "string" || !comment.trim() || comment.trim().length > 2000) {
    return next(
      new ErrorHandler("Enter a comment of 1 to 2,000 characters.", 400),
    );
  }
  await validateImage(proof);

  if (user.unpaidCommission === 0) {
    return res.status(200).json({
      success: true,
      message: "You don't have any unpaid commissions.",
    });
  }

  if (user.unpaidCommission < amount) {
    return next(
      new ErrorHandler(
        `The amount exceeds your unpaid commission balance. Please enter an amount up to ${user.unpaidCommission}`,
        400,
      ),
    );
  }

  const cloudinaryResponse = await uploadImage(proof, "MERN_AUCTION_PAYMENT_PROOFS");
  const commissionProof = await PaymentProof.create({
    userId: req.user._id,
    proof: {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    },
    amount,
    comment: comment.trim(),
  });
  res.status(201).json({
    success: true,
    message:
      "Your proof has been submitted successfully and is awaiting review.",
    commissionProof,
  });
});
