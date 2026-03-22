// src/services/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

/* ---------------- TEXT SCAM ANALYSIS ---------------- */
export const checkScamWithAI = async (text) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const prompt = `
Detect Indian phone scams.

Text:
"${text}"

Return ONLY JSON:
{
  "isScam": boolean,
  "riskScore": number,
  "deepfakeIndicators": "string",
  "reason": "short reason",
  "confidence": "high|medium|low"
}
`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text();

    const json = raw.substring(
      raw.indexOf("{"),
      raw.lastIndexOf("}") + 1
    );

    const parsed = JSON.parse(json);

    return {
      isScam: parsed.isScam ?? false,
      riskScore: Math.min(100, parsed.riskScore ?? 0),
      deepfakeIndicators: parsed.deepfakeIndicators ?? "None",
      reason: parsed.reason ?? "Unknown",
      confidence: parsed.confidence ?? "low"
    };
  } catch (e) {
    console.error("Gemini Text Error:", e);
    return {
      isScam: false,
      riskScore: 0,
      reason: "AI error",
      deepfakeIndicators: "Error",
      confidence: "low"
    };
  }
};

/* ---------------- IMAGE ANALYSIS ---------------- */
export const checkImageWithAI = async (base64Image) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const imagePart = {
      inlineData: {
        data: base64Image.split(",")[1],
        mimeType: "image/jpeg"
      }
    };

    const result = await model.generateContent([
      "Is this image fake or AI-generated? YES or NO.",
      imagePart
    ]);

    const answer = result.response.text().toLowerCase();

    return {
      isScam: answer.includes("yes"),
      confidence: answer.includes("yes") ? 85 : 10,
      indicators: [],
      reason: answer.includes("yes")
        ? "Image detected as fake"
        : "Image appears real"
    };
  } catch (e) {
    console.error("Gemini Image Error:", e);
    return {
      isScam: false,
      confidence: 0,
      indicators: ["Error"],
      reason: "Image analysis failed"
    };
  }
};
