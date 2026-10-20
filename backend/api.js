import app from "./app.js";
import { connection } from "./database/connection.js";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
export default async function handler(req, res) {
  try {
    await connection();
  } catch {
    return res
      .status(503)
      .json({ success: false, message: "Service temporarily unavailable." });
  }
  return app(req, res);
}
