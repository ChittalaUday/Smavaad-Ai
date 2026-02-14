import { Response } from "express";
import asyncHandler from "../helpers/asyncHandler";
import meetingRepo from "../database/repositories/meetingRepo";
import {
  BadRequestError,
  ForbiddenError,
  InternalError,
  NotFoundError,
} from "../core/ApiError";
import { SuccessResponse } from "../core/ApiResponse";
import { ProtectedRequest } from "../types/app-request";
import crypto from "crypto";
import { serverUrl } from "../config";
import { AIService } from "../services/ai.service";
import { PDFService } from "../services/pdf.service";
import path from "path";
import fs from "fs";

// Helper to generate a meeting ID (e.g., "abc-def-ghi")
const generateMeetingId = (): string => {
  // Simple implementation: 3 blocks of 3 random chars
  const part = () => Math.random().toString(36).substring(2, 5).toLowerCase();
  return `${part()}-${part()}-${part()}`;
};

const createMeeting = asyncHandler(
  async (req: ProtectedRequest, res: Response) => {
    // Generate a unique ID (retry once if collision, though unlikely with this logic in low volume)
    let meetingId = generateMeetingId();
    const { type, participants } = req.body;
    const exists = await meetingRepo.exists(meetingId);
    if (exists) {
      meetingId = generateMeetingId(); // Retry once
    }

    const meeting = await meetingRepo.create(
      meetingId,
      req.user._id,
      type,
      participants,
    );

    return new SuccessResponse("Meeting created successfully", meeting).send(
      res,
    );
  },
);

const validateMeeting = asyncHandler(
  async (req: ProtectedRequest, res: Response) => {
    const { meetingId } = req.params;
    const meeting = await meetingRepo.findByMeetingId(meetingId);

    if (!meeting || meeting.status !== "active") {
      throw new NotFoundError("Meeting not found or has ended");
    }

    return new SuccessResponse("Meeting is valid", meeting).send(res);
  },
);

const joinMeeting = asyncHandler(
  async (req: ProtectedRequest, res: Response) => {
    const { meetingId } = req.params;
    const userId = req.user._id;

    const meeting = await meetingRepo.findByMeetingId(meetingId);
    if (!meeting || meeting.status !== "active") {
      throw new NotFoundError("Meeting not found or has ended");
    }

    // Check if user is already a participant
    const isParticipant = meeting.participants.some(
      (p: any) => p.user._id.toString() === userId.toString(),
    );

    let updatedMeeting = meeting;
    if (!isParticipant) {
      const result = await meetingRepo.addParticipant(meetingId, userId);
      if (result) updatedMeeting = result;
    }

    return new SuccessResponse(
      "Joined meeting successfully",
      updatedMeeting,
    ).send(res);
  },
);

const endMeeting = asyncHandler(
  async (req: ProtectedRequest, res: Response) => {
    const { meetingId } = req.params;
    const userId = req.user._id;

    const meeting = await meetingRepo.findByMeetingId(meetingId);
    if (!meeting) {
      throw new NotFoundError("Meeting not found");
    }

    // Only host can end meeting
    if (meeting.host._id.toString() !== userId.toString()) {
      throw new ForbiddenError("Only the host can end the meeting");
    }

    const updatedMeeting = await meetingRepo.endMeeting(meetingId);

    return new SuccessResponse(
      "Meeting ended successfully",
      updatedMeeting,
    ).send(res);
  },
);

