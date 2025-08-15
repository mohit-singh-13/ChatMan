import express from "express";
import chatRouter from "./routes/chat.route";
import { config } from "dotenv";

config();
const PORT = Number(process.env.PORT);

const app = express();

app.use(express.json());
app.use("/api/chat", chatRouter);

app.listen(PORT, () => {
  console.log("Server up and running...");
});
