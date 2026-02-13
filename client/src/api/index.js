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
    const response = await fetch(
      `${import.meta.env.VITE_SERVER_URL}api/chat/ai`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.trim() !== "") {
          try {
            const parsed = JSON.parse(line);
            if (parsed.content) {
              onChunk(parsed.content);
            }
          } catch (e) {
            console.error("Error parsing chunk:", e);
          }
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

export default apiClient;
