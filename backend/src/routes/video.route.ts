import express from "express";
import { produceVideo } from "../controllers/video.controller";
import { isUser } from "../middlewares/auth.middleware";

const router = express.Router();

router.post("/produceVideo", isUser, produceVideo);

export default router;
