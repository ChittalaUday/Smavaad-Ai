import express from "express";
import { verifyJWT } from "../middlewares/auth.middlewares";
import meetingController from "../controllers/meeting.controller";
import { param } from "express-validator";
import { validate } from "../validators/validate";
import { upload } from "../middlewares/multer.middlwares";

const router = express.Router();

router.use(verifyJWT);

router.post("/", meetingController.createMeeting);

// Must come BEFORE /:meetingId to avoid "my" being treated as a meetingId
router.get("/my", meetingController.getMyMeetings);

router.get(
  "/:meetingId",
  param("meetingId").exists().isString().trim(),
  validate,
  meetingController.validateMeeting,
);

router.get(
  "/:meetingId/detail",
  param("meetingId").exists().isString().trim(),
  validate,
  meetingController.getMeetingDetail,
);

router.post(
  "/:meetingId/join",
  param("meetingId").exists().isString().trim(),
  validate,
  meetingController.joinMeeting,
);

router.post(
  "/:meetingId/end",
  param("meetingId").exists().isString().trim(),
  validate,
  meetingController.endMeeting,
);

router.post(
  "/:meetingId/transcript",
  param("meetingId").exists().isString().trim(),
  validate,
  meetingController.saveTranscript,
);

router.post(
  "/:meetingId/summary",
  param("meetingId").exists().isString().trim(),
  validate,
  meetingController.saveSummary,
);

router.post(
  "/:meetingId/summarize",
  param("meetingId").exists().isString().trim(),
  validate,
  meetingController.summarizeMeeting,
);

router.post(
  "/:meetingId/transcribe",
  param("meetingId").exists().isString().trim(),
  validate,
  meetingController.transcribeMeeting,
);

router.post(
  "/:meetingId/generate-pdf",
  param("meetingId").exists().isString().trim(),
  validate,
  meetingController.generatePdf,
);

router.post(
  "/:meetingId/audio",
  param("meetingId").exists().isString().trim(),
  validate,
  upload.single("audio"),
  meetingController.saveAudio,
);

router.post(
  "/:meetingId/ai",
  param("meetingId").exists().isString().trim(),
  validate,
  meetingController.getMeetingAIResponse,
);

export default router;
