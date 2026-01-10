import PDFDocument from "pdfkit";
import { Segment } from "./ai.service";

export class PDFService {
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
      doc.fontSize(12).text(`Generated on ${new Date().toLocaleString()}`, { align: "center" });
      doc.moveDown(2);

      // Content
      let currentSpeaker = "";

      segments.forEach((segment) => {
        // Speaker Header
        if (segment.speaker !== currentSpeaker) {
          doc.moveDown(0.5);
          doc.fontSize(12).font("Helvetica-Bold").text(segment.speaker, { continued: false });
          currentSpeaker = segment.speaker;
        }

        // Timestamp and text
        // Format timestamp HH:MM:SS
        const formatTime = (seconds: number) => {
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = Math.floor(seconds % 60);
            const pad = (n: number) => n.toString().padStart(2, '0');
            return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
        };
        
        const timestamp = `[${formatTime(segment.start)} - ${formatTime(segment.end)}]`;

        doc.fontSize(10).font("Helvetica-Oblique").fillColor("grey").text(timestamp, { continued: true });
        doc.font("Helvetica").fillColor("black").text(`  ${segment.text}`);
        doc.moveDown(0.5);
      });

      doc.end();
    });
  }
}
