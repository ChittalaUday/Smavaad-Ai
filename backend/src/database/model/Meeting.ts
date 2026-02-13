import { model, Schema, Types } from "mongoose";
import User from "./User";

export const DOCUMENT_NAME = "Meeting";
export const COLLECTION_NAME = "meetings";

export interface MeetingParticipant {
  user: Types.ObjectId | User;
  joinedAt: Date;
  leftAt?: Date;
  status: "joined" | "left" | "rejected" | "missed" | "invited";
}

export type MeetingType = "meeting" | "call";
export type CallStatus =
  | "ringing"
  | "accepted"
  | "rejected"
  | "missed"
  | "ended";

export interface MeetingActionItem {
  task: string;
  owner?: string;
  deadline?: string;
}

export interface MeetingMessage {
  sender: Types.ObjectId | User;
  text: string;
  timestamp: Date;
}

export default interface Meeting {
  _id: Types.ObjectId;
  meetingId: string; // The public-facing ID (e.g., "abc-defg-hij")
  host: Types.ObjectId | User;
  startTime: Date;
  endTime?: Date;
  status: "active" | "ended";
  participants: MeetingParticipant[];
  createdAt?: Date;
  updatedAt?: Date;
  type: MeetingType;
  callStatus?: CallStatus;
  transcript?: string;
  summary?: string;
  actionItems?: MeetingActionItem[];
  messages?: MeetingMessage[];
  audioUrl?: string;
  pdfUrl?: string;
}

const schema = new Schema<Meeting>(
  {
    meetingId: {
      type: Schema.Types.String,
      unique: true,
      required: true,
      trim: true,
      index: true,
    },
    type: {
      type: Schema.Types.String,
      enum: ["meeting", "call"],
      default: "meeting",
      required: true,
    },
    callStatus: {
      type: Schema.Types.String,
      enum: ["ringing", "accepted", "rejected", "missed", "ended"],
    },

    host: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startTime: {
      type: Schema.Types.Date,
      default: Date.now,
      required: true,
    },
    endTime: {
      type: Schema.Types.Date,
    },
    status: {
      type: Schema.Types.String,
      enum: ["active", "ended"],
      default: "active",
      required: true,
    },
    participants: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        joinedAt: {
          type: Schema.Types.Date,
          default: Date.now,
        },
        leftAt: {
          type: Schema.Types.Date,
        },
        status: {
          type: Schema.Types.String,
          enum: ["joined", "left", "rejected", "missed", "invited"],
          default: "joined",
        },
      },
    ],
    transcript: {
      type: Schema.Types.String,
      default: "",
    },
    summary: {
      type: Schema.Types.String,
      default: "",
    },
    actionItems: [
      {
        task: { type: Schema.Types.String },
        owner: { type: Schema.Types.String },
        deadline: { type: Schema.Types.String },
      },
    ],
    messages: [
      {
        sender: { type: Schema.Types.ObjectId, ref: "User" },
        text: { type: Schema.Types.String },
        timestamp: { type: Schema.Types.Date, default: Date.now },
      },
    ],
    audioUrl: {
      type: Schema.Types.String,
      default: "",
    },
    pdfUrl: {
      type: Schema.Types.String,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const MeetingModel = model<Meeting>(
  DOCUMENT_NAME,
  schema,
  COLLECTION_NAME,
);
