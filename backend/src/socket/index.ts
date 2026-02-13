import cookie from "cookie";
import User from "../database/model/User";
import { Namespace, Socket, Server as SocketIOServer } from "socket.io";
import { ChatEventEnum } from "../constants";
import { Server } from "http";
import { Application, Request } from "express";
import { BadTokenError } from "../core/ApiError";
import JWT from "../core/JWT";
import userRepo from "../database/repositories/userRepo";
import colorsUtils from "../helpers/colorsUtils";
import { Types } from "mongoose";

declare module "socket.io" {
  interface Socket {
    user?: User;
  }
}

// handles the join chat event ie; when a user join a room
const mountJoinChatEvent = (socket: Socket): void => {
  socket.on(ChatEventEnum.JOIN_CHAT_EVENT, (chatId: string) => {
    colorsUtils.log("info", "user joined a chat room. chatId: " + chatId);
    socket.join(chatId); // join the user to a chat between or group chat
  });
};

// handle the start Typing event
const mountStartTypingEvent = (socket: Socket): void => {
  socket.on(ChatEventEnum.START_TYPING_EVENT, (chatId: string) => {
    socket.in(chatId).emit(ChatEventEnum.START_TYPING_EVENT, chatId);
  });
};

// handle the stop Typing event
const mountStopTypingEvent = (socket: Socket): void => {
  socket.on(ChatEventEnum.STOP_TYPING_EVENT, (chatId: string) => {
    socket.in(chatId).emit(ChatEventEnum.STOP_TYPING_EVENT, chatId);
  });
};

const activeCallHosts = new Set<string>();

// handle the signaling events
const mountSignalingEvents = (socket: Socket) => {
  // when a user starts a call, mark them as active host
  socket.on("startCall", () => {
    if (socket.user?._id) {
      activeCallHosts.add(socket.user._id.toString());
      colorsUtils.log("info", "Call started by " + socket.user.username);
    }
  });

  // when a user ends a call, remove them from active hosts
  socket.on("endCall", () => {
    if (socket.user?._id) {
      activeCallHosts.delete(socket.user._id.toString());
      colorsUtils.log("info", "Call ended by " + socket.user.username);
    }
  });

  // check if a user is currently hosting a call
  socket.on(
    "checkCallStatus",
    (targetUserId: string, callback: (isActive: boolean) => void) => {
      const isActive = activeCallHosts.has(targetUserId);
      callback(isActive);
    },
  );

  socket.on("newOffer", (data: any) => {
    const { newOffer, sendToUserId } = data;
    colorsUtils.log("info", "newOffer from " + socket.user?.username);
    socket.to(sendToUserId).emit("newOfferAwaiting", {
      offer: newOffer,
      offererUserId: socket.user?._id,
    });
  });

  socket.on("newAnswer", (data: any) => {
    const { answer, offererUserId } = data;
    colorsUtils.log("info", "newAnswer from " + socket.user?.username);
    socket.to(offererUserId).emit("answerResponse", {
      answer,
      answererUserId: socket.user?._id,
    });
  });

  socket.on("sendIceCandidateToSignalingServer", (data: any) => {
    const { iceCandidate, iceUserId, didIOffer, targetUserId } = data; // Ensure targetUserId is sent from client
    colorsUtils.log("info", "iceCandidate from " + socket.user?.username);

    // If targetUserId is provided directly (best practice)
    if (targetUserId) {
      socket
        .to(targetUserId)
        .emit("receivedIceCandidateFromServer", iceCandidate);
    } else {
      // Fallback or specific logic if needed, but client should send target
      colorsUtils.log("error", "Target user ID missing for ICE candidate");
    }
  });

  socket.on("hangupCall", (targetUserId: string) => {
    colorsUtils.log("info", "hangupCall from " + socket.user?.username);
    socket.to(targetUserId).emit("hangupCallReq", true);
  });
};

// Handle meeting specific events (Mesh Topology)
import meetingRepo from "../database/repositories/meetingRepo";

