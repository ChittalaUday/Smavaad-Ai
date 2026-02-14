import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import { aiServiceUrl, aiConfig } from "../config";
import { InternalError } from "../core/ApiError";
import { Readable } from "stream";
import ollama from "ollama";
import { GroqService } from "./groq.service";

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
    const primaryInfo = aiConfig.primaryProvider === "groq" ? "Groq" : "Ollama";
    console.log(`Using primary AI provider: ${primaryInfo}`);

    if (aiConfig.primaryProvider === "groq") {
      try {
        return await GroqService.getChatStream(messages as any);
      } catch (error) {
        console.error("Groq Primary Failed, falling back to Ollama:", error);
        // Fallback to Ollama
        try {
          return await ollama.chat({
            model: "deepseek-r1:7b",
            messages: messages,
            stream: true,
          });
        } catch (ollamaError) {
          console.error("Ollama Fallback Failed:", ollamaError);
          throw new InternalError(
            "AI Service unavailable (Both Groq and Ollama failed)",
          );
        }
      }
    } else {
      // Default to Ollama primary
      try {
        return await ollama.chat({
          model: "deepseek-r1:7b",
          messages: messages,
          stream: true,
        });
      } catch (error) {
        console.error("Ollama Primary Failed, falling back to Groq:", error);
        // Fallback to Groq
        try {
          return await GroqService.getChatStream(messages as any);
        } catch (groqError) {
          console.error("Groq Fallback Failed:", groqError);
          throw new InternalError(
            "AI Service unavailable (Both Ollama and Groq failed)",
          );
        }
      }
    }
  }

  static async generateResponse(prompt: string) {
    if (aiConfig.primaryProvider === "groq") {
      try {
        return await GroqService.getChatCompletion(prompt);
      } catch (error) {
        console.error(
          "Groq Primary Generate Failed, falling back to Ollama:",
          error,
        );
        try {
          const response = await ollama.generate({
            model: "deepseek-r1:7b",
            prompt: prompt,
            stream: false,
          });
          return response.response;
        } catch (ollamaError) {
          console.error("Ollama Fallback Generate Failed:", ollamaError);
          throw new InternalError("AI Service unavailable");
        }
      }
    } else {
      try {
        const response = await ollama.generate({
          model: "deepseek-r1:7b",
          prompt: prompt,
          stream: false,
        });
        return response.response;
      } catch (error) {
        console.error(
          "Ollama Primary Generate Failed, falling back to Groq:",
          error,
        );
        try {
          return await GroqService.getChatCompletion(prompt);
        } catch (groqError) {
          console.error("Groq Fallback Generate Failed:", groqError);
          throw new InternalError("AI Service unavailable");
        }
      }
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
