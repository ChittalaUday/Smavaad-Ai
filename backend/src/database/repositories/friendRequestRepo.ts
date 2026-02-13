import { Types } from "mongoose";
import FriendRequest, { FriendRequestModel } from "../model/FriendRequest";

export default {
  async create(
    senderId: Types.ObjectId,
    receiverId: Types.ObjectId,
  ): Promise<FriendRequest> {
    const createdRequest = await FriendRequestModel.create({
      sender: senderId,
      receiver: receiverId,
    });
    return createdRequest.toObject();
  },

  async findPendingRequest(
    senderId: Types.ObjectId,
    receiverId: Types.ObjectId,
  ): Promise<FriendRequest | null> {
    return FriendRequestModel.findOne({
      sender: senderId,
      receiver: receiverId,
      status: "pending",
    }).lean();
  },

  async findById(id: Types.ObjectId): Promise<FriendRequest | null> {
    return FriendRequestModel.findById(id).lean();
  },

  async updateStatus(
    id: Types.ObjectId,
    status: "accepted" | "rejected",
  ): Promise<FriendRequest | null> {
    return FriendRequestModel.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true },
    ).lean();
  },

  async findPendingRequestsForUser(
    userId: Types.ObjectId,
  ): Promise<FriendRequest[]> {
    return FriendRequestModel.find({
      receiver: userId,
      status: "pending",
    })
      .populate("sender", "username avatarUrl email")
      .sort({ createdAt: -1 })
      .lean();
  },
};
