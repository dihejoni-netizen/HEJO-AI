export type UserMode = 'SIMPLE' | 'CREATOR' | 'PRO';

export type ActiveNavTab = 
  | 'home' 
  | 'ideas' 
  | 'studio' 
  | 'motion'
  | 'characters' 
  | 'products' 
  | 'projects' 
  | 'tools';

export interface PipelineIdea {
  id: string;
  title: string;
  hook: string;
  concept: string;
  targetAudience: string;
  goal: string;
  style: string;
  duration: string;
}

export interface PipelineScript {
  title: string;
  hook: string; // 0-3s
  problem: string; // 3-10s
  solution: string; // 10-20s
  advantage: string; // 20-27s
  callToAction: string; // 27-30s
  rawText?: string;
}

export interface PipelineScene {
  sceneNumber: number;
  sceneLabel: string; // "SCENE 1"
  duration: string; // "0–3 detik"
  visual: string; // "mahasiswa melihat tumpukan pakaian kotor."
  action: string; // "melihat jam lalu terlihat panik."
  voiceOver: string; // "Cucian numpuk di kosan?"
  textOnScreen: string; // "Cucian numpuk?"
  cameraShot: string; // "Medium shot"
  transition: string; // "Cut"
}

export interface VideoPackShot {
  shotNumber: string;
  duration: string;
  imageUrl?: string;
  character?: {
    id?: string;
    name: string;
    description?: string;
    visualNotes?: string;
    imageUrl?: string;
  };
  subject: string;
  cameraShot: string;
  cameraAngle: string;
  cameraMotion: string;
  speedIntensity: string;
  lighting: string;
  location: string;
  props: string;
  promptVideoAiGlobal: string;
  promptVideoAiIndo: string;
}

export interface VideoPackData {
  id: string;
  projectName: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  createdAt: string;
  updatedAt: string;
  totalDuration: string;
  shots: VideoPackShot[];
}

export interface PipelineShot {
  shotNumber: string; // "SHOT 01"
  scene: string; // "Scene 1"
  shotType: string; // "Medium shot"
  subject: string; // "Mahasiswa + pakaian kotor"
  cameraAngle: string; // "Eye level"
  cameraMovement: string; // "Static"
  lighting: string; // "Natural indoor light"
  location: string; // "Kamar kos"
  props: string; // "Keranjang pakaian"
  duration: string; // "3 detik"
  imageUrl?: string;
  image?: string;
  visualPrompt?: string;
  characterId?: string;
  characterName?: string;
  character?: {
    id?: string;
    name: string;
    description?: string;
    visualNotes?: string;
    imageUrl?: string;
  };
}

export interface CreatorContext {
  tujuan?: string;
  jenisKonten?: 'video' | 'visual' | 'script' | 'ide' | 'karakter' | 'produk' | string;
  platform?: string;
  produk?: string;
  karakter?: string;
  karakterDnaId?: string;
  characterLock?: Partial<CharacterDNA>;
  audiens?: string;
  targetAudiens?: string;
  gaya?: string;
  durasi?: string;
  format?: string;
  tone?: string;
  pesanUtama?: string;
  ide?: string;
  script?: string;
  storyboard?: any[];
  prompt?: string;
  referensi?: string;
  hasPhoto?: boolean | null;
  hasProductInfo?: boolean | null;
  step?: string;
  generatedIdeas?: PipelineIdea[];
  selectedIdea?: PipelineIdea;
  pipelineScript?: PipelineScript;
  pipelineStoryboard?: PipelineScene[];
  pipelineShotList?: PipelineShot[];
  pipelineStage?: 'idea' | 'script' | 'storyboard' | 'shotlist' | 'videoproduction' | string;
  [key: string]: any;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'hejo';
  text: string;
  timestamp: string;
  quickActions?: string[];
  creatorContext?: CreatorContext;
  attachedDraft?: {
    type: 'idea' | 'script' | 'storyboard' | 'shotlist' | 'character' | 'product';
    title: string;
    content: string;
    meta?: Record<string, any>;
  };
}

