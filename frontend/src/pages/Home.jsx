import { useState, useEffect } from "react";
import { ChatMessage } from "@/api/entities"; // 👈 use our local API wrapper
import ChatButton from "../components/chat/ChatButton";
import ChatWindow from "../components/chat/ChatWindow";

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    loadMessages(newSessionId);
  }, []);

  const loadMessages = async (sid) => {
    try {
      const chatHistory = await ChatMessage.getHistory(sid);
      if (chatHistory?.length > 0) {
        setMessages(chatHistory);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const handleSendMessage = async (userMessage) => {
    const userMsg = {
      message: userMessage,
      role: "user",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // 👇 send user message to backend
      const response = await ChatMessage.send(sessionId, userMessage);

      const assistantMsg = {
        message: response.reply || "I’m here to help!",
        role: "assistant",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg = {
        message: "Oops! Something went wrong. Please try again later.",
        role: "assistant",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <ChatButton onClick={() => setIsOpen(!isOpen)} />
      <ChatWindow
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}