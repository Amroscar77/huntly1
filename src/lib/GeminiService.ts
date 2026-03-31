import { GoogleGenAI } from "@google/genai";

const getApiKey = (): string => {
  // In AI Studio, GEMINI_API_KEY is injected into process.env via vite.config.ts
  if (typeof process !== 'undefined' && (process.env as any)?.API_KEY) return (process.env as any).API_KEY;
  if (typeof process !== 'undefined' && (process.env as any)?.GEMINI_API_KEY) return (process.env as any).GEMINI_API_KEY;
  if ((import.meta as any).env?.VITE_GEMINI_API_KEY) return (import.meta as any).env.VITE_GEMINI_API_KEY;
  return '';
};

const getAI = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('Gemini API key not found. Please set GEMINI_API_KEY in your environment.');
  }
  return new GoogleGenAI({ apiKey });
};

export interface Message {
  role: 'user' | 'model';
  text: string;
  grounding?: any[];
}

export const GeminiService = {
  async chat(history: Message[], userPrompt: string, location?: { lat: number; lng: number }) {
    const ai = getAI();
    let model = 'gemini-3-flash-preview';
    if (userPrompt.length > 200 || userPrompt.toLowerCase().includes('analyze') || userPrompt.toLowerCase().includes('compare')) {
      model = 'gemini-3.1-pro-preview';
    }

    const contents = history.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
    contents.push({ role: 'user', parts: [{ text: userPrompt }] });

    const config: any = {
      systemInstruction: "You are 'Huntly AI', an expert shopping assistant for the Huntly price tracker app in Egypt. You help users find the best deals, compare prices, and locate nearby stores. Be helpful, concise, and professional. Always respond in the same language the user writes in.",
      tools: [{ googleSearch: {} }],
    };

    if (location) {
      config.toolConfig = {
        includeServerSideToolInvocations: true,
        retrievalConfig: { latLng: { latitude: location.lat, longitude: location.lng } },
      };
    }

    try {
      const response = await ai.models.generateContent({ model, contents, config });
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      return {
        text: response.text || "I'm sorry, I couldn't process that request.",
        groundingChunks,
      };
    } catch (error: any) {
      console.error('Gemini Error:', error);
      throw error;
    }
  },

  async getSmartAdvice(recentData: any[]): Promise<string> {
    const ai = getAI();
    if (!recentData || recentData.length === 0) return 'Add some prices to get smart insights!';
    const summary = recentData.slice(0, 10).map(d => ({ item: d.itemName, price: d.price, currency: d.currency, store: d.storeName }));
    const prompt = `Recent Cairo market prices: ${JSON.stringify(summary)}. Give ONE punchy shopping tip. Max 20 words. No disclaimers.`;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { systemInstruction: 'You are a data analyst. One sentence shopping advice only.' },
      });
      return response.text?.trim() || 'Great prices available now — explore the market!';
    } catch {
      return 'Great prices available now — explore the market!';
    }
  },

  async extractPriceFromImage(base64Image: string): Promise<{ itemName: string; price: number; storeName?: string; category?: string } | null> {
    const ai = getAI();
    const model = 'gemini-2.5-flash-image'; // Use vision model

    const prompt = `Analyze this image of a price tag or receipt. Extract the following information in JSON format:
    - itemName: The name of the product.
    - price: The numerical price value (as a number).
    - storeName: The name of the store if visible.
    - category: One of [Groceries, Coffee & Drinks, Bakery, Electronics, Fashion, Vegetables, Dairy, Meat & Poultry, Cleaning, Other].
    
    If you cannot find the information, return null for those fields.`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/jpeg' } }
          ]
        },
        config: { responseMimeType: 'application/json' }
      });

      const result = JSON.parse(response.text || '{}');
      if (!result.itemName && !result.price) return null;
      return {
        itemName: result.itemName || '',
        price: Number(result.price) || 0,
        storeName: result.storeName || '',
        category: result.category || 'Other'
      };
    } catch (error) {
      console.error('Gemini Vision Error:', error);
      return null;
    }
  },
};