export interface CharacterDNA {
  id: string;
  name: string;
  imageUrl?: string; // Gambar referensi utama / upload foto
  visualNotes?: string; // Catatan visual (rambut, wajah, tubuh, busana)
  updatedAt?: string;
  characterType?: string; // Jenis karakter (Kreator, Maskot, Host, dsb)
  appearance?: string; // Penampilan umum
  description?: string;
  tagline?: string;
  gender?: string; // 'Perempuan' | 'Laki-laki' | 'Lainnya'
  ageRange?: string; // Rentang usia tampilan
  faceFeatures?: string; // Ciri wajah
  hair?: string; // Rambut
  skinTone?: string; // Warna kulit
  bodyType?: string; // Bentuk tubuh
  outfit?: string; // Pakaian
  accessories?: string; // Aksesori
  personality?: string; // Kepribadian
  speakingStyle: string; // Gaya bicara
  movementStyle?: string; // Gaya gerak
  visualStyle?: string; // Gaya visual
  imageReference?: string; // Referensi gambar
  notes?: string; // Catatan tambahan
  role?: string;
  visualDescription?: string;
  catchphrase?: string;
  values?: string[];
  avatarColor?: string;
  createdAt: string;
}

export type Character = CharacterDNA;

export interface ProductDNA {
  id: string;
  name: string;
  category: string;
  usp: string; // Keunggulan Unik
  targetAudience: string;
  tone: string;
  pricePoint?: string;
  keyBenefits: string[];
  visualMood: string;
  photoNotes?: string;
  createdAt: string;
}

export interface StoryboardScene {
  sceneNumber: number;
  title: string;
  durationSeconds: number;
  visualPrompt: string;
  spokenAudio: string;
  cameraMovement: string;
  notes?: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  name?: string; // Nama project (alias title)
  description: string;
  category: 'video' | 'visual' | 'story' | 'idea' | 'campaign';
  status: 'draft' | 'in_progress' | 'ready' | 'completed';
  createdAt?: string;
  updatedAt: string;
  currentStage?: 'idea' | 'script' | 'storyboard' | 'shotlist' | 'videoproduction' | string;

  // 10 Cabang Struktur Project Workspace
  idea?: string | PipelineIdea;
  script?: string;
  storyboard?: StoryboardScene[] | PipelineScene[];
  shotList?: PipelineShot[];
  images?: string[];
  motion?: {
    preset?: string;
    cameraMovement?: string;
    customPrompt?: string;
    shotsMotion?: Record<string, string>;
  };
  videos?: {
    timelineReady?: boolean;
    previewGenerated?: boolean;
    totalDuration?: number;
    videoUrl?: string;
  };
  voice?: {
    enabled?: boolean;
    voiceType?: string;
    narrationScript?: string;
  };
  music?: {
    mood?: string;
    trackName?: string;
  };
  final?: {
    isReady?: boolean;
    exportUrl?: string;
  };
  videoPack?: VideoPackData;

  // Backwards compatibility data & Character linkages
  characterDnaId?: string;
  characterName?: string;
  characterIds?: string[];
  characters?: { id: string; name: string; imageUrl?: string }[];
  productDnaId?: string;
  scenes?: StoryboardScene[];
  ideas?: string[];
  pipelineIdeas?: PipelineIdea[];
  pipelineScript?: PipelineScript;
  pipelineScenes?: PipelineScene[];
  pipelineShots?: PipelineShot[];
  selectedIdeaTitle?: string;
  tags: string[];
}

export interface IdeaCard {
  id: string;
  title: string;
  niche: string;
  hook: string;
  angle: string;
  format: 'Reels / TikTok' | 'YouTube Shorts' | 'Carousel' | 'Story';
  difficulty: 'Mudah' | 'Menengah' | 'Kreatif';
}
