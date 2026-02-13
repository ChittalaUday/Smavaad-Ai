import express from "express";
import { verifyJWT } from "../middlewares/auth.middlewares";
import meetingController from "../controllers/meeting.controller";
import { param } from "express-validator";
import { validate } from "../validators/validate";

const router = express.Router();

router.use(verifyJWT);

router.post("/", meetingController.createMeeting);

router.get(
  "/:meetingId",
  param("meetingId").exists().isString().trim(),
  validate,
  meetingController.validateMeeting,
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

export default router;
