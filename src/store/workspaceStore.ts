import { useState, useEffect } from 'react';
import { 
  UserMode, 
  ActiveNavTab, 
  ChatMessage, 
  ProjectItem, 
  CharacterDNA, 
  ProductDNA, 
  IdeaCard, 
  CreatorContext, 
  PipelineShot,
  GoogleFlowConnection,
  HejoUser,
  FlowGoogleAccount
} from '../types';
import { getAllVisualImagesFromDb, saveVisualImageToDb } from '../services/imageStorage';

function safeGetLocalStorage(key: string): string | null {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function safeSetLocalStorage(key: string, data: any) {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`[HEJO Storage] localStorage write error on key "${key}":`, err);
    try {
      // In case there is an unexpected quota issue, strip non-essential properties but keep real URLs
      const sanitized = JSON.parse(
        JSON.stringify(data, (_k, v) => {
          if (typeof v === 'string' && v.startsWith('data:image/') && v.length > 200000) {
            // Only strip if extremely large (>200KB base64), persistent HTTP URLs are never stripped
            return undefined;
          }
          return v;
        })
      );
      localStorage.setItem(key, JSON.stringify(sanitized));
    } catch {
      // Ignore if localStorage is completely disabled
    }
  }
}

const INITIAL_PROJECTS: ProjectItem[] = [
  {
    id: 'proj-1',
    title: 'Video Promosi Kopi Susu Aren Lestari',
    name: 'Video Promosi Kopi Susu Aren Lestari',
    description: 'Video 30 detik untuk Instagram Reels & TikTok dengan pendekatan sinematik hangat dan fokus kesegaran.',
    category: 'video',
    status: 'ready',
    createdAt: 'Hari ini',
    updatedAt: '2 jam yang lalu',
    currentStage: 'shotlist',
    productDnaId: 'prod-1',
    characterDnaId: 'char-1',
    characterName: 'Rian si Barista',
    characterIds: ['char-1'],
    characters: [{ id: 'char-1', name: 'Rian si Barista' }],
    script: `[0-3s] "Capek mikir di siang hari? Ini rahasia fokus barista favoritmu."
[3-10s] Tuangan espresso pekat bertemu es batu dan susu creamy gula aren murni.
[10-20s] "Dibuat dari 100% biji kopi lokal petani Garut, tanpa pemanis buatan."
[20-30s] "Pesan via bio sekarang, dapat diskon 20% untuk 50 pemesan pertama!"`,
    scenes: [
      {
        sceneNumber: 1,
        title: 'Hook Suara Es & Espresso',
        durationSeconds: 3,
        visualPrompt: 'Close-up makro es batu bergemerincing di gelas kaca bening, espresso dituangkan membentuk gradasi cokelat susu indah.',
        spokenAudio: 'Capek mikir di siang hari? Ini rahasia fokus barista favoritmu.',
        cameraMovement: 'Macro tilt down',
        notes: 'Gunakan suara asli (ASMR es)',
      },
      {
        sceneNumber: 2,
        title: 'Aroma Biji Kopi Segar',
        durationSeconds: 7,
        visualPrompt: 'Biji kopi sangrai berkilau dipegang tangan barista tersenyum ramah, latar belakang kedai bernuansa kayu hangat.',
        spokenAudio: 'Dibuat dari 100% biji kopi lokal petani Garut, tanpa pemanis buatan.',
        cameraMovement: 'Medium shot hangat',
      },
      {
        sceneNumber: 3,
        title: 'Kenikmatan Tegukan Pertama',
        durationSeconds: 10,
        visualPrompt: 'Seorang pelanggan menyeruput kopi, ekspresi rileks dan segar kembali.',
        spokenAudio: 'Bukan sekadar kafein, tapi waktu istirahat yang pantas kamu dapatkan.',
        cameraMovement: 'Slow motion 60fps',
      },
      {
        sceneNumber: 4,
        title: 'Call to Action Manis',
        durationSeconds: 10,
        visualPrompt: 'Gelas kopi di atas meja dengan botol take-away cantik dan tulisan promo diskon 20%.',
        spokenAudio: 'Pesan sekarang via link di bio selagi stok fresh masih ada!',
        cameraMovement: 'Hero product static',
      }
    ],
    tags: ['Kopi', 'Reels', 'Produk Lokal', 'Promosi']
  },
  {
    id: 'proj-2',
    title: 'Edukasi: 3 Kesalahan Pemula Bikin Konten',
    name: 'Edukasi: 3 Kesalahan Pemula Bikin Konten',
    description: 'Konten edukasi ringan gaya talking head untuk meningkatkan kepercayaan audiens pemula.',
    category: 'video',
    status: 'in_progress',
    createdAt: 'Kemarin',
    updatedAt: 'Kemarin',
    currentStage: 'script',
    characterDnaId: 'char-2',
    characterName: 'Bening Mentari',
    characterIds: ['char-2'],
    characters: [{ id: 'char-2', name: 'Bening Mentari' }],
    script: `Hook: "Jangan beli kamera mahal dulu sebelum kamu benerin 1 hal ini!"`,
    tags: ['Edukasi', 'Tips Kreator', 'TikTok']
  },
  {
    id: 'proj-3',
    title: 'Peluncuran Tas Kanvas Ramah Lingkungan',
    name: 'Peluncuran Tas Kanvas Ramah Lingkungan',
    description: 'Rangkaian visual carousel dan cerita brand di balik pembuatan tas daur ulang.',
    category: 'campaign',
    status: 'draft',
    createdAt: '3 hari yang lalu',
    updatedAt: '3 hari yang lalu',
    currentStage: 'idea',
    productDnaId: 'prod-2',
    tags: ['Eco-friendly', 'Fashion', 'Storytelling']
  }
];

