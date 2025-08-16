import express from "express";
import chatRouter from "./routes/chat.route";
import { config } from "dotenv";
import cors from "cors";

config();
const PORT = Number(process.env.PORT);

const app = express();

app.use(express.json());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use("/api/chat", chatRouter);

app.listen(PORT, () => {
  console.log("Server up and running...");
});
