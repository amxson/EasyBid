import { createHash, randomBytes } from "node:crypto";
import { sendEmail } from "../utils/sendEmail.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { User } from "../models/userSchema.js";
import { v2 as cloudinary } from "cloudinary";
import { cookieOptions, generateToken } from "../utils/jwtToken.js";

const emailQuery = (email) => ({
  email: {
    $regex: `^${email.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
    $options: "i",
  },
});

export const register = catchAsyncErrors(async (req, res, next) => {
  if (!["Bidder", "Auctioneer"].includes(req.body.role)) {
    return next(new ErrorHandler("Choose Bidder or Auctioneer.", 400));
  }
  if (!req.files?.profileImage || Array.isArray(req.files.profileImage)) {
    return next(new ErrorHandler("Profile Image Required.", 400));
  }

  const { profileImage } = req.files;

  const allowedFormats = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedFormats.includes(profileImage.mimetype)) {
    return next(new ErrorHandler("File format not supported.", 400));
  }

  const {
    userName,
    email,
    password,
    phone,
    address,
    role,
    bankAccountNumber,
    bankAccountName,
    bankName,
    TelebirrAccountNumber,
    paypalEmail,
  } = req.body;

  if (!userName || !email || !phone || !password || !address || !role) {
    return next(new ErrorHandler("Please fill full form.", 400));
  }
  if (role === "Auctioneer") {
    const bankComplete = bankAccountName && bankAccountNumber && bankName;
    const bankPartial = bankAccountName || bankAccountNumber || bankName;
    if (bankPartial && !bankComplete)
      return next(
        new ErrorHandler("Complete all bank fields or leave them empty.", 400),
      );
    if (!bankComplete && !TelebirrAccountNumber && !paypalEmail)
      return next(
        new ErrorHandler(
          "Add a bank account, Telebirr number, or PayPal email for receiving payment.",
          400,
        ),
      );
  }
  if (
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    typeof password !== "string" ||
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return next(
      new ErrorHandler(
        "Use a valid email and a password of 8 to 72 characters.",
        400,
      ),
    );
  }
  const isRegistered = await User.findOne(emailQuery(email));
  if (isRegistered) {
    return next(new ErrorHandler("User already registered.", 409));
  }
  const cloudinaryResponse = await cloudinary.uploader.upload(
    profileImage.tempFilePath,
    {
      folder: "MERN_AUCTION_PLATFORM_USERS",
    },
  );
  if (!cloudinaryResponse || cloudinaryResponse.error) {
    console.error(
      "Cloudinary error:",
      cloudinaryResponse?.error || "Unknown cloudinary error.",
    );
    return next(
      new ErrorHandler("Failed to upload profile image to cloudinary.", 500),
    );
  }
  const user = await User.create({
    userName,
    email,
    password,
    phone,
    address,
    role,
    profileImage: {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    },
    paymentMethods: {
      bankTransfer: {
        bankAccountNumber,
        bankAccountName,
        bankName,
      },
      Telebirr: {
        TelebirrAccountNumber,
      },
      paypal: {
        paypalEmail,
      },
    },
  });
  generateToken(user, "User Registered.", 201, res);
});

export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return next(new ErrorHandler("Enter your email and password.", 400));
  }
  const user = await User.findOne(emailQuery(email)).select(
    "+password +tokenVersion",
  );
  if (!user) {
    return next(new ErrorHandler("Invalid credentials.", 401));
  }
  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    return next(new ErrorHandler("Invalid credentials.", 401));
  }
  generateToken(user, "Login successfully.", 200, res);
});

export const getProfile = catchAsyncErrors(async (req, res, next) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    user,
  });
});

export const logout = catchAsyncErrors(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", "", {
      expires: new Date(Date.now()),
      ...cookieOptions(),
    })
    .json({
      success: true,
      message: "Logout Successfully.",
    });
});

export const fetchLeaderboard = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find({ moneySpent: { $gt: 0 } }).select(
    "userName profileImage moneySpent auctionsWon",
  );
  const leaderboard = users.sort((a, b) => b.moneySpent - a.moneySpent);
  res.status(200).json({
    success: true,
    leaderboard,
  });
});

export const forgotPassword = catchAsyncErrors(async (req, res) => {
  if (
    typeof req.body.email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email.trim())
  ) {
    throw new ErrorHandler("Enter a valid email address.", 400);
  }
  const user = await User.findOne(emailQuery(req.body.email));
  if (user) {
    const token = randomBytes(32).toString("hex");
    const hash = createHash("sha256").update(token).digest("hex");
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          resetPasswordToken: hash,
          resetPasswordExpires: new Date(Date.now() + 15 * 60000),
        },
      },
    );
    const baseUrl = (
      process.env.PASSWORD_RESET_URL ||
      process.env.FRONTEND_URL ||
      "http://localhost:5173"
    )
      .split(",")[0]
      .trim()
      .replace(/\/$/, "");
    try {
      await sendEmail({
        email: user.email,
        subject: "Reset your EasyBid password",
        message: `Use this link within 15 minutes to reset your password:\n${baseUrl}/reset-password/${token}\n\nIf you did not request this, ignore this email.`,
      });
    } catch {
      await User.updateOne(
        { _id: user._id, resetPasswordToken: hash },
        { $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 } },
      );
      console.error("Password reset email could not be delivered.");
    }
  }
  // Use the same response for registered and unknown addresses.
  res.json({
    success: true,
    message:
      "If that address has an account, a reset link will arrive shortly.",
  });
});

export const resetPassword = catchAsyncErrors(async (req, res) => {
  const { password, confirmPassword } = req.body;
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > 72 ||
    password !== confirmPassword
  ) {
    throw new ErrorHandler(
      "Use matching passwords of 8 to 72 characters.",
      400,
    );
  }
  if (!/^[a-f0-9]{64}$/.test(req.params.token))
    throw new ErrorHandler("Reset link is invalid or expired.", 400);
  const token = createHash("sha256").update(req.params.token).digest("hex");
  const bcrypt = await import("bcrypt");
  const hash = await bcrypt.default.hash(password, 10);
  // Atomically consume the token so two reset requests cannot both succeed.
  const user = await User.findOneAndUpdate(
    { resetPasswordToken: token, resetPasswordExpires: { $gt: new Date() } },
    {
      $set: { password: hash, passwordChangedAt: new Date() },
      $inc: { tokenVersion: 1 },
      $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 },
    },
  );
  if (!user) throw new ErrorHandler("Reset link is invalid or expired.", 400);
  res
    .clearCookie("token", cookieOptions())
    .json({ success: true, message: "Password updated. You can now log in." });
});

export const contact = catchAsyncErrors(async (req, res) => {
  const { name, email, phone = "", subject, message } = req.body;
  if (
    [name, email, phone, subject, message].some(
      (value) => typeof value !== "string",
    ) ||
    !name.trim() ||
    !subject.trim() ||
    !message.trim() ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    name.length > 100 ||
    subject.length > 150 ||
    message.length > 4000 ||
    phone.length > 30
  ) {
    throw new ErrorHandler(
      "Enter your name, a valid email, a subject, and a message of up to 4000 characters.",
      400,
    );
  }
  const destination = process.env.CONTACT_EMAIL || process.env.SMTP_MAIL;
  if (!destination || !process.env.SMTP_HOST)
    throw new ErrorHandler("Message service is temporarily unavailable.", 503);
  try {
    await sendEmail({
      email: destination,
      subject: `EasyBid contact: ${subject.replace(/[\r\n]/g, " ")}`,
      message: `From: ${name}\nEmail: ${email}\nPhone: ${phone}\n\n${message}`,
    });
  } catch {
    throw new ErrorHandler("Message service is temporarily unavailable.", 503);
  }
  res.json({
    success: true,
    message: "Your message has been sent. Thank you for getting in touch.",
  });
});
