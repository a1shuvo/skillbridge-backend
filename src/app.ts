import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express, { Application } from "express";
import { auth } from "./lib/auth";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import { notFound } from "./middlewares/notFound";
import { authRouter } from "./modules/auth/auth.router";

const app: Application = express();

app.use(
  cors({
    origin: process.env.APP_URL || "http://localhost:3000",
    credentials: true,
  }),
);

app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json());

app.use("/api/v1/auth", authRouter);

app.get("/", (req, res) => {
  res.json({ success: true, message: "SkillBridge Backend Running 🚀" });
});

app.use(notFound);
app.use(globalErrorHandler);

export default app;
