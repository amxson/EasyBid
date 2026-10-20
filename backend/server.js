import app from "./app.js";
import cloudinary from "cloudinary";
import { connection } from "./database/connection.js";
import { endedAuctionCron } from "./automation/endedAuctionCron.js";
import { verifyCommissionCron } from "./automation/verifyCommissionCron.js";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const port = process.env.PORT || 4000;
await connection();
if (process.env.DISABLE_CRON !== "true") {
  endedAuctionCron();
  verifyCommissionCron();
}
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
