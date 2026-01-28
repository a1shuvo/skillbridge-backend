import cors from "cors";
import express, { Application } from "express";

const app: Application = express();

app.use(
  cors({
    origin: process.env.APP_URL || "http://localhost:3000", // client side url
    credentials: true,
  }),
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

export default app;
