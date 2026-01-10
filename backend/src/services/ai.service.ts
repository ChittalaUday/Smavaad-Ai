import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import { aiServiceUrl } from "../config";
import { InternalError } from "../core/ApiError";

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
        }
      );

      return response.data.segments;
    } catch (error) {
        console.error("AI Service Error:", error);
        throw new InternalError("Failed to transcribe audio");
    }
  }
}
