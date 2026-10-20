import cron from "node-cron";
import { processApprovedProofs } from "../services/settlement.js";
export const verifyCommissionCron = () =>
  cron.schedule("* * * * *", async () => {
    try {
      await processApprovedProofs();
    } catch (error) {
      console.error("Commission worker failed:", error.message);
    }
  });
