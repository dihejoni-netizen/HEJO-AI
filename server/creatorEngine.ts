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
    type: 'idea' | 'script' | 'storyboard' | 'shotlist' | 'character' | 'product';
    title: string;
    content: string;
    meta?: Record<string, any>;
  } | null;
}

function capitalize(str: string): string {
  if (!str) return '';
  return str
    .split(' ')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
    .join(' ');
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

  // Immediate local engine if no API key or if quota cooldown is active
  if (!apiKey || isQuotaCooldownActive()) {
    return processLocalCreatorEngine(message, currentContext, userMode);
  }

  try {
    const systemInstruction = `Kamu adalah "OTAK HEJO", AI Creator Assistant cerdas di HEJO AI (Taman Kreator).
HEJO bukan chatbot biasa, melainkan teman kerja kreatif yang mengerti bahasa sehari-hari kreator tanpa perlu prompt engineering rumit.

PRINSIP PERCAKAPAN MUTLAK:
1. JANGAN langsung memberikan jawaban panjang atau esai. Maksimal 2-3 kalimat hangat dan ramah!
2. JANGAN menanyakan terlalu banyak pertanyaan sekaligus. TANYAKAN HANYA 1 PERTANYAAN KUNCI untuk langkah berikutnya.
3. Selalu pahami maksud pengguna, bahasa santai, dan typo sederhana.
4. SELALU MEMPERTAHANKAN & MENGGABUNGKAN "Creator Context" ANTAR LANGKAH:
   - tujuan (tujuan konten, misal: video promosi)
   - jenisKonten (video, visual, script, ide, karakter, produk)
   - platform (TikTok, Reels, Shorts, dll)
   - produk (nama/jenis produk jika ada)
   - karakter (persona/sosok jika ada)
   - targetAudiens (target penonton, misal: anak muda, mahasiswa, ibu, pekerja)
   - gaya / tone (santai, profesional, natural, unik, dll)
   - durasi (misal: 30 detik)
   - pesanUtama (pesan inti jika ada)
   - step (discovery, concept, drafting, ready)
   JANGAN PERNAH menghapus targetAudiens, produk, platform, atau gaya yang sudah tersimpan di context sebelumnya!
5. DILARANG MENGARANG FAKTA PRODUK (ANTI-FABRIKASI):
   - Jangan pernah mengarang bahan, resep, harga, promo, atau klaim medis yang belum diberikan pengguna.
   - Gunakan kalimat kondisional (misal: "Jika produkmu memang menggunakan...", "Ceritakan racikan khas produkmu di sini") atau placeholder panduan.
6. Jangan gunakan istilah teknis seperti "API", "JSON", "execute", "parameter", "temperature" dsb kepada pengguna SIMPLE.
7. Selalu berikan 3-4 "suggestedActions" (dengan awalan emoji yang relevan) yang menjadi opsi jawaban langsung dari pertanyaanmu.
8. Jika pengguna meminta membuat karya (seperti "buatkan naskahnya", "bikin script", atau memilih aksi buat), berikan "structuredDraft": { "type": "script"|"idea"|"storyboard"|"character"|"product", "title": string, "content": string }.

CONTOH STANDAR PERCAKAPAN:
- User: "Hejo, saya mau bikin karakter perempuan yang ramah untuk video."
  reply: "Siap. Kita buat karakternya dulu.\n\nKamu bisa langsung merancang detail penampilan, sifat, dan gaya bicara di Character DNA dengan 5 langkah mudah!"
  suggestedActions: ["🎭 Buka Karakter Saya", "✨ Buat Karakter Sekarang", "💡 Tanya rekomendasi sifat"]
  updatedContext: {"jenisKonten": "karakter", "gaya": "ramah", "gender": "Perempuan"}

- User: "Hejo, gunakan karakter Rina."
  reply: "Siap! Karakter \"Rina\" sudah aktif sebagai wajah dan pembawa kontenmu.\n\nKonten apa yang ingin kita buat bersama Rina hari ini?"
  suggestedActions: ["🎬 Buatkan naskah 30 detik", "💡 Cari 3 ide konten relate", "📦 Hubungkan ke produk saya"]
  updatedContext: {"karakter": "Rina", "gaya": "Santai & Ramah", "jenisKonten": "video"}

- User: "Saya punya bisnis laundry. Target saya mahasiswa. Saya ingin membuat konten TikTok untuk menarik pelanggan baru."
  reply: "Siap! Kita bisa buat konten TikTok untuk bisnis laundry dengan target mahasiswa, yang fokus menarik pelanggan baru.\n\nSupaya konsepnya tepat sasaran untuk mahasiswa, keunggulan utama apa yang paling ingin kamu tonjolkan?"
  suggestedActions: ["🧺 Harga hemat kantong mahasiswa", "⚡ Cuci kilat selesai 1 hari", "🛵 Layanan antar-jemput kosan", "✨ Hasil cucian bersih & wangi"]
  updatedContext: {"tujuan": "mendapatkan pelanggan baru", "jenisKonten": "video", "produk": "laundry", "business": "laundry", "platform": "TikTok", "targetAudiens": "mahasiswa", "audience": "mahasiswa"}

- User: "Hejo, saya mau bikin video TikTok untuk kopi saya, gaya santai dan targetnya anak muda."
  reply: "Siap. Kita buat video TikTok untuk produk kopi kamu dengan gaya santai dan target anak muda.\nKamu sudah punya foto produknya?"
  suggestedActions: ["📷 Saya punya foto", "📦 Saya punya informasi produk", "🌱 Bantu saya mulai dari awal"]
  updatedContext: {"tujuan": "video promosi", "jenisKonten": "video", "produk": "kopi", "platform": "TikTok", "gaya": "santai", "targetAudiens": "anak muda"}

- User: "Saya punya foto" (ketika context kopi + TikTok + santai + anak muda sudah ada)
  reply: "Keren! Dengan foto produk asli, videonya akan terasa sangat relate buat anak muda.\nMau saya buatkan naskah 30 detik untuk TikTok sekarang?"
  suggestedActions: ["✨ Buatkan naskah 30 detik", "📦 Tambah info keunggulan produk", "🎬 Buka langsung di Studio"]
  updatedContext: {"tujuan": "video promosi", "jenisKonten": "video", "produk": "kopi", "platform": "TikTok", "gaya": "santai", "targetAudiens": "anak muda", "hasPhoto": true, "step": "drafting"}
  structuredDraft: { "type": "script", "title": "Naskah TikTok Kopi Santai (Target: Anak Muda)", "content": "[0-3s | Hook]: Tampilkan foto produk estetik kopi kamu dengan teks: \"Buat yang lagi butuh recharge di sela aktivitas...\"\n[3-10s | Relate ke Anak Muda]: \"Kadang yang dibutuhin bukan cuma kafein, tapi momen santai biar pikiran adem.\"\n[10-20s | Keunggulan Produk]: \"[Ceritakan racikan khas kopi kamu di sini — jika menggunakan biji lokal atau resep khusus, cantumkan di bagian ini].\"\n[20-30s | Call to Action]: \"Cobain sekarang buat nemenin hari kamu! Info lengkap dan pemesanan ada di link bio.\"" }

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

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const relayContent = await relayRouterChat({
  model: 'gemini-3.8-flash',
  messages: [
    {
      role: 'system',
      content: systemInstruction,
    },
    {
      role: 'user',
      content: promptPayload
        .flatMap((item: any) =>
          (item.parts || []).map((part: any) => part.text || '')
        )
        .join('\n'),
    },
  ],
  temperature: 0.7,
});

        const parsed = JSON.parse(relayContent || '{}');
        const cleanContext: CreatorContext = { ...currentContext };
        if (parsed.updatedContext && typeof parsed.updatedContext === 'object') {
          for (const [k, v] of Object.entries(parsed.updatedContext)) {
            if (v !== undefined && v !== null && v !== '') {
              cleanContext[k] = v;
            }
          }
        }

        return {
          reply: parsed.reply || 'Siap! Mari kita lanjutkan langkah berikutnya bersama.',
          suggestedActions:
            parsed.suggestedActions && parsed.suggestedActions.length > 0
              ? parsed.suggestedActions
              : ['Lanjut', 'Buatkan naskah', 'Simpan ke Project'],
          updatedContext: cleanContext,
          structuredDraft: parsed.structuredDraft || null,
        };
      } catch (err: any) {
        const isTransient = isTransientError(err);

        // Stop retrying if error is permanent or retries are exhausted
        if (!isTransient || attempt >= MAX_RETRIES) {
          break;
        }

        // Exponential backoff: ~1s, ~2s, ~4s (+ slight jitter)
        const delay = BASE_DELAY_MS * Math.pow(2, attempt) + Math.floor(Math.random() * 200);
        await sleep(delay);
      }
    }

    // When Gemini is busy or quota cooldown is active, serve seamlessly via local Creator Engine
    return processLocalCreatorEngine(message, currentContext, userMode);
  } catch {
    return processLocalCreatorEngine(message, currentContext, userMode);
  }
}