// Handle meeting specific events (Mesh Topology)
const mountMeetingEvents = (socket: Socket) => {
  socket.on("meeting-join", async ({ meetingId }) => {
    try {
      const meeting = await meetingRepo.findByMeetingId(meetingId);
      // For calls, checking active status is tricky if they are just ringing.
      // But currently repo returns meeting if exists.
      // If call is 'ringing', it might not maintain 'active' status in the same way or we need to allow joining ringing calls.
      // The current implementation sets status 'active' on create. so it should be fine.

      if (
        !meeting ||
        (meeting.status !== "active" && meeting.status !== ("ringing" as any))
      ) {
        // specific check for call
        // Wait, type definition says status is 'active' | 'ended'. I should check my model update.
        // In Meeting.ts, status is 'active' | 'ended'. callStatus creates sub-status.
        if (!meeting || meeting.status !== "active") {
          socket.emit("meeting-error", {
            message: "Meeting not found or has ended",
          });
          return;
        }
      }

      // console.log(`User ${socket.user?.username} joining meeting ${meetingId}`);
      socket.join(`meeting:${meetingId}`);

      // Fetch existing chat history and send to the user
      const detailedMeeting =
        await meetingRepo.findByMeetingIdDetailed(meetingId);
      if (detailedMeeting && detailedMeeting.messages) {
        socket.emit(
          "meeting-chat-history",
          detailedMeeting.messages.map((m) => ({
            text: m.text,
            sender: (m.sender as any).username || "Unknown",
            avatarUrl: (m.sender as any).avatarUrl,
            time: m.timestamp,
            isLocal:
              (m.sender as any)._id?.toString() ===
              socket.user?._id?.toString(),
          })),
        );
      }

      // Notify others in the room
      socket.to(`meeting:${meetingId}`).emit("meeting-user-joined", {
        socketId: socket.id,
        userId: socket.user?._id,
        username: socket.user?.username,
        avatarUrl: socket.user?.avatarUrl,
      });
    } catch (error) {
      console.error("Error joining meeting socket:", error);
      socket.emit("meeting-error", {
        message: "Internal server error during join",
      });
    }
  });

  socket.on("meeting-leave", async ({ meetingId }) => {
    // console.log(`User ${socket.user?.username} leaving meeting ${meetingId}`);
    socket.leave(`meeting:${meetingId}`);
    socket.to(`meeting:${meetingId}`).emit("meeting-user-left", {
      socketId: socket.id,
      userId: socket.user?._id,
    });

    // Auto-end meeting if no one is left
    const room = socket.nsp.adapter.rooms.get(`meeting:${meetingId}`);
    if (!room || room.size === 0) {
      colorsUtils.log(
        "info",
        `Auto-ending meeting ${meetingId} as all participants left.`,
      );
      await meetingRepo.endMeeting(meetingId);
    }
  });

  // Relay signaling data to a specific peer in the meeting
  socket.on("meeting-signal", ({ targetSocketId, signal }) => {
    // signal contains type (offer, answer, candidate) and the payload
    socket.to(targetSocketId).emit("meeting-signal", {
      senderSocketId: socket.id,
      sender: {
        userId: socket.user?._id,
        username: socket.user?.username,
        avatarUrl: socket.user?.avatarUrl,
      },
      signal,
    });
  });

  socket.on("meeting-chat-message", async ({ meetingId, message }) => {
    // Persist message to database
    if (socket.user?._id && message.text) {
      try {
        await meetingRepo.addMessage(meetingId, socket.user._id, message.text);
      } catch (error) {
        console.error("Error saving meeting chat message:", error);
      }
    }

    socket.to(`meeting:${meetingId}`).emit("meeting-chat-message", {
      ...message,
      sender: socket.user?.username,
      avatarUrl: socket.user?.avatarUrl,
      socketId: socket.id,
      time: new Date().toISOString(),
    });
  });

  // Call Specific Events
  socket.on("meeting-call-initiate", async ({ meetingId, participants }) => {
    if (Array.isArray(participants)) {
      participants.forEach((participantId: string) => {
        // Emit to specific user room (assuming users join room = userId)
        socket.to(participantId).emit("call-incoming", {
          meetingId,
          caller: {
            _id: socket.user?._id,
            username: socket.user?.username,
            avatarUrl: socket.user?.avatarUrl,
          },
          type: "call",
        });
      });
    }
  });

  socket.on("meeting-call-reject", ({ meetingId, callerId }) => {
    socket.to(callerId).emit("call-rejected", {
      meetingId,
      rejector: {
        _id: socket.user?._id,
        username: socket.user?.username,
      },
    });
  });
};

// function to initialize the socket io
const initSocketIo = (io: any): void => {
  io.on("connection", async (socket: Socket) => {
    try {
      // get the token from the cookies or the handshake auth header
      const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
      let token = cookies?.accessToken || socket.handshake.auth?.token;

      // throw an error if the token is not found
      if (!token) {
        throw new BadTokenError("Token not found");
      }

      // decode the token
      const decodedToken = await JWT.validateToken(token);

      // get user info
      const userId = new Types.ObjectId(decodedToken.sub);
      const user = await userRepo.findById(userId);

      if (!user) {
        throw new BadTokenError("Invalid token");
      }

      socket.user = user;
      socket.join(user._id.toString());
      socket.emit(ChatEventEnum.CONNECTED_EVENT);
      colorsUtils.log(
        "info",
        "🤝 User connected. userId: " + user._id.toString(),
      );

      mountJoinChatEvent(socket);
      mountStartTypingEvent(socket);
      mountStopTypingEvent(socket);
      mountSignalingEvents(socket);
      mountMeetingEvents(socket);

      // disconnect event
      socket.on("disconnecting", async () => {
        const rooms = Array.from(socket.rooms);
        for (const roomName of rooms) {
          if (roomName.startsWith("meeting:")) {
            const meetingId = roomName.replace("meeting:", "");
            // Check room size after this socket leaves
            const room = socket.nsp.adapter.rooms.get(roomName);
            // room.size is current size including this socket.
            // If size is 1, it means this is the last socket.
            if (room && room.size === 1) {
              colorsUtils.log(
                "info",
                `Auto-ending meeting ${meetingId} on disconnect as last participant left.`,
              );
              await meetingRepo.endMeeting(meetingId);
            }
          }
        }
      });

      socket.on(ChatEventEnum.DISCONNECTED_EVENT, () => {
        if (socket.user?._id) {
          activeCallHosts.delete(socket.user._id.toString());
          socket.leave(socket.user._id.toString());
        }
      });
    } catch (error) {
      socket.emit(
        ChatEventEnum.SOCKET_ERROR_EVENT,
        "something went wrong while connecting to socket",
      );
    }
  });
};

const emitSocketEvent = (
  req: Request,
  roomId: string,
  event: ChatEventEnum,
  payload: any,
): void => {
  const io = req.app.get("io") as Namespace;
  io.in(roomId).emit(event, payload);
};

export { initSocketIo, emitSocketEvent };
