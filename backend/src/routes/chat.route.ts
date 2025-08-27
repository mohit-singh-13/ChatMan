import express from "express";
import {
  chat,
  deleteChat,
  getAllChats,
  getChat,
  renameChat,
} from "../controllers/chat.controller";

const router = express.Router();

router.post("/", chat);

router.get("/getAllChats", getAllChats);

router.get("/getChat/:conversationId", getChat);

router.put("/renameChat", renameChat);

router.delete("/deleteChat/:conversationId", deleteChat);

export default router;
