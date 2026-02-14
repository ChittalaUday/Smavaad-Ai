import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import { InternalError } from "../core/ApiError";

export class AudioService {
  /**
   * Optimizes audio for speech-to-text transcription.
   * Steps:
   * 1. Convert to 16kHz (Standard for Whisper)
   * 2. Convert to Mono (Reduces size/complexity)
   * 3. Apply Bandpass Filter (200Hz - 3000Hz) to isolate human voice range.
   * 4. Normalize volume using `loudnorm` filter.
   * @param inputPath Absolute path to input audio file
   * @returns Promise resolving to absolute path of optimized file
   */
  static async optimizeAudioForTranscription(
    inputPath: string,
  ): Promise<string> {
    const filename = path.basename(inputPath, path.extname(inputPath));
    const outputDir = path.dirname(inputPath);
    const outputPath = path.join(outputDir, `${filename}_optimized.wav`); // Use WAV for uncompressed clarity

    // Basic optimization command
    // -ar 16000: Set audio sampling rate to 16kHz
    // -ac 1: Set audio channels to mono
    // -af "highpass=f=200,lowpass=f=3000,loudnorm":
    //      highpass/lowpass: Bandpass filter for human speech range (approx 200-3000Hz)
    //      loudnorm: EBU R128 loudness normalization

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioFrequency(16000)
        .audioChannels(1)
        .audioFilters(["highpass=f=200", "lowpass=f=3000", "loudnorm"])
        .format("wav")
        .on("end", () => {
          console.log(`Audio optimization completed: ${outputPath}`);
          resolve(outputPath);
        })
        .on("error", (err) => {
          console.error("Audio optimization failed:", err);
          // If optimization fails, fallback to original? Or reject?
          // Let's resolve with original to not break flow if ffmpeg fails unexpectedly
          console.warn(
            "Falling back to original audio due to optimization error.",
          );
          resolve(inputPath);
        })
        .save(outputPath);
    });
  }
}
