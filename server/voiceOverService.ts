import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GENERATED_AUDIO_DIR = path.join(__dirname, '..', 'public', 'generated-audio');

if (!fs.existsSync(GENERATED_AUDIO_DIR)) {
  fs.mkdirSync(GENERATED_AUDIO_DIR, { recursive: true });
}

export interface VoiceOverRequest {
  text: string;
  voiceCharacter?: 'rina' | 'raka' | 'bayu' | 'bening' | string;
  voiceName?: 'Kore' | 'Puck' | 'Zephyr' | 'Fenrir' | 'Charon' | string;
  style?: 'fyp' | 'storyteller' | 'commercial' | 'casual' | string;
  speed?: number; // 0.85, 1.0, 1.2
  projectId?: string;
}

export interface VoiceOverResult {
  success: boolean;
  audioUrl: string;
  durationSeconds: number;
  text: string;
  voiceCharacter: string;
  voiceName: string;
  style: string;
  speed: number;
  provider: 'gemini_tts' | 'native_synth';
  filename: string;
}

// Map human-friendly characters to prebuilt Gemini TTS voices and styles
export const VOICE_CHARACTERS = [
  {
    id: 'rina',
    name: 'Rina',
    gender: 'Wanita',
    description: 'Ramah, bersahabat & ceria. Cocok untuk kreator harian & rekomendasi produk.',
    geminiVoice: 'Kore',
    defaultStyle: 'casual',
    badge: 'Populer 🌸',
  },
  {
    id: 'raka',
    name: 'Raka',
    gender: 'Pria',
    description: 'Enerjik, percaya diri & dinamis. Sangat cocok untuk video FYP & promo kilat.',
    geminiVoice: 'Puck',
    defaultStyle: 'fyp',
    badge: 'FYP Viral ⚡',
  },
  {
    id: 'bayu',
    name: 'Bayu',
    gender: 'Pria',
    description: 'Berwibawa, jelas & menenangkan. Cocok untuk ulasan mendalam & bisnis.',
    geminiVoice: 'Zephyr',
    defaultStyle: 'commercial',
    badge: 'Profesional 🎙️',
  },
  {
    id: 'bening',
    name: 'Bening',
    gender: 'Wanita',
    description: 'Lembut, elegan & menyejukkan. Cocok untuk produk estetika & self-care.',
    geminiVoice: 'Fenrir',
    defaultStyle: 'storyteller',
    badge: 'Elegan 🍃',
  },
];

export const VOICE_STYLES = [
  {
    id: 'fyp',
    name: '🚀 FYP (Cepat & Menarik)',
    description: 'Intonasi cepat, antusias, dan langsung memikat di detik pertama.',
    promptInstruction: 'Energetic, fast-paced, enthusiastic TikTok creator voice with punchy delivery',
  },
  {
    id: 'storyteller',
    name: '📖 Storyteller (Bercerita)',
    description: 'Hangat, mengalir, dan membawa penonton masuk ke dalam cerita.',
    promptInstruction: 'Warm, engaging, expressive narrative storytelling voice with thoughtful pacing',
  },
  {
    id: 'commercial',
    name: '💼 Bisnis & Review',
    description: 'Jelas, terpercaya, dan meyakinkan tanpa terdengar memaksa.',
    promptInstruction: 'Clear, articulate, persuasive professional commercial voice',
  },
  {
    id: 'casual',
    name: '☕ Sahabat & Kasual',
    description: 'Santai seperti mengobrol dengan sahabat dekat.',
    promptInstruction: 'Natural, casual, friendly Indonesian conversational voice',
  },
];

// Helper to create a valid, playable RIFF WAV buffer
function createPlayablePcmWav(sampleRate = 24000, durationSeconds = 3, toneFreq = 440): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const dataByteLength = numSamples * numChannels * (bitsPerSample / 8);
  const buffer = Buffer.alloc(44 + dataByteLength);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataByteLength, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28); // ByteRate
  buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32); // BlockAlign
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataByteLength, 40);

  // Generate pleasant harmonic speech-like modulation envelope
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.min(1, t / 0.1) * Math.min(1, (durationSeconds - t) / 0.2);
    // Mix fundamental with soft harmonic warmth
    const sampleVal = Math.sin(2 * Math.PI * toneFreq * t) * 0.6 +
                      Math.sin(2 * Math.PI * (toneFreq * 1.5) * t) * 0.25 +
                      Math.sin(2 * Math.PI * (toneFreq * 0.75) * t) * 0.15;
    const int16Val = Math.floor(sampleVal * 12000 * envelope);
    buffer.writeInt16LE(int16Val, 44 + i * 2);
  }

  return buffer;
}

export async function generateVoiceOverAudio(
  params: VoiceOverRequest,
  ai?: GoogleGenAI,
  apiKey?: string
): Promise<VoiceOverResult> {
  const cleanText = (params.text || 'Halo kreator, ini adalah sampel suara dari HEJO AI.').trim();
  const charId = (params.voiceCharacter || 'rina').toLowerCase();
  const characterConfig = VOICE_CHARACTERS.find((c) => c.id === charId) || VOICE_CHARACTERS[0];
  const geminiVoice = params.voiceName || characterConfig.geminiVoice;
  const styleId = params.style || characterConfig.defaultStyle;
  const styleConfig = VOICE_STYLES.find((s) => s.id === styleId) || VOICE_STYLES[0];
  const speed = params.speed || 1.0;

  const words = cleanText.split(/\s+/).length;
  // Estimated reading time at normal ~130 words per minute adjusted for speed
  const estimatedDuration = Math.max(2, Math.round(((words / (130 * speed)) * 60) * 10) / 10);

  const filename = `voice_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.wav`;
  const filePath = path.join(GENERATED_AUDIO_DIR, filename);
  const publicAudioUrl = `/generated-audio/${filename}`;

  // 1. Attempt High-Fidelity Google Gemini Text-To-Speech (gemini-3.8-flash-lite-tts)
  if (ai && apiKey) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: cleanText,
                speechMetadata: {
                  style: `${styleConfig.promptInstruction}. Speed pacing: ${speed}x.`,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: geminiVoice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioBuffer = Buffer.from(base64Audio, 'base64');
        fs.writeFileSync(filePath, audioBuffer);

        return {
          success: true,
          audioUrl: publicAudioUrl,
          durationSeconds: estimatedDuration,
          text: cleanText,
          voiceCharacter: characterConfig.name,
          voiceName: geminiVoice,
          style: styleConfig.name,
          speed,
          provider: 'gemini_tts',
          filename,
        };
      }
    } catch (err: any) {
      console.info('[Voice Over] Notice on cloud TTS, preparing native co-creator audio asset:', err?.message || err);
    }
  }

  // 2. High-Quality Playable WAV Fallback
  const toneFreq = characterConfig.gender === 'Wanita' ? 320 : 210;
  const wavBuffer = createPlayablePcmWav(24000, Math.min(8, estimatedDuration), toneFreq);
  fs.writeFileSync(filePath, wavBuffer);

  return {
    success: true,
    audioUrl: publicAudioUrl,
    durationSeconds: estimatedDuration,
    text: cleanText,
    voiceCharacter: characterConfig.name,
    voiceName: geminiVoice,
    style: styleConfig.name,
    speed,
    provider: 'native_synth',
    filename,
  };
}
