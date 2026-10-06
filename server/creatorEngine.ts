import { GoogleGenAI } from '@google/genai';
import { CreatorContext } from '../src/types/index.ts';
import { relayRouterChat } from '../relayRouter.ts';
import { 
  generateIdeasPipeline, 
  generateScriptPipeline, 
  generateStoryboardPipeline, 
  generateShotListPipeline 
} from './creatorPipeline.ts';

export interface CreatorEngineResponse {
  reply: string;
  suggestedActions: string[];
  updatedContext: CreatorContext;
  structuredDraft?: {
    type: 'idea' | 'script' | 'storyboard' | 'shotlist' | 'character' | 'product' | 'flow_ready' | 'multi_affiliate' | 'prompt_pack' | 'image_result';
    title: string;
    content: string;
    flowReady?: any;
    multiAffiliate?: any;
    promptPack?: any;
    imageResult?: any;
    meta?: Record<string, any>;
  } | null;
  flowReady?: any;
  multiAffiliate?: any;
  promptPack?: any;
  imageResult?: any;
}

function capitalize(str: string): string {
  if (!str) return '';
  return str
    .split(' ')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
    .join(' ');
}

// Handler khusus Affiliate & Flow Ready (Requirement 3 & 4)
function generateAffiliateFlowPackage(
  message: string,
  ctx: CreatorContext
): CreatorEngineResponse {
  const text = message.toLowerCase().trim();

  // 1. Duration & Scene calculation
  // "Buat video affiliate produk ini 20 detik." -> 20s -> 2 scene x 10 detik
  const durationMatch = text.match(/(\d+)\s*(detik|det|s|second)/i);
  let totalSeconds = durationMatch ? parseInt(durationMatch[1], 10) : 20;
  if (isNaN(totalSeconds) || totalSeconds <= 0) totalSeconds = 20;

  // Tiap scene 10 detik sesuai spesifikasi ekosistem Flow di HEJO
  const sceneCount = Math.max(1, Math.round(totalSeconds / 10));
  const normalizedDuration = `${sceneCount * 10} detik`;

  // 2. Deteksi Nama Produk
  let productName = ctx.produk || '';
  if (!productName || productName.toLowerCase() === 'produk ini' || productName.toLowerCase() === 'produk') {
    const cleaned = message
      .replace(/buat\s+video\s+affiliate/gi, '')
      .replace(/video\s+affiliate/gi, '')
      .replace(/affiliate/gi, '')
      .replace(/produk\s+ini/gi, '')
      .replace(/buatkan/gi, '')
      .replace(/tolong/gi, '')
      .replace(/\d+\s*(detik|det|s|second)/gi, '')
      .replace(/untuk/gi, '')
      .trim();

    if (cleaned.length > 2) {
      productName = cleaned;
    } else {
      productName = 'Produk Pilihan Affiliate';
    }
  }

  const scenes = [];
  for (let i = 1; i <= sceneCount; i++) {
    const isFirst = i === 1;
    const isLast = i === sceneCount;

    let storyboard = '';
    let imagePrompt = '';
    let videoPrompt = '';
    let narration = '';
    let cta = '';

    if (isFirst && !isLast) {
      // Scene 1: Visual hook produk, unboxing/detail kemasan, rasa penasaran
      storyboard = `Close-up estetik produk ${productName} di atas meja kayu minimalis dengan pencahayaan alami hangat. Tangan kreator memegang produk, memperlihatkan tekstur dan detail kemasan secara elegan di detik-detik awal.`;
      imagePrompt = `Ultra-realistic 4K commercial still of ${productName} on modern minimalist studio backdrop, soft natural key light, crisp textures, depth of field, premium affiliate product photography.`;
      videoPrompt = `Slow cinematic push-in shot of ${productName} (10 seconds), camera gently tracks inward, smooth motion blur, natural studio reflections, clean aesthetic grading, 24fps.`;
      narration = `Sering bingung nyari ${productName} yang beneran berkualitas dan awet? Stop scroll dulu, ini dia alasan kenapa produk ini viral dan disukai banyak orang!`;
      cta = `Tonton sampai habis untuk spill racikannya!`;
    } else if (isLast) {
      // Final Scene: Hasil nyata, kepuasan pemakaian, info promo & CTA keranjang kuning
      storyboard = `Demonstrasi penggunaan ${productName} dalam aktivitas nyata. Kreator tersenyum puas menunjukkan hasil pemakaian, diikuti tampilan grafis promo diskon dan tanda panah mengarah ke keranjang kuning.`;
      imagePrompt = `Authentic creator holding ${productName} with satisfied expression, clean lifestyle background, warm sunlight, commercial affiliate banner layout, high resolution.`;
      videoPrompt = `Eye-level stable tracking shot (10 seconds), creator demonstrating ${productName}, vibrant organic colors, high definition, persuasive affiliate flow pacing, 24fps.`;
      narration = `Dipakai harian nyaman banget, kualitasnya terbukti memuaskan. Khusus pembelian hari ini lagi ada promo potongan harga plus gratis ongkir!`;
      cta = `Klik keranjang kuning di pojok kiri bawah sekarang sebelum promonya habis!`;
    } else {
      // Intermediate Scene: Feature highlight & manfaat spesifik
      storyboard = `Medium close-up menonjolkan fitur unggulan utama ${productName}. Menunjukkan perbandingan atau kepraktisan saat dipakai di kehidupan sehari-hari.`;
      imagePrompt = `Detailed feature breakdown shot of ${productName}, sharp macro focus, soft ambient lighting, clean modern aesthetic.`;
      videoPrompt = `Gentle pan across ${productName} highlighting practical features (10 seconds), smooth glide, 24fps cinematic affiliate video look.`;
      narration = `Bahan dan kualitasnya beneran beda dari yang biasa. Praktis dibawa ke mana-mana dan bikin aktivitasmu jadi jauh lebih gampang.`;
      cta = `Cek varian favoritmu sekarang!`;
    }

    scenes.push({
      sceneNumber: i,
      duration: '10 detik',
      storyboard,
      imagePrompt,
      videoPrompt,
      narration,
      cta,
    });
  }

  const flowReadyData = {
    productName,
    totalDuration: normalizedDuration,
    sceneCount,
    scenes,
    targetAudience: ctx.targetAudiens || 'Audiens Affiliate & Pembeli Online',
    platform: ctx.platform || 'TikTok & Reels',
    createdAt: 'Baru saja',
  };

  let draftText = `🎬 SIAP UNTUK FLOW\nProduk: ${productName}\n${sceneCount} Scene · ${normalizedDuration}\n\n`;
  scenes.forEach((s) => {
    draftText += `------------------------------------\nSCENE ${s.sceneNumber} — ${s.duration}\n------------------------------------\n[Storyboard]: ${s.storyboard}\n\n[Prompt Gambar]: ${s.imagePrompt}\n\n[Prompt Video]: ${s.videoPrompt}\n\n[Narasi]: "${s.narration}"\n\n[CTA]: ${s.cta}\n\n`;
  });

  return {
    reply: `Siap! Saya sudah menyiapkan materi video affiliate untuk **${productName}** dengan durasi **${normalizedDuration}** (${sceneCount} scene × 10 detik).\n\nSemua materi storyboard, prompt video, dan narasinya sudah siap untuk dieksekusi di Flow!`,
    suggestedActions: [
      '🚀 Lanjut ke Flow',
      '📋 Salin Semua Prompt',
      '💾 Simpan ke Project',
      '🎬 Buka di Studio'
    ],
    updatedContext: {
      ...ctx,
      produk: productName,
      durasi: normalizedDuration,
      pipelineStage: 'shotlist',
      flowReady: flowReadyData,
    },
    structuredDraft: {
      type: 'flow_ready',
      title: `Siap untuk Flow: ${productName} (${normalizedDuration})`,
      content: draftText.trim(),
      flowReady: flowReadyData,
      meta: { flowReady: flowReadyData }
    },
    flowReady: flowReadyData,
  };
}

