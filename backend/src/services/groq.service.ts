import fs from "fs";
import Groq from "groq-sdk";
import { groqConfig } from "../config";

const groq = new Groq({ apiKey: groqConfig.apiKey });

// Default model to use.
const DEFAULT_MODEL = groqConfig.model || "llama-3.3-70b-versatile";

// Hardcoded fallback models for CHAT COMPLETIONS ONLY (no audio/whisper models)
const STATIC_FALLBACK_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "qwen/qwen3-32b",
  "meta-llama/llama-4-maverick-17b-128e-instruct",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "groq/compound",
  "groq/compound-mini",
  "moonshotai/kimi-k2-instruct-0905",
  "moonshotai/kimi-k2-instruct",
  "allam-2-7b",
];

export interface GroqCompletionOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  systemPrompt?: string;
}

const blockedModels = new Map<string, number>();

let cachedModels: string[] = [];
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fetches available models from Groq API or returns cached/static list.
 */
async function getAvailableModels(): Promise<string[]> {
  const now = Date.now();
  if (cachedModels.length > 0 && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedModels;
  }

  try {
    const list = await groq.models.list();
    const models = list.data
      .map((m: any) => m.id)
      .filter((id: string) => typeof id === "string");

    if (models.length > 0) {
      cachedModels = models;
      lastFetchTime = now;
      console.log(`Fetched ${models.length} models from Groq API.`);
      return models;
    }
  } catch (error) {
    console.warn(
      "Failed to fetch models from Groq API, using static fallback:",
      error,
    );
  }

  return STATIC_FALLBACK_MODELS;
}

/**
 * Helper to parse retry duration from Groq error message.
 */
function parseRetryAfter(message: string): number {
  const match = message.match(/try again in (\d+m)?(\d+(\.\d+)?s)?/);
  if (!match) return 60 * 1000; // Default 1 minute

  let ms = 0;
  if (match[1]) {
    ms += parseInt(match[1]) * 60 * 1000;
  }
  if (match[2]) {
    ms += parseFloat(match[2]) * 1000;
  }
  return ms > 0 ? ms : 60 * 1000;
}

/**
 * Helper to retry an operation with fallback models on rate limit errors.
 */
async function withModelFallback<T>(
  operation: (model: string) => Promise<T>,
  preferredModel: string = DEFAULT_MODEL,
): Promise<T> {
  const availableModels = await getAvailableModels();
  const now = Date.now();

  // Clean up expired blocks
  for (const [model, blockedUntil] of blockedModels.entries()) {
    if (now > blockedUntil) {
      blockedModels.delete(model);
    }
  }

  // Ensure preferred model is first, then unique available models (excluding preferred)
  const allModels = [
    preferredModel,
    ...availableModels.filter((m: string) => m !== preferredModel),
  ];

  // Filter out blocked models
  const modelsToTry = allModels.filter((m: string) => !blockedModels.has(m));

  // If all models are blocked, try all models as a last resort
  const finalModelsToTry = modelsToTry.length > 0 ? modelsToTry : allModels;

  let lastError: any;

  for (const model of finalModelsToTry) {
    try {
      return await operation(model);
    } catch (error: any) {
      console.warn(
        `Groq request failed with model ${model}:`,
        error.status,
        error.message,
      );
      lastError = error;

      const isRateLimit =
        error?.status === 429 ||
        error?.code === "rate_limit_exceeded" ||
        (error?.message && error.message.includes("429"));

      if (isRateLimit) {
        const retryAfter = parseRetryAfter(error.message || "");
        console.log(
          `Model ${model} rate limited. Blocking for ${Math.round(retryAfter / 1000)}s.`,
        );
        blockedModels.set(model, Date.now() + retryAfter);
      }

      const isRetryable =
        isRateLimit ||
        error?.status === 400 || // Bad request (e.g., model doesn't support chat)
        error?.status === 503 || // Service unavailable
        (error?.message && error.message.includes("does not support"));

      if (isRetryable) {
        console.log(
          `Switching to next model due to error (${error?.status || "unknown"})...`,
        );
        continue; // Try next model
      }

      throw error; // Rethrow non-retryable errors
    }
  }

  throw lastError;
}

