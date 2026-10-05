import { 
  ChatMessage, 
  StoryboardScene, 
  IdeaCard, 
  UserMode, 
  CreatorContext,
  PipelineIdea,
  PipelineScript,
  PipelineScene,
  PipelineShot,
  FlowReadyData,
  MultiAffiliatePackage,
  PromptPackData,
  ImageResultData
} from '../types';

export interface ChatResponse {
  reply: string;
  suggestedActions: string[];
  updatedContext?: CreatorContext;
  flowReady?: FlowReadyData;
  multiAffiliate?: MultiAffiliatePackage;
  promptPack?: PromptPackData;
  imageResult?: ImageResultData;
  structuredDraft?: {
    type: 'idea' | 'script' | 'storyboard' | 'shotlist' | 'character' | 'product' | 'flow_ready' | 'multi_affiliate' | 'prompt_pack' | 'image_result';
    title: string;
    content: string;
    flowReady?: FlowReadyData;
    multiAffiliate?: MultiAffiliatePackage;
    promptPack?: PromptPackData;
    imageResult?: ImageResultData;
    meta?: Record<string, any>;
  } | null;
}

export async function sendChatMessage(
  message: string,
  history: ChatMessage[] = [],
  userMode: UserMode = 'SIMPLE',
  context: CreatorContext = {}
): Promise<ChatResponse> {
  try {
    const res = await fetch('/api/hejo/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history,
        userMode,
        context,
      }),
    });

    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }

    const data = await res.json();
    const flowReady = data.flowReady || data.structuredDraft?.flowReady || data.structuredDraft?.meta?.flowReady || null;
    const multiAffiliate = data.multiAffiliate || data.structuredDraft?.multiAffiliate || data.structuredDraft?.meta?.multiAffiliate || null;
    const promptPack = data.promptPack || data.structuredDraft?.promptPack || data.structuredDraft?.meta?.promptPack || null;
    const imageResult = data.imageResult || data.structuredDraft?.imageResult || data.structuredDraft?.meta?.imageResult || null;

    return {
      reply: data.reply || 'Ada sedikit kendala jaringan, tapi saya tetap siap membantumu!',
      suggestedActions: data.suggestedActions || ['Coba lagi', 'Lanjut', 'Simpan ke Project'],
      updatedContext: data.updatedContext || context,
      flowReady,
      multiAffiliate,
      promptPack,
      imageResult,
      structuredDraft: data.structuredDraft || null,
    };
  } catch (err: any) {
    console.info('Transient client fetch notice, using local co-creator response:', err?.message || err);
    const text = message.toLowerCase();

    if (text.includes('motion_context:') || text.includes('motion_context')) {
      const lines = message.split('\n');
      const data: Record<string, string> = {};
      for (const l of lines) {
        if (l.includes('=')) {
          const [k, ...rest] = l.split('=');
          data[k.trim().toLowerCase()] = rest.join('=').trim();
        }
      }
      const preset = data.preset || 'Slow Push-in (Dolly In)';
      const angle = data.angle || 'Eye Level';
      const speed = data.speed || 'Normal';
      const subject = data.subject || context.karakter || context.produk || 'subjek adegan';

      return {
        reply: `Gerakan kamera "${preset}" (${angle}, tempo ${speed}) berhasil diterapkan untuk ${subject}. Kamera akan bergerak stabil dan terarah sesuai kebutuhan adegan video.`,
        suggestedActions: ['🎬 Buka Studio Video', '🎥 Lihat Shot List', '✨ Buat Semua Visual', '🔄 Ubah Motion'],
        updatedContext: {
          ...context,
          motion: {
            preset,
            cameraMovement: preset,
            angle,
            speed,
            subject,
          },
        },
        structuredDraft: {
          type: 'shotlist',
          title: `Motion Kamera: ${preset}`,
          content: `Preset: ${preset}\nSudut: ${angle}\nKecepatan: ${speed}\nSubjek: ${subject}`,
          meta: data,
        },
      };
    }
    if (text.includes('laundry')) {
      const targetLabel = text.includes('mahasiswa') ? 'mahasiswa' : (context.targetAudiens || 'pelanggan baru');
      return {
        reply: `Siap! Kita bisa buat konten TikTok untuk bisnis laundry dengan target ${targetLabel}, yang fokus menarik pelanggan baru.\n\nSupaya konsepnya tepat sasaran untuk ${targetLabel}, keunggulan utama apa yang paling ingin kamu tonjolkan?`,
        suggestedActions: ['🧺 Harga hemat kantong mahasiswa', '⚡ Cuci kilat selesai 1 hari', '🛵 Layanan antar-jemput kosan', '✨ Hasil cucian bersih & wangi'],
        updatedContext: { ...context, produk: 'laundry', business: 'laundry', platform: 'TikTok', targetAudiens: targetLabel, audience: targetLabel, tujuan: 'mendapatkan pelanggan baru', jenisKonten: 'video' },
        structuredDraft: null,
      };
    }
    if (text.includes('kopi')) {
      return {
        reply: 'Siap. Kita buat video TikTok untuk produk kopi kamu dengan gaya santai.\nKamu sudah punya foto produknya?',
        suggestedActions: ['📷 Saya punya foto', '📦 Saya punya informasi produk', '🌱 Bantu saya mulai dari awal'],
        updatedContext: { ...context, produk: 'kopi', platform: 'TikTok', gaya: 'santai', tujuan: 'membuat video promosi produk' },
        structuredDraft: null,
      };
    }
    return {
      reply: `Siap! Mari kita lanjutkan pembuatan konten ini bersama. Kamu sudah punya materi awalnya atau mau cari konsepnya dulu?`,
      suggestedActions: ['📷 Saya punya foto/materi', '💡 Bantu cari konsep', '🎬 Buka Studio'],
      updatedContext: context,
      structuredDraft: null,
    };
  }
}

