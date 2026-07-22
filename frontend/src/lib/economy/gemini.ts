import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini client.
// It uses the GEMINI_API_KEY environment variable by default.
// If the key is not available, it will throw an error or fail gracefully depending on usage.
export const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. AI Chat will be in mock mode.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};
