import express from "express";
import {
  chat,
  deleteChat,
  getAllChats,
  getChat,
  renameChat,
} from "../controllers/chat.controller";
import { isUser } from "../middlewares/auth.middleware";

const router = express.Router();

router.post("/", isUser, chat);

router.get("/getAllChats", isUser, getAllChats);

router.get("/getChat/:conversationId", isUser, getChat);

router.put("/renameChat", isUser, renameChat);

router.delete("/deleteChat/:conversationId", isUser, deleteChat);

export default router;
