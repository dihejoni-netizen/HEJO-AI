import { GoogleGenAI } from '@google/genai';

const RELAYROUTER_URL = 'https://api.relayrouter.ai/v1/chat/completions';

interface RelayRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface RelayRouterOptions {
  model?: string;
  messages: RelayRouterMessage[];
  temperature?: number;
  timeoutMs?: number;
}

// Fallback to direct GoogleGenAI if RelayRouter is saturated or unavailable
async function directGeminiFallback(
  messages: RelayRouterMessage[],
  temperature: number
): Promise<string | null> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return null;

  try {
    const ai = new GoogleGenAI({
      apiKey: geminiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemMsg = messages.find((m) => m.role === 'system')?.content;
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    if (contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: '' }] });
    }

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 4500);

    const res = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: systemMsg,
        temperature,
      },
    });

    clearTimeout(timeoutId);
    return res.text || null;
  } catch {
    return null;
  }
}

export async function relayRouterChat({
  model = 'gemini-3.8-flash',
  messages,
  temperature = 0.7,
  timeoutMs = 4000,
}: RelayRouterOptions): Promise<string> {
  const apiKey = process.env.RELAYROUTER_API_KEY;

  if (apiKey) {
    try {
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

      const response = await fetch(RELAYROUTER_URL, {
        method: 'POST',
        signal: abortController.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
        }),
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        if (content) {
          return content;
        }
      }
    } catch {
      // Fast fallback if RelayRouter times out or errors
    }
  }

  // Attempt direct Google Gemini API if RelayRouter was saturated or timed out
  const directResult = await directGeminiFallback(messages, temperature);
  if (directResult) {
    return directResult;
  }

  // Clean, non-crashing exception that signals to creatorPipeline to use contextual engine
  throw new Error('Upstream AI service is currently busy');
}
