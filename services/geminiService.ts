
import { GoogleGenAI, Type } from "@google/genai";
import { storage } from "./storageService.ts";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_MISSING");
  return new GoogleGenAI({ apiKey });
};

// Rate limit circuit breaker
let quotaExhaustedUntil = 0;
const QUOTA_BACKOFF_MS = 5 * 60 * 1000; // 5 minutes

export const getDailyReflections = async (content: string, id: string): Promise<string[]> => {
  // 1. Check persistent cache first
  const cached = storage.getReflectionsCache(id);
  if (cached) return cached;

  // 2. Check circuit breaker
  if (Date.now() < quotaExhaustedUntil) {
    console.warn("Circuit Breaker Active: Using spiritual fallbacks due to API quota.");
    return getFallbacks();
  }

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        parts: [{
          text: `Generate 3 thought-provoking Christian reflection questions based on this message: "${content.substring(0, 1000)}"`
        }]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["questions"]
        }
      }
    });
    
    const output = response.text?.trim();
    const questions = output ? JSON.parse(output).questions : getFallbacks();
    
    storage.saveReflectionsToCache(id, questions);
    return questions;
  } catch (error: any) {
    if (error?.status === 429 || error?.message?.includes('429')) {
      quotaExhaustedUntil = Date.now() + QUOTA_BACKOFF_MS;
    }
    return getFallbacks();
  }
};

const getFallbacks = () => [
  "How can you apply this teaching to your relationships today?",
  "What specific part of this scripture touched your heart the most?",
  "In what area of your life is God calling you to be 'still' right now?"
];

export const extractDevotionalStructure = async (text: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: `Extract into JSON: ${text}` }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            scripture: { type: Type.STRING },
            content: { type: Type.STRING },
            prayer: { type: Type.STRING },
            meditation: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });
    return response.text ? JSON.parse(response.text) : null;
  } catch (error) {
    return null;
  }
};
