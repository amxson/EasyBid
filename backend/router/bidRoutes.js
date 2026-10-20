import express from "express";
import { placeBid } from "../controllers/bidController.js";
import { isAuthenticated, isAuthorized } from "../middlewares/auth.js";

const router = express.Router();

router.post("/place/:id", isAuthenticated, isAuthorized("Bidder"), placeBid);

export default router;
