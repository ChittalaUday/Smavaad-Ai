import axios from "axios";
import { LocalStorage } from "../utils";
// import FormData from "form-data";

// Axios instance for API requests
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL,
  withCredentials: true,
  timeout: 120000,
});

apiClient.interceptors.request.use(
  (config) => {
    // retrieve user token from localStorage
    const token = LocalStorage.get("token");
    // set authorization header with bearer
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err),
);

export const loginUser = (data) => {
  return apiClient.post("/auth/login", data);
};

export const registerUser = (data) => {
  return apiClient.post("/auth/register", data);
};

export const logoutUser = () => {
  return apiClient.post("/auth/logout");
};

export const getAvailableUsers = (usernameOrEmail) => {
  return apiClient.get(`/api/chat/users?userId=${usernameOrEmail}`);
};

// create a new one to one chat
export const createOneToOneChat = (receiverId) => {
  return apiClient.post(`api/chat/c/${receiverId}`);
};

// get all the current user chats
export const getAllcurrentUserChats = () => {
  return apiClient.get("api/chat");
};

// get chat messages
export const getChatMessages = (chatId) => {
  return apiClient.get(`api/messages/${chatId}`);
};

// send a message
export const sendMessage = (chatId, content, attachments) => {
  const formData = new FormData();
  if (content) {
    formData.append("content", content);
  }

  if (attachments) {
    attachments?.map((file) => {
      formData.append("attachments", file);
    });
  }

  return apiClient.post(`api/messages/${chatId}`, formData);
};

// create group chat
export const createGroupChat = (name, participants) => {
  const body = {
    name,
    participants,
  };
  return apiClient.post("api/chat/group", body);
};

// delete a message
export const deleteMessage = (messageId) => {
  return apiClient.delete(`api/messages/${messageId}`);
};

// delete a chat
export const deleteChat = (chatId) => {
  return apiClient.delete(`api/chat/${chatId}`);
};

// update a message
export const updateMessage = (messageId, content) => {
  return apiClient.put(`api/messages/${messageId}`, { content });
};

// generate pdf
export const generatePdf = (file) => {
  const formData = new FormData();
  formData.append("audio", file);
  return apiClient.post("/api/pdf/generate", formData, {
    responseType: "blob",
  });
};

// get AI chat history
export const getAIChatHistory = () => {
  return apiClient.get("api/chat/ai");
};

// summarize chat
export const summarizeChat = (chatId) => {
  return apiClient.post(`api/chat/ai/summarize/${chatId}`);
};

// stream chat with AI
export const streamChatWithAI = async (
  message,
  onChunk,
  onComplete,
  onError,
) => {
  try {
    const token = LocalStorage.get("token");
    const baseUrl = import.meta.env.VITE_SERVER_URL;
    const url = `${baseUrl.endsWith("/") ? baseUrl : baseUrl + "/"}api/chat/ai`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");

      // Keep the last partial line in the buffer
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const dataStr = trimmed.replace("data: ", "");
        if (dataStr === "[DONE]") {
          if (onComplete) onComplete();
          return;
        }

        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.content) {
            onChunk(parsed.content);
          }
        } catch (e) {
          console.error("Error parsing message JSON:", e, dataStr);
        }
      }
    }

    if (onComplete) onComplete();
  } catch (error) {
    if (onError) onError(error);
  }
};

// stream chat with AI about conversation
export const chatWithConversation = async (
  chatId,
  prompt,
  onChunk,
  onComplete,
  onError,
) => {
  try {
    const token = LocalStorage.get("token");
    const baseUrl = import.meta.env.VITE_SERVER_URL;
    const url = `${baseUrl.endsWith("/") ? baseUrl : baseUrl + "/"}api/messages/ai/${chatId}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");

      // Keep the last partial line in the buffer
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const dataStr = trimmed.replace("data: ", "");
        if (dataStr === "[DONE]") {
          if (onComplete) onComplete();
          return;
        }

        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.content) {
            onChunk(parsed.content);
          }
        } catch (e) {
          console.error("Error parsing message JSON:", e, dataStr);
        }
      }
    }

    if (onComplete) onComplete();
  } catch (error) {
    if (onError) onError(error);
  }
};

// Meeting APIs
export const createMeeting = () => {
  return apiClient.post("/api/meetings");
};

export const validateMeeting = (meetingId) => {
  return apiClient.get(`/api/meetings/${meetingId}`);
};

export const joinMeeting = (meetingId) => {
  return apiClient.post(`/api/meetings/${meetingId}/join`);
};

// Call State Manager APIs
const AI_SERVICE_URL =
  import.meta.env.VITE_AI_SERVICE_URL || "http://127.0.0.1:8000";

export const extractIntents = async (transcript) => {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/api/extract-intents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("extractIntents error:", error);
    return null;
  }
};

export const summarizeCall = async (transcript, intents) => {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/api/call-summarize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, intents }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("summarizeCall error:", error);
    return null;
  }
};

export const saveCallTranscript = (meetingId, transcript) => {
  return apiClient.post(`/api/meetings/${meetingId}/transcript`, {
    transcript,
  });
};

export const saveCallSummary = (meetingId, summary, actionItems) => {
  return apiClient.post(`/api/meetings/${meetingId}/summary`, {
    summary,
    actionItems,
  });
};

export const getMyMeetings = () => {
  return apiClient.get("/api/meetings/my");
};

export const getMeetingDetail = (meetingId) => {
  return apiClient.get(`/api/meetings/${meetingId}/detail`);
};

export const summarizeMeeting = (meetingId) => {
  return apiClient.post(`/api/meetings/${meetingId}/summarize`);
};

export const transcribeMeeting = (meetingId) => {
  return apiClient.post(`/api/meetings/${meetingId}/transcribe`);
};

export const generateMeetingPdf = (meetingId) => {
  return apiClient.post(`/api/meetings/${meetingId}/generate-pdf`);
};

export const generateMeetingTranscriptPdf = (meetingId) => {
  return apiClient.post(
    `/api/meetings/${meetingId}/generate-transcript-pdf`,
    {},
    {
      responseType: "blob",
    },
  );
};

export const saveMeetingAudio = (meetingId, audioBlob) => {
  const formData = new FormData();
  formData.append("audio", audioBlob, `meeting-${meetingId}.webm`);
  return apiClient.post(`/api/meetings/${meetingId}/audio`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const chatWithMeeting = async (
  meetingId,
  prompt,
  onChunk,
  onComplete,
  onError,
) => {
  try {
    const token = LocalStorage.get("token");
    const baseUrl = import.meta.env.VITE_SERVER_URL;
    const url = `${baseUrl.endsWith("/") ? baseUrl : baseUrl + "/"}api/meetings/${meetingId}/ai`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");

      buffer = lines.pop(); // Keep the last partial line

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const dataStr = trimmed.replace("data: ", "");
        if (dataStr === "[DONE]") {
          if (onComplete) onComplete();
          return;
        }

        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.content) {
            onChunk(parsed.content);
          }
        } catch (e) {
          console.error("Error parsing message JSON:", e, dataStr);
        }
      }
    }

    if (onComplete) onComplete();
  } catch (error) {
    if (onError) onError(error);
  }
};

export default apiClient;
