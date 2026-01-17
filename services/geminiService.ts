
import { GoogleGenAI, Type } from "@google/genai";

// Initialize lazily to prevent crashing the whole app if the API key is missing at runtime
let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn("Gemini API Key is missing. Some features may not work.");
      // We still return an instance, but it will error only when called
      aiInstance = new GoogleGenAI({ apiKey: "MISSING_KEY" });
    } else {
      aiInstance = new GoogleGenAI({ apiKey });
    }
  }
  return aiInstance;
};

export const extractDevotionalStructure = async (text: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a content extractor. Your goal is to take a raw devotional text and identify its components. 
      CRITICAL RULE: You MUST NOT rewrite, summarize, or refurbish the 'content' field. It must be a verbatim copy of the main body of the text provided.
      
      Input text: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "The title of the devotional" },
            scripture: { type: Type.STRING, description: "The specific Bible verse or reference mentioned" },
            content: { type: Type.STRING, description: "The original, untouched main body text" },
            prayer: { type: Type.STRING, description: "A concluding prayer if present, or a short one based on the text if not" },
            meditation: { type: Type.STRING, description: "A short one-sentence key takeaway" },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["title", "scripture", "content", "prayer", "meditation", "tags"]
        }
      }
    });

    const result = JSON.parse(response.text.trim());
    return result;
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    return null;
  }
};

export const getDailyReflections = async (devotional: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on this devotional, provide 3 deep reflection questions to help the reader grow spiritually today: "${devotional}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Gemini Reflections Error:", error);
    return ["What stood out to you today?", "How can you apply this to your life?", "Who can you share this with?"];
  }
};
