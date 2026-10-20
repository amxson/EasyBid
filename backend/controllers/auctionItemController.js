import { Auction } from "../models/auctionSchema.js";
import { Bid } from "../models/bidSchema.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import { auctionTimes, moneyAmount } from "../utils/validation.js";

export const addNewAuctionItem = catchAsyncErrors(async (req, res, next) => {
  if (!req.files?.image || Array.isArray(req.files.image)) {
    return next(new ErrorHandler("Auction item image required.", 400));
  }

  const { image } = req.files;

  const allowedFormats = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedFormats.includes(image.mimetype)) {
    return next(new ErrorHandler("File format not supported.", 400));
  }

  const {
    title,
    description,
    category,
    condition,
    startingBid,
    startTime,
    endTime,
  } = req.body;
  if (
    !title ||
    !description ||
    !category ||
    !condition ||
    !startingBid ||
    !startTime ||
    !endTime
  ) {
    return next(new ErrorHandler("Please provide all details.", 400));
  }
  const times = auctionTimes(startTime, endTime);
  const price = moneyAmount(startingBid);
  const alreadyOneAuctionActive = await Auction.find({
    createdBy: req.user._id,
    endTime: { $gt: new Date().toISOString() },
  });
  if (alreadyOneAuctionActive.length > 0) {
    return next(new ErrorHandler("You already have one active auction.", 409));
  }
  try {
    const cloudinaryResponse = await cloudinary.uploader.upload(
      image.tempFilePath,
      {
        folder: "MERN_AUCTION_PLATFORM_AUCTIONS",
      },
    );
    if (!cloudinaryResponse || cloudinaryResponse.error) {
      console.error(
        "Cloudinary error:",
        cloudinaryResponse?.error || "Unknown cloudinary error.",
      );
      return next(
        new ErrorHandler("Failed to upload auction image to cloudinary.", 500),
      );
    }
    const auctionItem = await Auction.create({
      title,
      description,
      category,
      condition,
      startingBid: price,
      ...times,
      image: {
        public_id: cloudinaryResponse.public_id,
        url: cloudinaryResponse.secure_url,
      },
      createdBy: req.user._id,
    });
    return res.status(201).json({
      success: true,
      message: `Auction item created and will be listed on auction page at ${startTime}`,
      auctionItem,
    });
  } catch (error) {
    return next(error);
  }
});

export const getAllItems = catchAsyncErrors(async (req, res, next) => {
  let items = await Auction.find();
  res.status(200).json({
    success: true,
    items,
  });
});

export const getAuctionDetails = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid Id format.", 400));
  }
  const auctionItem = await Auction.findById(id);
  if (!auctionItem) {
    return next(new ErrorHandler("Auction not found.", 404));
  }
  const bidders = auctionItem.bids.sort((a, b) => b.amount - a.amount);
  res.status(200).json({
    success: true,
    auctionItem,
    bidders,
  });
});

export const getMyAuctionItems = catchAsyncErrors(async (req, res, next) => {
  const items = await Auction.find({ createdBy: req.user._id });
  res.status(200).json({
    success: true,
    items,
  });
});

export const removeFromAuction = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid Id format.", 400));
  }
  const auctionItem = await Auction.findById(id);
  if (!auctionItem) {
    return next(new ErrorHandler("Auction not found.", 404));
  }
  if (!auctionItem.createdBy.equals(req.user._id))
    throw new ErrorHandler("This auction belongs to another seller.", 403);
  const removed = await Auction.findOneAndDelete({
    _id: id,
    createdBy: req.user._id,
    "bids.0": { $exists: false },
  });
  if (!removed)
    throw new ErrorHandler("Auctions with bids cannot be deleted.", 409);
  await Bid.deleteMany({ auctionItem: id });
  res.status(200).json({
    success: true,
    message: "Auction item deleted successfully.",
  });
});

export const republishItem = catchAsyncErrors(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isObjectIdOrHexString(id))
    throw new ErrorHandler("Invalid auction ID.", 400);
  const auctionItem = await Auction.findById(id);
  if (!auctionItem) throw new ErrorHandler("Auction not found.", 404);
  if (!auctionItem.createdBy.equals(req.user._id))
    throw new ErrorHandler("This auction belongs to another seller.", 403);
  const times = auctionTimes(req.body.startTime, req.body.endTime);
  const updated = await Auction.findOneAndUpdate(
    {
      _id: id,
      createdBy: req.user._id,
      "bids.0": { $exists: false },
      $expr: {
        $lte: [
          { $convert: { input: "$endTime", to: "date", onError: null } },
          "$$NOW",
        ],
      },
    },
    {
      $set: {
        ...times,
        currentBid: 0,
        highestBidder: null,
        commissionCalculated: false,
      },
    },
    { new: true, runValidators: true },
  );
  if (!updated)
    throw new ErrorHandler(
      "Only ended auctions without bids can be republished. Create a new listing for a sold item.",
      409,
    );
  res.json({
    success: true,
    auctionItem: updated,
    message: "Auction republished.",
  });
});
