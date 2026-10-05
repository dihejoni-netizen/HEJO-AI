import { GoogleGenAI } from '@google/genai';
import { CreatorContext, PipelineIdea, PipelineScript, PipelineScene, PipelineShot } from '../src/types';
import { relayRouterChat } from '../relayRouter';

interface PipelineParams {
  context: CreatorContext;
  ai?: GoogleGenAI;
  apiKey?: string;
}

const capitalize = (str?: string) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Safe JSON parser that handles code blocks (```json ... ```) and raw string formats
function safeParseJson<T>(raw: string, fallback: T): T {
  if (!raw || typeof raw !== 'string') return fallback;
  try {
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
    return JSON.parse(cleaned);
  } catch {
    const firstBracket = raw.indexOf('[');
    const lastBracket = raw.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      try {
        return JSON.parse(raw.slice(firstBracket, lastBracket + 1));
      } catch {}
    }
    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(raw.slice(firstBrace, lastBrace + 1));
      } catch {}
    }
    return fallback;
  }
}

// ==========================================
// 1. IDE GENERATOR PIPELINE (Default 3 Ide)
// ==========================================
export async function generateIdeasPipeline({
  context,
  ai,
  apiKey,
}: PipelineParams): Promise<PipelineIdea[]> {
  const business = context.produk || context.business || 'karya kreatif';
  const target = context.targetAudiens || context.audience || context.audiens || 'anak muda';
  const platform = context.platform || 'TikTok';
  const goal = context.tujuan || 'menarik pelanggan baru';
  const style = context.gaya || 'Santai & Relate';
  const duration = context.durasi || '30 detik';
  const isLaundry = business.toLowerCase().includes('laundry') || business.toLowerCase().includes('cucian');

  // Dynamic context-aware ideas
  const fallbackIdeas: PipelineIdea[] = isLaundry
    ? [
        {
          id: 'idea-1',
          title: `Drama ${capitalize(target)}: Baju Bersih Habis Pas Minggu Ujian`,
          hook: `Ketika cucian numpuk di kosan, dan yang tersisa di lemari cuma kaos ospek...`,
          concept: `Situasi komedi relate anak kos yang panik baju habis, lalu menemukan solusi praktis lewat layanan ${business}.`,
          targetAudience: capitalize(target),
          goal: capitalize(goal),
          style: `Komedi Relate (${style})`,
          duration: duration,
        },
        {
          id: 'idea-2',
          title: `Hitung-hitungan Realistis: Nyuci Sendiri vs Laundry Kiloan`,
          hook: `Bener nggak sih laundry kiloan bikin boros anak kos? Mari kita bedah bareng!`,
          concept: `Perbandingan biaya deterjen, air, listrik, dan waktu nugas yang terbuang jika mencuci sendiri vs pakai paket hemat kiloan.`,
          targetAudience: capitalize(target),
          goal: capitalize(goal),
          style: `Edukatif & Mindset (${style})`,
          duration: duration,
        },
        {
          id: 'idea-3',
          title: `Lifehack Kosan: Cara Terima Bersih Tanpa Melangkah dari Kasur`,
          hook: `Buat kaum mager yang cuciannya menggunung, jangan tonton video ini sendirian!`,
          concept: `Menunjukkan kemudahan layanan antar-jemput ${business} langsung ke depan gerbang kosan, pakaian wangi dan rapi seketika.`,
          targetAudience: capitalize(target),
          goal: capitalize(goal),
          style: `Sensori & Lifehack (${style})`,
          duration: duration,
        },
      ]
    : [
        {
          id: 'idea-1',
          title: `Keresahan Nyata ${capitalize(target)}: Solusi Praktis ${capitalize(business)}`,
          hook: `Pernah ngerasa repot pas lagi butuh ${business} berkualitas tapi waktu mepet?`,
          concept: `Cerita relate sehari-hari ${target} yang menemukan jawaban tepat lewat keunggulan ${business}.`,
          targetAudience: capitalize(target),
          goal: capitalize(goal),
          style: `Relate & Solutif (${style})`,
          duration: duration,
        },
        {
          id: 'idea-2',
          title: `Rahasia yang Jarang Diketahui Tentang ${capitalize(business)}`,
          hook: `Banyak orang belum tahu kalau ${business} ini punya trik khusus bikin aktivitas lebih simpel!`,
          concept: `Edukasi ringan dan pembuktian langsung manfaat ${business} untuk kebutuhan ${target}.`,
          targetAudience: capitalize(target),
          goal: capitalize(goal),
          style: `Edukatif & Menarik (${style})`,
          duration: duration,
        },
        {
          id: 'idea-3',
          title: `Review Jujur: Seberapa Worth It Pakai ${capitalize(business)}?`,
          hook: `Sebelum kamu coba ${business}, tonton review 30 detik ini biar nggak salah pilih!`,
          concept: `Review pengalaman nyata yang transparan, menonjolkan nilai terbaik untuk ${target}.`,
          targetAudience: capitalize(target),
          goal: capitalize(goal),
          style: `Authentic Review (${style})`,
          duration: duration,
        },
      ];

  try {
    const prompt = `Kamu adalah Creator Engine HEJO AI. Buatkan tepat 3 (tiga) konsep ide konten video pendek yang terstruktur untuk:
Bisnis/Produk: ${business}
Target Audiens: ${target}
Platform: ${platform}
Tujuan: ${goal}
Gaya Konten: ${style}
Durasi: ${duration}
${context.karakter ? `Karakter Pembawa: ${context.karakter}` : ''}

Format JSON array persis:
[
  {
    "id": "idea-1",
    "title": "Judul ide menarik tanpa tanda kutip",
    "hook": "Kalimat hook pembuka 0-3 detik",
    "concept": "Penjelasan konsep 1-2 kalimat",
    "targetAudience": "${target}",
    "goal": "${goal}",
    "style": "${style}",
    "duration": "${duration}"
  },
  ... (sampai idea-3)
]
Hanya kembalikan array JSON valid.`;

    const relayContent = await relayRouterChat({
      model: 'gemini-3.8-flash',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const parsed = safeParseJson<any[]>(relayContent, []);
    if (Array.isArray(parsed) && parsed.length >= 3) {
      return parsed.slice(0, 3).map((item, idx) => ({
        id: `idea-${idx + 1}`,
        title: item.title || fallbackIdeas[idx].title,
        hook: item.hook || fallbackIdeas[idx].hook,
        concept: item.concept || fallbackIdeas[idx].concept,
        targetAudience: item.targetAudience || target,
        goal: item.goal || goal,
        style: item.style || style,
        duration: item.duration || duration,
      }));
    }
  } catch {
    // Graceful fallback to rich contextual generator
  }

  return fallbackIdeas;
}

// ==========================================
// 2. SCRIPT GENERATOR PIPELINE (5 Timed Parts)
// ==========================================
export async function generateScriptPipeline({
  context,
  selectedIdea,
  ai,
  apiKey,
}: PipelineParams & { selectedIdea?: PipelineIdea }): Promise<PipelineScript> {
  const business = context.produk || context.business || 'laundry';
  const target = context.targetAudiens || context.audience || context.audiens || 'mahasiswa';
  const platform = context.platform || 'TikTok';
  const goal = context.tujuan || 'menarik pelanggan baru';
  const style = context.gaya || 'Santai';
  const character = context.karakter || '';
  const ideaTitle = selectedIdea?.title || context.ide || `Solusi Praktis ${capitalize(business)}`;
  const ideaHook = selectedIdea?.hook || '';
  const isLaundry = business.toLowerCase().includes('laundry') || business.toLowerCase().includes('cucian');

  // Dynamic context-aware 5-part timed script
  const fallbackScript: PipelineScript = {
    title: `Naskah ${platform} ${capitalize(business)} (${capitalize(target)})`,
    hook: ideaHook || (character 
      ? `"${character} di sini! Mau tahu rahasia ${business} yang bikin harimu lebih santai?"`
      : (isLaundry 
        ? `"Cucian numpuk di kosan pas lagi minggu ujian? Jangan pusing sendiri!"`
        : `"Pernah ngerasa repot pas lagi butuh ${business}? Jangan skip video ini!"`)),
    problem: isLaundry 
      ? `"Waktu buat nugas dan istirahat aja mepet banget, apalagi mikirin cuci dan setrika baju satu per satu."`
      : `"Seringkali kita buang banyak waktu dan energi karena cara yang dipakai kurang praktis."`,
    solution: isLaundry
      ? `"Untung ada ${business} yang siap jemput dan cuci pakaianmu sampai bersih, rapi, dan wangi semerbak."`
      : `"Untung ada ${business} yang dirancang khusus untuk kasih hasil terbaik tanpa ribet."`,
    advantage: isLaundry
      ? `"Paket hemat kiloan ramah kantong ${target}, layanan kilat selesai 1 hari, dan bisa antar-jemput langsung ke kosan."`
      : `"Kualitas terjamin, harga ramah untuk ${target}, dan prosesnya cepat serta mudah diakses."`,
    callToAction: isLaundry
      ? `"Drop cucian kamu hari ini atau klik link di bio biar langsung kami jemput!"`
      : `"Coba sekarang atau cek link di bio sebelum promonya berakhir!"`,
  };

  try {
    const prompt = `Kamu adalah Creator Engine HEJO AI. Buatkan naskah video pendek terstruktur untuk:
Bisnis/Produk: ${business}
Target Audiens: ${target}
Platform: ${platform}
Tujuan: ${goal}
Gaya: ${style}
${character ? `Karakter Pembawa: ${character}` : ''}
Ide Acuan: ${ideaTitle}
${ideaHook ? `Hook Acuan: ${ideaHook}` : ''}

Struktur harus persis 5 bagian waktu:
1. Hook (0-3 detik)
2. Masalah / Situasi (3-10 detik)
3. Solusi (10-20 detik)
4. Keunggulan (20-27 detik)
5. Call to Action (27-30 detik)

Format JSON:
{
  "title": "Judul Naskah",
  "hook": "Teks hook 0-3 detik",
  "problem": "Teks masalah 3-10 detik",
  "solution": "Teks solusi 10-20 detik",
  "advantage": "Teks keunggulan 20-27 detik",
  "callToAction": "Teks ajakan bertindak 27-30 detik"
}`;

    const relayContent = await relayRouterChat({
      model: 'gemini-3.8-flash',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const parsed = safeParseJson<any>(relayContent, {});
    if (parsed.hook && parsed.solution) {
      const script: PipelineScript = {
        title: parsed.title || fallbackScript.title,
        hook: parsed.hook,
        problem: parsed.problem || fallbackScript.problem,
        solution: parsed.solution,
        advantage: parsed.advantage || fallbackScript.advantage,
        callToAction: parsed.callToAction || fallbackScript.callToAction,
      };
      script.rawText = formatScriptText(script);
      return script;
    }
  } catch {
    // Graceful fallback to rich contextual generator
  }

  fallbackScript.rawText = formatScriptText(fallbackScript);
  return fallbackScript;
}

function formatScriptText(s: PipelineScript): string {
  return `[0–3 detik] Hook
${s.hook}

[3–10 detik] Masalah
${s.problem}

[10–20 detik] Solusi
${s.solution}

[20–27 detik] Keunggulan
${s.advantage}

[27–30 detik] Call to Action
${s.callToAction}`;
}

// ==========================================
// 3. STORYBOARD GENERATOR PIPELINE
// ==========================================
export async function generateStoryboardPipeline({
  context,
  script,
  ai,
  apiKey,
}: PipelineParams & { script?: PipelineScript }): Promise<PipelineScene[]> {
  const business = context.produk || context.business || 'laundry';
  const target = context.targetAudiens || context.audience || context.audiens || 'mahasiswa';
  const character = context.karakter || 'Talenta';
  const isLaundry = business.toLowerCase().includes('laundry') || business.toLowerCase().includes('cucian');

  const sHook = script?.hook || `"Cucian numpuk di kosan?"`;
  const sProblem = script?.problem || `"Waktu nugas mepet, baju bersih habis..."`;
  const sSolution = script?.solution || `"Serahkan ke ${business}, beres seketika."`;
  const sCta = script?.callToAction || `"Hubungi link di bio sekarang!"`;

  const fallbackScenes: PipelineScene[] = isLaundry
    ? [
        {
          sceneNumber: 1,
          sceneLabel: 'SCENE 1',
          duration: '0–3 detik',
          visual: `${target} melihat tumpukan pakaian kotor menggunung di pojok kamar.`,
          action: 'Melihat jam dinding lalu terlihat panik dan garuk-garuk kepala.',
          voiceOver: sHook,
          textOnScreen: 'Cucian numpuk di kosan?',
          cameraShot: 'Medium shot',
          transition: 'Cut',
        },
        {
          sceneNumber: 2,
          sceneLabel: 'SCENE 2',
          duration: '3–10 detik',
          visual: `${target} duduk di depan laptop dengan buku tugas berserakan, lelah.`,
          action: 'Menghela napas panjang, menatap cucian dengan tatapan putus asa.',
          voiceOver: sProblem,
          textOnScreen: 'Mau nyuci tapi tugas numpuk',
          cameraShot: 'Over the shoulder',
          transition: 'Whip pan',
        },
        {
          sceneNumber: 3,
          sceneLabel: 'SCENE 3',
          duration: '10–20 detik',
          visual: `Kurir ramah ${business} datang menjemput kantong cucian di depan gerbang kosan.`,
          action: 'Menyerahkan cucian dengan senyum lega, pakaian diproses rapi dan bersih.',
          voiceOver: sSolution,
          textOnScreen: 'Tinggal jemput, terima beres!',
          cameraShot: 'Medium close-up',
          transition: 'Smooth slide',
        },
        {
          sceneNumber: 4,
          sceneLabel: 'SCENE 4',
          duration: '20–30 detik',
          visual: `${target} memakai pakaian bersih yang wangi dan rapi, tersenyum percaya diri.`,
          action: 'Menunjukkan smartphone dengan tautan pemesanan di bio.',
          voiceOver: sCta,
          textOnScreen: 'Pesan Antar-Jemput di Bio!',
          cameraShot: 'Hero shot',
          transition: 'Fade to brand',
        },
      ]
    : [
        {
          sceneNumber: 1,
          sceneLabel: 'SCENE 1',
          duration: '0–3 detik',
          visual: `${target} beraktivitas dengan ekspresi mencari solusi praktis.`,
          action: 'Menoleh ke kamera dengan tatapan antusias dan gestur interaktif.',
          voiceOver: sHook,
          textOnScreen: `Solusi Terbaik ${capitalize(business)}`,
          cameraShot: 'Medium close-up',
          transition: 'Cut',
        },
        {
          sceneNumber: 2,
          sceneLabel: 'SCENE 2',
          duration: '3–10 detik',
          visual: `Suasana realistis kendala yang sering dihadapi ${target}.`,
          action: 'Menunjukkan perbandingan sebelum menggunakan layanan ${business}.',
          voiceOver: sProblem,
          textOnScreen: 'Pernah ngalamin hal ini?',
          cameraShot: 'Over the shoulder',
          transition: 'Whip pan',
        },
        {
          sceneNumber: 3,
          sceneLabel: 'SCENE 3',
          duration: '10–20 detik',
          visual: `Tampilan produk/layanan ${business} dalam aksi nyata berkualitas prima.`,
          action: 'Menampilkan detail manfaat utama secara jelas dan meyakinkan.',
          voiceOver: sSolution,
          textOnScreen: `Praktis & Hasil Maksimal!`,
          cameraShot: 'Close-up hero framing',
          transition: 'Smooth slide',
        },
        {
          sceneNumber: 4,
          sceneLabel: 'SCENE 4',
          duration: '20–30 detik',
          visual: `${target} tersenyum puas menunjukkan hasil bersama ${business}.`,
          action: 'Menunjuk ke arah teks ajakan atau link bio profil.',
          voiceOver: sCta,
          textOnScreen: 'Cek Link di Bio Sekarang!',
          cameraShot: 'Hero shot',
          transition: 'Fade to brand',
        },
      ];

  try {
    const prompt = `Kamu adalah Creator Engine HEJO AI. Ubah naskah berikut menjadi Storyboard 4 Scene:
Naskah:
Hook: ${sHook}
Masalah: ${sProblem}
Solusi: ${sSolution}
CTA: ${sCta}
Bisnis: ${business}
Target: ${target}
${character ? `Karakter: ${character}` : ''}

Setiap scene harus memiliki data:
- sceneNumber: angka (1-4)
- sceneLabel: "SCENE 1", dll
- duration: rentang waktu (misal "0–3 detik")
- visual: deskripsi visual apa yang terlihat di layar
- action: aksi atau gestur yang dilakukan subjek
- voiceOver: suara narasi / dialog
- textOnScreen: teks judul/poin yang muncul di layar
- cameraShot: jenis shot kamera (Medium shot, Close-up, Hero shot, dll)
- transition: jenis transisi (Cut, Whip pan, Smooth slide, dll)

Format JSON array persis:
[
  {
    "sceneNumber": 1,
    "sceneLabel": "SCENE 1",
    "duration": "0–3 detik",
    "visual": "...",
    "action": "...",
    "voiceOver": "...",
    "textOnScreen": "...",
    "cameraShot": "...",
    "transition": "..."
  }
]`;

    const relayContent = await relayRouterChat({
      model: 'gemini-3.8-flash',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const parsed = safeParseJson<any[]>(relayContent, []);
    if (Array.isArray(parsed) && parsed.length >= 4) {
      return parsed.slice(0, 4).map((item, idx) => ({
        sceneNumber: idx + 1,
        sceneLabel: `SCENE ${idx + 1}`,
        duration: item.duration || fallbackScenes[idx].duration,
        visual: item.visual || fallbackScenes[idx].visual,
        action: item.action || fallbackScenes[idx].action,
        voiceOver: item.voiceOver || fallbackScenes[idx].voiceOver,
        textOnScreen: item.textOnScreen || fallbackScenes[idx].textOnScreen,
        cameraShot: item.cameraShot || fallbackScenes[idx].cameraShot,
        transition: item.transition || fallbackScenes[idx].transition,
      }));
    }
  } catch {
    // Graceful fallback to rich contextual generator
  }

  return fallbackScenes;
}

// ==========================================
// 4. SHOT LIST GENERATOR PIPELINE
// ==========================================
export async function generateShotListPipeline({
  context,
  storyboard,
  ai,
  apiKey,
}: PipelineParams & { storyboard?: PipelineScene[] }): Promise<PipelineShot[]> {
  const business = context.produk || context.business || 'laundry';
  const target = context.targetAudiens || context.audience || context.audiens || 'mahasiswa';
  const isLaundry = business.toLowerCase().includes('laundry') || business.toLowerCase().includes('cucian');

  const fallbackShots: PipelineShot[] = isLaundry
    ? [
        {
          shotNumber: 'SHOT 01',
          scene: 'Scene 1',
          shotType: 'Medium shot',
          subject: `${target} + pakaian kotor`,
          cameraAngle: 'Eye level',
          cameraMovement: 'Static',
          lighting: 'Natural indoor light',
          location: 'Kamar kos',
          props: 'Keranjang pakaian & jam dinding',
          duration: '3 detik',
        },
        {
          shotNumber: 'SHOT 02',
          scene: 'Scene 2',
          shotType: 'Over the shoulder',
          subject: `${target} depan laptop`,
          cameraAngle: 'High angle halus',
          cameraMovement: 'Slow push-in',
          lighting: 'Lampu belajar hangat',
          location: 'Meja belajar kosan',
          props: 'Laptop & buku tugas berserakan',
          duration: '7 detik',
        },
        {
          shotNumber: 'SHOT 03',
          scene: 'Scene 3',
          shotType: 'Medium close-up',
          subject: `Kurir ${business} & tas laundry rapi`,
          cameraAngle: 'Eye level',
          cameraMovement: 'Panning kanan mengikuti tangan',
          lighting: 'Outdoor daylight cerah',
          location: 'Depan gerbang kosan',
          props: 'Kantong laundry bermerek & motor',
          duration: '10 detik',
        },
        {
          shotNumber: 'SHOT 04',
          scene: 'Scene 4',
          shotType: 'Hero shot',
          subject: `${target} tersenyum rapi + smartphone`,
          cameraAngle: 'Slight low angle meyakinkan',
          cameraMovement: 'Static hero framing',
          lighting: 'Bright softbox light',
          location: 'Teras kosan bersih',
          props: 'Smartphone dengan tampilan profil bio',
          duration: '10 detik',
        },
      ]
    : [
        {
          shotNumber: 'SHOT 01',
          scene: 'Scene 1',
          shotType: 'Medium close-up',
          subject: `${target} dengan ekspresi relatable`,
          cameraAngle: 'Eye level',
          cameraMovement: 'Slow push-in (Dolly in)',
          lighting: 'Soft daylight hangat',
          location: 'Ruang kerja / studio bersih',
          props: `Produk / elemen ${business}`,
          duration: '3 detik',
        },
        {
          shotNumber: 'SHOT 02',
          scene: 'Scene 2',
          shotType: 'Over the shoulder',
          subject: `${target} menghadapi kendala umum`,
          cameraAngle: 'Slight high angle',
          cameraMovement: 'Handheld natural',
          lighting: 'Ambient indoor lighting',
          location: 'Setting aktivitas harian',
          props: 'Perlengkapan aktivitas',
          duration: '7 detik',
        },
        {
          shotNumber: 'SHOT 03',
          scene: 'Scene 3',
          shotType: 'Macro close-up',
          subject: `Keunggulan & detail ${business}`,
          cameraAngle: 'Low angle dinamis',
          cameraMovement: 'Smooth tracking follow',
          lighting: 'Hero commercial lighting',
          location: 'Fokus produk utama',
          props: `Varian / packaging ${business}`,
          duration: '10 detik',
        },
        {
          shotNumber: 'SHOT 04',
          scene: 'Scene 4',
          shotType: 'Hero shot',
          subject: `${target} tersenyum puas & smartphone`,
          cameraAngle: 'Eye level terpercaya',
          cameraMovement: 'Static hero framing',
          lighting: 'Warm key light bersih',
          location: 'Setting akhir estetis',
          props: 'Smartphone dengan link profil bio',
          duration: '10 detik',
        },
      ];

  try {
    const prompt = `Kamu adalah Creator Engine HEJO AI. Buatkan Shot List produksi video dari storyboard berikut:
Storyboard ringkas:
${(storyboard || fallbackShots).map((s: any, idx) => `Scene ${idx + 1}: ${s.visual || s.subject} (${s.duration})`).join('\n')}

Format JSON array persis:
[
  {
    "shotNumber": "SHOT 01",
    "scene": "Scene 1",
    "shotType": "Medium shot",
    "subject": "Subjek utama shot",
    "cameraAngle": "Eye level",
    "cameraMovement": "Static",
    "lighting": "Natural indoor light",
    "location": "Kamar kos",
    "props": "Barang/properti",
    "duration": "3 detik"
  }
]`;

    const relayContent = await relayRouterChat({
      model: 'gemini-3.8-flash',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const parsed = safeParseJson<any[]>(relayContent, []);
    if (Array.isArray(parsed) && parsed.length >= 4) {
      return parsed.slice(0, 4).map((item, idx) => ({
        shotNumber: `SHOT 0${idx + 1}`,
        scene: item.scene || `Scene ${idx + 1}`,
        shotType: item.shotType || fallbackShots[idx].shotType,
        subject: item.subject || fallbackShots[idx].subject,
        cameraAngle: item.cameraAngle || fallbackShots[idx].cameraAngle,
        cameraMovement: item.cameraMovement || fallbackShots[idx].cameraMovement,
        lighting: item.lighting || fallbackShots[idx].lighting,
        location: item.location || fallbackShots[idx].location,
        props: item.props || fallbackShots[idx].props,
        duration: item.duration || fallbackShots[idx].duration,
      }));
    }
  } catch {
    // Graceful fallback to rich contextual generator
  }

  return fallbackShots;
}
