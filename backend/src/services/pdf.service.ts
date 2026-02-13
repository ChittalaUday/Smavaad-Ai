import PDFDocument from "pdfkit";
import { Segment } from "./ai.service";

export class PDFService {
  static async generateMeetingReportPDF(
    meeting: any,
    segments: Segment[],
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: any[] = [];

      doc.on("data", (buffer) => buffers.push(buffer));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      // Header
      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .text("SAMVAAD AI - Meeting Report", { align: "center" });
      doc.moveDown(0.5);
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("grey")
        .text(`Generated on ${new Date().toLocaleString()}`, {
          align: "center",
        });
      doc.moveDown(1.5);

      // Meeting Info
      doc
        .fillColor("black")
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Meeting Information");
      doc.rect(50, doc.y, 500, 1).fill("#EEEEEE");
      doc.moveDown(0.5);

      const infoY = doc.y;
      doc.fontSize(10).font("Helvetica-Bold").text("Meeting ID: ", 60, infoY);
      doc.font("Helvetica").text(meeting.meetingId, 130, infoY);

      doc.font("Helvetica-Bold").text("Host: ", 60, infoY + 15);
      doc
        .font("Helvetica")
        .text(meeting.host?.username || "N/A", 130, infoY + 15);

      doc.font("Helvetica-Bold").text("Date: ", 60, infoY + 30);
      doc
        .font("Helvetica")
        .text(
          meeting.createdAt
            ? new Date(meeting.createdAt).toLocaleString()
            : "N/A",
          130,
          infoY + 30,
        );

      doc.moveDown(3);

      // AI Summary
      if (meeting.summary) {
        doc.fontSize(14).font("Helvetica-Bold").text("AI Summary");
        doc.rect(50, doc.y, 500, 1).fill("#EEEEEE");
        doc.moveDown(0.5);
        doc
          .fontSize(10)
          .font("Helvetica")
          .fillColor("#333333")
          .text(meeting.summary, { align: "justify", lineGap: 2 });
        doc.moveDown(2);
      }

      // Action Items
      if (meeting.actionItems && meeting.actionItems.length > 0) {
        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .fillColor("black")
          .text("Action Items");
        doc.rect(50, doc.y, 500, 1).fill("#EEEEEE");
        doc.moveDown(0.5);

        meeting.actionItems.forEach((item: any, idx: number) => {
          const task = typeof item === "string" ? item : item.task;
          doc
            .fontSize(10)
            .font("Helvetica")
            .text(`${idx + 1}. ${task}`, { bulletRadius: 2, indent: 20 });
          if (item.owner) {
            doc
              .fontSize(8)
              .fillColor("grey")
              .text(`   Assigned to: ${item.owner}`, { indent: 20 });
            doc.fillColor("black");
          }
        });
        doc.moveDown(2);
      }

      // Transcription
      doc.fontSize(14).font("Helvetica-Bold").text("Full Transcription");
      doc.rect(50, doc.y, 500, 1).fill("#EEEEEE");
      doc.moveDown(0.5);

      let currentSpeaker = "";
      const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const pad = (n: number) => n.toString().padStart(2, "0");
        return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
      };

      segments.forEach((segment) => {
        if (segment.speaker !== currentSpeaker) {
          doc.moveDown(0.5);
          doc.fontSize(10).font("Helvetica-Bold").text(segment.speaker);
          currentSpeaker = segment.speaker;
        }

        const timestamp = `[${formatTime(segment.start)} - ${formatTime(
          segment.end,
        )}]`;
        doc
          .fontSize(9)
          .font("Helvetica-Oblique")
          .fillColor("grey")
          .text(timestamp, { continued: true });
        doc
          .font("Helvetica")
          .fillColor("black")
          .text(`  ${segment.text}`, { lineGap: 1 });
      });

      doc.end();
    });
  }

  static async generateTranscriptPDF(segments: Segment[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: any[] = [];

      doc.on("data", (buffer) => buffers.push(buffer));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      // Title
      doc.fontSize(20).text("Audio Transcription", { align: "center" });
      doc.moveDown();
      doc.fontSize(12).text(`Generated on ${new Date().toLocaleString()}`, {
        align: "center",
      });
      doc.moveDown(2);

      // Content
      let currentSpeaker = "";

      segments.forEach((segment) => {
        // Speaker Header
        if (segment.speaker !== currentSpeaker) {
          doc.moveDown(0.5);
          doc
            .fontSize(12)
            .font("Helvetica-Bold")
            .text(segment.speaker, { continued: false });
          currentSpeaker = segment.speaker;
        }

        // Timestamp and text
        // Format timestamp HH:MM:SS
        const formatTime = (seconds: number) => {
          const h = Math.floor(seconds / 3600);
          const m = Math.floor((seconds % 3600) / 60);
          const s = Math.floor(seconds % 60);
          const pad = (n: number) => n.toString().padStart(2, "0");
          return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
        };

        const timestamp = `[${formatTime(segment.start)} - ${formatTime(
          segment.end,
        )}]`;

        doc
          .fontSize(10)
          .font("Helvetica-Oblique")
          .fillColor("grey")
          .text(timestamp, { continued: true });
        doc.font("Helvetica").fillColor("black").text(`  ${segment.text}`);
        doc.moveDown(0.5);
      });

      doc.end();
    });
  }
}