const INITIAL_CHARACTERS: CharacterDNA[] = [
  {
    id: 'char-budi',
    name: 'Budi',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80',
    description: 'Pria Indonesia usia sekitar 25 tahun.',
    visualNotes: 'Rambut hitam pendek, wajah ramah, tubuh sedang, kaos kasual.',
    characterType: 'Kreator Konten',
    appearance: 'Pria Indonesia usia sekitar 25 tahun, rambut hitam pendek, wajah ramah.',
    gender: 'Laki-laki',
    ageRange: '20-25 tahun',
    faceFeatures: 'Senyum ramah, tatapan hangat, ekspresi santai bersahabat',
    hair: 'Rambut hitam pendek rapi',
    skinTone: 'Sawo matang alami',
    bodyType: 'Tubuh sedang proporsional',
    outfit: 'Kaos kasual krem atau kemeja santai',
    accessories: 'Jam tangan simpel',
    personality: '😎 Santai & Ramah',
    speakingStyle: '🗣️ Santai dan bersahabat',
    movementStyle: 'Natural, santai, gerakan tangan ekspresif',
    visualStyle: 'Modern cinematic aesthetic, pencahayaan alami',
    notes: 'Rambut hitam pendek, wajah ramah, tubuh sedang.',
    role: 'Kreator TikTok & Reels',
    avatarColor: 'from-emerald-600 to-teal-800',
    createdAt: 'Baru saja',
    updatedAt: 'Baru saja'
  },
  {
    id: 'char-sinta',
    name: 'Sinta',
    imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=500&q=80',
    description: 'Wanita muda Indonesia usia sekitar 23 tahun, ramah dan kreatif.',
    visualNotes: 'Rambut hitam sebahu rapi, senyum tulus, pakaian kasual pastel.',
    characterType: 'Kreator Konten',
    appearance: 'Wanita muda Indonesia 23 tahun dengan senyum ramah bersahabat.',
    gender: 'Perempuan',
    ageRange: '20-25 tahun',
    faceFeatures: 'Senyum ramah, mata berbinar cerah, ekspresi bersahabat',
    hair: 'Sebahu hitam rapi kasual',
    skinTone: 'Kuning langsat',
    bodyType: 'Proporsional & energik',
    outfit: 'Kaos linen sage green dan celana santai rapi',
    accessories: 'Jam tangan simpel & tote bag kanvas',
    personality: '😊 Ramah & Inspiratif',
    speakingStyle: 'Hangat, menyenangkan, dan teratur',
    movementStyle: 'Luwes, tangan aktif menyapa penonton',
    visualStyle: 'Warm aesthetic, pencahayaan alami terang',
    notes: 'Rambut hitam sebahu rapi, senyum tulus, pakaian kasual pastel.',
    role: 'Kreator Konten',
    avatarColor: 'from-emerald-500 to-teal-600',
    createdAt: 'Baru saja',
    updatedAt: 'Baru saja'
  },
  {
    id: 'char-oyen',
    name: 'Oyen',
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=500&q=80',
    description: 'Maskot kucing oranye lucu yang selalu penasaran dan ekspresif.',
    visualNotes: 'Bulu oranye belang putih tebal, mata bulat berkilau, pipi tembem menggemaskan.',
    characterType: 'Maskot',
    appearance: 'Kucing oranye gemuk lucu dan menggemaskan.',
    gender: 'Lainnya',
    ageRange: 'Muda',
    faceFeatures: 'Mata bulat berkilau, kumis lucu, pipi tembem',
    hair: 'Bulu oranye belang putih',
    skinTone: 'Oranye keemasan',
    bodyType: 'Gemuk menggemaskan',
    outfit: 'Kerah pita kecil hijau emerald',
    accessories: 'Kerah pita kecil',
    personality: '🐱 Lucu & Ceria',
    speakingStyle: 'Ekspresif & menggemaskan',
    movementStyle: 'Lincah, menggeleng kepala menggemaskan',
    visualStyle: 'Warm cozy animated aesthetic',
    notes: 'Bulu oranye belang putih tebal, mata bulat berkilau, pipi tembem menggemaskan.',
    role: 'Maskot Studio',
    avatarColor: 'from-amber-500 to-orange-600',
    createdAt: 'Baru saja',
    updatedAt: 'Baru saja'
  },
  {
    id: 'char-1',
    name: 'Rian si Barista',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80',
    description: 'Rian, barista ramah yang selalu punya cerita menenangkan.',
    visualNotes: 'Pria muda 26 tahun memakai apron kanvas cokelat olive, senyum tulus, kacamata bulat tipis.',
    tagline: 'Teman ngopi yang selalu punya cerita menenangkan',
    gender: 'Laki-laki',
    ageRange: '26-30 tahun',
    faceFeatures: 'Senyum tulus, kacamata bulat tipis',
    hair: 'Pendek rapi belah samping',
    skinTone: 'Sawo matang',
    bodyType: 'Tinggi proporsional',
    outfit: 'Apron kanvas cokelat olive di atas kaos putih',
    accessories: 'Kacamata bulat tipis',
    personality: 'Santai',
    speakingStyle: 'Santai, bersahabat, suara lembut dan jelas',
    movementStyle: 'Tenang, fokus pada gerakan meracik',
    visualStyle: 'Warm cozy coffee shop, earthy tone',
    notes: 'Pria muda 26 tahun memakai apron kanvas cokelat olive, senyum tulus, kacamata bulat tipis.',
    role: 'Barista & Kreator Kuliner',
    visualDescription: 'Pria muda 26 tahun, memakai apron kanvas cokelat olive, senyum tulus, kacamata bulat tipis.',
    catchphrase: 'Secangkir dulu, biar pikiran jernih.',
    values: ['Kualitas lokal', 'Ketulusan rasa', 'Keramahan'],
    avatarColor: 'from-amber-600 to-emerald-700',
    createdAt: 'Baru saja',
    updatedAt: 'Baru saja'
  },
  {
    id: 'char-2',
    name: 'Bening Mentari',
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500&q=80',
    description: 'Bening, mentor edukasi hangat yang membimbing pemula berkarya.',
    visualNotes: 'Wanita 28 tahun, berpakaian kasual rapi warna krem/hijau sage, tatapan suportif dan percaya diri.',
    tagline: 'Membimbing pemula berkarya tanpa rasa takut',
    gender: 'Perempuan',
    ageRange: '26-30 tahun',
    faceFeatures: 'Tatapan suportif dan percaya diri',
    hair: 'Panjang bergelombang rapi terikat',
    skinTone: 'Kuning langsat cerah',
    bodyType: 'Ramping elegan',
    outfit: 'Blouse krem sage green dengan outer santai',
    accessories: 'Anting mutiara kecil',
    personality: 'Edukatif',
    speakingStyle: 'Hangat, suportif, analogi sederhana sehari-hari',
    movementStyle: 'Ekspresif mendidik, gestur terarah',
    visualStyle: 'Bright clean aesthetic studio',
    notes: 'Wanita 28 tahun, berpakaian kasual rapi warna krem/hijau sage, tatapan suportif dan percaya diri.',
    role: 'Mentor Kreator Konten',
    visualDescription: 'Wanita 28 tahun, berpakaian kasual rapi warna krem/hijau sage, tatapan suportif dan percaya diri.',
    catchphrase: 'Mulai dari apa yang kamu punya hari ini.',
    values: ['Aksesibilitas', 'Konsistensi', 'Empati'],
    avatarColor: 'from-emerald-500 to-teal-700',
    createdAt: 'Kemarin',
    updatedAt: 'Kemarin'
  }
];

