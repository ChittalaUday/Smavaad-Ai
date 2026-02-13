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
