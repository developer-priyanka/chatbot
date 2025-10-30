import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import MessageBubble from "./MessageBubble";

// eslint-disable-next-line react/prop-types
export default function ChatWindow({ isOpen, onClose, messages, onSendMessage, isLoading }) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleBookAppointment = () => {
    window.open("https://giftofhealth.org/appointment-page", "_blank");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          />

          {/* Chat Window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-6 right-6 w-[380px] h-[600px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden md:w-[380px] max-md:inset-4 max-md:w-auto max-md:h-auto max-md:max-h-[calc(100vh-2rem)]"
          >
            {/* Header */}
            <div
              className="px-6 py-4 text-white flex items-center justify-between"
              style={{ backgroundColor: "#00897B" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🍎</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Gift of Health</h3>
                  <p className="text-xs text-white/80">Nutrition Assistant</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Welcome Message */}
            {messages.length === 0 && (
              <div className="px-6 py-8 bg-gradient-to-b from-teal-50 to-white">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-teal-600" />
                  <h4 className="font-semibold text-gray-900">Welcome!</h4>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  I&apos;m your Gift of Health nutrition assistant. Ask me about:
                </p>
                <div className="space-y-2">
                  {[
                    "🥗 Plant-based nutrition",
                    "🏃 Healthy lifestyle habits",
                    "📚 Our nutrition programs",
                    "❓ General health questions"
                  ].map((item, i) => (
                    <div key={i} className="text-sm text-gray-600 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 bg-white">
              {messages.map((msg, index) => (
                <MessageBubble
                  key={index}
                  message={msg.message}
                  role={msg.role}
                  timestamp={msg.timestamp}
                />
              ))}
              
              {isLoading && (
                <div className="flex gap-3 mb-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-teal-500 to-teal-600">
                    <span className="text-white text-lg">🍎</span>
                  </div>
                  <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <motion.div
                        className="w-2 h-2 bg-teal-500 rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-teal-500 rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-teal-500 rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Book Appointment CTA */}
            {messages.length > 2 && (
              <div className="px-6 py-3 bg-gradient-to-r from-teal-50 to-emerald-50 border-t border-teal-100">
                <button
                  onClick={handleBookAppointment}
                  className="w-full flex items-center justify-center gap-2 text-sm text-teal-700 hover:text-teal-800 font-medium transition-colors group"
                >
                  <Calendar className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>Ready to book an appointment?</span>
                </button>
              </div>
            )}

            {/* Input */}
            <div className="px-4 py-4 bg-gray-50 border-t border-gray-100">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything about nutrition..."
                  className="flex-1 resize-none min-h-[44px] max-h-[120px] border-gray-200 focus:border-teal-500 focus:ring-teal-500 rounded-xl"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="h-11 px-4 rounded-xl self-end"
                  style={{ backgroundColor: "#00897B" }}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
              
              <div className="mt-2 text-center">
                <p className="text-xs text-gray-400">
                  Powered by <span className="font-medium text-teal-600">Gift of Health AI</span>
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}