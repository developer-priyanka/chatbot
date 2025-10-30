import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema({
  session_id: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "assistant"],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
