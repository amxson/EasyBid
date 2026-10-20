import express from "express";
import { rateLimit } from "../middlewares/rateLimit.js";
import {
  contact,
  forgotPassword,
  resetPassword,
  fetchLeaderboard,
  getProfile,
  login,
  logout,
  register,
} from "../controllers/userController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.post("/contact", rateLimit("contact", 5, 3600000), contact);
router.post("/register", rateLimit("register", 10, 3600000), register);
router.post("/login", rateLimit("login", 30, 900000), login);
router.post(
  "/password/forgot",
  rateLimit("forgot", 5, 3600000),
  forgotPassword,
);
router.put(
  "/password/reset/:token",
  rateLimit("reset", 15, 900000),
  resetPassword,
);
router.get("/me", isAuthenticated, getProfile);
router.post("/logout", isAuthenticated, logout);
router.get("/leaderboard", fetchLeaderboard);

export default router;
