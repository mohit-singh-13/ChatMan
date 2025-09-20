import express from "express";
import cors from "cors";
import { config } from "dotenv";
import chatRouter from "./routes/chat.route";
import videoController from "./routes/video.route";
import authRouter from "./routes/auth.route";

config();
const PORT = Number(process.env.PORT);

const app = express();

app.use(express.json());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

app.use("/api/auth", authRouter);
app.use("/api/chat", chatRouter);
app.use("/api/video", videoController);

app.listen(PORT, () => {
  console.log("Server up and running...");
});
