import { useState, useRef, useEffect, useCallback } from "react";

import { toast } from "react-toastify";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { apiClient } from "../api";
import { useCallStateManager, CALL_STATES } from "./useCallStateManager";
import { useRealtimeTranscription } from "./useRealtimeTranscription";
import {
  extractIntents,
  summarizeCall,
  saveCallTranscript,
  saveCallSummary,
  saveMeetingAudio,
  summarizeMeeting,
} from "../api";

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
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [participants, setParticipants] = useState({});
  const [localStream, setLocalStream] = useState(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [showTranscript, setShowTranscript] = useState(false);

  // Call Specific State
  const [incomingCall, setIncomingCall] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [meetingFiles, setMeetingFiles] = useState({
    audioUrl: null,
    pdfUrl: null,
  });

  // Refs
  const peersRef = useRef({});
  const localStreamRef = useRef(null);
  const paramsRef = useRef({ meetingId: null });
  const intentIntervalRef = useRef(null);
  const lastIntentLengthRef = useRef(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const audioDestRef = useRef(null);
  const sourceNodesRef = useRef(new Map()); // Map client/socketId -> SourceNode

  // Call State Manager
  const callStateManager = useCallStateManager();
  const {
    callState,
    initializeCall,
    activateCall,
    endCall,
    dismissWrapUp,
    appendTranscript,
    transcript,
    extractedIntents,
    callSummary,
    updateIntents,
    setPostCallSummary,
    formattedDuration,
    greeting,
    sessionId,
  } = callStateManager;

  // Real-time Transcription
  useRealtimeTranscription({
    localStream,
    callState,
    onTranscript: appendTranscript,
  });

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

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("meeting-signal", {
            targetSocketId,
            signal: { type: "candidate", candidate: event.candidate },
          });
        }
      };

      pc.ontrack = (event) => {
        console.log(`Received track from ${targetSocketId}`, event.streams[0]);
        setParticipants((prev) => ({
          ...prev,
          [targetSocketId]: {
            ...prev[targetSocketId],
            stream: event.streams[0],
          },
        }));

        // Connect remote audio to recording mix
        if (audioContextRef.current && audioDestRef.current) {
          const remoteStream = event.streams[0];
          if (remoteStream.getAudioTracks().length > 0) {
            const source =
              audioContextRef.current.createMediaStreamSource(remoteStream);
            source.connect(audioDestRef.current);
            sourceNodesRef.current.set(targetSocketId, source);
          }
        }

        // Transition INITIALIZED → ACTIVE when first remote stream arrives
        activateCall();
      };

      peersRef.current[targetSocketId] = pc;
      return pc;
    },
    [socket, activateCall],
  );

  // Join Meeting
  const joinMeeting = useCallback(
    async (meetingId) => {
      if (!socket) {
        console.error("joinMeeting: No socket available");
        return;
      }

      console.log("joinMeeting: Starting for", meetingId);

      const stream = await getLocalStream();
      if (!stream) {
        console.warn(
          "joinMeeting: Could not get local stream, continuing without camera",
        );
      }

      paramsRef.current.meetingId = meetingId;
      setActiveMeeting({ meetingId });
      setParticipants({});
      setMessages([]);
      setIncomingCall(null);

      // Setup Audio Recording
      if (!audioContextRef.current) {
        audioContextRef.current = new (
          window.AudioContext || window.webkitAudioContext
        )();
        audioDestRef.current =
          audioContextRef.current.createMediaStreamDestination();
      }

      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      if (stream) {
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(audioDestRef.current);
        sourceNodesRef.current.set("local", source);
      }

      // Start Recording
      mediaRecorderRef.current = new MediaRecorder(
        audioDestRef.current.stream,
        {
          mimeType: "audio/webm",
        },
      );
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.start();

      // Initialize call state machine → INITIALIZED
      initializeCall();

      console.log("joinMeeting: activeMeeting set, emitting meeting-join");
      socket.emit("meeting-join", { meetingId });
    },
    [socket, getLocalStream, initializeCall],
  );

  // Leave Meeting
  const leaveMeeting = useCallback(() => {
    if (!socket || !paramsRef.current.meetingId) return;

    const meetingId = paramsRef.current.meetingId;

    // Transition to ENDED state (post-processing begins)
    endCall();

    socket.emit("meeting-leave", { meetingId });

    // Close all peer connections
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

    if (intentIntervalRef.current) {
      clearInterval(intentIntervalRef.current);
      intentIntervalRef.current = null;
    }

    // Stop and Upload Recording
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        if (audioBlob.size > 0) {
          try {
            console.log("Uploading meeting audio...");
            const response = await saveMeetingAudio(meetingId, audioBlob);
            if (response.data?.data) {
              const { audioUrl, pdfUrl } = response.data.data;
              setMeetingFiles({ audioUrl, pdfUrl });
            }
            console.log("Meeting audio uploaded successfully");
          } catch (error) {
            console.error("Failed to upload meeting audio", error);
          }
        }
      };
      mediaRecorderRef.current.stop();
    }

    // Clean up nodes
    sourceNodesRef.current.forEach((node) => node.disconnect());
    sourceNodesRef.current.clear();

    // Don't clear activeMeeting yet — keep for wrap-up card
    // Don't reset call state — ENDED state triggers post-processing
    // After wrap-up is dismissed, handleDismissWrapUp() clears activeMeeting → Room.jsx navigates away
    paramsRef.current.meetingId = null;
  }, [socket, endCall]);

  // Dismiss wrap-up → IDLE
  const handleDismissWrapUp = useCallback(() => {
    dismissWrapUp();
    setActiveMeeting(null);
  }, [dismissWrapUp]);

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
          socket.emit("meeting-call-initiate", {
            meetingId: meeting.meetingId,
            participants: participantsList,
          });
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

  // ─── Periodic Intent Extraction during ACTIVE state ─────────────
  useEffect(() => {
    if (callState === CALL_STATES.ACTIVE) {
      intentIntervalRef.current = setInterval(async () => {
        const currentTranscript = transcript;
        if (currentTranscript.length > lastIntentLengthRef.current + 100) {
          lastIntentLengthRef.current = currentTranscript.length;
          try {
            const newText = currentTranscript.slice(
              lastIntentLengthRef.current - 100,
            );
            const result = await extractIntents(newText);
            if (result) {
              updateIntents(result);
            }
          } catch (err) {
            console.error("Intent extraction failed:", err);
          }
        }
      }, 60000);
    }

    return () => {
      if (intentIntervalRef.current) {
        clearInterval(intentIntervalRef.current);
        intentIntervalRef.current = null;
      }
    };
  }, [callState, transcript, updateIntents]);

  // ─── Post-Call Processing when ENDED ────────────────────────────
  const runPostProcessing = useCallback(async () => {
    console.log("[PostProcessing] Starting...");
    setIsSummarizing(true);

    const meetingId = activeMeeting?.meetingId;
    const currentTranscript = transcript;

    try {
      // 1. Save transcript to backend
      if (meetingId && currentTranscript) {
        try {
          await saveCallTranscript(meetingId, currentTranscript);
          console.log("[PostProcessing] Transcript saved");
        } catch (err) {
          console.error("[PostProcessing] Failed to save transcript:", err);
        }
      }

      // 2. Trigger summarization via backend (which handles AI + PDF + DB)
      if (meetingId && currentTranscript && currentTranscript.length > 20) {
        try {
          const response = await summarizeMeeting(meetingId);
          if (response.data?.data) {
            const updatedMeeting = response.data.data;
            // Update local state to reflect summary
            setPostCallSummary({
              summary: updatedMeeting.summary,
              action_items: updatedMeeting.actionItems || [],
              key_topics: updatedMeeting.keyTopics || [], // Note: check backend key names
            });
            // Update meeting files for download links
            setMeetingFiles({
              audioUrl: updatedMeeting.audioUrl,
              pdfUrl: updatedMeeting.pdfUrl,
            });
          }
        } catch (err) {
          console.error("[PostProcessing] Summarization failed:", err);
          setPostCallSummary({
            summary: "Call summary could not be generated automatically.",
            action_items: [],
            key_topics: [],
          });
        }
      } else {
        setPostCallSummary({
          summary:
            currentTranscript?.length <= 20
              ? "Call was too short to generate a summary."
              : "No transcript available for summarization.",
          action_items: [],
          key_topics: [],
        });
      }
    } finally {
      setIsSummarizing(false);
      console.log("[PostProcessing] Complete");
    }
  }, [
    activeMeeting?.meetingId,
    transcript,
    setPostCallSummary,
    setMeetingFiles,
  ]);

  useEffect(() => {
    if (callState === CALL_STATES.ENDED) {
      runPostProcessing();
    }
  }, [callState, runPostProcessing]);

  // ─── Socket Events ─────────────────────────────────────────────
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
    };

    const handleCallIncoming = (data) => {
      console.log("Incoming call:", data);
      setIncomingCall(data);
    };

    const handleCallRejected = (data) => {
      toast.info(`${data.rejector?.username} rejected the call`);
      leaveMeeting();
    };

    const handleChatHistory = (history) => {
      setMessages(history);
    };

    socket.on("meeting-user-joined", handleUserJoined);
    socket.on("meeting-user-left", handleUserLeft);
    socket.on("meeting-signal", handleSignal);
    socket.on("meeting-chat-message", handleChatMessage);
    socket.on("meeting-chat-history", handleChatHistory);
    socket.on("meeting-error", handleMeetingError);
    socket.on("call-incoming", handleCallIncoming);
    socket.on("call-rejected", handleCallRejected);

    return () => {
      socket.off("meeting-user-joined", handleUserJoined);
      socket.off("meeting-user-left", handleUserLeft);
      socket.off("meeting-signal", handleSignal);
      socket.off("meeting-chat-message", handleChatMessage);
      socket.off("meeting-chat-history", handleChatHistory);
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

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }

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

  const toggleTranscript = () => {
    setShowTranscript((prev) => !prev);
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

    // Call State Manager
    callState,
    sessionId,
    transcript,
    extractedIntents,
    callSummary,
    formattedDuration,
    greeting,
    isSummarizing,
    showTranscript,
    toggleTranscript,
    handleDismissWrapUp,
    meetingFiles,
    retrySummarization: runPostProcessing,
  };
};
