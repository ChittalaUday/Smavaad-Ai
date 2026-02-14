import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import { aiServiceUrl, aiConfig } from "../config";
import { InternalError } from "../core/ApiError";
import { Readable } from "stream";
import ollama from "ollama";
import { GroqService } from "./groq.service";
import { PDFService } from "./pdf.service";

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
    const primaryInfo =
      aiConfig.primaryProvider === "groq" ? "Groq" : "Default (Python)";
    console.log(`Using primary Transcription provider: ${primaryInfo}`);

    if (aiConfig.primaryProvider === "groq") {
      try {
        return await GroqService.transcribeAudio(filePath);
      } catch (error) {
        console.error(
          "Groq Transcription Failed, falling back to default:",
          error,
        );
        // Fallback to default (Python service)
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
        } catch (defaultError) {
          console.error("Default Transcription Failed:", defaultError);
          throw new InternalError(
            "Failed to transcribe audio (Both providers failed)",
          );
        }
      }
    } else {
      // Default (Python) primary
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
        console.error(
          "Default Transcription Failed, falling back to Groq:",
          error,
        );
        // Fallback to Groq
        try {
          return await GroqService.transcribeAudio(filePath);
        } catch (groqError) {
          console.error("Groq Fallback Transcription Failed:", groqError);
          throw new InternalError(
            "Failed to transcribe audio (Both providers failed)",
          );
        }
      }
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
      // 1. Try Python Service (if available)
      const url = `${aiServiceUrl.replace(/\/api$/, "")}/api/call-summarize`; // Ensure no double /api

      const response = await axios.post<SummaryResponse>(url, {
        transcript,
        intents,
      });
      return response.data;
    } catch (error) {
      console.warn(
        "AI Python Service Summary Failed (likely offline), falling back to Groq/LLM:",
        (error as any).message,
      );

      // 2. Fallback to Groq / LLM
      try {
        const prompt = `
You are an expert meeting assistant. Analyze the following meeting transcript and provide a structured summary.

Transcript:
"""
${transcript.slice(0, 15000)} 
"""

Output strictly valid JSON with the following structure:
{
  "summary": "A comprehensive summary of the discussion...",
  "action_items": [
    { "task": "Specific task", "owner": "Person name or Role (if mentioned)", "deadline": "Timeframe (if mentioned)" }
  ],
  "key_topics": ["Topic 1", "Topic 2", "Topic 3"]
}
`;

        if (aiConfig.primaryProvider === "groq") {
          return await GroqService.getJsonCompletion<SummaryResponse>(prompt);
        } else {
          // Default to Ollama fallback if configured, otherwise try Groq as fallback
          try {
            const response = await ollama.generate({
              model: "deepseek-r1:7b",
              prompt: prompt + "\nRespond with JSON only.",
              format: "json",
              stream: false,
            });
            return JSON.parse(response.response);
          } catch (ollamaError) {
            console.warn("Ollama fallback failed, trying Groq...", ollamaError);
            return await GroqService.getJsonCompletion<SummaryResponse>(prompt);
          }
        }
      } catch (llmError) {
        console.error("All AI Summary attempts failed:", llmError);
        throw new InternalError(
          "Failed to summarize call (All providers failed)",
        );
      }
    }
  }

  static async generatePdf(
    summary: string,
    actionItems: any[],
    keyTopics: string[],
  ): Promise<string> {
    try {
      // Use local PDFService instead of external Python service
      const pdfBase64 = await PDFService.generateMeetingReport(
        summary,
        actionItems,
        keyTopics,
      );
      return pdfBase64;
    } catch (error) {
      console.error("AI Service PDF Error:", error);
      throw new InternalError("Failed to generate PDF");
    }
  }
}