const saveTranscript = asyncHandler(
  async (req: ProtectedRequest, res: Response) => {
    const { meetingId } = req.params;
    const { transcript } = req.body;

    if (!transcript || typeof transcript !== "string") {
      throw new BadRequestError("Transcript is required");
    }

    const meeting = await meetingRepo.findByMeetingId(meetingId);
    if (!meeting) {
      throw new NotFoundError("Meeting not found");
    }

    const updatedMeeting = await meetingRepo.saveTranscript(
      meetingId,
      transcript,
    );

    // Auto-summarize in background after saving transcript
    try {
      const detailedMeeting =
        await meetingRepo.findByMeetingIdDetailed(meetingId);
      if (detailedMeeting) {
        let combinedText = transcript;
        if (detailedMeeting.messages && detailedMeeting.messages.length > 0) {
          const chatTranscript = detailedMeeting.messages
            .map(
              (msg: any) => `${msg.sender?.username || "Unknown"}: ${msg.text}`,
            )
            .join("\n");
          combinedText = `Audio Transcript:\n${transcript}\n\nChat Messages:\n${chatTranscript}`;
        }

        const summaryData = await AIService.summarizeCall(combinedText);
        if (summaryData.summary) {
          await meetingRepo.saveSummary(
            meetingId,
            summaryData.summary,
            summaryData.action_items,
          );

          if (summaryData.pdf_report) {
            const pdfDir = path.join(__dirname, "..", "..", "public", "pdf");
            if (!fs.existsSync(pdfDir)) {
              fs.mkdirSync(pdfDir, { recursive: true });
            }
            const pdfFilename = `summary-${meetingId}-${Date.now()}.pdf`;
            const pdfFilePath = path.join(pdfDir, pdfFilename);
            fs.writeFileSync(
              pdfFilePath,
              Buffer.from(summaryData.pdf_report, "base64") as any,
            );
            const pdfUrl = `${serverUrl}/public/pdf/${pdfFilename}`;
            await meetingRepo.savePdf(meetingId, pdfUrl);
          }
        }
      }
    } catch (err) {
      console.error("Auto-summarization failed:", err);
    }

    return new SuccessResponse(
      "Transcript saved and summarization triggered",
      updatedMeeting,
    ).send(res);
  },
);

const summarizeMeeting = asyncHandler(
  async (req: ProtectedRequest, res: Response) => {
    const { meetingId } = req.params;

    const meeting = await meetingRepo.findByMeetingIdDetailed(meetingId);
    if (!meeting) {
      throw new NotFoundError("Meeting not found");
    }

    let combinedText = "";
    if (meeting.transcript) {
      combinedText += `Audio Transcript:\n${meeting.transcript}\n\n`;
    }

    if (meeting.messages && meeting.messages.length > 0) {
      const chatTranscript = meeting.messages
        .map((msg: any) => `${msg.sender?.username || "Unknown"}: ${msg.text}`)
        .join("\n");
      combinedText += `Chat Messages:\n${chatTranscript}`;
    }

    if (!combinedText || combinedText.trim().length < 10) {
      throw new BadRequestError("No transcript or messages to summarize");
    }

    const summaryData = await AIService.summarizeCall(combinedText);

    // Save summary and action items
    const updatedMeeting = await meetingRepo.saveSummary(
      meetingId,
      summaryData.summary,
      summaryData.action_items,
    );

    // Save PDF if provided
    if (summaryData.pdf_report) {
      const pdfDir = path.join(__dirname, "..", "..", "public", "pdf");
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }
      const pdfFilename = `summary-${meetingId}-${Date.now()}.pdf`;
      const pdfFilePath = path.join(pdfDir, pdfFilename);
      fs.writeFileSync(
        pdfFilePath,
        Buffer.from(summaryData.pdf_report, "base64") as any,
      );
      const pdfUrl = `${serverUrl}/public/pdf/${pdfFilename}`;
      await meetingRepo.savePdf(meetingId, pdfUrl);
    }

    const finalMeeting = await meetingRepo.findByMeetingIdDetailed(meetingId);

    return new SuccessResponse(
      "Meeting summarized successfully",
      finalMeeting,
    ).send(res);
  },
);

const saveSummary = asyncHandler(
  async (req: ProtectedRequest, res: Response) => {
    const { meetingId } = req.params;
    const { summary, actionItems } = req.body;

    if (!summary || typeof summary !== "string") {
      throw new BadRequestError("Summary is required");
    }

    const meeting = await meetingRepo.findByMeetingId(meetingId);
    if (!meeting) {
      throw new NotFoundError("Meeting not found");
    }

    const updatedMeeting = await meetingRepo.saveSummary(
      meetingId,
      summary,
      actionItems || [],
    );

    return new SuccessResponse(
      "Summary saved successfully",
      updatedMeeting,
    ).send(res);
  },
);

const getMyMeetings = asyncHandler(
  async (req: ProtectedRequest, res: Response) => {
    const userId = req.user._id;
    const meetings = await meetingRepo.findByUserId(userId);

    return new SuccessResponse("Meetings fetched successfully", meetings).send(
      res,
    );
  },
);

const getMeetingDetail = asyncHandler(
  async (req: ProtectedRequest, res: Response) => {
    const { meetingId } = req.params;

    const meeting = await meetingRepo.findByMeetingIdDetailed(meetingId);
    if (!meeting) {
      throw new NotFoundError("Meeting not found");
    }

    return new SuccessResponse(
      "Meeting detail fetched successfully",
      meeting,
    ).send(res);
  },
);

