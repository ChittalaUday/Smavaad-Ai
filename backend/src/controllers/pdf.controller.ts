import { Request, Response, NextFunction } from "express";
import asyncHandler from "../helpers/asyncHandler";
import { ApiError, BadRequestError } from "../core/ApiError";
import { AIService } from "../services/ai.service";
import { PDFService } from "../services/pdf.service";
import fs from "fs";

export const generatePdfFromAudio = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      throw new BadRequestError("No audio file provided");
    }

    const audioPath = req.file.path;

    try {
      // 1. Transcribe
      const segments = await AIService.transcribeAudio(audioPath);

      // 2. Generate PDF
      const pdfBuffer = await PDFService.generateTranscriptPDF(segments);

      // 3. Send PDF
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="transcript.pdf"',
        "Content-Length": pdfBuffer.length,
      });

      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    } finally {
        // Cleanup uploaded file
        if (fs.existsSync(audioPath)) {
            try {
                fs.unlinkSync(audioPath);
            } catch(e) {
                console.error("Failed to delete temp file:", e);
            }
        }
    }
  }
);