export class GroqService {
  /**
   * Generates a standard chat completion (string output).
   */
  static async getChatCompletion(
    prompt: string,
    options: GroqCompletionOptions = {},
  ): Promise<string> {
    const {
      temperature = 0.7,
      max_tokens = 1024,
      systemPrompt,
      model: requestedModel,
    } = options;

    const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [];

    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }

    messages.push({ role: "user", content: prompt });

    return withModelFallback(async (model) => {
      const completion = await groq.chat.completions.create({
        messages,
        model,
        temperature,
        max_tokens,
      });

      return completion.choices[0]?.message?.content || "";
    }, requestedModel);
  }

  /**
   * Generates a streaming chat completion.
   */
  static async getChatStream(
    messages: any[],
    options: GroqCompletionOptions = {},
  ): Promise<AsyncIterable<any>> {
    const {
      temperature = 0.7,
      max_tokens = 1024,
      model: requestedModel,
    } = options;

    return withModelFallback(async (model) => {
      const stream = await groq.chat.completions.create({
        messages,
        model,
        temperature,
        max_tokens,
        stream: true,
      });

      // Adapt Groq stream to match Ollama's format for the controller
      const adaptedStream = async function* () {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          yield {
            model: chunk.model,
            message: { role: "assistant", content },
            done: false,
          };
        }
        yield {
          model: model,
          message: { role: "assistant", content: "" },
          done: true,
        };
      };

      return adaptedStream();
    }, requestedModel);
  }

  /**
   * Generates a JSON output.
   */
  static async getJsonCompletion<T = any>(
    prompt: string,
    options: GroqCompletionOptions = {},
  ): Promise<T> {
    const {
      temperature = 0.5,
      max_tokens = 2048,
      systemPrompt = "You are a helpful assistant that outputs strictly in JSON format.",
      model: requestedModel,
    } = options;

    const finalSystemPrompt = systemPrompt.includes("JSON")
      ? systemPrompt
      : `${systemPrompt} Output strictly in JSON format.`;

    const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: finalSystemPrompt },
      { role: "user", content: prompt },
    ];

    return withModelFallback(async (model) => {
      const completion = await groq.chat.completions.create({
        messages,
        model,
        // @ts-ignore
        response_format: { type: "json_object" },
        temperature,
        max_tokens,
      });

      const content = completion.choices[0]?.message?.content || "{}";

      try {
        return JSON.parse(content) as T;
      } catch (_parseError) {
        console.error(
          `Failed to parse JSON response from model ${model}:`,
          content,
        );
        throw new Error(`Failed to parse JSON response from LLM (${model})`);
      }
    }, requestedModel);
  }

  /**
   * Transcribes audio using Groq's Whisper model.
   */
  static async transcribeAudio(filePath: string): Promise<any[]> {
    console.log("GroqService.transcribeAudio called with path:", filePath);

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    const stats = fs.statSync(filePath);
    console.log("FILE SIZE:", stats.size);

    if (stats.size === 0) {
      throw new Error("Uploaded file is empty");
    }

    try {
      // ✅ Read file into buffer
      const buffer = fs.readFileSync(filePath);

      // ✅ Create a File object manually (this avoids Groq SDK fd bug)
      const file = new File(
        [buffer as any],
        filePath.split("\\").pop() || "audio.mp3",
        { type: "audio/mpeg" },
      );

      const transcription = await groq.audio.transcriptions.create({
        file,
        model: "whisper-large-v3",
        temperature: 0,
        response_format: "verbose_json",
      });

      // @ts-ignore
      if (transcription.segments) {
        // @ts-ignore
        return transcription.segments.map((seg: any) => ({
          start: seg.start,
          end: seg.end,
          speaker: "Speaker",
          text: seg.text.trim(),
        }));
      }

      return [
        {
          start: 0,
          end: (transcription as any).duration || 0,
          speaker: "Speaker",
          text: transcription.text.trim(),
        },
      ];
    } catch (error) {
      console.error("Groq Transcription Error:", error);
      throw error;
    }
  }
}