const saveAudio = asyncHandler(async (req: ProtectedRequest, res: Response) => {
  const { meetingId } = req.params;

  if (!req.file) {
    throw new BadRequestError("Audio file is required");
  }

  const meeting = await meetingRepo.findByMeetingIdDetailed(meetingId);
  if (!meeting) {
    throw new NotFoundError("Meeting not found");
  }

  const audioPath = req.file.path;
  const audioUrl = `${serverUrl}/public/audio/${req.file.filename}`;

  // 1. Update audio URL first
  await meetingRepo.saveAudio(meetingId, audioUrl);

  const updatedMeetingAfterAudio =
    await meetingRepo.findByMeetingIdDetailed(meetingId);
  if (!updatedMeetingAfterAudio) {
    throw new InternalError("Meeting not found after audio update");
  }

  // 2. Perform background processing (Transcription -> PDF)
  try {
    // a. Transcribe
    const segments = await AIService.transcribeAudio(audioPath);
    const transcriptText = segments.map((s) => s.text).join(" ");

    // b. Generate Summary and PDF from AI Service
    let summary = "";
    let actionItems: any[] = [];
    let pdfUrl = "";

    try {
      // Fetch latest meeting to get existing messages if any
      const meeting = await meetingRepo.findByMeetingIdDetailed(meetingId);
      let combinedText = transcriptText;

      if (meeting?.messages && meeting.messages.length > 0) {
        const chatTranscript = meeting.messages
          .map(
            (msg: any) => `${msg.sender?.username || "Unknown"}: ${msg.text}`,
          )
          .join("\n");
        combinedText = `Audio Transcript:\n${transcriptText}\n\nChat Messages:\n${chatTranscript}`;
      }

      const summaryData = await AIService.summarizeCall(combinedText);
      summary = summaryData.summary;
      actionItems = summaryData.action_items;

      if (summaryData.summary) {
        await meetingRepo.saveSummary(meetingId, summary, actionItems);
      }

      if (summaryData.pdf_report) {
        const pdfDir = path.join(__dirname, "..", "..", "public", "pdf");
        if (!fs.existsSync(pdfDir)) {
          fs.mkdirSync(pdfDir, { recursive: true });
        }
        const pdfFilename = `meeting-${meetingId}-${Date.now()}.pdf`;
        const pdfFilePath = path.join(pdfDir, pdfFilename);
        fs.writeFileSync(
          pdfFilePath,
          Buffer.from(summaryData.pdf_report, "base64") as any,
        );
        pdfUrl = `${serverUrl}/public/pdf/${pdfFilename}`;
        await meetingRepo.savePdf(meetingId, pdfUrl);
      }
    } catch (summaryError) {
      console.error("Summary generation failed in saveAudio:", summaryError);
      // Fallback to basic PDF if summary fails?
      // For now, just continue with transcription saved
    }

    // Save segments/transcript
    await meetingRepo.saveTranscript(meetingId, transcriptText);

    const finalMeeting = await meetingRepo.findByMeetingIdDetailed(meetingId);

    return new SuccessResponse(
      "Audio saved and processed successfully",
      finalMeeting,
    ).send(res);
  } catch (error: any) {
    console.error("Failed to process meeting documents:", error);
    // Even if PDF fails, we already saved the audio
    return new SuccessResponse("Audio saved, but document processing failed", {
      ...updatedMeetingAfterAudio,
      audioUrl,
    }).send(res);
  }
});

const transcribeMeeting = asyncHandler(
  async (req: ProtectedRequest, res: Response) => {
    const { meetingId } = req.params;

    const meeting = await meetingRepo.findByMeetingIdDetailed(meetingId);
    if (!meeting) {
      throw new NotFoundError("Meeting not found");
    }

    if (!meeting.audioUrl) {
      throw new BadRequestError("No audio recording available to transcribe");
    }

    // Determine local file path from URL
    // URL: http://.../public/audio/filename.webm
    const filename = meeting.audioUrl.split("/").pop();
    if (!filename) throw new InternalError("Invalid audio URL");

    const audioPath = path.join(
      __dirname,
      "..",
      "..",
      "public",
      "audio",
      filename,
    );

    if (!fs.existsSync(audioPath)) {
      throw new NotFoundError("Audio file not found on server");
    }

    const segments = await AIService.transcribeAudio(audioPath);
    const transcriptText = segments.map((s) => s.text).join(" ");

    const updatedMeeting = await meetingRepo.saveTranscript(
      meetingId,
      transcriptText,
    );

    return new SuccessResponse(
      "Meeting transcribed successfully",
      updatedMeeting,
    ).send(res);
  },
);

