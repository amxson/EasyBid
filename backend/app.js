import { timingSafeEqual } from "node:crypto";
import {
  processEndedAuctions,
  processApprovedProofs,
  deliverEmails,
} from "./services/settlement.js";
import express from "express";
import helpRouter from "./router/helpRoutes.js";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import { errorMiddleware } from "./middlewares/error.js";
import userRouter from "./router/userRoutes.js";
import auctionItemRouter from "./router/auctionItemRoutes.js";
import bidRouter from "./router/bidRoutes.js";
import commissionRouter from "./router/commissionRouter.js";
import superAdminRouter from "./router/superAdminRoutes.js";

const app = express();
dotenv.config();
app.disable("x-powered-by");
if (process.env.VERCEL) app.set("trust proxy", 1);

app.use(
  cors({
    origin: (process.env.FRONTEND_URL || "http://localhost:5173")
      .split(",")
      .map((origin) => origin.trim()),
    methods: ["POST", "GET", "PUT", "DELETE"],
    credentials: true, // This allows cookies and other credentials to be sent
  }),
);

app.use((req, res, next) => {
  const allowed = (process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim());
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    req.headers.origin &&
    !allowed.includes(req.headers.origin)
  ) {
    return res
      .status(403)
      .json({ success: false, message: "Origin not allowed." });
  }
  next();
});
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
    limits: { fileSize: 5 * 1024 * 1024 },
    abortOnLimit: true,
  }),
);

app.use("/api/v1/help", helpRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/auctionitem", auctionItemRouter);
app.use("/api/v1/bid", bidRouter);
app.use("/api/v1/commission", commissionRouter);
app.use("/api/v1/superadmin", superAdminRouter);

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "EasyBid API is running" });
});

app.get("/api/internal/jobs", async (req, res, next) => {
  const expected = `Bearer ${process.env.CRON_SECRET || ""}`;
  const actual = req.headers.authorization || "";
  const expectedBytes = Buffer.from(expected);
  const actualBytes = Buffer.from(actual);
  if (
    !process.env.CRON_SECRET ||
    actualBytes.length !== expectedBytes.length ||
    !timingSafeEqual(actualBytes, expectedBytes)
  ) {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }
  try {
    await processEndedAuctions();
    await processApprovedProofs();
    await deliverEmails();
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});
app.use((req, res) =>
  res.status(404).json({ success: false, message: "Route not found." }),
);
app.use(errorMiddleware);

export default app;