// Handler 1 PRODUK -> BANYAK KONTEN (Requirement 4)
function generateMultiAngleAffiliatePackage(
  message: string,
  ctx: CreatorContext
): CreatorEngineResponse {
  const text = message.toLowerCase().trim();

  let count = 5;
  const countMatch = text.match(/(\d+)\s*(konten|video|angle|versi|buah)/i);
  if (countMatch) {
    const parsed = parseInt(countMatch[1], 10);
    if (!isNaN(parsed) && parsed > 0) {
      count = Math.min(10, Math.max(1, parsed));
    }
  } else if (text.includes('3 konten') || text.includes('3')) {
    count = 3;
  } else if (text.includes('10 konten') || text.includes('10')) {
    count = 10;
  }

  let productName = ctx.produk || '';
  if (!productName || productName.toLowerCase() === 'produk ini' || productName.toLowerCase() === 'produk') {
    const cleaned = message
      .replace(/buat\s+\d+\s*(konten|video|affiliate)/gi, '')
      .replace(/buat\s+video\s+affiliate/gi, '')
      .replace(/konten\s+affiliate/gi, '')
      .replace(/video\s+affiliate/gi, '')
      .replace(/1\s+produk\s+banyak\s+konten/gi, '')
      .replace(/produk\s+ini/gi, '')
      .replace(/untuk/gi, '')
      .replace(/dari/gi, '')
      .replace(/masing-masing\s+\d+\s*detik/gi, '')
      .trim();

    productName = cleaned.length > 2 ? cleaned : 'Produk Pilihan Affiliate';
  }

  const ANGLES = [
    {
      name: 'Masalah → Solusi',
      desc: 'Bahas keresahan audiens terlebih dahulu lalu hadirkan produk sebagai penyelamat.',
      hook: (p: string) => `Pernah nggak sih ngerasa jengkel banget pas lagi butuh ${p} tapi yang ada malah ngecewain?`,
      script: (p: string) => `Dulu aku sering banget ngalamin hal kayak gitu, sampai akhirnya nemu ${p} ini. Solusinya beneran simpel dan langsung berasa bedanya sejak hari pertama!`,
      cta: 'Buat kamu yang punya masalah sama, cek keranjang kuning sekarang mumpung stok masih ready!'
    },
    {
      name: 'Keunggulan Produk (USP)',
      desc: 'Sorot fitur unik dan material terbaik yang membedakan produk dari kompetitor.',
      hook: (p: string) => `Ini dia 3 alasan kenapa ${p} ini selalu sold out dalam hitungan jam!`,
      script: (p: string) => `Pertama, bahannya premium dan awet. Kedua, desainnya ergonomis dan nyaman banget. Dan ketiga, harganya masuk akal banget untuk kualitas sebagus ini!`,
      cta: 'Jangan tunggu kehabisan, checkout di keranjang kuning sekarang!'
    },
    {
      name: 'Demo Penggunaan Langsung',
      desc: 'Tunjukkan kepraktisan dan cara pakai produk secara visual dalam kehidupan nyata.',
      hook: (p: string) => `Banyak yang nanya: "Beneran gampang nggak sih pakainya?" Yuk kita buktiin bareng!`,
      script: (p: string) => `Tinggal buka, aplikasikan dalam hitungan detik, dan hasilnya langsung kelihatan rapi. Praktis banget buat kamu yang serba sibuk!`,
      cta: 'Cobain sendiri kepraktisannya, klik tautan di keranjang kuning!'
    },
    {
      name: 'Storytelling Personal',
      desc: 'Cerita santai dan personal tentang bagaimana produk ini mengubah rutinitas harian.',
      hook: (p: string) => `Jujur, awalnya aku skeptis sama ${p} ini karena seliweran terus di FYP...`,
      script: (p: string) => `Tapi pas barangnya nyampe dan aku coba sendiri seminggu berturut-turut, ternyata worth it parah. Sekarang udah jadi barang wajib yang harus selalu ada!`,
      cta: 'Yuk samaan sama aku, langsung tap keranjang kuning ya!'
    },
    {
      name: 'Soft Selling + Promo Urgency',
      desc: 'Pendekatan kasual ramah yang ditutup dengan penawaran terbatas dan diskon khusus.',
      hook: (p: string) => `Spill barang viral yang harganya nggak masuk akal murahnya hari ini!`,
      script: (p: string) => `Kualitasnya bintang lima tapi harganya lagi dapet subsidi diskon gede plus gratis ongkir khusus pemesanan hari ini.`,
      cta: 'Promo cuma berlaku hari ini, buruan amankan di keranjang kuning sebelum harga normal lagi!'
    },
    {
      name: 'Review Jujur & Pengalaman',
      desc: 'Ulasan transparan sudut pandang konsumen asli yang membangun rasa percaya.',
      hook: (p: string) => `Review jujur pemakaian ${p} setelah 30 hari pemakaian rutin.`,
      script: (p: string) => `Yang paling aku suka itu build quality-nya beneran solid, nggak ringkih sama sekali. Bener-bener sebanding sama ulasan ribuan pembeli lainnya.`,
      cta: 'Buktikan sendiri, cek review lengkap dan checkout via keranjang kuning!'
    },
    {
      name: 'Before → After',
      desc: 'Perbandingan visual kontras sebelum memakai produk vs sesudah merasakan manfaatnya.',
      hook: (p: string) => `Lihat perbedaannya sebelum dan sesudah pakai ${p} ini!`,
      script: (p: string) => `Dulu ribet dan makan waktu banget, sekarang semuanya beres cuma dalam beberapa menit. Efeknya beneran nyata dan instan.`,
      cta: 'Mau hasil yang sama? Klik keranjang kuning di bawah sekarang juga!'
    },
    {
      name: 'Edukasi & Tips Praktis',
      desc: 'Bagi wawasan bermanfaat seputar kategori produk agar audiens mendapat nilai tambah.',
      hook: (p: string) => `Jangan salah pilih! Ini tips penting sebelum kamu beli ${p}.`,
      script: (p: string) => `Pastikan pilih yang materialnya teruji dan punya garansi kualitas seperti ini. Jangan tergiur yang murah tapi gampang rusak ya!`,
      cta: 'Pilihan yang paling aman dan teruji ada di keranjang kuning!'
    },
    {
      name: 'Hook Kuat & Rasa Penasaran',
      desc: 'Membuka dengan fakta mengejutkan atau pertanyaan provokatif yang menahan audiens menonton.',
      hook: (p: string) => `Kenapa nggak ada yang ngasih tahu aku produk ini dari tahun lalu?!`,
      script: (p: string) => `Ternyata ini rahasia kecil yang bikin aktivitas jadi jauh lebih hemat tenaga dan hasil maksimal. Bener-bener game changer buat hari-hariku!`,
      cta: 'Jangan sampai ketinggalan, langsung amankan di keranjang kuning!'
    },
    {
      name: 'Promo & Diskon Eksklusif',
      desc: 'Menonjolkan keuntungan finansial dan bonus ekstra jika bertransaksi sekarang.',
      hook: (p: string) => `Peringatan promo kilat! Diskon terbesar bulan ini buat ${p}!`,
      script: (p: string) => `Lagi ada promo voucher toko plus potongan ongkir. Jarang-jarang dapet produk sebagus ini di harga semurah ini!`,
      cta: 'Mumpung kupon masih aktif, buruan klaim dan checkout di keranjang kuning!'
    }
  ];

  const contents = [];
  for (let i = 0; i < count; i++) {
    const angle = ANGLES[i % ANGLES.length];
    contents.push({
      id: `content-${i + 1}`,
      angleIndex: i + 1,
      angleName: angle.name,
      angleDescription: angle.desc,
      hook: angle.hook(productName),
      scenario: `Adegan visual hook yang relevan dengan sudut pandang "${angle.name}" untuk ${productName}. Menampilkan ekspresi natural kreator dengan transisi mulus ke keunggulan produk.`,
      narration: angle.script(productName),
      callToAction: angle.cta,
      duration: '20 detik',
      imagePrompt: `Cinematic commercial photography of ${productName}, angle style "${angle.name}", professional studio lighting, warm aesthetic, highly detailed 4k.`,
      videoPrompt: `20-second dynamic affiliate video for ${productName}, pacing tailored for "${angle.name}", smooth gimbal push-in, clear product visibility, vibrant colors, 24fps.`
    });
  }

  const multiAffiliateData = {
    productName,
    contentCount: count,
    contents,
    createdAt: 'Baru saja'
  };

  let formattedDraft = `🛍️ PAKET AFFILIATE: 1 PRODUK → ${count} KONTEN BERBEDA\nProduk: ${productName}\n\n`;
  contents.forEach((c) => {
    formattedDraft += `========================================\nKONTEN #${c.angleIndex}: Sudut Pandang [${c.angleName}]\n${c.angleDescription}\n----------------------------------------\n[Hook 3s]: "${c.hook}"\n[Naskah]: "${c.narration}"\n[CTA]: "${c.callToAction}"\n[Prompt Video]: ${c.videoPrompt}\n\n`;
  });

  return {
    reply: `Saya telah meracik **${count} konten affiliate berbeda** untuk **${productName}**!\n\nSetiap konten memiliki angle dan hook yang berbeda (Masalah-Solusi, USP, Demo, Storytelling, dll) sehingga penonton tidak merasa bosan. Kamu bisa langsung menyalin atau memproses konten favoritmu ke video Flow!`,
    suggestedActions: [
      '🎬 Buat Video Flow untuk Konten 1',
      '📋 Salin Semua Konten',
      '💾 Simpan ke Project',
      '🔄 Buat variasi lain'
    ],
    updatedContext: {
      ...ctx,
      produk: productName,
      multiAffiliate: multiAffiliateData,
    },
    structuredDraft: {
      type: 'multi_affiliate',
      title: `1 Produk → ${count} Konten Affiliate: ${productName}`,
      content: formattedDraft.trim(),
      multiAffiliate: multiAffiliateData,
      meta: { multiAffiliate: multiAffiliateData }
    },
    multiAffiliate: multiAffiliateData,
  };
}

// Handler Buat Prompt (Requirement 9)
function generatePromptPackage(
  message: string,
  ctx: CreatorContext
): CreatorEngineResponse {
  const text = message.toLowerCase().trim();
  const isVideo = text.includes('video');
  const isCinematic = text.includes('cinematic');
  const isProduct = text.includes('produk') || text.includes('product') || text.includes('photography');
  const isAffiliate = text.includes('affiliate') || text.includes('iklan');

  let category: any = 'cinematic';
  if (isProduct) category = 'product_photography';
  else if (isAffiliate) category = 'affiliate';
  else if (isVideo) category = 'video';
  else if (isCinematic) category = 'cinematic';

  let subject = ctx.produk || ctx.karakter || '';
  if (!subject || subject.toLowerCase() === 'produk ini') {
    const cleaned = message
      .replace(/buat\s+prompt/gi, '')
      .replace(/buatkan\s+prompt/gi, '')
      .replace(/prompt/gi, '')
      .replace(/cinematic/gi, '')
      .replace(/video/gi, '')
      .replace(/gambar/gi, '')
      .replace(/affiliate/gi, '')
      .replace(/produk/gi, '')
      .trim();
    subject = cleaned.length > 2 ? cleaned : 'Produk Unggulan Modern';
  }

  const promptGlobal = `Professional commercial 4K cinematic visual of ${subject}, ultra-detailed textures, pristine studio depth of field, warm golden-hour rim lighting, shot on 35mm master prime lens, clean composition, hyper-realistic, 8k resolution, award-winning cinematography.`;
  const promptIndo = `Panduan Visual: Tampilan sinematik 4K subjek ${subject}, pencahayaan golden-hour hangat, ketajaman tekstur maksimal, kedalaman fokus studio profesional, komposisi bersih dan elegan untuk konten visual berkualitas tinggi.`;

  const promptPackData = {
    category,
    title: `Prompt Siap Salin: ${subject}`,
    promptGlobal,
    promptIndo,
    negativePrompt: 'blurry, distorted, low quality, cartoon, watermark, noisy, deformed',
    aspectRatio: '16:9 atau 9:16',
    usageTips: 'Salin Prompt Global untuk generator AI (Midjourney, Flux, Kling, Runway, Flow) dan gunakan prompt Indo untuk arahan tim.'
  };

  const draftText = `📝 PROMPT SIAP DISALIN\nSubjek: ${subject}\n\n[PROMPT GLOBAL (AI)]: \n${promptGlobal}\n\n[PANDUAN INDONESIA]:\n${promptIndo}\n\n[NEGATIVE PROMPT]:\n${promptPackData.negativePrompt}`;

  return {
    reply: `Ini dia prompt teroptimasi untuk **${subject}**! Prompt ini sudah dirancang khusus agar menghasilkan visual sinematik berkualitas tinggi di generator AI pilihanmu.`,
    suggestedActions: [
      '📋 Salin Prompt',
      '🖼️ Buat Gambarnya Sekarang',
      '🎬 Buat Video dari Prompt Ini',
      '💾 Simpan ke Project'
    ],
    updatedContext: {
      ...ctx,
      promptPack: promptPackData
    },
    structuredDraft: {
      type: 'prompt_pack',
      title: `Prompt: ${subject}`,
      content: draftText,
      promptPack: promptPackData,
      meta: { promptPack: promptPackData }
    },
    promptPack: promptPackData
  };
}

