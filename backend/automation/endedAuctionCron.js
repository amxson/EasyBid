import cron from "node-cron";
import { processEndedAuctions, deliverEmails } from "../services/settlement.js";
export const endedAuctionCron = () =>
  cron.schedule("* * * * *", async () => {
    try {
      await processEndedAuctions();
      await deliverEmails();
    } catch (error) {
      console.error("Auction worker failed:", error.message);
    }
  });
