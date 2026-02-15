import PDFDocument from "pdfkit";
import { Segment } from "./ai.service";
import path from "path";
import fs from "fs";

// Helper to determine the correct fonts directory
// Helper to determine the correct fonts directory
const getFontsDir = () => {
  const possiblePaths = [
    path.join(__dirname, "..", "assets", "fonts"),
    path.join(__dirname, "..", "..", "assets", "fonts"), // In case structure is deeper in dist
    path.join(process.cwd(), "src", "assets", "fonts"),
    path.join(process.cwd(), "dist", "assets", "fonts"),
    path.join(process.cwd(), "assets", "fonts"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      console.log(`Found fonts directory at: ${p}`);
      return p;
    }
  }

  console.warn("Fonts directory not found in any standard location.");
  return null;
};

// Helper to detect script and return font name
const getFontForText = (text: string) => {
  if (/[\u0C00-\u0C7F]/.test(text)) return "NotoSansTelugu";
  if (/[\u0900-\u097F]/.test(text)) return "NotoSansDevanagari";
  return "NotoSans";
};

// Start of PDFService
export class PDFService {
  /**
   * Generates a Meeting Report PDF with Summary, Key Topics, and Action Items.
   */
  static async generateMeetingReport(
    summary: string,
    actionItems: any[],
    keyTopics: string[],
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: any[] = [];

      doc.on("data", (buffer) => buffers.push(buffer));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData.toString("base64"));
      });
      doc.on("error", (err) => reject(err));

      const fontsDir = getFontsDir();
      let customFontsLoaded = false;
      if (fontsDir) {
        try {
          doc.registerFont(
            "NotoSans",
            path.join(fontsDir, "NotoSans-Regular.ttf"),
          );
          doc.registerFont(
            "NotoSansTelugu",
            path.join(fontsDir, "NotoSansTelugu-Regular.ttf"),
          );
          doc.registerFont(
            "NotoSansDevanagari",
            path.join(fontsDir, "NotoSansDevanagari-Regular.ttf"),
          );
          customFontsLoaded = true;
        } catch (fontError) {
          console.error("Error registering fonts:", fontError);
        }
      }

      // Robust text rendering handling mixed languages
      const renderText = (
        text: string,
        options?: PDFKit.Mixins.TextOptions,
      ) => {
        try {
          if (!customFontsLoaded || !text) {
            doc.font("Helvetica").text(text || "", options);
            return;
          }

          // Split text into chunks based on script presence (Telugu or Devanagari)
          // The capturing groups in split keep the separators in the result array
          const parts = text
            .split(/([\u0C00-\u0C7F]+|[\u0900-\u097F]+)/g)
            .filter((p) => p);

          if (parts.length === 0) {
            doc.text("", options);
            return;
          }

          const globalContinued = options?.continued || false;

          parts.forEach((part, index) => {
            const isLast = index === parts.length - 1;
            const font = getFontForText(part);

            doc.font(font);

            // Pass options only to the first segment to set paragraph styles
            // Use 'continued' for all non-final segments effectively chaining them
            // If the caller requested continued: true, the very last segment continues too.
            const shouldContinue = !isLast || globalContinued;

            if (index === 0) {
              doc.text(part, { ...options, continued: shouldContinue });
            } else {
              doc.text(part, { continued: shouldContinue });
            }
          });
        } catch (err) {
          console.error(
            `Error rendering text with custom font: ${err}. Falling back to Helvetica.`,
          );
          doc.font("Helvetica").text(text, options);
        }
      };

      // Header
      doc
        .fontSize(24)
        .font(customFontsLoaded ? "NotoSans" : "Helvetica")
        .text("Meeting Summary Report", { align: "center" });
      doc.moveDown(0.5);
      doc
        .fontSize(10)
        .font(customFontsLoaded ? "NotoSans" : "Helvetica")
        .fillColor("grey")
        .text(`Generated on ${new Date().toLocaleString()}`, {
          align: "center",
        });
      doc.moveDown(2);

      // Summary
      if (summary) {
        doc
          .fontSize(16)
          .font(customFontsLoaded ? "NotoSans" : "Helvetica")
          .fillColor("black")
          .text("Summary");
        doc.rect(50, doc.y, 500, 1).fill("#EEEEEE");
        doc.moveDown(0.5);
        doc.fontSize(12).fillColor("#333333");
        renderText(summary, { align: "justify", lineGap: 2 });
        doc.moveDown(2);
      }

      // Key Topics
      if (keyTopics && keyTopics.length > 0) {
        doc
          .fontSize(16)
          .font(customFontsLoaded ? "NotoSans" : "Helvetica")
          .fillColor("black")
          .text("Key Topics");
        doc.rect(50, doc.y, 500, 1).fill("#EEEEEE");
        doc.moveDown(0.5);

        doc.fontSize(12);
        keyTopics.forEach((topic) => {
          renderText(`• ${topic}`, { indent: 20 });
        });
        doc.moveDown(2);
      }

      // Action Items
      if (actionItems && actionItems.length > 0) {
        doc
          .fontSize(16)
          .font(customFontsLoaded ? "NotoSans" : "Helvetica")
          .fillColor("black")
          .text("Action Items");
        doc.rect(50, doc.y, 500, 1).fill("#EEEEEE");
        doc.moveDown(0.5);

        doc.fontSize(12);
        actionItems.forEach((item, idx) => {
          const task =
            typeof item === "string" ? item : item.task || JSON.stringify(item);
          renderText(`${idx + 1}. ${task}`, { indent: 20 });
        });
        doc.moveDown(2);
      }

      doc.end();
    });
  }

  /**
   * Generates a literal transcript PDF from audio segments.
   */
  static async generateTranscriptPDF(segments: Segment[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: any[] = [];

      doc.on("data", (buffer) => buffers.push(buffer));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      const fontsDir = getFontsDir();
      let customFontsLoaded = false;
      if (fontsDir) {
        try {
          doc.registerFont(
            "NotoSans",
            path.join(fontsDir, "NotoSans-Regular.ttf"),
          );
          doc.registerFont(
            "NotoSansTelugu",
            path.join(fontsDir, "NotoSansTelugu-Regular.ttf"),
          );
          doc.registerFont(
            "NotoSansDevanagari",
            path.join(fontsDir, "NotoSansDevanagari-Regular.ttf"),
          );
          customFontsLoaded = true;
        } catch (fontError) {
          console.error("Error registering fonts:", fontError);
        }
      }

      // Robust text rendering handling mixed languages
      const renderText = (
        text: string,
        options?: PDFKit.Mixins.TextOptions,
      ) => {
        try {
          if (!customFontsLoaded || !text) {
            doc.font("Helvetica").text(text || "", options);
            return;
          }

          const parts = text
            .split(/([\u0C00-\u0C7F]+|[\u0900-\u097F]+)/g)
            .filter((p) => p);

          if (parts.length === 0) {
            doc.text("", options);
            return;
          }

          const globalContinued = options?.continued || false;

          parts.forEach((part, index) => {
            const isLast = index === parts.length - 1;
            const font = getFontForText(part);

            doc.font(font);

            const shouldContinue = !isLast || globalContinued;

            if (index === 0) {
              doc.text(part, { ...options, continued: shouldContinue });
            } else {
              doc.text(part, { continued: shouldContinue });
            }
          });
        } catch (err) {
          console.error(
            `Error rendering text with custom font: ${err}. Falling back to Helvetica.`,
          );
          doc.font("Helvetica").text(text, options);
        }
      };

      // Title
      doc
        .fontSize(20)
        .font(customFontsLoaded ? "NotoSans" : "Helvetica")
        .text("Audio Transcription", { align: "center" });
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
            .font(customFontsLoaded ? "NotoSans" : "Helvetica")
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
          .font(customFontsLoaded ? "NotoSans" : "Helvetica")
          .fillColor("grey")
          .text(timestamp, { continued: true });

        doc.fillColor("black");
        // Print the text content of the segment
        renderText(`  ${segment.text}`);
        doc.moveDown(0.5);
      });

      doc.end();
    });
  }
}
