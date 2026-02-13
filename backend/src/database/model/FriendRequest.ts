import { model, Schema, Types } from "mongoose";

export const DOCUMENT_NAME = "FriendRequest";

export default interface FriendRequest {
  _id: Types.ObjectId;
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  status: "pending" | "accepted" | "rejected";
  createdAt?: Date;
  updatedAt?: Date;
}

const schema = new Schema<FriendRequest>({
  sender: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiver: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  createdAt: {
    type: Schema.Types.Date,
    default: Date.now,
  },
  updatedAt: {
    type: Schema.Types.Date,
    default: Date.now,
  },
});

export const FriendRequestModel = model<FriendRequest>(DOCUMENT_NAME, schema);
