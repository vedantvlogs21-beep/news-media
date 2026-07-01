
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  // Fixed: Create a new GoogleGenAI instance right before the call as per guidelines
  static async generateNewsSummary(content: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `पुढील मराठी बातमीचा थोडक्यात आणि प्रभावी सारांश तयार करा: ${content}`;
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: 'You are a professional Marathi news editor. Summarize the provided news content into 2-3 concise sentences in Marathi.',
        }
      });
      // Use response.text directly as it is a property
      return response.text || 'सारांश उपलब्ध नाही.';
    } catch (error) {
      console.error("Gemini Error:", error);
      return 'AI सारांश लोड करण्यात त्रुटी आली.';
    }
  }

  // Fixed: Use new GoogleGenAI instance with direct process.env.API_KEY
  static async getTrendingTopicSummary(topic: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `${topic} या विषयावर सध्याच्या ताज्या घडामोडींचा १ वाक्यात मराठीत आढावा द्या.`;
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: 'You are a news bot providing trending updates in Marathi.',
        }
      });
      return response.text || '';
    } catch (error) {
      console.error("Gemini Error:", error);
      return '';
    }
  }
}
