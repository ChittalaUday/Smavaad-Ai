import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import { aiServiceUrl } from "../config";
import { InternalError } from "../core/ApiError";
import { Readable } from "stream";
import ollama from "ollama";

export interface Segment {
  start: number;
  end: number;
  speaker: string;
  text: string;
}

export interface TranscribeResponse {
  status: string;
  segments: Segment[];
}

export interface ChatMessage {
  role: string;
  content: string;
}

export class AIService {
  static async transcribeAudio(filePath: string): Promise<Segment[]> {
    try {
      const form = new FormData();
      form.append("file", fs.createReadStream(filePath));

      const response = await axios.post<TranscribeResponse>(
        `${aiServiceUrl}/transcribe`,
        form,
        {
          headers: {
            ...form.getHeaders(),
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        },
      );

      return response.data.segments;
    } catch (error) {
      console.error("AI Service Error:", error);
      throw new InternalError("Failed to transcribe audio");
    }
  }
  static async streamChatWithAI(messages: ChatMessage[]) {
    try {
      const response = await ollama.chat({
        model: "deepseek-r1:7b",
        messages: messages,
        stream: true,
      });

      return response;
    } catch (error) {
      console.error("AI Service Chat Error:", error);
      throw new InternalError("Failed to initiate chat with AI");
    }
  }

  static async generateResponse(prompt: string) {
    try {
      const response = await ollama.generate({
        model: "deepseek-r1:7b",
        prompt: prompt,
        stream: false,
      });
      return response.response;
    } catch (error) {
      console.error("AI Service Generate Error:", error);
      throw new InternalError("Failed to generate AI response");
    }
  }
}
