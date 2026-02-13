import { useState, useRef, useEffect, useCallback } from "react";

import { toast } from "react-toastify";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { apiClient } from "../api";

const ICE_SERVERS = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"],
    },
  ],
};

export const useMeetingEngine = () => {
  const { socket } = useSocket();
  const { user } = useAuth();

  // State
  const [activeMeeting, setActiveMeeting] = useState(null); // { meetingId, type, ... }
  const [participants, setParticipants] = useState({}); // { [socketId]: { userId, username, stream, ... } }
  const [localStream, setLocalStream] = useState(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [messages, setMessages] = useState([]);

  // Call Specific State
  const [incomingCall, setIncomingCall] = useState(null); // { meetingId, caller, type }

  // Refs
  const peersRef = useRef({}); // { [socketId]: RTCPeerConnection }
  const localStreamRef = useRef(null);
  const paramsRef = useRef({ meetingId: null });

  // Initialize Local Media
  const getLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (error) {
      console.error("Failed to get local stream", error);
      toast.error("Failed to access camera/microphone");
      return null;
    }
  }, []);

  // Create Peer Connection
  const createPeerConnection = useCallback(
    (targetSocketId, isInitiator) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Add local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      // Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("meeting-signal", {
            targetSocketId,
            signal: { type: "candidate", candidate: event.candidate },
          });
        }
      };

      // Handle Remote Stream
      pc.ontrack = (event) => {
        console.log(`Received track from ${targetSocketId}`, event.streams[0]);
        setParticipants((prev) => ({
          ...prev,
          [targetSocketId]: {
            ...prev[targetSocketId],
            stream: event.streams[0],
          },
        }));
      };

      peersRef.current[targetSocketId] = pc;
      return pc;
    },
    [socket],
  );

  // Join Meeting
  const joinMeeting = useCallback(
    async (meetingId) => {
      if (!socket) {
        console.error("joinMeeting: No socket available");
        return;
      }

      console.log("joinMeeting: Starting for", meetingId);

      // 1. Get media (continue even if it fails — user can still see remote video)
      const stream = await getLocalStream();
      if (!stream) {
        console.warn(
          "joinMeeting: Could not get local stream, continuing without camera",
        );
      }

      paramsRef.current.meetingId = meetingId;
      setActiveMeeting({ meetingId });
      setParticipants({}); // Reset participants
      setMessages([]);
      setIncomingCall(null); // Clear incoming call if joining

      console.log("joinMeeting: activeMeeting set, emitting meeting-join");

      // 2. Emit join event
      socket.emit("meeting-join", { meetingId });
    },
    [socket, getLocalStream],
  );

  // Leave Meeting
  const leaveMeeting = useCallback(() => {
    if (!socket || !paramsRef.current.meetingId) return;

    socket.emit("meeting-leave", { meetingId: paramsRef.current.meetingId });

    // Close all connections
    Object.values(peersRef.current).forEach((pc) => pc.close());
    peersRef.current = {};

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    setLocalStream(null);
    localStreamRef.current = null;

    setParticipants({});
    setMessages([]);
    setActiveMeeting(null);
    paramsRef.current.meetingId = null;
  }, [socket]);

  // Start Call
  const startCall = useCallback(
    async (participantsList) => {
      try {
        const response = await apiClient.post("/api/meetings", {
          type: "call",
          participants: participantsList,
        });
        const data = response.data;

        if (data.statusCode === "10000" || data.data) {
          const meeting = data.data;
          // 2. Notify Participants
          socket.emit("meeting-call-initiate", {
            meetingId: meeting.meetingId,
            participants: participantsList,
          });

          // 3. Join the call (this sets activeMeeting, which triggers the CallOverlay)
          await joinMeeting(meeting.meetingId);
        } else {
          toast.error(data.message || "Failed to start call");
        }
      } catch (error) {
        console.error("Error starting call", error);
        toast.error("Error starting call");
      }
    },
    [socket, joinMeeting],
  );

  const rejectCall = useCallback(
    (meetingId, callerId) => {
      socket.emit("meeting-call-reject", { meetingId, callerId });
      setIncomingCall(null);
    },
    [socket],
  );

  const acceptCall = useCallback(
    async (meetingId) => {
      console.log("acceptCall: Accepting call for meeting", meetingId);
      await joinMeeting(meetingId);
      setIncomingCall(null);
      console.log("acceptCall: Call accepted, overlay should be visible");
    },
    [joinMeeting],
  );

  // Send Message
  const sendMessage = useCallback(
    (text) => {
      if (!socket || !paramsRef.current.meetingId) return;

      setMessages((prev) => [
        ...prev,
        {
          text,
          sender: user?.username || "You",
          avatarUrl: user?.avatarUrl,
          time: new Date().toISOString(),
          isLocal: true,
        },
      ]);

      socket.emit("meeting-chat-message", {
        meetingId: paramsRef.current.meetingId,
        message: { text },
      });
    },
    [socket, user],
  );

  // Socket Events Handling
  useEffect(() => {
    if (!socket) return;

    const handleUserJoined = async ({
      socketId,
      userId,
      username,
      avatarUrl,
    }) => {
      console.log(`User joined: ${username} (${socketId})`);

      setParticipants((prev) => ({
        ...prev,
        [socketId]: { userId, username, avatarUrl, stream: null },
      }));

      // Initiate WebRTC connection (We are existing user, they are new)
      const pc = createPeerConnection(socketId, true);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("meeting-signal", {
        targetSocketId: socketId,
        signal: { type: "offer", sdp: offer },
      });
    };

    const handleUserLeft = ({ socketId }) => {
      console.log(`User left: ${socketId}`);
      if (peersRef.current[socketId]) {
        peersRef.current[socketId].close();
        delete peersRef.current[socketId];
      }
      setParticipants((prev) => {
        const newParticipants = { ...prev };
        delete newParticipants[socketId];
        return newParticipants;
      });
    };

    const handleChatMessage = (message) => {
      setMessages((prev) => [...prev, { ...message, isLocal: false }]);
    };

    const handleSignal = async ({ senderSocketId, sender, signal }) => {
      console.log(
        `Received signal from ${senderSocketId}: ${signal.type}`,
        sender,
      );

      let pc = peersRef.current[senderSocketId];

      if (!pc && signal.type === "offer") {
        pc = createPeerConnection(senderSocketId, false);
      }

      if (!pc) {
        console.warn(
          `No peer connection for ${senderSocketId}, ignoring signal`,
        );
        return;
      }

      if (signal.type === "offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("meeting-signal", {
          targetSocketId: senderSocketId,
          signal: { type: "answer", sdp: answer },
        });

        setParticipants((prev) => {
          // Update if missing OR if we now have better info (e.g. sender details)
          if (!prev[senderSocketId] || !prev[senderSocketId].userId) {
            return {
              ...prev,
              [senderSocketId]: {
                stream: prev[senderSocketId]?.stream || null,
                userId: sender?.userId,
                username: sender?.username,
                avatarUrl: sender?.avatarUrl,
              },
            };
          }
          return prev;
        });
      } else if (signal.type === "answer") {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      } else if (signal.type === "candidate") {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } catch (e) {
          console.error("Error adding ice candidate", e);
        }
      }
    };

    const handleMeetingError = ({ message }) => {
      toast.error(message);
      leaveMeeting();
      // Redirect logic?
      // Using window.location is harsh, maybe just state reset
      // window.location.href = "/chat";
    };

    const handleCallIncoming = (data) => {
      // data: { meetingId, caller, type }
      console.log("Incoming call:", data);
      setIncomingCall(data);
      // Play ringtone? handled by Context or UI
    };

    const handleCallRejected = (data) => {
      toast.info(`${data.rejector?.username} rejected the call`);
      leaveMeeting();
    };

    socket.on("meeting-user-joined", handleUserJoined);
    socket.on("meeting-user-left", handleUserLeft);
    socket.on("meeting-signal", handleSignal);
    socket.on("meeting-chat-message", handleChatMessage);
    socket.on("meeting-error", handleMeetingError);
    socket.on("call-incoming", handleCallIncoming);
    socket.on("call-rejected", handleCallRejected);

    return () => {
      socket.off("meeting-user-joined", handleUserJoined);
      socket.off("meeting-user-left", handleUserLeft);
      socket.off("meeting-signal", handleSignal);
      socket.off("meeting-chat-message", handleChatMessage);
      socket.off("meeting-error", handleMeetingError);
      socket.off("call-incoming", handleCallIncoming);
      socket.off("call-rejected", handleCallRejected);
    };
  }, [socket, user, createPeerConnection, leaveMeeting]);

  // Screen Sharing
  const shareScreen = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      const screenTrack = stream.getVideoTracks()[0];

      setLocalStream(stream);
      localStreamRef.current = stream;

      Object.values(peersRef.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track.kind === "video");
        if (sender) {
          sender.replaceTrack(screenTrack);
        }
      });

      setIsScreenSharing(true);
      setIsCamOn(false);

      screenTrack.onended = () => {
        stopScreenShare();
      };
    } catch (error) {
      console.error("Error sharing screen", error);
    }
  };

  const stopScreenShare = async () => {
    if (!isScreenSharing) return;

    // Stop screen share stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }

    // Revert to camera
    const stream = await getLocalStream();
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      Object.values(peersRef.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track.kind === "video");
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });
      setIsScreenSharing(false);
      setIsCamOn(true);
    }
  };

  // Controls
  const toggleMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current
        .getAudioTracks()
        .forEach((t) => (t.enabled = !isMicOn));
      setIsMicOn(!isMicOn);
    }
  };

  const toggleCam = async () => {
    if (isScreenSharing) {
      await stopScreenShare();
      return;
    }

    if (localStreamRef.current) {
      localStreamRef.current
        .getVideoTracks()
        .forEach((t) => (t.enabled = !isCamOn));
      setIsCamOn(!isCamOn);
    }
  };

  return {
    user,
    activeMeeting,
    joinMeeting,
    leaveMeeting,
    localStream,
    participants,
    toggleMic,
    toggleCam,
    shareScreen,
    stopScreenShare,
    isMicOn,
    isCamOn,
    isScreenSharing,
    messages,
    sendMessage,
    startCall,
    incomingCall,
    acceptCall,
    rejectCall,
  };
};
