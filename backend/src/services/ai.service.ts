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

export interface ActionItem {
  task: string;
  owner?: string;
  deadline?: string;
}

export interface SummaryResponse {
  summary: string;
  action_items: ActionItem[];
  key_topics: string[];
  pdf_report?: string; // base64
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

  static async summarizeCall(
    transcript: string,
    intents?: any[],
  ): Promise<SummaryResponse> {
    try {
      const response = await axios.post<SummaryResponse>(
        `${aiServiceUrl}/api/call-summarize`,
        { transcript, intents },
      );
      return response.data;
    } catch (error) {
      console.error("AI Service Summary Error:", error);
      throw new InternalError("Failed to summarize call");
    }
  }

  static async generatePdf(
    summary: string,
    actionItems: any[],
    keyTopics: string[],
  ): Promise<string> {
    try {
      const response = await axios.post<{ pdf_report: string }>(
        `${aiServiceUrl}/api/generate-pdf`,
        { summary, action_items: actionItems, key_topics: keyTopics },
      );
      return response.data.pdf_report;
    } catch (error) {
      console.error("AI Service PDF Error:", error);
      throw new InternalError("Failed to generate PDF");
    }
  }
}