export async function requestScriptGeneration(params: {
  topic: string;
  format?: string;
  targetAudience?: string;
  duration?: string;
  tone?: string;
}): Promise<{
  title: string;
  hook: string;
  fullScript: string;
  scenes: StoryboardScene[];
}> {
  try {
    const res = await fetch('/api/hejo/generate-script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Gagal menghubungi engine script');
    return await res.json();
  } catch (err) {
    console.warn('Fallback script generator:', err);
    return {
      title: `Konsep Video: ${params.topic}`,
      hook: `Pernahkah kamu penasaran cara termudah untuk ${params.topic}?`,
      fullScript: `[Scene 1: Hook (0-3s)]\n"Jangan skip dulu kalau kamu mau hasil yang rapi dan memuaskan!"\n\n[Scene 2: Masalah (3-8s)]\n"Banyak orang bingung mulai dari mana dan akhirnya menunda karya mereka."\n\n[Scene 3: Solusi (8-20s)]\n"Dengan metode praktis ini, kamu bisa menyelesaikannya dalam hitungan menit."\n\n[Scene 4: Aksi (20-30s)]\n"Klik simpan sekarang dan coba langsung hari ini!"`,
      scenes: [
        {
          sceneNumber: 1,
          title: 'Hook Pembuka (0-3s)',
          durationSeconds: 3,
          visualPrompt: 'Ekspresi ramah menatap kamera dengan senyum hangat, pencahayaan alami studio kreatif.',
          spokenAudio: 'Jangan skip dulu kalau kamu mau hasil yang rapi dan memuaskan!',
          cameraMovement: 'Zoom in perlahan',
        },
        {
          sceneNumber: 2,
          title: 'Keresahan Nyata (3-8s)',
          durationSeconds: 5,
          visualPrompt: 'Tampilan kendala atau kebiasaan lama yang sering membuang waktu.',
          spokenAudio: 'Banyak orang bingung mulai dari mana dan akhirnya menunda karya mereka.',
          cameraMovement: 'Medium shot santai',
        },
        {
          sceneNumber: 3,
          title: 'Langkah Solusi (8-20s)',
          durationSeconds: 12,
          visualPrompt: 'Demonstrasi langkah atau produk dengan detail yang jelas dan memuaskan.',
          spokenAudio: 'Dengan metode praktis ini, kamu bisa menyelesaikannya dalam hitungan menit.',
          cameraMovement: 'Close-up tangan / aksi',
        },
        {
          sceneNumber: 4,
          title: 'Panggilan Aksi (20-30s)',
          durationSeconds: 10,
          visualPrompt: 'Hasil karya akhir dengan visual bersih, teks judul jelas di layar.',
          spokenAudio: 'Klik simpan sekarang dan coba langsung hari ini!',
          cameraMovement: 'Hero shot stabil',
        },
      ],
    };
  }
}

