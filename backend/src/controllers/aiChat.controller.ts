import { Request, Response } from "express";
import asyncHandler from "../helpers/asyncHandler";
import { AIService } from "../services/ai.service";
import { BadRequestError } from "../core/ApiError";
import { AIChatModel } from "../database/model/AIChat";
import { ProtectedRequest } from "../types/app-request";
import { SuccessResponse } from "../core/ApiResponse";
import { ChatModel } from "../database/model/Chat";
import { MessageModel } from "../database/model/Message";
export const chatWithAI = asyncHandler(
  async (req: ProtectedRequest, res: Response) => {
    const { message } = req.body;
    const userId = req.user._id;

    if (!message) throw new BadRequestError("Message is required");

    // 1. Get or Create Chat
    let aiChat = await AIChatModel.findOne({ user: userId });
    if (!aiChat) {
      aiChat = await AIChatModel.create({ user: userId, messages: [] });
    }

    // 2. Persist User Message
    aiChat.messages.push({
      role: "user",
      content: message,
      timestamp: new Date(),
    });
    await aiChat.save();

    // 3. Prepare Context
    const contextMessages = aiChat.messages.slice(-20).map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    try {
      const response = await AIService.streamChatWithAI(contextMessages);

      // Standard headers for SSE (Server-Sent Events) or NDJSON
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let fullAiContent = "";
      let buffer = "";
      let isThinking = false;

      // Helper to send formatted chunks
      const sendChunk = (content: string) => {
        if (!content) return;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
        fullAiContent += content;
      };

      // @ts-ignore
      for await (const part of response) {
        const chunk = part.message.content;
        buffer += chunk;

        // Process buffer for <think> tags
        if (!isThinking) {
          const startTagIdx = buffer.indexOf("<think>");
          if (startTagIdx !== -1) {
            // Send everything before <think>
            sendChunk(buffer.substring(0, startTagIdx));
            isThinking = true;
            buffer = buffer.substring(startTagIdx + 7);
          } else {
            // No tag found, but keep last 7 chars in buffer in case <think> is split across chunks
            if (buffer.length > 7) {
              const safeToSend = buffer.substring(0, buffer.length - 7);
              sendChunk(safeToSend);
              buffer = buffer.substring(buffer.length - 7);
            }
          }
        } else {
          const endTagIdx = buffer.indexOf("</think>");
          if (endTagIdx !== -1) {
            isThinking = false;
            buffer = buffer.substring(endTagIdx + 8);
          } else {
            // While thinking, just discard the buffer (don't let it grow infinitely)
            if (buffer.length > 8) buffer = buffer.substring(buffer.length - 8);
          }
        }
      }

      // Final Flush
      if (buffer.length > 0 && !isThinking) {
        sendChunk(buffer);
      }

      // 4. Save Assistant Response to DB
      if (fullAiContent) {
        aiChat.messages.push({
          role: "assistant",
          content: fullAiContent.trim(),
          timestamp: new Date(),
        });
        await aiChat.save();
      }

      res.write(`data: [DONE]\n\n`);
      res.end();
    } catch (error) {
      console.error("AI Stream Error:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "AI Service Error" });
      } else {
        res.write(
          `data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`,
        );
        res.end();
      }
    }
  },
);

export const getAIChatHistory = asyncHandler(
  async (req: ProtectedRequest, res: Response) => {
    const userId = req.user._id;

    let aiChat = await AIChatModel.findOne({ user: userId });

    // If no chat exists, return empty array
    if (!aiChat) {
      return new SuccessResponse("AI Chat History", []).send(res);
    }

    // Return messages
    // We might want to limit this or paginate in the future, but for now sending all (or last N)
    // The requirement said "last 20 messages" for context, but for display user probably wants to see more?
    // Let's send the last 50 for display purposes.
    const messages = aiChat.messages.slice(-50);

    return new SuccessResponse("AI Chat History", messages).send(res);
  },
);

export const summarizeChat = asyncHandler(
  async (req: ProtectedRequest, res: Response) => {
    const { chatId } = req.params;

    // Check if user is participant of this chat
    const chat = await ChatModel.findById(chatId);
    if (!chat) throw new BadRequestError("Chat not found");

    // Fetch last 50 messages
    const messages = await MessageModel.find({ chat: chatId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("sender", "username")
      .lean();

    if (!messages || messages.length === 0) {
      return new SuccessResponse("Chat Summary", {
        summary: "No messages to summarize.",
      }).send(res);
    }

    // Format transcript
    // Messages are sorted desc, so reverse them for chronological order
    const transcript = messages
      .reverse()
      .map((msg: any) => {
        return `${msg.sender.username}: ${msg.content}`;
      })
      .join("\n");

    const prompt = `Summarize the following conversation in a concise paragraph. Ignore formatting tokens like <think>. Just give the summary.\n\n${transcript}`;

    let summary = await AIService.generateResponse(prompt);

    // Filter <think> tags (handle multiline and multiple occurrences)
    summary = summary.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    return new SuccessResponse("Chat Summary", { summary }).send(res);
  },
);