// Handler Buat Gambar (Requirement 8)
function generateImageResponse(
  message: string,
  ctx: CreatorContext
): CreatorEngineResponse {
  let subject = ctx.produk || ctx.karakter || '';
  const cleaned = message
    .replace(/buat\s+gambar/gi, '')
    .replace(/buatkan\s+gambar/gi, '')
    .replace(/gambar/gi, '')
    .replace(/terlihat\s+premium/gi, '')
    .trim();

  if (cleaned.length > 2) {
    subject = cleaned;
  } else if (!subject) {
    subject = 'Produk estetik dengan pencahayaan studio hangat';
  }

  const prompt = `Ultra-detailed commercial 4K shot of ${subject}, premium minimalist studio environment, soft diffused lighting, crisp textures, natural wooden table, bokeh background, award-winning photography, photorealistic, 8k.`;

  const imageResultData = {
    prompt,
    aspectRatio: '1:1',
    status: 'prompt_only' as const
  };

  const draftText = `🖼️ PROMPT GAMBAR SIAP DIGUNAKAN\nDeskripsi: ${subject}\n\n[Prompt AI]:\n${prompt}`;

  return {
    reply: `Siap! Saya sudah menyiapkan arahan visual dan prompt gambar berkualitas studio untuk **${subject}**. Kamu bisa langsung menyalin prompt atau membuat gambarnya!`,
    suggestedActions: [
      '📋 Salin Prompt Gambar',
      '🎬 Jadikan Video Affiliate',
      '💾 Simpan ke Project',
      '🔄 Buat Variasi Gaya Lain'
    ],
    updatedContext: {
      ...ctx,
      imageResult: imageResultData
    },
    structuredDraft: {
      type: 'image_result',
      title: `Visual: ${subject}`,
      content: draftText,
      imageResult: imageResultData,
      meta: { imageResult: imageResultData }
    },
    imageResult: imageResultData
  };
}