const INITIAL_PRODUCTS: ProductDNA[] = [
  {
    id: 'prod-1',
    name: 'Kopi Susu Gula Aren Lestari',
    category: 'Minuman / Kuliner',
    usp: '100% Kopi Arabika Garut berpadu gula aren murni organik dari petani lokal Ciamis.',
    targetAudience: 'Pekerja kantor, mahasiswa, dan penikmat kopi yang mencari kesegaran tanpa maag.',
    tone: 'Segar, otentik, membumi, dan bersahabat.',
    pricePoint: 'Rp 22.000 / cup',
    keyBenefits: ['Rasa lembut & tidak asam', 'Gula aren alami rendah glikemik', 'Kemasan daur ulang'],
    visualMood: 'Warm sunlight, earthy tones, natural wood, water drops condensation.',
    photoNotes: 'Sudut pandang 45 derajat dengan es batu berkilau dan tetesan embun dingin.',
    createdAt: 'Minggu lalu'
  },
  {
    id: 'prod-2',
    name: 'Tote Bag Kanvas "Langkah Hijau"',
    category: 'Fashion Berkelanjutan',
    usp: 'Tas kanvas tebal tahan air dari 100% serat katun daur ulang dengan jahitan dobel super kuat.',
    targetAudience: 'Anak muda, kreator, dan komuter urban yang peduli lingkungan.',
    tone: 'Estetik, minimalis, dan bertanggung jawab.',
    pricePoint: 'Rp 89.000',
    keyBenefits: ['Kapasitas laptop 15 inch', 'Anti cipratan air', 'Desain timeless'],
    visualMood: 'Clean studio lighting, sage green & natural linen, minimalist outdoor.',
    createdAt: '2 minggu lalu'
  }
];

