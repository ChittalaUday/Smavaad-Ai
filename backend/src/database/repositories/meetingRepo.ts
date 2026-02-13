import { Types } from "mongoose";
import Meeting, { MeetingModel, MeetingActionItem } from "../model/Meeting";

const findByMeetingId = (meetingId: string): Promise<Meeting | null> => {
  return MeetingModel.findOne({ meetingId })
    .populate("host", "username email avatarUrl")
    .populate("participants.user", "username email avatarUrl")
    .lean();
};

const findById = (id: Types.ObjectId): Promise<Meeting | null> => {
  return MeetingModel.findOne({ _id: id })
    .populate("host", "username email avatarUrl")
    .lean();
};

const create = async (
  meetingId: string,
  hostId: Types.ObjectId,
  type: "meeting" | "call" = "meeting",
  participants: Types.ObjectId[] = [],
): Promise<Meeting> => {
  const now = new Date();
  const meeting = await MeetingModel.create({
    meetingId,
    host: hostId,
    startTime: now,
    status: "active",
    participants: [
      {
        user: hostId,
        joinedAt: now,
        status: "joined",
      },
      ...participants.map((p) => ({
        user: p,
        joinedAt: now,
        status: "invited",
      })),
    ],
    type,
    callStatus: type === "call" ? "ringing" : undefined,
  } as unknown as Meeting);
  return meeting.toObject();
};

const addParticipant = async (
  meetingId: string,
  userId: Types.ObjectId,
): Promise<Meeting | null> => {
  return MeetingModel.findOneAndUpdate(
    { meetingId, status: "active" },
    {
      $push: {
        participants: {
          user: userId,
          joinedAt: new Date(),
        },
      },
    },
    { new: true },
  )
    .populate("host", "username email avatarUrl")
    .populate("participants.user", "username email avatarUrl")
    .lean();
};

const removeParticipant = async (
  meetingId: string,
  userId: Types.ObjectId,
): Promise<Meeting | null> => {
  return MeetingModel.findOneAndUpdate(
    { meetingId },
    {
      $pull: { participants: { user: userId } },
    },
    { new: true },
  ).lean();
};

const endMeeting = async (meetingId: string): Promise<Meeting | null> => {
  return MeetingModel.findOneAndUpdate(
    { meetingId },
    {
      $set: {
        status: "ended",
        endTime: new Date(),
      },
    },
    { new: true },
  ).lean();
};

const exists = async (meetingId: string): Promise<boolean> => {
  const meeting = await MeetingModel.exists({ meetingId, status: "active" });
  return meeting !== null;
};

const saveTranscript = async (
  meetingId: string,
  transcript: string,
): Promise<Meeting | null> => {
  return MeetingModel.findOneAndUpdate(
    { meetingId },
    { $set: { transcript } },
    { new: true },
  ).lean();
};

const saveSummary = async (
  meetingId: string,
  summary: string,
  actionItems: MeetingActionItem[] = [],
): Promise<Meeting | null> => {
  return MeetingModel.findOneAndUpdate(
    { meetingId },
    { $set: { summary, actionItems } },
    { new: true },
  ).lean();
};

/**
 * Find all meetings where user is host or participant.
 * Sorted newest first, returns without full transcript/messages for list view.
 */
const findByUserId = (userId: Types.ObjectId): Promise<Meeting[]> => {
  return MeetingModel.find({
    $or: [{ host: userId }, { "participants.user": userId }],
  })
    .select("-transcript -messages") // Exclude heavy fields for listing
    .populate("host", "username email avatarUrl")
    .populate("participants.user", "username email avatarUrl")
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * Get full meeting detail including transcript, summary, messages.
 */
const findByMeetingIdDetailed = (
  meetingId: string,
): Promise<Meeting | null> => {
  return MeetingModel.findOne({ meetingId })
    .populate("host", "username email avatarUrl")
    .populate("participants.user", "username email avatarUrl")
    .populate("messages.sender", "username email avatarUrl")
    .lean();
};

/**
 * Add a chat message to the meeting document.
 */
const addMessage = async (
  meetingId: string,
  senderId: Types.ObjectId,
  text: string,
): Promise<Meeting | null> => {
  return MeetingModel.findOneAndUpdate(
    { meetingId },
    {
      $push: {
        messages: {
          sender: senderId,
          text,
          timestamp: new Date(),
        },
      },
    },
    { new: true },
  ).lean();
};

const saveAudio = async (
  meetingId: string,
  audioUrl: string,
): Promise<Meeting | null> => {
  return MeetingModel.findOneAndUpdate(
    { meetingId },
    { $set: { audioUrl } },
    { new: true },
  ).lean();
};

const savePdf = async (
  meetingId: string,
  pdfUrl: string,
): Promise<Meeting | null> => {
  return MeetingModel.findOneAndUpdate(
    { meetingId },
    { $set: { pdfUrl } },
    { new: true },
  ).lean();
};

export default {
  findByMeetingId,
  findById,
  create,
  addParticipant,
  removeParticipant,
  endMeeting,
  exists,
  saveTranscript,
  saveSummary,
  findByUserId,
  findByMeetingIdDetailed,
  addMessage,
  saveAudio,
  savePdf,
};
