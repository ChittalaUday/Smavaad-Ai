import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares";
import { upload } from "../middlewares/multer.middlwares"; // Misspelled in source
import { generatePdfFromAudio } from "../controllers/pdf.controller";

const router = Router();

// Allow authenticated users to generate PDF
router.use(verifyJWT);

router.post(
  "/generate",
  upload.single("audio"), // Expecting form field 'audio'
  generatePdfFromAudio
);

export default router;
