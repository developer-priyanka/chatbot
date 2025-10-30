import { apiClient } from './apiClient';


export const ChatMessage = {
  // Send a message (user input → backend → response)
  async send(session_id, message) {
    return apiClient.post("/chat/send", { session_id, message });
  },

  // Fetch chat history for a session
  async getHistory(session_id) {
    return apiClient.get(`/chat/history/${session_id}`);
  },
};


// auth sdk:
export const User = {
  getCurrentUser: () => ({ id: "guest", name: "Guest User" }),
  isAuthenticated: () => true,
};