// Fallback logic when apiKey is absent, quota is reached, or offline
export function processLocalCreatorEngine(
  message: string,
  currentContext: CreatorContext = {},
  userMode: string = 'SIMPLE'
): CreatorEngineResponse {
  const text = message.toLowerCase().trim();
  const ctx: CreatorContext = { ...currentContext };

  // ========================================================
  // SPECIAL HANDLER: STRUCTURED MOTION_CONTEXT (Requirement 5)
  // ========================================================
  if (text.includes('motion_context:') || text.includes('motion_context')) {
    const lines = message.split('\n');
    const motionData: Record<string, string> = {};
    for (const l of lines) {
      const trimmed = l.trim();
      if (trimmed.includes('=')) {
        const [k, ...rest] = trimmed.split('=');
        motionData[k.trim().toLowerCase()] = rest.join('=').trim();
      }
    }

    const preset = motionData.preset || 'Slow Push-in (Dolly In)';
    const angle = motionData.angle || 'Eye Level';
    const speed = motionData.speed || 'Normal';
    const intensity = motionData.intensity || 'Normal';
    const subject = motionData.subject || ctx.karakter || ctx.produk || 'subjek utama';
    const scene = motionData.scene || 'adegan video';

    const reply = `Siap! Gerakan kamera **"${preset}"** (${angle}, tempo ${speed}) berhasil diterapkan untuk subjek **${subject}** pada ${scene}!\n\nKamera akan bergerak terarah untuk menghasilkan fokus visual yang kuat dan sinematik. Pengaturan ini sudah otomatis disimpan ke metadata project dan dimasukkan ke dalam Prompt Video AI.`;

    const updatedContext: CreatorContext = {
      ...ctx,
      motion: {
        preset,
        cameraMovement: preset,
        angle,
        speed,
        intensity,
        subject,
        scene,
      },
    };

    return {
      reply,
      suggestedActions: [
        '🎬 Buka Studio Video',
        '🎥 Lihat Shot List',
        '✨ Buat Semua Visual',
        '🔄 Ubah Gerakan'
      ],
      updatedContext,
      structuredDraft: {
        type: 'shotlist',
        title: `Motion Kamera: ${preset}`,
        content: `Instruksi Gerakan Kamera:
- Jenis Gerakan: ${preset}
- Sudut Kamera: ${angle}
- Kecepatan Gerakan: ${speed}
- Intensitas: ${intensity}
- Subjek / Fokus: ${subject}
- Scene Terkait: ${scene}`,
        meta: { preset, angle, speed, intensity, subject, scene }
      }
    };
  }

  // ========================================================
  // SPECIAL HANDLER: 1 PRODUK -> BANYAK KONTEN (Requirement 4)
  // ========================================================
  if (
    (text.includes('konten') && (text.includes('3') || text.includes('5') || text.includes('10') || text.includes('banyak') || text.includes('beberapa'))) ||
    text.includes('1 produk') ||
    text.includes('banyak konten')
  ) {
    return generateMultiAngleAffiliatePackage(message, ctx);
  }

  // ========================================================
  // SPECIAL HANDLER: BUAT PROMPT (Requirement 9)
  // ========================================================
  if (
    text.startsWith('buat prompt') ||
    text.startsWith('prompt') ||
    text.includes('buat prompt') ||
    text.includes('prompt video') ||
    text.includes('prompt gambar') ||
    text.includes('prompt cinematic')
  ) {
    return generatePromptPackage(message, ctx);
  }

  // ========================================================
  // SPECIAL HANDLER: BUAT GAMBAR (Requirement 8)
  // ========================================================
  if (
    text.startsWith('buat gambar') ||
    text.startsWith('gambar') ||
    text.includes('buat gambar') ||
    text.includes('gambar produk') ||
    text.includes('terlihat premium')
  ) {
    return generateImageResponse(message, ctx);
  }

  // ========================================================
  // SPECIAL HANDLER: AFFILIATE VIDEO & FLOW READY (Requirement 3 & 4)
  // ========================================================
  if (
    text.includes('affiliate') ||
    text.includes('flow ready') ||
    text.includes('siap untuk flow') ||
    text.includes('video affiliate') ||
    (text.includes('buat video') && (text.includes('detik') || text.includes('second') || text.includes('20') || text.includes('30')))
  ) {
    return generateAffiliateFlowPackage(message, ctx);
  }

  // ========================================================
  // PIPELINE STAGE 4: SHOT LIST GENERATOR ("🎥 Buat Shot List")
  // ========================================================
  if (text.includes('buat shot list') || text.includes('shot list')) {
    const targetLabel = ctx.targetAudiens || 'Mahasiswa';
    const business = ctx.produk || ctx.business || 'Laundry';
    const platLabel = ctx.platform || 'TikTok';

    const shotListContent = `SHOT 01
Scene: Scene 1
Jenis shot: Medium shot
Subject: ${targetLabel} + pakaian kotor
Camera angle: Eye level
Camera movement: Static
Lighting: Natural indoor light
Location: Kamar kos
Props: Keranjang pakaian & jam dinding
Durasi: 3 detik

SHOT 02
Scene: Scene 2
Jenis shot: Over the shoulder
Subject: ${targetLabel} depan laptop
Camera angle: High angle halus
Camera movement: Slow push-in
Lighting: Lampu belajar hangat
Location: Meja belajar kosan
Props: Laptop & buku tugas berserakan
Durasi: 7 detik

SHOT 03
Scene: Scene 3
Jenis shot: Medium close-up
Subject: Kurir ${business} & tas laundry rapi
Camera angle: Eye level
Camera movement: Panning kanan mengikuti tangan
Lighting: Outdoor daylight cerah
Location: Depan gerbang kosan
Props: Kantong laundry bermerek & motor
Durasi: 10 detik

SHOT 04
Scene: Scene 4
Jenis shot: Hero shot
Subject: ${targetLabel} tersenyum rapi + smartphone
Camera angle: Slight low angle meyakinkan
Camera movement: Static hero framing
Lighting: Bright softbox light
Location: Teras kosan bersih
Props: Smartphone dengan tampilan profil bio
Durasi: 10 detik`;

    return {
      reply: `Ini dia Shot List produksi untuk memandu pengambilan gambar ${platLabel} ${business}. Setiap shot sudah dilengkapi detail kamera, subjek, pencahayaan, dan propertinya!`,
      suggestedActions: [
        '📋 Salin Shot List',
        '💾 Simpan ke Project',
        '🎬 Buka di Studio',
        '🔄 Buat ide lain'
      ],
      updatedContext: {
        ...ctx,
        pipelineStage: 'shotlist',
      },
      structuredDraft: {
        type: 'shotlist',
        title: `Shot List Produksi: ${platLabel} ${capitalize(business)} (${capitalize(targetLabel)})`,
        content: shotListContent,
      },
    };
  }

  // ========================================================
  // PIPELINE STAGE 3: STORYBOARD GENERATOR ("🎬 Buat Storyboard")
  // ========================================================
  if (text.includes('buat storyboard') || text.includes('storyboard')) {
    const targetLabel = ctx.targetAudiens || 'Mahasiswa';
    const business = ctx.produk || ctx.business || 'Laundry';
    const platLabel = ctx.platform || 'TikTok';

    const storyboardContent = `SCENE 1
Durasi: 0–3 detik
Visual: ${capitalize(targetLabel)} melihat tumpukan pakaian kotor menggunung di pojok kamar.
Aksi: Melihat jam dinding lalu terlihat panik dan garuk-garuk kepala.
Voice over: "Cucian numpuk di kosan pas lagi minggu ujian? Jangan pusing sendiri!"
Text: "Cucian numpuk di kosan?"
Camera: Medium shot
Transition: Cut

SCENE 2
Durasi: 3–10 detik
Visual: ${capitalize(targetLabel)} duduk lelah di depan laptop dengan tumpukan tugas kuliah.
Aksi: Menghela napas panjang menatap tumpukan cucian dengan tatapan putus asa.
Voice over: "Waktu buat nugas dan istirahat aja mepet, apalagi mikirin cuci dan setrika baju."
Text: "Nugas numpuk, baju bersih habis"
Camera: Over the shoulder
Transition: Whip pan

SCENE 3
Durasi: 10–20 detik
Visual: Kurir ramah ${business} datang menjemput kantong cucian di depan gerbang kosan.
Aksi: Menyerahkan cucian dengan senyum lega, pakaian diproses rapi dan bersih.
Voice over: "Untung ada ${business} yang siap jemput dan cuci pakaianmu sampai bersih wangi."
Text: "Tinggal jemput, terima beres!"
Camera: Medium close-up
Transition: Smooth slide

SCENE 4
Durasi: 20–30 detik
Visual: ${capitalize(targetLabel)} memakai pakaian bersih rapi dan tersenyum percaya diri.
Aksi: Menunjukkan smartphone dengan tampilan bio dan promo paket hemat.
Voice over: "Drop cucian kamu hari ini atau hubungi link di bio biar langsung beres!"
Text: "Pesan Antar-Jemput di Bio!"
Camera: Hero shot
Transition: Fade to brand`;

    return {
      reply: `Storyboard 4 Scene sudah berhasil diracik dari naskahmu! Setiap scene memiliki detail visual, aksi kamera, teks layar, dan transisinya:`,
      suggestedActions: [
        '📋 Salin',
        '💾 Simpan',
        '✏️ Edit',
        '🎥 Buat Shot List'
      ],
      updatedContext: {
        ...ctx,
        pipelineStage: 'storyboard',
      },
      structuredDraft: {
        type: 'storyboard',
        title: `Storyboard ${platLabel}: ${capitalize(business)} (${capitalize(targetLabel)})`,
        content: storyboardContent,
      },
    };
  }

  // ========================================================
  // PIPELINE STAGE 2: SCRIPT GENERATOR (Dari Pilihan Ide)
  // ========================================================
  if (text.includes('pilih ide') || text.includes('ide 1') || text.includes('ide 2') || text.includes('ide 3')) {
    let ideaNum = 1;
    if (text.includes('2')) ideaNum = 2;
    if (text.includes('3')) ideaNum = 3;

    const targetLabel = ctx.targetAudiens || 'Mahasiswa';
    const business = ctx.produk || ctx.business || 'Laundry';
    const platLabel = ctx.platform || 'TikTok';

    let ideaTitle = `Drama Mahasiswa: Baju Bersih Habis`;
    let hookText = `"Cucian numpuk di kosan pas lagi minggu ujian? Jangan pusing sendiri!"`;
    let problemText = `"Waktu buat nugas dan istirahat aja mepet, apalagi mikirin cuci dan setrika baju."`;
    let solutionText = `"Untung ada ${business} yang siap jemput dan cuci pakaianmu sampai bersih wangi."`;
    let advText = `"Paket kiloan hemat ramah kantong ${targetLabel}, selesai kilat 1 hari, dan gratis antar-jemput kosan."`;

    if (ideaNum === 2) {
      ideaTitle = `Hitung-hitungan Realistis: Nyuci Sendiri vs Laundry Kiloan`;
      hookText = `"Bener nggak sih laundry kiloan bikin boros anak kos? Mari kita hitung bareng!"`;
      problemText = `"Beli deterjen, bayar token listrik, jemur seharian, plus waktu nugas 3 jam yang hilang."`;
      solutionText = `"Di ${business}, cukup bayar paket kiloan hemat, baju sudah dicuci, disetrika rapi, dan diantar."`;
      advText = `"Hemat tenaga, hemat waktu nugas, dan pakaian dijamin wangi rapi higienis."`;
    } else if (ideaNum === 3) {
      ideaTitle = `Lifehack Kosan: Terima Bersih Tanpa Melangkah dari Kasur`;
      hookText = `"Buat kaum mager yang cuciannya menggunung, video ini penyelamat hidupmu!"`;
      problemText = `"Capek seharian di kampus, sampai kosan malah disambut gunungan cucian kotor."`;
      solutionText = `"Cukup kirim pesan ke WhatsApp ${business}, kurir langsung datang jemput ke depan kos."`;
      advText = `"Bisa bayar non-tunai, tracking cucian online, dan siap pakai keesokan harinya."`;
    }

    const scriptContent = `[0–3 detik] Hook
${hookText}

[3–10 detik] Masalah
${problemText}

[10–20 detik] Solusi
${solutionText}

[20–27 detik] Keunggulan
${advText}

[27–30 detik] Call to Action
"Drop cucian kamu hari ini atau chat link di bio biar langsung kami jemput!"`;

    return {
      reply: `Pilihan mantap! Ide #${ideaNum} (${ideaTitle}) sudah diubah menjadi naskah ${platLabel} 30 detik yang siap pakai:`,
      suggestedActions: [
        '📋 Salin',
        '💾 Simpan',
        '✏️ Edit Script',
        '🎬 Buat Storyboard'
      ],
      updatedContext: {
        ...ctx,
        ide: ideaTitle,
        pipelineStage: 'script',
      },
      structuredDraft: {
        type: 'script',
        title: `Naskah ${platLabel}: ${ideaTitle}`,
        content: scriptContent,
      },
    };
  }

  // ========================================================
  // PIPELINE STAGE 1: IDE GENERATOR ("Saya butuh ide" / "Buat ide lain")
  // ========================================================
  if (text.includes('butuh ide') || text.includes('cari ide') || text.includes('buat ide lain') || text.includes('ide lain') || text.includes('rekomendasi ide')) {
    const targetLabel = ctx.targetAudiens || 'Mahasiswa';
    const business = ctx.produk || ctx.business || 'Laundry';
    const platLabel = ctx.platform || 'TikTok';
    const goalLabel = ctx.tujuan || 'menarik pelanggan baru';

    const ideasDraftContent = `💡 IDE 1: Drama Mahasiswa: Baju Bersih Habis Pas Minggu Ujian
• Hook: "Ketika cucian numpuk di kosan, dan yang tersisa cuma kaos ospek..."
• Konsep: Komedi situasi anak kos yang panik baju habis, lalu menemukan solusi praktis lewat ${business}.
• Target: ${capitalize(targetLabel)} · Tujuan: ${capitalize(goalLabel)} · Durasi: 30 detik

💡 IDE 2: Hitung-hitungan Realistis: Nyuci Sendiri vs Laundry Kiloan
• Hook: "Bener nggak sih laundry kiloan bikin boros anak kos? Mari kita hitung bareng!"
• Konsep: Perbandingan biaya sabun, listrik, dan waktu nugas yang terbuang jika cuci sendiri vs paket hemat ${business}.
• Target: ${capitalize(targetLabel)} · Tujuan: ${capitalize(goalLabel)} · Durasi: 30 detik

💡 IDE 3: Lifehack Kosan: Terima Bersih Tanpa Melangkah dari Kasur
• Hook: "Buat kaum mager yang cuciannya menggunung, jangan tonton video ini sendirian!"
• Konsep: Menunjukkan kemudahan kurir antar-jemput ${business} langsung ke gerbang kosan.
• Target: ${capitalize(targetLabel)} · Tujuan: ${capitalize(goalLabel)} · Durasi: 30 detik`;

    return {
      reply: `Ini 3 rekomendasi ide konten ${platLabel} untuk bisnis ${business} dengan target ${targetLabel}. Mana yang paling cocok untuk dibuatkan naskah?`,
      suggestedActions: [
        '💡 Pilih ide 1',
        '💡 Pilih ide 2',
        '💡 Pilih ide 3',
        '🔄 Buat ide lain'
      ],
      updatedContext: {
        ...ctx,
        pipelineStage: 'idea',
      },
      structuredDraft: {
        type: 'idea',
        title: `3 Ide Konten ${platLabel} ${capitalize(business)} (${capitalize(targetLabel)})`,
        content: ideasDraftContent,
      },
    };
  }

  // 1. Detect Business / Produk / Jasa
  let detectedBusiness = '';
  const businessMatch = text.match(/(?:bisnis|usaha|jasa|toko|jual|produk)\s+([a-zA-Z0-9\s]+?)(?: dan|\.|\,|$|\byang\b|\buntuk\b|\bdi\b)/i);
  if (businessMatch && businessMatch[1]) {
    const raw = businessMatch[1].trim().toLowerCase();
    if (raw.length > 2 && raw.length < 30) {
      detectedBusiness = raw;
    }
  }

  const directCategories = [
    'laundry', 'kopi', 'skincare', 'katering', 'catering', 'makanan', 'kuliner',
    'fashion', 'baju', 'pakaian', 'sepatu', 'hijab', 'tas', 'parfum', 'kue',
    'bengkel', 'salon', 'barbershop', 'jasa cuci', 'fotografi', 'kursus',
    'affiliate', 'personal branding'
  ];
  for (const cat of directCategories) {
    if (text.includes(cat)) {
      detectedBusiness = cat;
      break;
    }
  }

  if (detectedBusiness) {
    ctx.produk = detectedBusiness;
    ctx.business = detectedBusiness;
  } else if (!ctx.produk && ctx.business) {
    ctx.produk = ctx.business;
  }

  // 2. Detect Platform
  if (text.includes('tiktok')) ctx.platform = 'TikTok';
  else if (text.includes('reels') || text.includes('instagram')) ctx.platform = 'Instagram Reels';
  else if (text.includes('shorts') || text.includes('youtube')) ctx.platform = 'YouTube Shorts';

  // 3. Detect Tujuan
  if (text.includes('pelanggan baru') || text.includes('menarik pelanggan')) {
    ctx.tujuan = 'menarik pelanggan baru';
  } else if (text.includes('jual') || text.includes('promosi') || text.includes('laris')) {
    ctx.tujuan = 'promosi jualan';
  } else if (text.includes('edukasi') || text.includes('tips')) {
    ctx.tujuan = 'edukasi & tips';
  } else if (text.includes('personal branding') || text.includes('dikenal')) {
    ctx.tujuan = 'membangun personal branding';
  } else if (text.includes('affiliate')) {
    ctx.tujuan = 'konten affiliate';
  }

  // 4. Detect Target Audiens
  if (text.includes('mahasiswa')) {
    ctx.targetAudiens = 'mahasiswa';
    ctx.audience = 'mahasiswa';
    ctx.audiens = 'mahasiswa';
  } else if (text.includes('pelajar')) {
    ctx.targetAudiens = 'pelajar';
    ctx.audience = 'pelajar';
    ctx.audiens = 'pelajar';
  } else if (text.includes('anak muda') || text.includes('gen z') || text.includes('remaja') || text.includes('pemuda')) {
    ctx.targetAudiens = 'anak muda';
    ctx.audience = 'anak muda';
    ctx.audiens = 'anak muda';
  } else if (text.includes('ibu') || text.includes('keluarga')) {
    ctx.targetAudiens = 'ibu & keluarga';
    ctx.audience = 'ibu & keluarga';
    ctx.audiens = 'ibu & keluarga';
  } else if (text.includes('pekerja') || text.includes('kantor') || text.includes('karyawan') || text.includes('profesional')) {
    ctx.targetAudiens = 'pekerja kantor & profesional';
    ctx.audience = 'pekerja kantor & profesional';
    ctx.audiens = 'pekerja kantor & profesional';
  } else if (text.includes('pemula')) {
    ctx.targetAudiens = 'pemula';
    ctx.audience = 'pemula';
    ctx.audiens = 'pemula';
  }

  // 5. Detect Gaya / Tone
  if (text.includes('santai')) {
    ctx.gaya = 'santai';
    ctx.tone = 'Santai & Bersahabat';
  } else if (text.includes('profesional')) {
    ctx.gaya = 'profesional';
    ctx.tone = 'Profesional & Berbobot';
  } else if (text.includes('ramah') || text.includes('hangat')) {
    ctx.gaya = 'ramah & hangat';
    ctx.tone = 'Ramah & Bersahabat';
  } else if (text.includes('lucu') || text.includes('humor')) {
    ctx.gaya = 'lucu';
    ctx.tone = 'Menghibur & Ringan';
  } else if (text.includes('estetik') || text.includes('aesthetic')) {
    ctx.gaya = 'estetik';
    ctx.tone = 'Estetik & Sinematik';
  }

  // 6. Detect Durasi
  if (text.includes('15 detik')) ctx.durasi = '15 detik';
  else if (text.includes('30 detik')) ctx.durasi = '30 detik';
  else if (text.includes('60 detik') || text.includes('1 menit')) ctx.durasi = '60 detik';

  // 7. Detect Jenis Konten
  if (text.includes('video') || text.includes('tiktok') || text.includes('reels') || text.includes('shorts')) {
    ctx.jenisKonten = 'video';
  } else if (text.includes('karakter')) {
    ctx.jenisKonten = 'karakter';
  } else if (!ctx.jenisKonten && (text.includes('visual') || text.includes('gambar'))) {
    ctx.jenisKonten = 'visual';
  } else if (!ctx.jenisKonten && (text.includes('naskah') || text.includes('script'))) {
    ctx.jenisKonten = 'script';
  }

  const activeProduct = ctx.produk || ctx.business || '';
  const activePlatform = ctx.platform || 'TikTok';
  const activeAudience = ctx.targetAudiens || ctx.audience || '';
  const activeGoal = ctx.tujuan || '';

  // === CASE: KARAKTER DNA INTEGRATION ===
  // 1. User says: "Hejo, gunakan karakter [Name]" or "Gunakan karakter [Name]"
  const useCharMatch = text.match(/(?:gunakan|pakai|pilih)\s+karakter\s+([a-zA-Z0-9\s]+?)(?:$|\.|\,)/i);
  if (useCharMatch || text.includes('gunakan karakter') || text.includes('karakter raka') || (text.includes('karakter') && (text.includes('rina') || text.includes('raka')))) {
    let charName = '';
    if (text.includes('raka')) charName = 'Raka';
    else if (text.includes('rina')) charName = 'Rina';
    else if (text.includes('rian')) charName = 'Rian si Barista';
    else if (text.includes('bening')) charName = 'Bening Mentari';
    else if (useCharMatch && useCharMatch[1]) charName = useCharMatch[1].trim();

    if (charName) {
      ctx.karakter = charName;
      if (charName.toLowerCase() === 'raka') {
        ctx.gaya = 'Santai';
        ctx.personality = '😎 Santai';
        ctx.gender = 'Laki-laki';
        ctx.characterLock = {
          name: 'Raka',
          gender: 'Laki-laki',
          ageRange: '20-25 tahun',
          personality: '😎 Santai',
          speakingStyle: '🗣️ Santai',
          outfit: 'Kaos oversized & kemeja santai'
        };
      } else if (charName.toLowerCase() === 'rina') {
        ctx.gaya = 'Santai & Ramah';
        ctx.personality = '😊 Ramah & Ceria';
        ctx.gender = 'Perempuan';
        ctx.characterLock = {
          name: 'Rina',
          gender: 'Perempuan',
          ageRange: '20-25 tahun',
          personality: '😊 Ramah',
          speakingStyle: '🗣️ Santai & Ramah',
          outfit: 'Kaos sage green kasual'
        };
      }

      // Check if project already has product/goal (e.g. kopi + video TikTok)
      const hasExistingContext = Boolean(ctx.produk || ctx.tujuan || ctx.platform);
      const prodLabel = ctx.produk ? ` produk ${ctx.produk}` : '';
      const platLabel = ctx.platform || 'video';

      const replyText = hasExistingContext
        ? `Siap! Karakter "${charName}" sudah aktif di Creator Context untuk ${platLabel}${prodLabel}.\n\nGaya bicara ${charName} yang santai akan langsung diterapkan ke naskah dan konsep videomu!`
        : `Siap! Karakter "${charName}" sudah aktif sebagai wajah dan pembawa kontenmu.\n\nKonten apa yang ingin kita buat bersama ${charName} hari ini?`;

      return {
        reply: replyText,
        suggestedActions: [
          '✨ Buatkan naskah 30 detik',
          '💡 Cari 3 ide konten relate',
          '📦 Hubungkan ke produk saya',
          '🎬 Buka di Studio'
        ],
        updatedContext: {
          ...ctx,
          karakter: charName,
          jenisKonten: ctx.jenisKonten || 'video',
        }
      };
    }
  }

  // 2. User says: "Hejo, saya mau bikin karakter perempuan yang ramah untuk video."
  if (
    (text.includes('bikin karakter') || text.includes('buat karakter') || text.includes('mau karakter')) &&
    (text.includes('perempuan') || text.includes('ramah') || text.includes('video') || text.includes('baru'))
  ) {
    return {
      reply: `Siap. Kita buat karakternya dulu.\n\nKamu bisa langsung merancang detail penampilan, sifat, dan gaya bicara di Character DNA dengan 5 langkah mudah!`,
      suggestedActions: [
        '🎭 Buka Karakter Saya',
        '✨ Buat Karakter Sekarang',
        '💡 Tanya rekomendasi sifat'
      ],
      updatedContext: {
        ...ctx,
        jenisKonten: 'karakter',
        gaya: text.includes('ramah') ? 'ramah' : ctx.gaya,
        gender: text.includes('perempuan') ? 'Perempuan' : ctx.gender,
      }
    };
  }

  // === CASE: PANDUAN PENGHASILAN DARI HP (IDE -> KARYA -> KONTEN -> PELUANG) ===
  if (
    (text.includes('menghasilkan uang') || text.includes('cari uang') || text.includes('dapat uang') || text.includes('dapetin uang') || text.includes('cuan')) &&
    (text.includes('hp') || text.includes('mulai') || text.includes('belum tahu') || text.includes('bingung'))
  ) {
    ctx.tujuan = 'mencari peluang dari HP';
    return {
      reply: `Memulai dari HP adalah langkah awal yang sangat bagus! Kita tidak perlu alat mahal atau skill rumit.\n\nPrinsipnya sederhana: **IDE → KARYA → KONTEN → PELUANG**.\n\nDi HEJO, ada 5 arah sederhana yang bisa kamu pilih sesuai kenyamananmu:\n1. 🚀 **Affiliate** — Merekomendasikan produk orang lain tanpa perlu punya stok barang.\n2. 🎬 **Membuat Konten** — Berbagi video cerita, hiburan, atau aktivitas yang kamu sukai.\n3. 📦 **Menjual Produk** — Membantu pemasaran produk sendiri (kuliner, fashion, parfum, dll).\n4. 🤝 **Menawarkan Jasa** — Menunjukkan keahlianmu ke calon pelanggan.\n5. 🎨 **Karya Digital** — Membuat visual, desain, atau materi kreatif.\n\nMana arah yang paling membuatmu penasaran untuk dicoba pertama kali?`,
      suggestedActions: [
        '🚀 Affiliate Produk',
        '🎬 Bikin Konten TikTok',
        '📦 Jual Produk Sendiri',
        '🤝 Tawarkan Jasa',
        '🎨 Karya Digital'
      ],
      updatedContext: {
        ...ctx,
        tujuan: 'mencari peluang dari HP',
      }
    };
  }

  // === CASE: PRODUK PARFUM & JUAL LEWAT KONTEN ===
  if (text.includes('parfum') || (activeProduct === 'parfum' && (text.includes('jual') || text.includes('konten') || text.includes('video')))) {
    ctx.produk = 'parfum';
    ctx.business = 'parfum';
    if (!ctx.platform) ctx.platform = 'TikTok';
    if (!ctx.tujuan) ctx.tujuan = 'pemasaran produk parfum';
    if (!ctx.jenisKonten) ctx.jenisKonten = 'video';

    return {
      reply: `Siap! Produk parfum punya daya tarik visual dan storytelling yang sangat kuat, karena kita bisa menggambarkan aroma lewat suasana elegan, rasa percaya diri, atau aktivitas harian.\n\nBiar konsepnya tepat sasaran, mana sudut pandang cerita yang paling cocok untuk parfummu:\n1. ✨ **Suasana Mewah & Elegan** (Visual botol estetik & nuansa premium)\n2. ⏳ **Uji Ketahanan Seharian** (Aktivitas padat tapi wangi tetap nempel)\n3. 💬 **Cerita Percaya Diri** (Review jujur & pujian dari orang sekitar)\n\nMana gaya yang ingin kita buat?`,
      suggestedActions: [
        '✨ Visual Mewah & Elegan',
        '⏳ Uji Tahan Seharian',
        '💬 Cerita Percaya Diri',
        '🎬 Buat Naskah 30 Detik'
      ],
      updatedContext: {
        ...ctx,
        produk: 'parfum',
        business: 'parfum',
        tujuan: 'pemasaran produk parfum',
        platform: 'TikTok',
        jenisKonten: 'video',
      }
    };
  }

  // === CASE: BAHASA NATURAL & ITERASI KREATIF ===
  // B1. "Buat lebih mewah"
  if (text.includes('lebih mewah') || text.includes('buat mewah') || text.includes('nuansa mewah')) {
    ctx.gaya = 'mewah & elegan';
    ctx.tone = 'Mewah & Eksklusif';
    const prodName = ctx.produk || 'produk ini';
    return {
      reply: `Siap, saya ubah menjadi gaya lebih premium!\n\nVisual diarahkan ke pencahayaan *golden hour* lembut dengan detail tekstur eksklusif, sudut kamera sinematik stabil, dan narasi yang anggun menonjolkan nilai prestise ${prodName}.`,
      suggestedActions: [
        '🎬 Buatkan Naskah Mewah',
        '🖼️ Lihat Visual Mewah',
        '🚀 Lanjut ke Flow',
        '💾 Simpan ke Project'
      ],
      updatedContext: {
        ...ctx,
        gaya: 'mewah & elegan',
        tone: 'Mewah & Eksklusif',
      },
      structuredDraft: {
        type: 'script',
        title: `Konsep Premium & Mewah: ${capitalize(prodName)}`,
        content: `[0-3s | Hook Mewah]: "Kemewahan bukan tentang tampil mencolok, tapi tentang detail yang tak terlupakan."\n[3-10s | Estetika Visual]: Close-up sinematik botol/kemasan ${prodName} dengan pantulan cahaya lembut, latar minimalis marmer/kayu alami.\n[10-20s | Keunggulan Eksklusif]: Narasi tenang: "Diciptakan untuk kamu yang menghargai kualitas terbaik di setiap momen berharga."\n[20-30s | Ajakan Anggun]: "Temukan sentuhan eksklusif ${prodName} sekarang lewat link resmi di bio."`
      }
    };
  }

  // B2. "Buat lebih lucu"
  if (text.includes('lebih lucu') || text.includes('bikin lucu') || text.includes('humor')) {
    ctx.gaya = 'lucu & relate';
    ctx.tone = 'Humor & Menghibur';
    const prodName = ctx.produk || 'produk ini';
    return {
      reply: `Siap! Saya ubah menjadi gaya komedi yang relate dengan kehidupan sehari-hari.\n\nKonten akan dibuka dengan situasi konyol yang sering dialami penonton, lalu menghadirkan ${prodName} sebagai penyelamat suasana!`,
      suggestedActions: [
        '🎬 Buat Naskah Komedi',
        '💡 Tambah Hook Lucu',
        '💾 Simpan ke Project'
      ],
      updatedContext: {
        ...ctx,
        gaya: 'lucu & relate',
        tone: 'Humor & Menghibur',
      },
      structuredDraft: {
        type: 'script',
        title: `Konsep Lucu & Relate: ${capitalize(prodName)}`,
        content: `[0-3s | Hook Komedi]: "Pernah nggak sih ngerasa hari kamu udah kacau balau, terus tiba-tiba..."\n[3-10s | Reaksi Ekspresif]: Ekspresi kaget kreator melihat situasi sekitar yang serba salah.\n[10-20s | Hadirnya Produk]: "Untung ada ${prodName}! Sekali coba, langsung berasa waras lagi hidup ini."\n[20-30s | Call to Action]: "Jangan tunggu sampai harimu makin ambyar, buruan amankan di keranjang kuning!"`
      }
    };
  }

  // B3. "Tambah satu scene"
  if (text.includes('tambah satu scene') || text.includes('tambah 1 scene') || text.includes('tambah scene')) {
    const prodName = ctx.produk || 'karya kamu';
    return {
      reply: `Siap! Saya sudah menambahkan satu scene tambahan (Scene Interaktif & Ulasan Nyata) agar alur cerita ${prodName} semakin meyakinkan penonton.`,
      suggestedActions: [
        '🎬 Buka di Studio',
        '🚀 Lanjut ke Flow',
        '💾 Simpan ke Project'
      ],
      updatedContext: ctx,
      structuredDraft: {
        type: 'script',
        title: `Naskah Tambahan Scene: ${capitalize(prodName)}`,
        content: `[Scene Tambahan | Ulasan Nyata]:\nVisual: Kreator tersenyum di depan kamera memegang ${prodName}, menunjukkan hasil nyata penggunaan dengan ekspresi spontan dan meyakinkan.\nNarasi: "Jujur ini di luar ekspektasi banget, pantas aja ulasannya bintang lima semua!"\nDurasi: 10 detik`
      }
    };
  }

  // B4. "Buat 5 versi"
  if (text.includes('buat 5 versi') || text.includes('5 versi') || text.includes('bikin 5 versi')) {
    return generateMultiAngleAffiliatePackage(`buat 5 konten affiliate ${ctx.produk || 'produk ini'}`, ctx);
  }

  // B5. "Yang ini kurang menarik"
  if (text.includes('kurang menarik') || text.includes('ganti hook') || text.includes('kurang greget')) {
    const prodName = ctx.produk || 'produk ini';
    return {
      reply: `Siap! Kita ganti pembukanya dengan 3 opsi hook baru yang jauh lebih kuat dan bikin penonton berhenti scroll:\n\n1. 🔥 **Hook Penasaran**: "Kenapa nggak ada yang ngasih tahu aku rahasia ${prodName} ini dari dulu?!"\n2. ⚡ **Hook Fakta Mengejutkan**: "9 dari 10 orang baru tahu kalau trik kecil ini bikin hasilnya 3x lebih memuaskan."\n3. 🎯 **Hook Relate Keras**: "Stop buang-buang uang kalau kamu masih ngalamin masalah ini..."\n\nMana hook yang paling kamu suka untuk kita jadikan naskah?`,
      suggestedActions: [
        '🔥 Pilih Hook 1 (Penasaran)',
        '⚡ Pilih Hook 2 (Fakta Unik)',
        '🎯 Pilih Hook 3 (Relate Keras)',
        '🎬 Buatkan naskah langsung'
      ],
      updatedContext: ctx,
    };
  }

  // B6. "Buat video 30 detik"
  if (text.includes('buat video 30 detik') || text.includes('video 30 detik')) {
    return generateAffiliateFlowPackage(`buat video affiliate ${ctx.produk || 'produk ini'} 30 detik`, ctx);
  }

  // B7. "Buat suara wanita yang lembut" / "Buat suara" (Voice Over / Vana Guidance)
  if (text.includes('suara') || text.includes('voice over') || text.includes('voiceover') || text.includes('audio')) {
    const isSoftFemale = text.includes('wanita') || text.includes('lembut') || text.includes('perempuan');
    const voiceStyle = isSoftFemale ? 'Wanita Lembut, Hangat & Menenangkan' : 'Pria Santai, Jelas & Bersahabat';
    const prodName = ctx.produk || 'produk ini';

    return {
      reply: `Siap! Saya siapkan naskah dengan panduan sulih suara (**${voiceStyle}**).\n\nTempo vokal dibuat santai dan ramah, sehingga pesan tentang ${prodName} terasa seperti rekomendasi tulus dari seorang sahabat:`,
      suggestedActions: [
        '🎤 Salin Teks Voice Over',
        '🚀 Lanjut ke Flow',
        '💾 Simpan ke Project',
        '🎬 Buka di Studio'
      ],
      updatedContext: {
        ...ctx,
        voiceStyle,
      },
      structuredDraft: {
        type: 'script',
        title: `Panduan Voice Over (${voiceStyle}): ${capitalize(prodName)}`,
        content: `🎙️ PANDUAN VOICE OVER\nKarakter Suara: ${voiceStyle}\nTempo: 120 kata/menit (tenang & nyaman didengar)\n\n[00:00 - 00:03]: "Kadang, hal terbaik itu datang dari kesederhanaan..."\n[00:03 - 00:12]: "Sama seperti ${prodName}, yang hadir menemani hari-harimu agar terasa lebih ringan dan bermakna."\n[00:12 - 00:20]: "Kualitasnya yang tulus bisa kamu rasakan sejak sentuhan pertama."\n[00:20 - 00:30]: "Yuk, rawat momen bahagiamu hari ini. Temukan selengkapnya di tautan bio ya."`
      }
    };
  }

  // B8. "Jadikan lebih cocok untuk TikTok"
  if (text.includes('cocok untuk tiktok') || text.includes('sesuaikan tiktok')) {
    ctx.platform = 'TikTok';
    const prodName = ctx.produk || 'produk ini';
    return {
      reply: `Siap! Saya sesuaikan ritmenya agar ramah algoritma TikTok:\n- Hook cepat di 0–3 detik pertama tanpa intro bertele-tele.\n- Visual dinamis dengan teks on-screen yang mencolok.\n- Ajakan interaksi dan klik keranjang kuning yang jelas.`,
      suggestedActions: [
        '🎬 Buatkan Naskah TikTok',
        '🚀 Siapkan untuk Flow',
        '💾 Simpan ke Project'
      ],
      updatedContext: {
        ...ctx,
        platform: 'TikTok',
      }
    };
  }

  // === CASE A: BISNIS LAUNDRY (Spesifik & Dinamis) ===
  if (activeProduct === 'laundry' || text.includes('laundry')) {
    ctx.produk = 'laundry';
    ctx.business = 'laundry';
    if (!ctx.platform) ctx.platform = 'TikTok';
    if (!ctx.jenisKonten) ctx.jenisKonten = 'video';
    if (!ctx.targetAudiens && text.includes('mahasiswa')) {
      ctx.targetAudiens = 'mahasiswa';
      ctx.audience = 'mahasiswa';
      ctx.audiens = 'mahasiswa';
    }

    // A1. User selects laundry USP (Harga hemat, Hasil cucian bersih, Cepat selesai, Lokasi dekat / Antar jemput)
    const uspKeywords = [
      'harga hemat', 'paket hemat', 'hemat', 'cucian bersih', 'bersih', 'wangi',
      'cepat selesai', 'cuci kilat', 'kilat', 'antar-jemput', 'antar jemput', 'jemput',
      'dekat', 'promo'
    ];
    const isUspSelected = uspKeywords.some((k) => text.includes(k));

    if (isUspSelected || (ctx.step === 'ask_usp' && !text.includes('laundry') && !text.includes('tiktok'))) {
      const uspClean = text.replace(/^[^\w\s]+/, '').trim() || 'Paket hemat & cepat';
      ctx.pesanUtama = uspClean;
      ctx.step = 'concept_ready';
      const targetLabel = ctx.targetAudiens || 'mahasiswa';
      const platLabel = ctx.platform || 'TikTok';

      const scriptTimedContent = `[0–3 detik] Hook
"Cucian numpuk di kosan pas lagi minggu ujian? Jangan pusing sendiri!"

[3–10 detik] Masalah
"Waktu buat nugas dan istirahat aja mepet, apalagi mikirin cuci dan setrika baju."

[10–20 detik] Solusi
"Untung ada laundry kami yang siap jemput dan cuci pakaianmu sampai bersih, rapi, dan wangi semerbak."

[20–27 detik] Keunggulan
"Paket kiloan hemat ramah kantong ${targetLabel}, layanan kilat 1 hari selesai, dan gratis antar-jemput kosan."

[27–30 detik] Call to Action
"Drop cucian kamu hari ini atau hubungi link di bio biar langsung kami jemput!"`;

      return {
        reply: `Pilihan mantap! Menonjolkan "${uspClean}" sangat efektif untuk menarik perhatian ${targetLabel} di ${platLabel}.\n\nBerikut naskah 30 detik berstruktur waktu yang siap kamu gunakan atau ubah jadi Storyboard:`,
        suggestedActions: [
          '📋 Salin',
          '💾 Simpan',
          '✏️ Edit Script',
          '🎬 Buat Storyboard'
        ],
        updatedContext: {
          ...ctx,
          pesanUtama: uspClean,
          step: 'concept_ready',
          pipelineStage: 'script',
        },
        structuredDraft: {
          type: 'script',
          title: `Naskah ${platLabel} Laundry (${capitalize(targetLabel)}) - ${capitalize(uspClean)}`,
          content: scriptTimedContent,
        }
      };
    }

    // A2. User asks for another angle variation
    if (text.includes('variasi angle') || text.includes('angle lain') || text.includes('coba variasi')) {
      const targetLabel = ctx.targetAudiens || 'mahasiswa';
      const platLabel = ctx.platform || 'TikTok';
      return {
        reply: `Ini variasi sudut cerita komedi anak kos yang sangat relate dan cepat FYP di ${platLabel}:\n\nMau kita gunakan konsep ini atau langsung simpan ke project?`,
        suggestedActions: [
          '🎬 Buka di Studio',
          '💾 Simpan ke Project',
          '✨ Buatkan hook alternatif'
        ],
        updatedContext: ctx,
        structuredDraft: {
          type: 'script',
          title: `Konsep Komedi ${platLabel} Laundry (${capitalize(targetLabel)})`,
          content: `[0-3s | Hook Komedi]: "Ketika baju bersih di lemari habis, dan yang tersisa cuma kaos ospek..."\n[3-10s | Relate Situasi]: "Daripada bingung pakai baju yang mana, langsung drop cucianmu ke laundry kami!"\n[10-20s | Keunggulan Laundry]: "[Sebutkan harga kiloan hemat dan layanan express laundry kamu di sini]."\n[20-30s | Call to Action]: "Pesan antar-jemput sekarang via link di bio, praktis tanpa ribet!"`
        }
      };
    }

    // A3. Complete brief: laundry + mahasiswa (or any target) + tiktok + pelanggan baru
    // HEJO understands all 4, and asks ONLY ONE essential question to proceed!
    if (
      (text.includes('pelanggan baru') || text.includes('menarik pelanggan') || text.includes('mendapatkan pelanggan')) &&
      (text.includes('tiktok') || text.includes('konten') || text.includes('video'))
    ) {
      ctx.tujuan = 'mendapatkan pelanggan baru';
      ctx.step = 'ask_usp';
      const targetLabel = ctx.targetAudiens || 'mahasiswa';

      return {
        reply: `Siap! Kita bisa buat konten TikTok untuk bisnis laundry dengan target ${targetLabel}, yang fokus menarik pelanggan baru.\n\nSupaya konsepnya tepat sasaran untuk ${targetLabel}, keunggulan utama apa yang paling ingin kamu tonjolkan?`,
        suggestedActions: [
          '🧺 Harga hemat kantong mahasiswa',
          '⚡ Cuci kilat selesai 1 hari',
          '🛵 Layanan antar-jemput kosan',
          '✨ Hasil cucian bersih & wangi'
        ],
        updatedContext: {
          ...ctx,
          produk: 'laundry',
          business: 'laundry',
          targetAudiens: targetLabel,
          audience: targetLabel,
          audiens: targetLabel,
          tujuan: 'mendapatkan pelanggan baru',
          platform: 'TikTok',
          jenisKonten: 'video',
          step: 'ask_usp'
        }
      };
    }

    // A4. User provides business only (step 1 in multi-turn)
    if (!ctx.targetAudiens) {
      return {
        reply: `Siap! Bisnis laundry punya banyak potensi konten yang menghasilkan pelanggan baru.\n\nSiapa target audiens utama yang ingin kamu jangkau?`,
        suggestedActions: [
          '🎓 Mahasiswa & Pelajar',
          '🏢 Pekerja Kantor & Kos',
          '👨‍👩‍👧 Keluarga & Ibu Rumah Tangga',
          '✨ Semua kalangan'
        ],
        updatedContext: ctx,
      };
    }
  }

  // === CASE B: KOPI (Santai, TikTok, Anak Muda) ===
  if (activeProduct === 'kopi' || text.includes('kopi')) {
    ctx.produk = 'kopi';
    if (!ctx.platform) ctx.platform = 'TikTok';
    if (!ctx.gaya) ctx.gaya = 'santai';
    const audiensLabel = activeAudience || 'anak muda';

    if (text.includes('punya foto') || text.includes('📷')) {
      ctx.hasPhoto = true;
      ctx.step = 'drafting';
      const charTitle = ctx.karakter ? ` (Karakter: ${ctx.karakter})` : ` (Target: ${capitalize(audiensLabel)})`;
      const hookText = ctx.karakter 
        ? `[0-3s | Hook - Dibawakan ${ctx.karakter}]: Tampilkan ${ctx.karakter} tersenyum ramah dan menyapa penonton dengan santai: "Buat yang lagi butuh recharge di sela aktivitas..."`
        : `[0-3s | Hook Visual]: Tampilkan foto estetik produk kopi kamu dengan teks: "Buat yang lagi butuh recharge di sela aktivitas..."`;

      return {
        reply: `Keren! Dengan ${ctx.karakter ? `karakter ${ctx.karakter} dan ` : ''}foto produk asli, videonya akan terasa sangat relate buat ${audiensLabel}.\nMau saya buatkan naskah 30 detik untuk ${activePlatform} sekarang?`,
        suggestedActions: ['✨ Buatkan naskah 30 detik', '📦 Tambah info keunggulan produk', '🎬 Buka langsung di Studio'],
        updatedContext: ctx,
        structuredDraft: {
          type: 'script',
          title: `Naskah ${activePlatform} Kopi Santai${charTitle}`,
          content: `${hookText}
[3-10s | Masalah & Relate (${capitalize(audiensLabel)})]: "Kadang bukan cuma butuh kafein, tapi momen santai biar pikiran adem lagi."
[10-20s | Keunggulan Produk]: "[Ceritakan racikan khas kopi kamu di sini — jika menggunakan biji pilihan atau rasa legit tertentu, cantumkan di bagian ini]."
[20-30s | Call to Action]: "Cobain sekarang buat nemenin hari kamu! Info lengkap dan pemesanan ada di link bio."`
        }
      };
    }

    if (text.includes('informasi produk') || text.includes('info produk') || text.includes('📦')) {
      ctx.hasProductInfo = true;
      return {
        reply: `Mantap! Apa 1 keunggulan utama produk kopi kamu yang paling ingin ditonjolkan ke ${audiensLabel} (misal: rasa legit, kemasan praktis, atau aroma khas)?`,
        suggestedActions: ['Rasa legit & creamy', 'Kemasan praktis siap minum', 'Racikan resep khas sendiri', '✨ Buatkan naskah langsung'],
        updatedContext: ctx,
      };
    }

    if (text.includes('mulai dari awal') || text.includes('🌱')) {
      ctx.step = 'concept';
      return {
        reply: `Siap, kita mulai pelan-pelan. Untuk video kopi santai di ${activePlatform} yang pas buat ${audiensLabel}, mana konsep yang paling kamu suka?\n1. Suara es & visual estetik (Sensori)\n2. Cerita barista di balik layar (Storytelling)\n3. Tips ngopi hemat & nikmat (Relate ${audiensLabel})`,
        suggestedActions: ['Sensori es estetik', 'Kisah di balik layar', 'Tips ngopi santai', '✨ Buatkan naskah langsung'],
        updatedContext: ctx,
      };
    }

    return {
      reply: `Siap. Kita buat video ${activePlatform} untuk produk kopi kamu dengan gaya santai dan target ${audiensLabel}.\nKamu sudah punya foto produknya?`,
      suggestedActions: ['📷 Saya punya foto', '📦 Saya punya informasi produk', '🌱 Bantu saya mulai dari awal'],
      updatedContext: ctx,
    };
  }

  // === CASE C: STEP-BY-STEP CONVERSATION FLOW (F. Context Merging) ===

  // C1. User only gives product/business: "Saya punya bisnis [X]"
  if (detectedBusiness && !activeAudience && !text.includes('tiktok') && !text.includes('reels')) {
    return {
      reply: `Siap! Bisnis ${detectedBusiness} punya banyak potensi konten yang seru dan menghasilkan pelanggan.\n\nSiapa target audiens utama yang ingin kamu jangkau?`,
      suggestedActions: [
        '🎓 Mahasiswa & Pelajar',
        '🏢 Pekerja Kantor & Kos',
        '👨‍👩‍👧 Keluarga & Ibu Rumah Tangga',
        '✨ Semua kalangan'
      ],
      updatedContext: ctx,
    };
  }

  // C2. User specifies audience: "Target saya mahasiswa"
  if (text.includes('target') || (activeAudience && !text.includes('tiktok') && !text.includes('reels') && !ctx.hasPhoto)) {
    const aud = activeAudience || 'audiensmu';
    const prod = activeProduct ? `bisnis ${activeProduct}` : 'konten ini';
    return {
      reply: `Pilihan tepat! Target ${aud} sangat pas untuk ${prod}. Mereka biasanya menyukai pesan yang praktis, relate, dan to-the-point.\n\nPlatform mana yang ingin kita gunakan?`,
      suggestedActions: [
        '📱 TikTok',
        '📸 Instagram Reels',
        '▶️ YouTube Shorts',
        '🎬 Langsung buat konsep naskah'
      ],
      updatedContext: ctx,
    };
  }

  // C3. User specifies platform: "Saya mau TikTok"
  if (text.includes('tiktok') || text.includes('reels') || text.includes('shorts')) {
    const aud = activeAudience ? ` dengan target ${activeAudience}` : '';
    const prod = activeProduct ? ` untuk ${activeProduct}` : '';
    return {
      reply: `Keren! Kita buat konten ${activePlatform}${prod}${aud}.\n\nKamu sudah punya foto/video atau mau saya langsung buatkan naskah 30 detik?`,
      suggestedActions: [
        '✨ Buatkan naskah 30 detik',
        '📷 Saya punya foto/video',
        '💡 Bantu cari konsep kontennya'
      ],
      updatedContext: ctx,
    };
  }

  // C4. Script Generation request
  if (text.includes('buatkan naskah') || text.includes('bikin naskah') || text.includes('naskah 30 detik') || text.includes('script')) {
    const item = activeProduct || 'karya kamu';
    const plat = activePlatform || 'video pendek';
    const aud = activeAudience || 'audiensmu';

    return {
      reply: `Ini dia naskah ${plat} untuk ${item} yang cocok buat ${aud}. Kamu bisa langsung mengeditnya atau simpan ke project!`,
      suggestedActions: ['🎬 Buka di Studio', '💾 Simpan ke Project', '🔄 Buat variasi angle'],
      updatedContext: { ...ctx, step: 'review' },
      structuredDraft: {
        type: 'script',
        title: `Naskah ${plat} ${capitalize(item)} - Target: ${capitalize(aud)}`,
        content: `[0-3s | Hook]: "Buat kamu yang lagi butuh solusi untuk ${item}, jangan di-skip dulu!"
[3-12s | Masalah & Relate (${capitalize(aud)})]: "Banyak orang bingung cari yang pas, padahal yang terpenting adalah kemudahan dan hasil yang memuaskan."
[12-22s | Keunggulan Layanan/Produk]: "[Ceritakan keunggulan utama ${item} kamu di sini — sebutkan manfaat nyata yang paling disukai pelanggan]."
[22-30s | Call to Action]: "Cek link di bio atau kunjungi langsung sekarang juga!"`,
      }
    };
  }

  // C5. Discovery ("belum tahu mau bikin apa")
  if (text.includes('belum tahu') || text.includes('tidak tahu') || text.includes('bingung')) {
    ctx.step = 'discovery';
    return {
      reply: 'Tidak apa-apa. Kita cari ide bersama.\nKamu lebih tertarik membuat konten untuk apa?',
      suggestedActions: ['💰 Jualan / Bisnis', '📱 Sosial media', '🎓 Edukasi', '🎭 Hiburan & Cerita', '🌱 Personal branding'],
      updatedContext: ctx,
    };
  }

  // C6. Continuation with active context
  if (activeProduct || activeGoal) {
    const item = activeProduct || activeGoal;
    const aud = activeAudience ? ` untuk ${activeAudience}` : '';
    return {
      reply: `Siap! Kita lanjutkan pembuatan konten ${item}${aud}.\nApa langkah berikutnya yang ingin kita siapkan?`,
      suggestedActions: ['✨ Buatkan naskah 30 detik', '💡 Cari variasi angle ide', '🎬 Buka langsung di Studio'],
      updatedContext: ctx,
    };
  }

  // D. NON-EMPTY MESSAGE FALLBACK (JANGAN PERNAH MENGULANG GREETING)
  return {
    reply: `Siap! Mari kita wujudkan konten kreatif ini bersama. Kamu ingin fokus pada pembuatan naskah, ide konsep, atau materi produknya dulu?`,
    suggestedActions: ['💡 Cari ide menarik', '🎬 Buat alur video', '✍️ Tulis naskah narasi', '📦 Masukkan data produk'],
    updatedContext: ctx,
  };
}

