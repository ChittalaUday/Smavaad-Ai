import { Schema, Types, model, Document } from "mongoose";
import User from "./User";

export const DOCUMENT_NAME = "AIChat";
export const COLLECTION_NAME = "aichats";

export interface AIChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default interface AIChat extends Document {
  user: Types.ObjectId | User;
  messages: AIChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<AIChat>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    messages: [
      {
        role: {
          type: String,
          enum: ["user", "assistant"],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const AIChatModel = model<AIChat>(
  DOCUMENT_NAME,
  schema,
  COLLECTION_NAME,
);