export async function requestIdeas(niche: string): Promise<IdeaCard[]> {
  try {
    const res = await fetch('/api/hejo/generate-ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ niche, count: 6 }),
    });
    if (!res.ok) throw new Error('Gagal menghubungi engine ide');
    const data = await res.json();
    return (data.ideas || []).map((item: any, idx: number) => ({
      id: `idea-${Date.now()}-${idx}`,
      title: item.title,
      niche: niche,
      hook: item.hook,
      angle: item.angle || 'Inspirasi Segar',
      format: (item.format as any) || 'Reels / TikTok',
      difficulty: (item.difficulty as any) || 'Mudah',
    }));
  } catch (err) {
    console.warn('Fallback ideas:', err);
    return [
      {
        id: `idea-${Date.now()}-1`,
        title: `3 Cara Mudah Memulai ${niche} untuk Pemula`,
        niche: niche,
        hook: `Baru mau mulai ${niche}? Simpan 3 aturan emas ini biar nggak bingung.`,
        angle: 'Panduan Ringkas',
        format: 'Reels / TikTok',
        difficulty: 'Mudah',
      },
      {
        id: `idea-${Date.now()}-2`,
        title: `Mitos vs Fakta Seputar ${niche}`,
        niche: niche,
        hook: `Banyak yang salah paham soal ini. Yuk kita luruskan faktanya!`,
        angle: 'Edukasi Kritis',
        format: 'Carousel',
        difficulty: 'Mudah',
      },
    ];
  }
}

// ==========================================
// CREATOR ENGINE PIPELINE CLIENT FUNCTIONS
// ==========================================
export async function fetchPipelineIdeas(context: CreatorContext): Promise<PipelineIdea[]> {
  try {
    const res = await fetch('/api/hejo/pipeline/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context }),
    });
    if (!res.ok) throw new Error('Gagal mendapatkan ide');
    const data = await res.json();
    return data.ideas || [];
  } catch (err) {
    console.warn('Pipeline ideas fallback:', err);
    return [
      {
        id: 'idea-1',
        title: `Drama Mahasiswa: Baju Bersih Habis Pas Minggu Ujian`,
        hook: `Ketika cucian numpuk di kosan, dan yang tersisa di lemari cuma kaos ospek...`,
        concept: `Situasi komedi relate anak kos yang panik baju habis, lalu menemukan solusi praktis.`,
        targetAudience: context.targetAudiens || 'Mahasiswa',
        goal: context.tujuan || 'Mendapatkan Pelanggan Baru',
        style: 'Komedi Relate',
        duration: '30 detik',
      },
      {
        id: 'idea-2',
        title: `Hitung-hitungan Realistis: Nyuci Sendiri vs Laundry Kiloan`,
        hook: `Bener nggak sih laundry kiloan bikin boros anak kos? Mari kita hitung bareng!`,
        concept: `Perbandingan biaya sabun, listrik, dan waktu nugas yang terbuang jika cuci sendiri.`,
        targetAudience: context.targetAudiens || 'Mahasiswa',
        goal: context.tujuan || 'Mendapatkan Pelanggan Baru',
        style: 'Edukatif & Mindset',
        duration: '30 detik',
      },
      {
        id: 'idea-3',
        title: `Lifehack Kosan: Terima Bersih Tanpa Melangkah dari Kasur`,
        hook: `Buat kaum mager yang cuciannya menggunung, jangan tonton video ini sendirian!`,
        concept: `Menunjukkan kemudahan kurir antar-jemput langsung ke gerbang kosan.`,
        targetAudience: context.targetAudiens || 'Mahasiswa',
        goal: context.tujuan || 'Mendapatkan Pelanggan Baru',
        style: 'Sensori & Lifehack',
        duration: '30 detik',
      },
    ];
  }
}

export async function fetchPipelineScript(
  context: CreatorContext,
  selectedIdea?: PipelineIdea
): Promise<PipelineScript> {
  try {
    const res = await fetch('/api/hejo/pipeline/script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context, selectedIdea }),
    });
    if (!res.ok) throw new Error('Gagal mendapatkan naskah');
    const data = await res.json();
    return data.script;
  } catch (err) {
    console.warn('Pipeline script fallback:', err);
    return {
      title: `Naskah ${context.platform || 'TikTok'} ${context.produk || 'Laundry'} (${context.targetAudiens || 'Mahasiswa'})`,
      hook: `"Cucian numpuk di kosan pas lagi minggu ujian? Jangan pusing sendiri!"`,
      problem: `"Waktu buat nugas dan istirahat aja mepet, apalagi mikirin cuci dan setrika baju."`,
      solution: `"Untung ada laundry kami yang siap jemput dan cuci pakaianmu sampai bersih, rapi, dan wangi semerbak."`,
      advantage: `"Paket kiloan hemat ramah kantong mahasiswa, layanan kilat 1 hari selesai, dan gratis antar-jemput kosan."`,
      callToAction: `"Drop cucian kamu hari ini atau hubungi link di bio biar langsung kami jemput!"`,
    };
  }
}

