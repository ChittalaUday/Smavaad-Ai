import { Response } from "express";
import { ProtectedRequest } from "../types/app-request";
import { BadRequestError, NotFoundError } from "../core/ApiError";
import friendRequestRepo from "../database/repositories/friendRequestRepo";
import { SuccessMsgResponse, SuccessResponse } from "../core/ApiResponse";
import { Types } from "mongoose";
import asyncHandler from "../helpers/asyncHandler";
import userRepo from "../database/repositories/userRepo";

export const sendFriendRequest = asyncHandler(
  async (req: ProtectedRequest, res: Response) => {
    const { receiverId } = req.body;
    const senderId = req.user._id;

    if (!receiverId) throw new BadRequestError("Receiver ID is required");
    if (senderId.toString() === receiverId)
      throw new BadRequestError("Cannot send friend request to yourself");

    const receiver = await userRepo.findById(new Types.ObjectId(receiverId));
    if (!receiver) throw new NotFoundError("Receiver not found");

    const existingRequest = await friendRequestRepo.findPendingRequest(
      senderId,
      new Types.ObjectId(receiverId),
    );
    if (existingRequest)
      throw new BadRequestError("Friend request already pending");

    // Also check if they are already friends (if you have a friends list in User model, which we might not have yet.
    // For now assuming Chat existence or just allowing request if not friends)

    await friendRequestRepo.create(senderId, new Types.ObjectId(receiverId));

    return new SuccessMsgResponse("Friend request sent successfully").send(res);
  },
);

export const acceptFriendRequest = asyncHandler(
  async (req: ProtectedRequest, res: Response) => {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await friendRequestRepo.findById(
      new Types.ObjectId(requestId),
    );
    if (!request) throw new NotFoundError("Friend request not found");
    if (request.receiver.toString() !== userId.toString())
      throw new BadRequestError("Not authorized to accept this request");
    if (request.status !== "pending")
      throw new BadRequestError("Request already processed");

    await friendRequestRepo.updateStatus(request._id, "accepted");

    // Logic to add to friends list or creating a chat can happen here or upon first message
    // For now, accepting just updates status.
    // We might want to automatically create a chat or just let them find each other.

    return new SuccessMsgResponse("Friend request accepted").send(res);
  },
);

export const rejectFriendRequest = asyncHandler(
  async (req: ProtectedRequest, res: Response) => {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await friendRequestRepo.findById(
      new Types.ObjectId(requestId),
    );
    if (!request) throw new NotFoundError("Friend request not found");
    // Sender can also cancel? For now only receiver rejects.
    if (request.receiver.toString() !== userId.toString())
      throw new BadRequestError("Not authorized to reject this request");
    if (request.status !== "pending")
      throw new BadRequestError("Request already processed");

    await friendRequestRepo.updateStatus(request._id, "rejected");

    return new SuccessMsgResponse("Friend request rejected").send(res);
  },
);

export const getPendingRequests = asyncHandler(
  async (req: ProtectedRequest, res: Response) => {
    const userId = req.user._id;
    const requests = await friendRequestRepo.findPendingRequestsForUser(userId);
    return new SuccessResponse("Pending requests fetched", requests).send(res);
  },
);
