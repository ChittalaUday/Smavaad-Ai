import { Response } from "express";
import asyncHandler from "../helpers/asyncHandler";
import meetingRepo from "../database/repositories/meetingRepo";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../core/ApiError";
import { SuccessResponse } from "../core/ApiResponse";
import { ProtectedRequest } from "../types/app-request";
import crypto from "crypto";

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

export default {
  createMeeting,
  validateMeeting,
  joinMeeting,
  endMeeting,
};