const generatePdf = asyncHandler(
  async (req: ProtectedRequest, res: Response) => {
    const { meetingId } = req.params;

    const meeting = await meetingRepo.findByMeetingIdDetailed(meetingId);
    if (!meeting) {
      throw new NotFoundError("Meeting not found");
    }

    if (!meeting.summary) {
      throw new BadRequestError("No summary available to generate PDF");
    }

    const pdfBase64 = await AIService.generatePdf(
      meeting.summary,
      meeting.actionItems || [],
      [], // key topics empty for now
    );

    const pdfDir = path.join(__dirname, "..", "..", "public", "pdf");
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }
    const pdfFilename = `meeting-${meetingId}-${Date.now()}.pdf`;
    const pdfFilePath = path.join(pdfDir, pdfFilename);

    fs.writeFileSync(pdfFilePath, Buffer.from(pdfBase64, "base64") as any);

    const pdfUrl = `${serverUrl}/public/pdf/${pdfFilename}`;
    const updatedMeeting = await meetingRepo.savePdf(meetingId, pdfUrl);

    return new SuccessResponse(
      "PDF generated successfully",
      updatedMeeting,
    ).send(res);
  },
);

const generateTranscriptPdf = asyncHandler(
  async (req: ProtectedRequest, res: Response) => {
    const { meetingId } = req.params;

    const meeting = await meetingRepo.findByMeetingIdDetailed(meetingId);
    if (!meeting) {
      throw new NotFoundError("Meeting not found");
    }

    if (!meeting.audioUrl) {
      throw new BadRequestError(
        "No audio URL available to generate transcript PDF",
      );
    }

    // Determine local file path from URL
    const filename = meeting.audioUrl.split("/").pop();
    if (!filename) throw new InternalError("Invalid audio URL");

    const audioPath = path.join(
      __dirname,
      "..",
      "..",
      "public",
      "audio",
      filename,
    );

    if (!fs.existsSync(audioPath)) {
      throw new NotFoundError("Audio file not found on server");
    }

    // Transcribe to get segments (this duplicates transcribe logic but is needed for segments)
    const segments = await AIService.transcribeAudio(audioPath);

    // Generate Transcript PDF
    const pdfBuffer = await PDFService.generateTranscriptPDF(segments);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="transcript-${meetingId}.pdf"`,
      "Content-Length": pdfBuffer.length,
    });

    res.send(pdfBuffer);
  },
);

// AI Chat for meeting
const getMeetingAIResponse = asyncHandler(
  async (req: ProtectedRequest, res: Response) => {
    const { meetingId } = req.params;
    const { prompt } = req.body;
    const currentUserId = req.user?._id;

    if (!meetingId) throw new BadRequestError("Meeting Id not provided");

    const meeting = await meetingRepo.findByMeetingIdDetailed(meetingId);

    if (!meeting) throw new NotFoundError("Meeting not found");

    // Check participation
    const isParticipant = meeting.participants.some(
      (p: any) => p.user._id.toString() === currentUserId.toString(),
    );
    if (!isParticipant) {
      throw new ForbiddenError("You are not a participant of this meeting");
    }

    const messages = meeting.messages || [];

    // Format chat history for context
    const chatHistory = messages
      .map((msg: any) => `${msg.sender?.username || "Unknown"}: ${msg.text}`)
      .join("\n");

    const systemPrompt = `You are a helpful AI assistant analyzing a meeting conversation history.
Here involves a meeting conversation between users:
${chatHistory}

Answer the user's question based on the conversation above. Be concise and helpful.`;

    const aiMessages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: prompt || "Summarize this meeting conversation.",
      },
    ];

    try {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await AIService.streamChatWithAI(aiMessages as any);

      for await (const chunk of stream) {
        let content = "";
        if (chunk.message && chunk.message.content) {
          content = chunk.message.content;
        } else if (chunk.response) {
          content = chunk.response;
        }

        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }

        if (chunk.done) {
          res.write("data: [DONE]\n\n");
          res.end();
          return;
        }
      }
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error) {
      console.error("AI Stream Error:", error);
      if (!res.headersSent) {
        throw new InternalError("Failed to generate AI response");
      }
      res.end();
    }
  },
);

export default {
  createMeeting,
  validateMeeting,
  joinMeeting,
  endMeeting,
  saveTranscript,
  saveSummary,
  getMyMeetings,
  getMeetingDetail,
  saveAudio,
  summarizeMeeting,
  transcribeMeeting,
  generatePdf,
  generateTranscriptPdf,
  getMeetingAIResponse,
};
