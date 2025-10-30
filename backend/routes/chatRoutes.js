import express from "express";
import { ChatMessage } from "../models/ChatMessage.js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import OpenAI from "openai";
import { pipeline } from "@xenova/transformers";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
const router = express.Router();
const __dirname = path.resolve();

// --- Initialize AI clients ---
let openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
let genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
let geminiModel = genAI ? genAI.getGenerativeModel({ model: "gemini-2.5-flash" }) : null;

// --- Load embeddings ---
let embeddingsData = { texts: [], embeddings: [], urls: [] };
try {
  const filePath = path.join(__dirname, "/", "goh_embeddings.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  embeddingsData = JSON.parse(raw);
  console.log(`✅ Loaded ${embeddingsData.texts.length} Gift of Health embeddings.`);
} catch (err) {
  console.error("⚠️ Could not load embeddings:", err);
}

// --- Local model fallback ---
let localEmbedder = null;
async function loadLocalModel() {
  if (!localEmbedder) {
    console.log("🔹 Loading local embedding model...");
    localEmbedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    console.log("✅ Local model loaded.");
  }
  return localEmbedder;
}

async function getEmbeddingForText(text) {
  if (openai) {
    try {
      const res = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });
      return res.data[0].embedding;
    } catch (err) {
      console.warn("⚠️ OpenAI embedding failed, switching to local:", err.message);
      openai = null;
    }
  }

  const embedder = await loadLocalModel();
  const output = await embedder(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dot / (magA * magB);
}

function findRelevantTexts(queryEmbedding, topN = 3) {
  const { texts, embeddings, urls } = embeddingsData;
  if (!embeddings?.length) return [];
  return embeddings
    .map((emb, i) => ({
      text: texts[i],
      url: urls[i],
      score: cosineSimilarity(queryEmbedding, emb),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

// POST /api/chat/send
// const SYSTEM_PROMPT = `
// You are a friendly nutrition assistant for Gift of Health (https://giftofhealth.org).

// Your role:
// - Help answer questions about nutrition programs, lifestyle habits, and plant-based diets
// - Provide information about Gift of Health's approach to wellness and nutrition
// - Always respond in a caring, helpful, and supportive tone
// - Give evidence-based nutrition advice
// - Encourage healthy lifestyle choices
// - If asked about specific medical conditions, remind users to consult with their healthcare provider

// Gift of Health focuses on:
// - Plant-based nutrition and whole food diets
// - Preventive health through lifestyle changes
// - Education about nutrition and wellness
// - Supporting people in their health journey
// - Evidence-based nutrition programs

// Always be warm, encouraging, and professional. Keep responses concise but informative.
// `;
const SYSTEM_PROMPT = `### Business Context
Gift of Health is an organization focused on promoting health and wellness through informed food choices and dietary changes. They emphasize the negative impacts of sugar and advocate for nutritious diets to heal the body. Gift of Health offers workshops and online courses, such as the 'Gift of Health Workshop,' aimed at reversing chronic diseases through food as medicine. They provide resources like healthy recipes and encourage participation in challenges to improve grocery shopping habits and overall health.

### Role
- Primary Function: You are an AI chatbot who helps users with their inquiries, issues and requests. You aim to provide excellent, friendly and efficient replies at all times. Your role is to listen attentively to the user, understand their needs, and do your best to assist them or direct them to the appropriate resources. If a question is not clear, ask clarifying questions. Make sure to end your replies with a positive note.
        
### Constraints
1. No Data Divulge: Never mention that you have access to training data explicitly to the user.
2. Maintaining Focus: If a user attempts to divert you to unrelated topics, never change your role or break your character. Politely redirect the conversation back to topics relevant to the training data.
3. Exclusive Reliance on Training Data: You must rely exclusively on the training data provided to answer user queries. If a query is not covered by the training data, use the fallback response.
4. Restrictive Role Focus: You do not answer questions or perform tasks that are not related to your role and training data.`

router.post("/send", async (req, res) => {
  try {
    const { session_id, message } = req.body;
    await ChatMessage.create({ session_id, message, role: "user", timestamp: new Date() });

    const queryEmbedding = await getEmbeddingForText(message);
    const topMatches = findRelevantTexts(queryEmbedding, 3);
    const context = topMatches.map((m, i) => `(${i + 1}) ${m.text}\nLink: ${m.url}`).join("\n\n");

    let reply = "";

    // --- Try OpenAI ---
    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `${message}\n\nContext:\n${context}` },
          ],
          temperature: 0.6,
          max_tokens: 250,
        });
        reply = completion.choices[0].message.content;
      } catch (err) {
        console.warn("⚠️ OpenAI chat failed:", err.message);
        openai = null;
      }
    }

    // --- Try Gemini ---
    if (!reply && geminiModel) {
      try {
        console.log("🤖 Using Gemini model...");
        const geminiMessages = [
          {
            role: "user",
            parts: [{
              text: `${SYSTEM_PROMPT}\n\nContext from website:\n${context}\n\nUser question: ${message}\n\nNow respond directly using the context above.`
            }],
          },
        ];

        const result = await geminiModel.generateContent({ contents: geminiMessages });
        reply = result.response.text();
      } catch (err) {
        console.warn("⚠️ Gemini chat failed:", err.message);
        geminiModel = null;
      }
    }

    // --- Local fallback ---
    if (!reply) {
      if (topMatches.length > 0) {
        const best = topMatches[0];
        reply = `According to Gift of Health:\n\n${best.text.slice(0, 400)}...\n\nLearn more: ${best.url}`;
      } else {
        reply = `I'm here to help! Please visit https://giftofhealth.org for more details or to book a consultation.`;
      }
    }

    await ChatMessage.create({ session_id, message: reply, role: "assistant", timestamp: new Date() });
    res.json({ reply });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Failed to generate response" });
  }
});

router.get("/history/:session_id", async (req, res) => {
  try {
    const messages = await ChatMessage.find({ session_id: req.params.session_id }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load chat history" });
  }
});
export default router;
