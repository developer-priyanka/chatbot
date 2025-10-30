import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import chatRoutes from "./routes/chatRoutes.js";
dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Connect DB
connectDB();

app.get("/", (req, res) => res.send("Gift of Health Chatbot API running 🚀"));

// Chat routes
app.use("/api/chat", chatRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
