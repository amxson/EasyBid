import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    minLength: [3, "Username must contain at least 3 characters."],
    maxLength: [40, "Username cannot exceed 40 characters."],
  },
  password: {
    type: String,
    select: false,
    minLength: [8, "Password must contain at least 8 characters."],
  },
  email: { type: String, trim: true, lowercase: true, required: true },
  resetPasswordToken: { type: String, select: false },
  resetPasswordExpires: { type: Date, select: false },
  tokenVersion: { type: Number, default: 0, select: false },
  passwordChangedAt: { type: Date, select: false },
  address: String,
  phone: {
    type: String,
    validate: {
      validator: (value) => /^\+?[0-9]{9,15}$/.test(value),
      message: "Enter a valid phone number with 9 to 15 digits.",
    },
  },
  profileImage: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  paymentMethods: {
    bankTransfer: {
      bankAccountNumber: String,
      bankAccountName: String,
      bankName: String,
    },
    Telebirr: {
      TelebirrAccountNumber: String,
    },
    paypal: {
      paypalEmail: String,
    },
  },
  role: {
    type: String,
    enum: ["Auctioneer", "Bidder", "Super Admin"],
  },
  unpaidCommission: {
    type: Number,
    default: 0,
  },
  auctionsWon: {
    type: Number,
    default: 0,
  },
  moneySpent: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.index(
  { email: 1 },
  {
    unique: true,
    name: "email_case_insensitive_unique",
    collation: { locale: "en", strength: 2 },
  },
);
userSchema.set("toJSON", {
  transform(doc, ret) {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    delete ret.passwordChangedAt;
    delete ret.tokenVersion;
    return ret;
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateJsonWebToken = function () {
  return jwt.sign(
    { id: this._id, version: this.tokenVersion || 0 },
    process.env.JWT_SECRET_KEY,
    {
      expiresIn: process.env.JWT_EXPIRE,
    },
  );
};

export const User = mongoose.model("User", userSchema);