export async function fetchPipelineStoryboard(
  context: CreatorContext,
  script?: PipelineScript
): Promise<PipelineScene[]> {
  try {
    const res = await fetch('/api/hejo/pipeline/storyboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context, script }),
    });
    if (!res.ok) throw new Error('Gagal mendapatkan storyboard');
    const data = await res.json();
    return data.storyboard || [];
  } catch (err) {
    console.warn('Pipeline storyboard fallback:', err);
    return [
      {
        sceneNumber: 1,
        sceneLabel: 'SCENE 1',
        duration: '0–3 detik',
        visual: 'Mahasiswa melihat tumpukan pakaian kotor menggunung di pojok kamar.',
        action: 'Melihat jam dinding lalu terlihat panik dan garuk-garuk kepala.',
        voiceOver: '"Cucian numpuk di kosan pas lagi minggu ujian? Jangan pusing sendiri!"',
        textOnScreen: 'Cucian numpuk di kosan?',
        cameraShot: 'Medium shot',
        transition: 'Cut',
      },
      {
        sceneNumber: 2,
        sceneLabel: 'SCENE 2',
        duration: '3–10 detik',
        visual: 'Mahasiswa duduk lelah di depan laptop dengan tumpukan tugas kuliah.',
        action: 'Menghela napas panjang menatap tumpukan cucian dengan tatapan putus asa.',
        voiceOver: '"Waktu buat nugas dan istirahat aja mepet, apalagi mikirin cuci dan setrika baju."',
        textOnScreen: 'Nugas numpuk, baju bersih habis',
        cameraShot: 'Over the shoulder',
        transition: 'Whip pan',
      },
      {
        sceneNumber: 3,
        sceneLabel: 'SCENE 3',
        duration: '10–20 detik',
        visual: 'Kurir ramah laundry datang menjemput kantong cucian di depan gerbang kosan.',
        action: 'Menyerahkan cucian dengan senyum lega, pakaian diproses rapi dan bersih.',
        voiceOver: '"Untung ada laundry kami yang siap jemput dan cuci pakaianmu sampai bersih wangi."',
        textOnScreen: 'Tinggal jemput, terima beres!',
        cameraShot: 'Medium close-up',
        transition: 'Smooth slide',
      },
      {
        sceneNumber: 4,
        sceneLabel: 'SCENE 4',
        duration: '20–30 detik',
        visual: 'Mahasiswa memakai pakaian bersih rapi dan tersenyum percaya diri.',
        action: 'Menunjukkan smartphone dengan tampilan bio dan promo paket hemat.',
        voiceOver: '"Drop cucian kamu hari ini atau hubungi link di bio biar langsung beres!"',
        textOnScreen: 'Pesan Antar-Jemput di Bio!',
        cameraShot: 'Hero shot',
        transition: 'Fade to brand',
      },
    ];
  }
}

export async function fetchPipelineShotList(
  context: CreatorContext,
  storyboard?: PipelineScene[]
): Promise<PipelineShot[]> {
  try {
    const res = await fetch('/api/hejo/pipeline/shotlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context, storyboard }),
    });
    if (!res.ok) throw new Error('Gagal mendapatkan shot list');
    const data = await res.json();
    return data.shotList || [];
  } catch (err) {
    console.warn('Pipeline shotlist fallback:', err);
    return [
      {
        shotNumber: 'SHOT 01',
        scene: 'Scene 1',
        shotType: 'Medium shot',
        subject: 'Mahasiswa + pakaian kotor',
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
        subject: 'Mahasiswa depan laptop',
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
        subject: 'Kurir laundry & tas pakaian',
        cameraAngle: 'Eye level',
        cameraMovement: 'Panning kanan mengikuti tangan',
        lighting: 'Outdoor daylight cerah',
        location: 'Depan gerbang kosan',
        props: 'Kantong laundry & smartphone',
        duration: '10 detik',
      },
      {
        shotNumber: 'SHOT 04',
        scene: 'Scene 4',
        shotType: 'Hero shot',
        subject: 'Mahasiswa tersenyum rapi + smartphone',
        cameraAngle: 'Slight low angle meyakinkan',
        cameraMovement: 'Static hero framing',
        lighting: 'Bright softbox light',
        location: 'Teras kosan bersih',
        props: 'Smartphone dengan bio profil',
        duration: '10 detik',
      },
    ];
  }
}

export async function fetchPipelineShotImage(
  shot: PipelineShot,
  context?: CreatorContext
): Promise<string> {
  const res = await fetch('/api/hejo/pipeline/shot-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shot, context }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Gagal membuat visual shot ${shot.shotNumber}`);
  }

  const data = await res.json();
  if (!data.imageUrl) {
    throw new Error(`Visual tidak ditemukan untuk ${shot.shotNumber}`);
  }

  return data.imageUrl;
}

