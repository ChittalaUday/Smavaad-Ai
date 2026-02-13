import express from "express";
import { chatWithAI, getAIChatHistory } from "../controllers/aiChat.controller";
import { verifyJWT } from "../middlewares/auth.middlewares";
import { summarizeChat } from "../controllers/aiChat.controller";
const router = express.Router();

router.use(verifyJWT);

router.post("/chat/ai", chatWithAI);
router.get("/chat/ai", getAIChatHistory);
router.post("/chat/ai/summarize/:chatId", summarizeChat);

export default router;
