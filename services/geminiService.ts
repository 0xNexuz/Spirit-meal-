
import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_MISSING");
  return new GoogleGenAI({ apiKey });
};

export const extractDevotionalStructure = async (text: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        parts: [{
          text: `Extract this Christian devotional into JSON.
          Verbatim content in 'content'. 
          If no prayer/meditation exists, generate brief ones.
          
          Text: "${text}"`
        }]
      }],
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
          },
          required: ["title", "scripture", "content", "prayer", "meditation", "tags"]
        }
      }
    });

    const output = response.text?.trim();
    return output ? JSON.parse(output) : null;
  } catch (error) {
    console.error("Extraction Error:", error);
    return null;
  }
};

export const getDailyReflections = async (devotional: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        parts: [{
          text: `Generate 3 reflection questions for this devotional: "${devotional}"`
        }]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["questions"]
        }
      }
    });
    
    const output = response.text?.trim();
    if (!output) throw new Error("Empty response");
    const parsed = JSON.parse(output);
    return parsed.questions || [];
  } catch (error) {
    console.error("Reflections RPC Error - Using Fallback:", error);
    return [
      "How does this message challenge your current walk with God?",
      "In what practical way can you apply this truth to your life today?",
      "Is there someone in your life who needs to hear this encouragement today?"
    ];
  }
};
