const express    = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const authenticate = require("../middleware/auth");
const router     = express.Router();

const SYSTEM_PROMPT = `You are CRIMSON Assistant, an AI-powered chatbot 
for the CRIMSON Crime Reporting and Intelligent Safety Management System 
in Sri Lanka.

Your role:
- Help citizens report crimes and understand the reporting process
- Guide users through the CRIMSON platform features
- Provide information about victim support services
- Answer questions about case tracking and follow-up
- Give safety tips and crime prevention advice
- Explain police procedures in simple language

Important facts:
- Sri Lanka Police emergency number: 119
- Ambulance: 1990
- CRIMSON covers all 25 districts of Sri Lanka
- Legal reference: Computer Crime Act No. 24 of 2007
- You support English, Sinhala, and Tamil languages

Rules:
- Always be empathetic, especially with crime victims
- If someone is in danger tell them to call 119 IMMEDIATELY
- Never give legal advice - direct to legal aid services
- Keep responses clear, short and helpful
- If asked in Sinhala or Tamil, respond in that language`;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model:             "gemini-2.5-flash",
  systemInstruction: SYSTEM_PROMPT,
});

// ── Authenticated route (for logged-in users) ──
router.post("/message", authenticate, async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty"
      });
    }

    // Build chat history for Gemini
    const chatHistory = history.map(h => ({
      role:  h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }]
    }));

    const chat = model.startChat({
      history:          chatHistory,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature:     0.7,
      },
    });

    const result = await chat.sendMessage(message);
    const reply  = result.response.text();

    res.json({ success: true, reply });

  } catch (error) {
    console.error("Chatbot error:", error.status, error.message?.substring(0, 120));
    const is429 = error.status === 429 || error.message?.includes("429") || error.message?.includes("quota");
    res.status(is429 ? 429 : 500).json({
      success: false,
      message: is429
        ? "AI assistant is temporarily busy. Please wait a moment and try again."
        : "Chatbot unavailable. Please try again."
    });
  }
});

// ── Public route (for landing page, no login needed) ──
router.post("/public", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty"
      });
    }

    const chat = model.startChat({
      generationConfig: { maxOutputTokens: 512, temperature: 0.7 },
    });

    const result = await chat.sendMessage(message);
    const reply  = result.response.text();

    res.json({ success: true, reply });

  } catch (error) {
    console.error("Public chatbot error:", error.status, error.message?.substring(0, 120));
    const is429 = error.status === 429 || error.message?.includes("429") || error.message?.includes("quota");
    res.status(is429 ? 429 : 500).json({
      success: false,
      message: is429
        ? "AI assistant is temporarily busy. Please wait a moment and try again."
        : "Service unavailable"
    });
  }
});

module.exports = router;