const INITIAL_IDEAS: IdeaCard[] = [
  {
    id: 'idea-seed-1',
    title: 'Bongkar Rahasia: Modal Kecil Hasil Maksimal',
    niche: 'Bisnis & UMKM',
    hook: 'Modal 50 ribu bisa dapat hasil kayak gini? Ini langkah konkretnya.',
    angle: 'Bukti Nyata & Solusi Murah',
    format: 'Reels / TikTok',
    difficulty: 'Mudah'
  },
  {
    id: 'idea-seed-2',
    title: '1 Hari di Balik Layar Produksi',
    niche: 'Kuliner & Kerajinan',
    hook: 'Banyak yang ngira ini gampang, sampai mereka lihat proses dari jam 5 subuh...',
    angle: 'Behind The Scenes & Kejujuran',
    format: 'Reels / TikTok',
    difficulty: 'Mudah'
  },
  {
    id: 'idea-seed-3',
    title: 'Tips 3 Detik Pertama yang Bikin Orang Stop Scrolling',
    niche: 'Kreator Konten',
    hook: 'Video kamu sepi bukan karena isinya jelek, tapi karena 3 detik pertamanya membosankan.',
    angle: 'Edukasi Tajam & Membuka Mata',
    format: 'YouTube Shorts',
    difficulty: 'Menengah'
  },
  {
    id: 'idea-seed-4',
    title: 'Rekomendasi Rahasia Barista untuk Hari Melelahkan',
    niche: 'Gaya Hidup & Kopi',
    hook: 'Kalau lagi burn-out, jangan pesan kopi biasa. Coba racikan satu ini.',
    angle: 'Kurasi & Rekomendasi Personal',
    format: 'Story',
    difficulty: 'Mudah'
  }
];

