import express from "express"
import { produceVideo } from "../controllers/video.controller";

const router = express.Router();

router.post("/produceVideo", produceVideo);

export default router;