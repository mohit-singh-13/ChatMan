import express from "express";
import { chat, getAllChats, getChat } from "../controllers/chat.controller";

const router = express.Router();

router.post("/", chat);

router.get("/getAllChats", getAllChats);

router.get("/getChat/:conversationId", getChat);

export default router;
