import { Types } from "mongoose";
import Meeting, { MeetingModel } from "../model/Meeting";

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
  // Logic: Mark the participant as left (set leftAt) rather than removing from array
  // This allows us to keep history.
  // Note: If user rejoins, we might add a new entry or update the existing one.
  // For simplicity implementation, we'll append a new entry on join, so here we update the *latest* entry for this user that doesn't have leftAt.

  // Actually, standard array update in mongo is tricky for "last element matching criteria".
  // For now, let's just push to a "history" if we wanted complex tracking,
  // but for simple "current participants", we might want to pull them or just have a separate "activeParticipants" list?
  // The Prompt asked for "participants[]", usually implies history or current list.
  // Let's stick to "add new entry on join". logic for "leave" updates the last entry.

  // Finding the specific subdocument to update is hard in one query if there are multiple entries for same user.
  // Let's simplified: We will add them to list. When they leave, we update the specific entry?
  // Or maybe just `pull` if we only care about active?
  // Prompt says "Left Meeting -> Remove participant". I will use $pull for active list simplicity as per "Remove participant" instruction.

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

export default {
  findByMeetingId,
  findById,
  create,
  addParticipant,
  removeParticipant,
  endMeeting,
  exists,
};