export function useWorkspaceStore() {
  const [userMode, setUserModeState] = useState<UserMode>(() => {
    return (safeGetLocalStorage('hejo_user_mode') as UserMode) || 'SIMPLE';
  });

  const [activeTab, setActiveTab] = useState<ActiveNavTab>('home');

  const [projects, setProjects] = useState<ProjectItem[]>(() => {
    const saved = safeGetLocalStorage('hejo_projects');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.filter((p: any) => Boolean(p && (p.id || p.title)));
          if (cleaned.length > 0) return cleaned;
        }
      } catch (e) { /* ignore */ }
    }
    return INITIAL_PROJECTS;
  });

  const [characters, setCharacters] = useState<CharacterDNA[]>(() => {
    const saved = safeGetLocalStorage('hejo_characters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.filter((c: any) => Boolean(c && (c.id || c.name)));
          if (cleaned.length > 0) return cleaned;
        }
      } catch (e) { /* ignore */ }
    }
    return INITIAL_CHARACTERS;
  });

  const [products, setProducts] = useState<ProductDNA[]>(() => {
    const saved = safeGetLocalStorage('hejo_products');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.filter((p: any) => Boolean(p && (p.id || p.name)));
          if (cleaned.length > 0) return cleaned;
        }
      } catch (e) { /* ignore */ }
    }
    return INITIAL_PRODUCTS;
  });

  const [ideas, setIdeas] = useState<IdeaCard[]>(INITIAL_IDEAS);

  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    const saved = safeGetLocalStorage('hejo_active_project_id');
    if (saved) return saved;
    // Fallback: check if projects in storage has a project with pipelineShots
    const savedProjects = safeGetLocalStorage('hejo_projects');
    if (savedProjects) {
      try {
        const parsed = JSON.parse(savedProjects);
        if (Array.isArray(parsed)) {
          const projWithShots = parsed.find((p: any) => p.pipelineShots && p.pipelineShots.length > 0);
          if (projWithShots?.id) return projWithShots.id;
          if (parsed.length > 0 && parsed[0]?.id) return parsed[0].id;
        }
      } catch (e) { /* ignore */ }
    }
    return INITIAL_PROJECTS[0]?.id || null;
  });
  const [creatorContext, setCreatorContext] = useState<CreatorContext>(() => {
    const saved = safeGetLocalStorage('hejo_creator_context');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return {};
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = safeGetLocalStorage('hejo_chat_messages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { /* ignore */ }
    }
    return [
      {
        id: 'welcome-msg',
        sender: 'hejo',
        text: 'Halo! Selamat datang di HEJO AI. Ceritakan saja apa yang ingin kamu buat hari ini, HEJO akan membantu dari ide sampai menjadi karya nyata.',
        timestamp: 'Baru saja',
        quickActions: ['💡 Saya butuh ide', '🎬 Saya mau buat video', '📦 Saya mau membuat konten produk', '🤷 Saya belum tahu mau membuat apa']
      }
    ];
  });

  const [toast, setToast] = useState<string | null>(null);

  // Status Otentikasi Pengguna HEJO & Akun Google Flow (Multi-Account)
  const [hejoUser, setHejoUser] = useState<HejoUser | null>(null);
  const [flowAccounts, setFlowAccounts] = useState<FlowGoogleAccount[]>([]);
  const [isOAuthConfigured, setIsOAuthConfigured] = useState<boolean>(false);
  const [oauthClientId, setOauthClientId] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  const fetchAuthStatus = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setIsOAuthConfigured(Boolean(data.isConfigured));
        setOauthClientId(data.clientId || null);
        setHejoUser(data.user || null);
        if (Array.isArray(data.flowAccounts)) {
          setFlowAccounts(data.flowAccounts);
        }
      }
    } catch (e) {
      console.error('Failed to fetch auth status:', e);
    } finally {
      setIsAuthLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthStatus();
  }, []);

  const activeFlowAccount: FlowGoogleAccount | null = 
    flowAccounts.find((a) => a.isActive) || flowAccounts[0] || null;

  // Status Koneksi Google / Flow (Backward-compatible adapter)
  const googleFlowConnection: GoogleFlowConnection = activeFlowAccount
    ? {
        isConnected: true,
        googleEmail: activeFlowAccount.email,
        connectedAt: activeFlowAccount.linkedAt,
      }
    : {
        isConnected: false,
      };

  const setActiveFlowAccount = async (accountId: string) => {
    try {
      const res = await fetch('/api/auth/flow-accounts/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.flowAccounts)) {
          setFlowAccounts(data.flowAccounts);
        }
        const activeAcc = data.flowAccounts?.find((a: any) => a.id === accountId);
        showToast(`Akun aktif Flow: ${activeAcc?.email || 'diperbarui'}`);
      }
    } catch {
      showToast('Gagal mengubah akun aktif.');
    }
  };

  const removeFlowAccount = async (accountId: string) => {
    try {
      const res = await fetch(`/api/auth/flow-accounts/${accountId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.flowAccounts)) {
          setFlowAccounts(data.flowAccounts);
        }
        showToast('Koneksi akun Flow berhasil dihapus.');
      }
    } catch {
      showToast('Gagal menghapus akun Flow.');
    }
  };

  const logoutHejo = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setHejoUser(null);
      setFlowAccounts([]);
      showToast('Berhasil keluar dari akun HEJO.');
    } catch {
      showToast('Gagal keluar.');
    }
  };

  const connectGoogleFlow = (email: string) => {
    const cleanEmail = email.trim();
    if (isOAuthConfigured) {
      window.location.href = '/api/auth/google/link-flow';
    } else {
      showToast('Google OAuth belum dikonfigurasi di server (.env).');
    }
  };

  const disconnectGoogleFlow = () => {
    if (activeFlowAccount) {
      removeFlowAccount(activeFlowAccount.id);
    } else {
      showToast('Belum ada akun Flow yang terhubung.');
    }
  };

  // Restore heavy visual images from IndexedDB across page reloads
  useEffect(() => {
    getAllVisualImagesFromDb().then((imageMap) => {
      if (!imageMap || Object.keys(imageMap).length === 0) return;

      setProjects((prevProjects) =>
        prevProjects.map((proj) => {
          if (!proj.pipelineShots) return proj;
          let changed = false;
          const updatedShots = proj.pipelineShots.map((shot, idx) => {
            const key1 = `shot_${shot.shotNumber}_${shot.subject}`;
            const key2 = `proj_${proj.id}_shot_${idx}`;
            const key3 = `ctx_shot_${idx}`;
            const key4 = `shot_${shot.shotNumber}`;
            const key5 = `shot_idx_${idx}`;
            const foundImage = imageMap[key1] || imageMap[key2] || imageMap[key3] || imageMap[key4] || imageMap[key5];
            const currentImg = shot.imageUrl || shot.image;
            if (foundImage && (!currentImg || currentImg === '[IDB_IMAGE]')) {
              changed = true;
              return { ...shot, imageUrl: foundImage, image: foundImage };
            }
            return shot;
          });
          return changed ? { ...proj, pipelineShots: updatedShots } : proj;
        })
      );

      setCreatorContext((prevCtx) => {
        if (!prevCtx.pipelineShotList) return prevCtx;
        let changed = false;
        const updatedShots = prevCtx.pipelineShotList.map((shot, idx) => {
          const key1 = `shot_${shot.shotNumber}_${shot.subject}`;
          const key3 = `ctx_shot_${idx}`;
          const key4 = `shot_${shot.shotNumber}`;
          const key5 = `shot_idx_${idx}`;
          const foundImage = imageMap[key1] || imageMap[key3] || imageMap[key4] || imageMap[key5];
          const currentImg = shot.imageUrl || shot.image;
          if (foundImage && (!currentImg || currentImg === '[IDB_IMAGE]')) {
            changed = true;
            return { ...shot, imageUrl: foundImage, image: foundImage };
          }
          return shot;
        });
        return changed ? { ...prevCtx, pipelineShotList: updatedShots } : prevCtx;
      });
    }).catch(() => {});
  }, []);

  // Safe sync to local storage (never throws quota errors)
  useEffect(() => {
    safeSetLocalStorage('hejo_chat_messages', chatMessages);
  }, [chatMessages]);

  useEffect(() => {
    safeSetLocalStorage('hejo_creator_context', creatorContext);
  }, [creatorContext]);

  useEffect(() => {
    try {
      if (activeProjectId) {
        localStorage.setItem('hejo_active_project_id', activeProjectId);
      } else {
        localStorage.removeItem('hejo_active_project_id');
      }
    } catch { /* safe */ }
  }, [activeProjectId]);

  useEffect(() => {
    try {
      localStorage.setItem('hejo_user_mode', userMode);
    } catch { /* safe */ }
  }, [userMode]);

  useEffect(() => {
    safeSetLocalStorage('hejo_projects', projects);
  }, [projects]);

  useEffect(() => {
    safeSetLocalStorage('hejo_characters', characters);
  }, [characters]);

  useEffect(() => {
    safeSetLocalStorage('hejo_products', products);
  }, [products]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const setUserMode = (mode: UserMode) => {
    setUserModeState(mode);
    showToast(`Mode diubah ke ${mode}: ${mode === 'SIMPLE' ? 'Sederhana & Ramah' : mode === 'CREATOR' ? 'Fokus Kreator' : 'Kontrol Lanjutan'}`);
  };

  const addChatMessage = (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const trimmedText = msg.text.trim();
    const newMsg: ChatMessage = {
      ...msg,
      text: trimmedText,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => {
      // Guard against adding exact consecutive duplicate message
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        if (last.sender === msg.sender && last.text.trim() === trimmedText) {
          return prev;
        }
      }
      return [...prev, newMsg];
    });
    return newMsg;
  };

  const saveProject = (
    item: Partial<ProjectItem> & { title: string },
    silent = false
  ): ProjectItem => {
    const now = 'Baru saja';
    const targetId = item.id || (activeProjectId && projects.some((p) => Boolean(p && p.id === activeProjectId)) ? activeProjectId : undefined);

    console.log(`[HEJO Persistence Debug] saveProject called: targetId=${targetId}, title="${item.title}", shots=${item.pipelineShots?.length}`);
    if (item.pipelineShots) {
      item.pipelineShots.forEach((s, idx) => {
        console.log(`[HEJO Persistence Debug] saveProject shot ${idx} (${s.shotNumber}) has imageUrl:`, s.imageUrl || (s as any).image);
      });
    }

    // Persist any visual images to IndexedDB and server cache
    if (item.pipelineShots) {
      item.pipelineShots.forEach((s, idx) => {
        const url = s.imageUrl || (s as any).image;
        if (url && url !== '[IDB_IMAGE]') {
          saveVisualImageToDb(`shot_${s.shotNumber}_${s.subject}`, url);
          saveVisualImageToDb(`shot_${s.shotNumber}`, url);
          saveVisualImageToDb(`shot_idx_${idx}`, url);
          saveVisualImageToDb(`ctx_shot_${idx}`, url);
          if (targetId) {
            saveVisualImageToDb(`proj_${targetId}_shot_${idx}`, url);
          }
        }
      });

      // Keep creatorContext.pipelineShotList synced as well
      setCreatorContext((prev) => ({
        ...prev,
        pipelineShotList: item.pipelineShots,
      }));
    }

    const title = item.title || item.name || 'Project Baru';
    const name = item.name || title;

    if (targetId) {
      let updatedProj: ProjectItem | undefined;
      setProjects((prev) =>
        prev.map((p) => {
          if (p && p.id === targetId) {
            const rawImages = (item.pipelineShots || p.pipelineShots || [])
              .map((s) => s.imageUrl || (s as any).image)
              .filter(Boolean);

            updatedProj = { 
              ...p, 
              ...item, 
              id: targetId, 
              title,
              name,
              images: rawImages.length > 0 ? rawImages : p.images,
              currentStage: item.currentStage || p.currentStage || 'idea',
              updatedAt: now 
            } as ProjectItem;
            return updatedProj;
          }
          return p;
        })
      );
      setActiveProjectId(targetId);
      if (!silent) {
        showToast(`Project "${title}" berhasil diperbarui`);
      }
      return updatedProj || ({ ...item, id: targetId, title, name, updatedAt: now } as ProjectItem);
    } else {
      const newProjId = `proj-${Date.now()}`;
      if (item.pipelineShots) {
        item.pipelineShots.forEach((s, idx) => {
          const url = s.imageUrl || (s as any).image;
          if (url && url !== '[IDB_IMAGE]') {
            saveVisualImageToDb(`proj_${newProjId}_shot_${idx}`, url);
            saveVisualImageToDb(`shot_${s.shotNumber}_${s.subject}`, url);
            saveVisualImageToDb(`shot_${s.shotNumber}`, url);
            saveVisualImageToDb(`shot_idx_${idx}`, url);
            saveVisualImageToDb(`ctx_shot_${idx}`, url);
          }
        });
      }

      const rawImages = (item.pipelineShots || [])
        .map((s) => s.imageUrl || (s as any).image)
        .filter(Boolean);

      const newProj: ProjectItem = {
        ...item,
        id: newProjId,
        title,
        name,
        description: item.description || 'Project baru di HEJO AI',
        category: item.category || 'video',
        status: item.status || 'draft',
        createdAt: item.createdAt || now,
        updatedAt: now,
        currentStage: item.currentStage || 'idea',
        images: rawImages,
        scenes: item.scenes || [],
        script: item.script || '',
        tags: item.tags || ['Karya Baru'],
        productDnaId: item.productDnaId,
        characterDnaId: item.characterDnaId,
        pipelineShots: item.pipelineShots || [],
        pipelineIdeas: item.pipelineIdeas || [],
        pipelineScript: item.pipelineScript,
        pipelineScenes: item.pipelineScenes || [],
      };
      setProjects((prev) => [newProj, ...prev]);
      setActiveProjectId(newProj.id);
      if (!silent) {
        showToast(`Project "${newProj.title}" berhasil disimpan!`);
      }
      return newProj;
    }
  };

  const createProject = (name: string): ProjectItem => {
    const trimmed = name.trim();
    const now = 'Baru saja';
    const newProjId = `proj-${Date.now()}`;
    const newProj: ProjectItem = {
      id: newProjId,
      title: trimmed,
      name: trimmed,
      description: 'Project baru di HEJO AI',
      category: 'video',
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      currentStage: 'idea',
      pipelineShots: [],
      pipelineIdeas: [],
      pipelineScenes: [],
      scenes: [],
      tags: ['Karya Baru'],
    };
    setProjects((prev) => [newProj, ...prev]);
    setActiveProjectId(newProjId);
    safeSetLocalStorage('hejo_active_project_id', newProjId);
    showToast(`Project "${trimmed}" berhasil dibuat!`);
    return newProj;
  };

  const updateActiveProjectShots = (shots: PipelineShot[], defaultTitle?: string): ProjectItem => {
    const existing = activeProjectId ? projects.find((p) => Boolean(p && p.id === activeProjectId)) : null;
    const title = existing?.title || defaultTitle || 'Project Video Studio';
    return saveProject({
      id: existing?.id,
      title,
      pipelineShots: shots,
    }, true);
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => Boolean(p && p.id !== id)));
    if (activeProjectId === id) setActiveProjectId(null);
    showToast('Project telah dihapus');
  };

  const saveCharacter = (char: Partial<CharacterDNA> & { name: string }) => {
    const now = 'Baru saja';
    const visualNotes = char.visualNotes || char.notes || '';
    const imageUrl = char.imageUrl || char.imageReference || '';

    if (char.id) {
      setCharacters((prev) =>
        prev.map((c) =>
          c.id === char.id
            ? ({
                ...c,
                ...char,
                imageUrl: imageUrl || c.imageUrl || c.imageReference || '',
                imageReference: imageUrl || c.imageReference || c.imageUrl || '',
                visualNotes: visualNotes || c.visualNotes || c.notes || '',
                notes: visualNotes || c.notes || c.visualNotes || '',
                updatedAt: now,
              } as CharacterDNA)
            : c
        )
      );
      showToast(`Karakter "${char.name}" diperbarui`);
    } else {
      const newChar: CharacterDNA = {
        id: `char-${Date.now()}`,
        name: char.name,
        imageUrl: imageUrl,
        imageReference: imageUrl,
        visualNotes: visualNotes,
        notes: visualNotes,
        description: char.description || `${char.name}, karakter kreatif di HEJO AI.`,
        tagline: char.tagline || char.description || 'Karakter baru di HEJO AI',
        gender: char.gender || 'Laki-laki',
        ageRange: char.ageRange || '20-25 tahun',
        faceFeatures: char.faceFeatures || 'Senyum ramah dan ekspresif',
        hair: char.hair || 'Rapi kasual',
        skinTone: char.skinTone || 'Alami',
        bodyType: char.bodyType || 'Proporsional',
        outfit: char.outfit || 'Pakaian santai rapi',
        accessories: char.accessories || '',
        personality: char.personality || 'Ramah',
        speakingStyle: char.speakingStyle || 'Santai',
        movementStyle: char.movementStyle || 'Luwes & alami',
        visualStyle: char.visualStyle || 'Warm aesthetic',
        role: char.role || 'Kreator Konten',
        visualDescription: visualNotes || char.visualDescription || char.description || '',
        catchphrase: char.catchphrase || 'Mulai dengan langkah kecil hari ini!',
        values: char.values || ['Ramah', 'Kreatif', 'Tulus'],
        avatarColor: char.avatarColor || 'from-emerald-500 to-teal-700',
        createdAt: now,
        updatedAt: now,
      };
      setCharacters((prev) => [newChar, ...prev]);
      showToast(`Karakter "${newChar.name}" berhasil disimpan!`);
    }
  };

  const assignCharacterToProject = (projectId: string, char: CharacterDNA) => {
    const charImageUrl = char.imageUrl || char.imageReference;
    const charVisualNotes = char.visualNotes || char.notes || char.visualDescription;

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const currentChars = (p.characters || []).filter((c) => Boolean(c));
          const exists = currentChars.some((c) =>
            typeof c === 'string' ? c === char.id : c?.id === char.id
          );
          const updatedChars = exists
            ? currentChars
            : [
                ...currentChars,
                {
                  id: char.id,
                  name: char.name,
                  imageUrl: charImageUrl,
                },
              ];

          // Also update existing pipelineShots that don't have custom overrides
          const updatedShots = p.pipelineShots
            ? p.pipelineShots.map((s) => ({
                ...s,
                characterId: s.characterId || char.id,
                characterName: s.characterName || char.name,
                character: s.character || {
                  id: char.id,
                  name: char.name,
                  description: char.description,
                  visualNotes: charVisualNotes,
                  imageUrl: charImageUrl,
                },
              }))
            : p.pipelineShots;

          return {
            ...p,
            characterDnaId: char.id,
            characterName: char.name,
            characterIds: [char.id],
            characters: updatedChars,
            pipelineShots: updatedShots,
            updatedAt: 'Baru saja',
          };
        }
        return p;
      })
    );

    // Sync creatorContext
    setCreatorContext((prev) => ({
      ...prev,
      karakter: char.name,
      karakterDnaId: char.id,
      character: {
        id: char.id,
        name: char.name,
        description: char.description,
        visualNotes: charVisualNotes,
        imageUrl: charImageUrl,
      },
      characterLock: {
        id: char.id,
        name: char.name,
        description: char.description,
        gender: char.gender,
        ageRange: char.ageRange,
        hair: char.hair,
        faceFeatures: char.faceFeatures,
        outfit: char.outfit,
        notes: charVisualNotes,
        speakingStyle: char.speakingStyle,
        imageUrl: charImageUrl,
      },
    }));

    showToast(`Karakter "${char.name}" telah dihubungkan ke project!`);
  };

  const deleteCharacter = (id: string) => {
    setCharacters((prev) => prev.filter((c) => c.id !== id));
    showToast('Karakter telah dihapus');
  };

  const saveProduct = (prod: Partial<ProductDNA> & { name: string }) => {
    if (prod.id) {
      setProducts((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, ...prod } as ProductDNA : p))
      );
      showToast(`Produk ${prod.name} diperbarui`);
    } else {
      const newProd: ProductDNA = {
        id: `prod-${Date.now()}`,
        name: prod.name,
        category: prod.category || 'Produk Kreatif',
        usp: prod.usp || 'Keunggulan produk berkualitas',
        targetAudience: prod.targetAudience || 'Pengguna umum',
        tone: prod.tone || 'Ramah & Bersahabat',
        pricePoint: prod.pricePoint || '',
        keyBenefits: prod.keyBenefits || ['Mudah digunakan', 'Kualitas terjamin'],
        visualMood: prod.visualMood || 'Warm & Aesthetic',
        createdAt: 'Baru saja',
      };
      setProducts((prev) => [newProd, ...prev]);
      showToast(`Produk "${newProd.name}" berhasil ditambahkan!`);
    }
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast('Produk telah dihapus');
  };

  const activeProject = projects.find((p) => Boolean(p && p.id === activeProjectId)) || null;

  return {
    userMode,
    setUserMode,
    activeTab,
    setActiveTab,
    projects,
    characters,
    products,
    ideas,
    setIdeas,
    activeProject,
    setActiveProjectId,
    chatMessages,
    addChatMessage,
    saveProject,
    createProject,
    updateActiveProjectShots,
    deleteProject,
    saveCharacter,
    deleteCharacter,
    assignCharacterToProject,
    saveProduct,
    deleteProduct,
    creatorContext,
    setCreatorContext,
    toast,
    showToast,
    googleFlowConnection,
    connectGoogleFlow,
    disconnectGoogleFlow,
    hejoUser,
    flowAccounts,
    activeFlowAccount,
    isOAuthConfigured,
    oauthClientId,
    isAuthLoading,
    fetchAuthStatus,
    setActiveFlowAccount,
    removeFlowAccount,
    logoutHejo,
  };
}