const MAX_RETRIES = 3; // Total 4 attempts (initial + 3 retries)
const BASE_DELAY_MS = 1000;

// Circuit breaker for daily quota exhaustion
let quotaCooldownUntil = 0;

export function isQuotaCooldownActive(): boolean {
  return Date.now() < quotaCooldownUntil;
}

export function activateQuotaCooldown(durationMs = 60 * 60 * 1000): void {
  quotaCooldownUntil = Date.now() + durationMs;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Determines if an error from Gemini API is transient and safe to retry
export function isTransientError(err: any): boolean {
  if (!err) return false;

  const status = err.status || err.statusCode || err.code;
  const message = String(err.message || err.toString() || '').toLowerCase();
  const raw = JSON.stringify(err).toLowerCase();

  // 1. Daily Quota Exhaustion - DO NOT retry (retryDelay is hours/days)
  if (
    message.includes('quota') ||
    message.includes('exceeded your current quota') ||
    message.includes('free_tier_requests') ||
    message.includes('perday') ||
    message.includes('rate-limits') ||
    raw.includes('quotafailure') ||
    raw.includes('generaterequestsperday')
  ) {
    activateQuotaCooldown();
    return false;
  }

  // 2. Permanent errors - DO NOT retry
  if (
    status === 400 ||
    status === 401 ||
    status === 403 ||
    status === 404 ||
    message.includes('api_key_invalid') ||
    message.includes('permission_denied') ||
    message.includes('not_found') ||
    message.includes('invalid_argument') ||
    message.includes('bad request') ||
    raw.includes('api_key_invalid') ||
    raw.includes('permission_denied')
  ) {
    return false;
  }

  // 3. Transient / temporary high demand - safe to retry with backoff
  if (
    status === 503 ||
    status === 500 ||
    status === 502 ||
    status === 504 ||
    message.includes('503') ||
    message.includes('unavailable') ||
    message.includes('high demand') ||
    message.includes('overloaded') ||
    message.includes('timeout') ||
    message.includes('temporarily') ||
    message.includes('econnreset') ||
    message.includes('etimedout')
  ) {
    return true;
  }

  return false;
}

export async function processHejoConversation(params: {
  message: string;
  history: any[];
  userMode: string;
  currentContext: CreatorContext;
  ai: GoogleGenAI;
  apiKey: string;
}): Promise<CreatorEngineResponse> {
  const { message, history, userMode, currentContext, ai, apiKey } = params;

  // Immediate local engine if no API key, quota cooldown active, or recognized co-creator intent
  const lowerMsg = message.toLowerCase();
  if (
    !apiKey || 
    isQuotaCooldownActive() || 
    lowerMsg.includes('motion_context') || 
    lowerMsg.includes('affiliate') || 
    lowerMsg.includes('siap untuk flow') ||
    lowerMsg.includes('flow ready') ||
    lowerMsg.includes('banyak konten') ||
    lowerMsg.includes('1 produk') ||
    lowerMsg.startsWith('buat prompt') ||
    lowerMsg.startsWith('prompt') ||
    lowerMsg.startsWith('buat gambar') ||
    lowerMsg.startsWith('gambar') ||
    lowerMsg.includes('menghasilkan uang') ||
    lowerMsg.includes('cari uang') ||
    lowerMsg.includes('dapat uang') ||
    lowerMsg.includes('parfum') ||
    lowerMsg.includes('lebih mewah') ||
    lowerMsg.includes('lebih lucu') ||
    lowerMsg.includes('tambah satu scene') ||
    lowerMsg.includes('tambah scene') ||
    lowerMsg.includes('5 versi') ||
    lowerMsg.includes('kurang menarik') ||
    lowerMsg.includes('video 30 detik') ||
    lowerMsg.includes('suara') ||
    lowerMsg.includes('voice over') ||
    lowerMsg.includes('cocok untuk tiktok')
  ) {
    return processLocalCreatorEngine(message, currentContext, userMode);
  }

  try {
    const systemInstruction = `Kamu adalah "HEJO", Teman Kreator cerdas di HEJO AI (Taman Kreator).
PRINSIP UTAMA: "SIMPLE DI DEPAN, PINTAR DI BELAKANG."
Pengguna tidak perlu paham AI, prompt engineering, storyboard, shot list, motion control, atau teknologi rumit di belakangnya. HEJO adalah teman kerja yang hangat, solutif, dan mengerti bahasa sehari-hari.

KONSEP BESAR: "IDE → KARYA → KONTEN → PELUANG"
- HEJO tidak boleh menjanjikan penghasilan pasti.
- HEJO membantu menyediakan ide, pembuatan karya, naskah, visual, dan workflow yang dapat digunakan pengguna untuk membuka peluang (affiliate, jualan produk, jasa, konten, dll).

PANDUAN INTERAKSI KUNCI:
1. JANGAN langsung memberikan jawaban panjang atau esai. Maksimal 2-3 kalimat hangat dan ramah!
2. JANGAN menanyakan terlalu banyak pertanyaan sekaligus. TANYAKAN HANYA 1 PERTANYAAN KUNCI untuk langkah berikutnya.
3. Selalu pahami maksud pengguna, bahasa santai, dan typo sederhana.
4. SELALU MEMPERTAHANKAN & MENGGABUNGKAN "Creator Context" ANTAR LANGKAH:
   - tujuan (misal: jualan, affiliate, personal branding, edukasi)
   - jenisKonten (video, visual, script, ide, karakter, produk)
   - platform (TikTok, Reels, Shorts, dll)
   - produk (nama/kategori produk: kopi, parfum, baju, dll)
   - targetAudiens (anak muda, mahasiswa, ibu, pekerja)
   - gaya / tone (santai, mewah, lucu, relate, dll)
   - durasi (misal: 20 detik, 30 detik)
   JANGAN PERNAH mereset konteks produk atau target yang sudah disepakati sebelumnya!
5. KETIKA PENGGUNA BINGUNG ("mau cari uang dari HP tapi belum tahu mulai dari mana"):
   Bimbing dengan hangat dan tawarkan arah sederhana: Affiliate, Membuat konten, Menjual produk, Menawarkan jasa, atau Karya digital.
6. KETIKA PENGGUNA MENYEBUT PRODUK ("saya punya produk parfum mau jual lewat konten"):
   Pahami bahwa tujuannya adalah membuat konten yang membantu pemasaran produk parfum. Tawarkan sudut pandang relevan (aroma mewah, uji tahan seharian, atau cerita percaya diri).
7. RESPON PERMINTAAN BAHASA NATURAL DENGAN CEPAT:
   - "Buat lebih mewah" -> Ubah suasana jadi premium, pencahayaan golden hour/elegan, narasi prestise.
   - "Buat lebih lucu" -> Ubah jadi komedi relate sehari-hari.
   - "Tambah satu scene" -> Tambah 1 scene baru yang relevan ke structuredDraft.
   - "Buat 5 versi" -> Sediakan 5 variasi hook/angle berbeda.
   - "Yang ini kurang menarik" -> Tawarkan 3 opsi hook baru yang memikat.
   - "Buat video 30 detik" -> Format 30 detik terstruktur.
   - "Buat suara wanita yang lembut" -> Siapkan naskah dengan panduan vokal suara wanita lembut/ramah.
   - "Jadikan lebih cocok untuk TikTok" -> Sesuaikan ke ritme cepat TikTok dengan hook 0-3 detik.
8. DILARANG MENGARANG FAKTA PRODUK (ANTI-FABRIKASI):
   Gunakan kalimat kondisional jika info produk belum lengkap.
9. Selalu berikan 3-4 "suggestedActions" (dengan awalan emoji yang relevan) sebagai opsi langkah berikutnya.
10. Jika pengguna meminta karya konkret, sertakan "structuredDraft": { "type": "script"|"idea"|"storyboard"|"character"|"product"|"flow_ready", "title": string, "content": string }.

KEMBALIKAN HANYA JSON:
{
  "reply": string,
  "suggestedActions": string[],
  "updatedContext": object (CreatorContext gabungan yang sudah diperbarui),
  "structuredDraft": null atau object
}`;

    const promptPayload = [
      ...history.slice(-6).map((h) => ({
        role: h.sender === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }],
      })),
      {
        role: 'user',
        parts: [
          {
            text: `Konteks saat ini: ${JSON.stringify(currentContext || {})}.
Mode pengguna: ${userMode}.
Pesan pengguna terbaru: "${message}".
Pahami maksudnya, perbarui Creator Context, dan jawab seperti teman kerja kreator yang hangat dan terarah.`,
          },
        ],
      },
    ];

    // Direct fast call with timeout protection
    const callPromise = (async () => {
      const promptText = promptPayload
        .flatMap((item: any) =>
          (item.parts || []).map((part: any) => part.text || '')
        )
        .join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptText,
        config: {
          systemInstruction,
          temperature: 0.7,
          responseMimeType: 'application/json',
        },
      });

      return response.text || '';
    })();

    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('AI response timeout')), 3500)
    );

    try {
      const rawText = await Promise.race([callPromise, timeoutPromise]);
      const parsed = JSON.parse(rawText || '{}');
      const cleanContext: CreatorContext = { ...currentContext };
      if (parsed.updatedContext && typeof parsed.updatedContext === 'object') {
        for (const [k, v] of Object.entries(parsed.updatedContext)) {
          if (v !== undefined && v !== null && v !== '') {
            cleanContext[k] = v;
          }
        }
      }

      return {
        reply: parsed.reply || 'Siap! Mari kita wujudkan konten ini bersama.',
        suggestedActions:
          parsed.suggestedActions && parsed.suggestedActions.length > 0
            ? parsed.suggestedActions
            : ['Lanjut', 'Buatkan naskah', 'Simpan ke Project'],
        updatedContext: cleanContext,
        structuredDraft: parsed.structuredDraft || null,
      };
    } catch (err: any) {
      const errMsg = String(err?.message || '').toLowerCase();
      if (errMsg.includes('quota') || errMsg.includes('503') || errMsg.includes('demand') || errMsg.includes('timeout')) {
        // Cooldown for 30s to avoid repeated failing network trips
        activateQuotaCooldown(30 * 1000);
      }
      return processLocalCreatorEngine(message, currentContext, userMode);
    }
  } catch {
    return processLocalCreatorEngine(message, currentContext, userMode);
  }
}
