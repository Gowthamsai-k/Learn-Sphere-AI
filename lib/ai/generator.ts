import { google } from '@ai-sdk/google';
import { groq } from '@ai-sdk/groq';

export function getLanguageModel() {
  if (process.env.GROQ_API_KEY) {
    console.log('[AI] Initializing Groq model: llama-3.3-70b-versatile');
    // Use Groq's ultra-low latency Llama model if API key is provided
    return groq('llama-3.3-70b-versatile');
  }
  console.log('[AI] Initializing Google Gemini model: gemini-2.0-flash (Fallback)');
  // Fallback to Google Gemini
  return google('gemini-2.0-flash');
}
