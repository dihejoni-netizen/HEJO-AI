import React, { useState, useEffect } from 'react';
import { 
  Clapperboard, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Sparkles, 
  Clock, 
  Video, 
  FileText, 
  BookmarkCheck,
  Camera,
  Layers,
  Info,
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  Film,
  Download,
  Share2,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  MonitorPlay,
  Image as ImageIcon,
  UserCircle2,
  ChevronDown,
  ChevronUp,
  Settings,
  Sliders,
  Package,
  Mic,
  Volume2
} from 'lucide-react';
import { 
  StoryboardScene, 
  ProjectItem, 
  UserMode, 
  CreatorContext,
  PipelineIdea,
  PipelineScript,
  PipelineScene,
  PipelineShot,
  CharacterDNA,
  VideoPackData
} from '../types';
import { 
  fetchPipelineIdeas, 
  fetchPipelineScript, 
  fetchPipelineStoryboard, 
  fetchPipelineShotList,
  fetchPipelineShotImage
} from '../services/aiService';
import { saveVisualImageToDb, getAllVisualImagesFromDb } from '../services/imageStorage';
import { ProjectProgressBar } from './ProjectProgressBar';
import { NewProjectModal } from './NewProjectModal';
import { VideoPackView } from './VideoPackView';
import { SimpleWorkflowProgress } from './SimpleWorkflowProgress';
import { NarrationCard } from './NarrationCard';
import { SimplifiedSceneCard } from './SimplifiedSceneCard';
import { getSmartMotionForScene, STANDARD_NEGATIVE_PROMPT } from '../utils/motionHelper';
import { generateNarrationPackage, NarrationPackage } from '../utils/narrationHelper';

const INITIAL_IDEAS: PipelineIdea[] = [
  {
    id: 'idea-1',
    title: 'Drama Mahasiswa: Baju Bersih Habis Pas Minggu Ujian',
    hook: 'Ketika cucian numpuk di kosan, dan yang tersisa di lemari cuma kaos ospek...',
    concept: 'Komedi situasi relate anak kos yang panik baju habis, lalu menemukan solusi praktis.',
    targetAudience: 'Mahasiswa',
    goal: 'Menarik Pelanggan Baru',
    style: 'Komedi Relate',
    duration: '30 detik',
  },
  {
    id: 'idea-2',
    title: 'Hitung-hitungan Realistis: Nyuci Sendiri vs Laundry Kiloan',
    hook: 'Bener nggak sih laundry kiloan bikin boros anak kos? Mari kita hitung bareng!',
    concept: 'Perbandingan biaya sabun, listrik, dan waktu nugas yang terbuang jika cuci sendiri.',
    targetAudience: 'Mahasiswa',
    goal: 'Menarik Pelanggan Baru',
    style: 'Edukatif & Mindset',
    duration: '30 detik',
  },
  {
    id: 'idea-3',
    title: 'Lifehack Kosan: Terima Bersih Tanpa Melangkah dari Kasur',
    hook: 'Buat kaum mager yang cuciannya menggunung, jangan tonton video ini sendirian!',
    concept: 'Menunjukkan kemudahan kurir antar-jemput langsung ke depan gerbang kosan.',
    targetAudience: 'Mahasiswa',
    goal: 'Menarik Pelanggan Baru',
    style: 'Sensori & Lifehack',
    duration: '30 detik',
  },
];

const INITIAL_SCRIPT: PipelineScript = {
  title: 'Naskah TikTok Laundry (Mahasiswa) - Paket Hemat',
  hook: '"Cucian numpuk di kosan pas lagi minggu ujian? Jangan pusing sendiri!"',
  problem: '"Waktu buat nugas dan istirahat aja mepet, apalagi mikirin cuci dan setrika baju."',
  solution: '"Untung ada laundry kami yang siap jemput dan cuci pakaianmu sampai bersih, rapi, dan wangi semerbak."',
  advantage: '"Paket kiloan hemat ramah kantong mahasiswa, layanan kilat 1 hari selesai, dan gratis antar-jemput kosan."',
  callToAction: '"Drop cucian kamu hari ini atau hubungi link di bio biar langsung kami jemput!"',
};

const INITIAL_SCENES: PipelineScene[] = [
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

const INITIAL_SHOTS: PipelineShot[] = [
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
    props: 'Kantong laundry bermerek & motor',
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
    props: 'Smartphone dengan tampilan profil bio',
    duration: '10 detik',
  },
];

interface StudioWorkspaceProps {
  userMode: UserMode;
  activeProject: ProjectItem | null;
  saveProject: (project: Partial<ProjectItem> & { title: string }, silent?: boolean) => ProjectItem | void;
  createProject?: (name: string) => ProjectItem;
  showToast: (msg: string) => void;
  creatorContext?: CreatorContext;
  setCreatorContext?: React.Dispatch<React.SetStateAction<CreatorContext>>;
  setActiveTab?: (tab: any) => void;
  setActiveProjectId?: (id: string | null) => void;
  projects?: ProjectItem[];
  characters?: CharacterDNA[];
  saveCharacter?: (char: Partial<CharacterDNA> & { name: string }) => void;
  assignCharacterToProject?: (projectId: string, char: CharacterDNA) => void;
  onOpenVoiceOver?: (text?: string) => void;
}

export const StudioWorkspace: React.FC<StudioWorkspaceProps> = ({
  userMode,
  activeProject,
  saveProject,
  createProject,
  showToast,
  creatorContext,
  setCreatorContext,
  setActiveTab: setNavTab,
  setActiveProjectId,
  projects = [],
  characters = [],
  assignCharacterToProject,
  onOpenVoiceOver,
}) => {
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isCharacterPickerOpen, setIsCharacterPickerOpen] = useState(false);

  // Active Character for Visual & Storyboard Consistency
  const activeCharId = activeProject?.characterDnaId || creatorContext?.karakterDnaId || creatorContext?.characterLock?.id;
  const activeCharName = activeProject?.characterName || creatorContext?.karakter;
  const activeCharacter = characters.find(
    (c) => Boolean(c) && (c.id === activeCharId || (activeCharName && c.name && c.name.toLowerCase() === activeCharName.toLowerCase()))
  );

  // Characters associated with this project (supports multiple characters)
  const projectCharacterIds = activeProject?.characterIds || (activeProject?.characterDnaId ? [activeProject.characterDnaId] : []);
  const projectCharacters = characters.filter((c) => Boolean(c && c.id && projectCharacterIds.includes(c.id)));

  const handleSelectCharacter = (characterId: string) => {
    if (!characterId) {
      // Clear character from shots that were using previous project character
      const updatedShots = shotList.map((s) => {
        if (!s.characterId || (activeCharId && s.characterId === activeCharId)) {
          return {
            ...s,
            characterId: undefined,
            characterName: undefined,
            character: undefined,
          };
        }
        return s;
      });
      setShotList(updatedShots);

      if (activeProject?.id) {
        saveProject({
          id: activeProject.id,
          title: activeProject.title,
          characterDnaId: undefined,
          characterName: undefined,
          characterIds: [],
          characters: [],
          pipelineShots: updatedShots,
        }, true);
      }
      if (setCreatorContext) {
        setCreatorContext((prev) => ({
          ...prev,
          karakter: undefined,
          karakterDnaId: undefined,
          character: undefined,
          characterLock: undefined,
          pipelineShotList: updatedShots,
        }));
      }
      showToast('Karakter visual dilepas dari project');
      return;
    }

    const found = characters.find((c) => c.id === characterId);
    if (!found) return;

    const charImageUrl = found.imageUrl || found.imageReference;
    const charVisualNotes = found.visualNotes || found.notes || found.visualDescription;

    // Update shots in shotList to synchronize with newly selected project character (unless individually customized)
    const updatedShots = shotList.map((s) => {
      if (!s.characterId || (activeCharId && s.characterId === activeCharId)) {
        return {
          ...s,
          characterId: found.id,
          characterName: found.name,
          character: {
            id: found.id,
            name: found.name,
            description: found.description,
            visualNotes: charVisualNotes,
            imageUrl: charImageUrl,
          },
        };
      }
      return s;
    });
    setShotList(updatedShots);

    // Maintain multiple characters if already assigned
    const currentIds = activeProject?.characterIds || (activeProject?.characterDnaId ? [activeProject.characterDnaId] : []);
    const updatedIds = currentIds.includes(found.id) ? currentIds : [...currentIds, found.id];
    const updatedChars = updatedIds.map((id) => {
      const charObj = characters.find((c) => c.id === id);
      return charObj ? { id: charObj.id, name: charObj.name, imageUrl: charObj.imageUrl || charObj.imageReference } : null;
    }).filter(Boolean);

    const targetProjId = activeProject?.id;
    const projTitle = activeProject?.title || selectedIdea?.title || topicInput || 'Project Video Studio';

    if (targetProjId && assignCharacterToProject) {
      assignCharacterToProject(targetProjId, found);
    } else {
      const savedProj = saveProject({
        id: targetProjId,
        title: projTitle,
        characterDnaId: found.id,
        characterName: found.name,
        characterIds: updatedIds,
        characters: updatedChars as any,
        pipelineShots: updatedShots,
      }, true);
      if (savedProj && (savedProj as any).id && setActiveProjectId) {
        setActiveProjectId((savedProj as any).id);
      }
    }

    if (setCreatorContext) {
      setCreatorContext((prev) => ({
        ...prev,
        karakter: found.name,
        karakterDnaId: found.id,
        character: {
          id: found.id,
          name: found.name,
          description: found.description,
          visualNotes: charVisualNotes,
          imageUrl: charImageUrl,
        },
        characterLock: {
          id: found.id,
          name: found.name,
          description: found.description,
          notes: charVisualNotes,
          speakingStyle: found.speakingStyle,
          imageUrl: charImageUrl,
        },
        pipelineShotList: updatedShots,
      }));
    }
    showToast(`Karakter "${found.name}" dipilih sebagai referensi visual project!`);
  };

  const handleAssignCharacterToShot = (shotIdx: number, characterId: string) => {
    const isNone = characterId === 'none';
    const chosenChar = isNone ? null : (characterId ? characters.find((c) => c.id === characterId) : null);

    const updatedShots = shotList.map((s, i) => {
      if (i === shotIdx) {
        if (isNone) {
          return {
            ...s,
            characterId: 'none',
            characterName: undefined,
            character: undefined,
          };
        }
        if (!characterId) {
          // Revert to project character if available
          return {
            ...s,
            characterId: activeCharacter ? activeCharacter.id : undefined,
            characterName: activeCharacter ? activeCharacter.name : undefined,
            character: activeCharacter
              ? {
                  id: activeCharacter.id,
                  name: activeCharacter.name,
                  description: activeCharacter.description,
                  visualNotes: activeCharacter.visualNotes || activeCharacter.notes,
                  imageUrl: activeCharacter.imageUrl || activeCharacter.imageReference,
                }
              : undefined,
          };
        }
        return {
          ...s,
          characterId: characterId,
          characterName: chosenChar?.name || undefined,
          character: chosenChar
            ? {
                id: chosenChar.id,
                name: chosenChar.name,
                description: chosenChar.description,
                visualNotes: chosenChar.visualNotes || chosenChar.notes,
                imageUrl: chosenChar.imageUrl || chosenChar.imageReference,
              }
            : undefined,
        };
      }
      return s;
    });
    persistShotUpdate(updatedShots);
    if (isNone) {
      showToast(`Mode tanpa karakter untuk ${shotList[shotIdx]?.shotNumber || 'shot'}`);
    } else if (chosenChar) {
      showToast(`Karakter "${chosenChar.name}" disematkan ke ${shotList[shotIdx]?.shotNumber || 'shot'}`);
    } else {
      showToast(`Mengikuti karakter project untuk ${shotList[shotIdx]?.shotNumber || 'shot'}`);
    }
  };

  // Stepper state: 'idea' | 'script' | 'storyboard' | 'shotlist' | 'videoproduction'
  const [pipelineStage, setPipelineStage] = useState<'idea' | 'script' | 'storyboard' | 'shotlist' | 'videoproduction'>(() => {
    if (activeProject?.currentStage) {
      return activeProject.currentStage as any;
    }
    if (creatorContext?.pipelineStage) {
      return creatorContext.pipelineStage as any;
    }
    const hasShots = (activeProject?.pipelineShots && activeProject.pipelineShots.length > 0) ||
      (creatorContext?.pipelineShotList && creatorContext.pipelineShotList.length > 0);
    return hasShots ? 'shotlist' : 'idea';
  });

  const handleStageChange = (stage: 'idea' | 'script' | 'storyboard' | 'shotlist' | 'videoproduction') => {
    setPipelineStage(stage);
    if (setCreatorContext) {
      setCreatorContext((prev) => ({
        ...prev,
        pipelineStage: stage,
      }));
    }
    if (activeProject?.id) {
      saveProject({
        id: activeProject.id,
        title: activeProject.title,
        currentStage: stage,
      }, true);
    }
  };

  const handleCreateNewProject = (name: string) => {
    if (createProject) {
      createProject(name);
    } else {
      saveProject({
        title: name,
        name: name,
        description: 'Project baru di HEJO AI',
        currentStage: 'idea',
      });
    }
    setPipelineStage('idea');
    setShotImages({});
  };

  // Video Production Timeline Player & Video Pack SubTab State
  const [videoCurrentShotIndex, setVideoCurrentShotIndex] = useState(0);
  const [videoIsPlaying, setVideoIsPlaying] = useState(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoPlaybackSpeed, setVideoPlaybackSpeed] = useState<number>(1);
  const [videoProductionSubTab, setVideoProductionSubTab] = useState<'timeline' | 'videopack'>('timeline');

  // Simple Mode & UX Simplification States (Requirements 2, 4, 6, 8)
  const [expandedDetails, setExpandedDetails] = useState<Record<number, boolean>>({});
  const [visualProgressText, setVisualProgressText] = useState<string | null>(null);
  const [proSettingsOpen, setProSettingsOpen] = useState(false);
  const [isAutoPipelineRunning, setIsAutoPipelineRunning] = useState(false);
  
  // Context Inputs
  const [topicInput, setTopicInput] = useState(
    activeProject?.title || creatorContext?.produk || 'Bisnis Laundry Mahasiswa'
  );
  const [targetAudience, setTargetAudience] = useState(
    creatorContext?.targetAudiens || 'Mahasiswa'
  );
  const [platform, setPlatform] = useState(
    creatorContext?.platform || 'TikTok'
  );
  const [goal, setGoal] = useState(
    creatorContext?.tujuan || 'Menarik Pelanggan Baru'
  );

  const [isLoading, setIsLoading] = useState(false);
  const [copiedStage, setCopiedStage] = useState<string | null>(null);

  // 1. Pipeline State: IDEAS
  const [ideas, setIdeas] = useState<PipelineIdea[]>(() => {
    if (activeProject?.pipelineIdeas && activeProject.pipelineIdeas.length > 0) {
      return activeProject.pipelineIdeas;
    }
    if (creatorContext?.generatedIdeas && creatorContext.generatedIdeas.length > 0) {
      return creatorContext.generatedIdeas;
    }
    return INITIAL_IDEAS;
  });

  const [selectedIdea, setSelectedIdea] = useState<PipelineIdea>(() => {
    if (creatorContext?.selectedIdea) {
      return creatorContext.selectedIdea;
    }
    return ideas[0] || INITIAL_IDEAS[0];
  });

  // 2. Pipeline State: SCRIPT (5 Timed Blocks)
  const [script, setScript] = useState<PipelineScript>(() => {
    if (activeProject?.pipelineScript) {
      return activeProject.pipelineScript;
    }
    if (creatorContext?.pipelineScript) {
      return creatorContext.pipelineScript;
    }
    return INITIAL_SCRIPT;
  });

  // 3. Pipeline State: STORYBOARD
  const [scenes, setScenes] = useState<PipelineScene[]>(() => {
    if (activeProject?.pipelineScenes && activeProject.pipelineScenes.length > 0) {
      return activeProject.pipelineScenes;
    }
    if (creatorContext?.pipelineStoryboard && creatorContext.pipelineStoryboard.length > 0) {
      return creatorContext.pipelineStoryboard;
    }
    return INITIAL_SCENES;
  });

  // 4. Pipeline State: SHOT LIST (with persisted images)
  const [shotList, setShotList] = useState<PipelineShot[]>(() => {
    if (activeProject?.pipelineShots && activeProject.pipelineShots.length > 0) {
      console.log('[HEJO Persistence Debug] Init shotList from activeProject. Count:', activeProject.pipelineShots.length);
      return activeProject.pipelineShots;
    }
    if (creatorContext?.pipelineShotList && creatorContext.pipelineShotList.length > 0) {
      console.log('[HEJO Persistence Debug] Init shotList from creatorContext. Count:', creatorContext.pipelineShotList.length);
      return creatorContext.pipelineShotList;
    }
    const projWithShots = projects?.find((p) => Boolean(p && p.pipelineShots && p.pipelineShots.length > 0));
    if (projWithShots?.pipelineShots && projWithShots.pipelineShots.length > 0) {
      console.log('[HEJO Persistence Debug] Init shotList from projects list. Count:', projWithShots.pipelineShots.length);
      return projWithShots.pipelineShots;
    }
    return INITIAL_SHOTS;
  });

  // Shot Visuals State (per shot index)
  const [shotImages, setShotImages] = useState<
    Record<number, { url?: string; loading?: boolean; error?: string }>
  >(() => {
    const map: Record<number, { url?: string; loading?: boolean; error?: string }> = {};
    const projWithShots = projects?.find((p) => Boolean(p && p.pipelineShots && p.pipelineShots.length > 0));
    const sourceShots = activeProject?.pipelineShots || creatorContext?.pipelineShotList || projWithShots?.pipelineShots;
    if (sourceShots && sourceShots.length > 0) {
      sourceShots.forEach((s, idx) => {
        const url = s.imageUrl || (s as any).image;
        if (url && url !== '[IDB_IMAGE]') {
          map[idx] = { url, loading: false };
        }
      });
    }
    return map;
  });
  const [isGeneratingAllImages, setIsGeneratingAllImages] = useState(false);

  // Narration Package State (Requirement 9)
  const [narrationPkg, setNarrationPkg] = useState<NarrationPackage | null>(() => {
    if (activeProject?.narration) {
      return {
        fullScript: activeProject.narration.script || '',
        voiceDirection: activeProject.narration.voiceDirection || 'Suara ramah dan jelas',
        tone: activeProject.narration.tone || 'Hangat dan meyakinkan',
        pace: activeProject.narration.pace || 'Tempo normal',
        characterName: activeProject.characterName,
        scenesNarration: [],
      };
    }
    return generateNarrationPackage(
      INITIAL_SCRIPT,
      INITIAL_SCENES,
      { targetAudiens: targetAudience, platform },
      activeCharacter
    );
  });

  // Sync from creatorContext or activeProject if present
  useEffect(() => {
    const projWithShots = projects?.find((p) => Boolean(p && p.pipelineShots && p.pipelineShots.length > 0));
    const sourceShots = activeProject?.pipelineShots || creatorContext?.pipelineShotList || projWithShots?.pipelineShots;
    if (sourceShots && sourceShots.length > 0) {
      console.log('[HEJO Persistence Debug] StudioWorkspace useEffect syncing shots. Count:', sourceShots.length);
      sourceShots.forEach((s, idx) => {
        const url = s.imageUrl || (s as any).image;
        if (url && url !== '[IDB_IMAGE]') {
          console.log(`[HEJO Persistence Debug] Active shot ${idx} (${s.shotNumber}) has image URL:`, url);
        }
      });

      setShotList(sourceShots);
      setShotImages((prev) => {
        const next = { ...prev };
        sourceShots.forEach((s, idx) => {
          const url = s.imageUrl || (s as any).image;
          if (url && url !== '[IDB_IMAGE]') {
            next[idx] = { url, loading: false };
          }
        });
        return next;
      });
    }

    if (activeProject?.pipelineScript) {
      setScript(activeProject.pipelineScript);
    } else if (creatorContext?.pipelineScript) {
      setScript(creatorContext.pipelineScript);
    }

    if (activeProject?.pipelineScenes && activeProject.pipelineScenes.length > 0) {
      setScenes(activeProject.pipelineScenes);
    } else if (creatorContext?.pipelineStoryboard && creatorContext.pipelineStoryboard.length > 0) {
      setScenes(creatorContext.pipelineStoryboard);
    }

    if (activeProject?.pipelineIdeas && activeProject.pipelineIdeas.length > 0) {
      setIdeas(activeProject.pipelineIdeas);
    } else if (creatorContext?.generatedIdeas && creatorContext.generatedIdeas.length > 0) {
      setIdeas(creatorContext.generatedIdeas);
    }

    if (creatorContext?.selectedIdea) {
      setSelectedIdea(creatorContext.selectedIdea);
    }
    if (creatorContext?.pipelineStage) {
      setPipelineStage(creatorContext.pipelineStage as any);
    }

    if (activeProject?.narration) {
      setNarrationPkg({
        fullScript: activeProject.narration.script || '',
        voiceDirection: activeProject.narration.voiceDirection || 'Suara ramah dan jelas',
        tone: activeProject.narration.tone || 'Hangat dan meyakinkan',
        pace: activeProject.narration.pace || 'Tempo normal',
        characterName: activeProject.characterName,
        scenesNarration: [],
      });
    } else if (activeProject?.pipelineScript && activeProject?.pipelineScenes) {
      setNarrationPkg(
        generateNarrationPackage(
          activeProject.pipelineScript,
          activeProject.pipelineScenes,
          { targetAudiens: targetAudience, platform },
          activeCharacter
        )
      );
    }
  }, [activeProject, creatorContext, projects]);

  // IndexedDB image recovery on mount
  useEffect(() => {
    getAllVisualImagesFromDb().then((imageMap) => {
      if (!imageMap || Object.keys(imageMap).length === 0) return;

      setShotList((prev) => {
        let changed = false;
        const updated = prev.map((shot, idx) => {
          const cur = shot.imageUrl || (shot as any).image;
          if (!cur || cur === '[IDB_IMAGE]') {
            const key1 = `shot_${shot.shotNumber}_${shot.subject}`;
            const key2 = `proj_${activeProject?.id}_shot_${idx}`;
            const key3 = `ctx_shot_${idx}`;
            const key4 = `shot_${shot.shotNumber}`;
            const key5 = `shot_idx_${idx}`;
            const found = imageMap[key1] || imageMap[key2] || imageMap[key3] || imageMap[key4] || imageMap[key5];
            if (found) {
              changed = true;
              return { ...shot, imageUrl: found, image: found };
            }
          }
          return shot;
        });
        return changed ? updated : prev;
      });

      setShotImages((prev) => {
        const next = { ...prev };
        let changed = false;
        shotList.forEach((shot, idx) => {
          const cur = next[idx]?.url;
          if (!cur || cur === '[IDB_IMAGE]') {
            const key1 = `shot_${shot.shotNumber}_${shot.subject}`;
            const key2 = `proj_${activeProject?.id}_shot_${idx}`;
            const key3 = `ctx_shot_${idx}`;
            const key4 = `shot_${shot.shotNumber}`;
            const key5 = `shot_idx_${idx}`;
            const found = imageMap[key1] || imageMap[key2] || imageMap[key3] || imageMap[key4] || imageMap[key5];
            if (found) {
              changed = true;
              next[idx] = { url: found, loading: false };
            }
          }
        });
        return changed ? next : prev;
      });
    }).catch(() => {});
  }, [activeProject?.id]);

  // Video Production Duration Calculation & Timeline Timer
  const parsedDurations = shotList.map((s) => {
    const match = s.duration?.match(/\d+/);
    const num = match ? parseInt(match[0], 10) : 5;
    return isNaN(num) || num <= 0 ? 5 : num;
  });
  const totalVideoDuration = parsedDurations.reduce((acc, cur) => acc + cur, 0) || 30;

  // Cumulative timestamps: [0, 3, 10, 20, 30]
  const cumulativeTimes: number[] = [0];
  parsedDurations.forEach((d, i) => {
    cumulativeTimes.push(cumulativeTimes[i] + d);
  });

  // Timer loop for video playback
  useEffect(() => {
    let interval: any = null;
    if (videoIsPlaying) {
      interval = setInterval(() => {
        setVideoCurrentTime((prev) => {
          const nextTime = Math.round((prev + 0.1 * videoPlaybackSpeed) * 10) / 10;
          if (nextTime >= totalVideoDuration) {
            setVideoIsPlaying(false);
            return totalVideoDuration;
          }
          // Find matching shot index based on cumulative time
          for (let i = 0; i < parsedDurations.length; i++) {
            if (nextTime >= cumulativeTimes[i] && nextTime < cumulativeTimes[i + 1]) {
              setVideoCurrentShotIndex(i);
              break;
            }
          }
          return nextTime;
        });
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [videoIsPlaying, videoPlaybackSpeed, totalVideoDuration, parsedDurations, cumulativeTimes]);

  const handleSeekToShot = (idx: number) => {
    const targetIdx = Math.max(0, Math.min(idx, shotList.length - 1));
    setVideoCurrentShotIndex(targetIdx);
    setVideoCurrentTime(cumulativeTimes[targetIdx] || 0);
  };

  const handleTogglePlayVideo = () => {
    if (videoCurrentTime >= totalVideoDuration) {
      setVideoCurrentTime(0);
      setVideoCurrentShotIndex(0);
    }
    setVideoIsPlaying((prev) => !prev);
  };

  const handleRestartVideo = () => {
    setVideoCurrentTime(0);
    setVideoCurrentShotIndex(0);
    setVideoIsPlaying(true);
  };

  const formatTimecode = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Actions
  const handleGenerateIdeas = async () => {
    setIsLoading(true);
    try {
      const res = await fetchPipelineIdeas({
        produk: topicInput,
        targetAudiens: targetAudience,
        platform,
        tujuan: goal,
      });
      if (res && res.length > 0) {
        setIdeas(res);
        setSelectedIdea(res[0]);
        showToast('3 Ide Konten berhasil diracik!');
      }
    } catch {
      showToast('Gagal meracik ide baru');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectIdeaAndGenerateScript = async (idea: PipelineIdea) => {
    setSelectedIdea(idea);
    setIsLoading(true);
    try {
      const newScript = await fetchPipelineScript(
        {
          produk: topicInput,
          targetAudiens: targetAudience,
          platform,
          tujuan: goal,
          ide: idea.title,
        },
        idea
      );
      setScript(newScript);
      handleStageChange('script');
      showToast('Naskah berhasil diracik dari ide terpilih!');
    } catch {
      showToast('Gagal membuat naskah otomatis');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateStoryboard = async () => {
    setIsLoading(true);
    try {
      const newStoryboard = await fetchPipelineStoryboard(
        {
          produk: topicInput,
          targetAudiens: targetAudience,
          platform,
          tujuan: goal,
        },
        script
      );
      setScenes(newStoryboard);
      handleStageChange('storyboard');
      showToast('Storyboard 4 Scene berhasil diracik!');
    } catch {
      showToast('Gagal membuat storyboard');
    } finally {
      setIsLoading(false);
    }
  };

  const persistShotUpdate = (updatedShots: PipelineShot[]) => {
    console.log('[HEJO Persistence Debug] persistShotUpdate called with', updatedShots.length, 'shots');
    updatedShots.forEach((s, idx) => {
      console.log(`[HEJO Persistence Debug] Shot ${idx} (${s.shotNumber}) has imageUrl:`, s.imageUrl || (s as any).image);
    });

    // 1. Update local shot list
    setShotList(updatedShots);

    // 2. Persist to creatorContext
    if (setCreatorContext) {
      setCreatorContext((prev) => ({
        ...prev,
        pipelineShotList: updatedShots,
        pipelineStage: 'shotlist',
      }));
    }

    // 3. Persist to project/store
    const fullScriptText = `[0–3 detik] Hook\n${script.hook}\n\n[3–10 detik] Masalah\n${script.problem}\n\n[10–20 detik] Solusi\n${script.solution}\n\n[20–27 detik] Keunggulan\n${script.advantage}\n\n[27–30 detik] Call to Action\n${script.callToAction}`;

    const saved = saveProject({
      id: activeProject?.id,
      title: activeProject?.title || selectedIdea?.title || topicInput || 'Project Video Studio',
      description: `Target: ${targetAudience} · Platform: ${platform} · 4 Scene Storyboard + Shot List`,
      category: 'video',
      status: 'ready',
      script: fullScriptText,
      pipelineIdeas: ideas,
      pipelineScript: script,
      pipelineScenes: scenes,
      pipelineShots: updatedShots,
      characterDnaId: activeCharacter?.id || activeProject?.characterDnaId,
      characterName: activeCharacter?.name || activeProject?.characterName,
      characterIds: projectCharacterIds,
      characters: projectCharacters.map((c) => ({
        id: c.id,
        name: c.name,
        imageUrl: c.imageUrl || c.imageReference,
      })),
      selectedIdeaTitle: selectedIdea?.title,
      tags: ['Creator Engine', platform, targetAudience],
    }, true);

    if (saved && (saved as any).id && setActiveProjectId) {
      setActiveProjectId((saved as any).id);
    }

    // 4. Persist to IndexedDB with multiple key strategies
    updatedShots.forEach((s, idx) => {
      const url = s.imageUrl || (s as any).image;
      if (url && url !== '[IDB_IMAGE]') {
        saveVisualImageToDb(`shot_${s.shotNumber}_${s.subject}`, url);
        saveVisualImageToDb(`shot_${s.shotNumber}`, url);
        saveVisualImageToDb(`shot_idx_${idx}`, url);
        saveVisualImageToDb(`ctx_shot_${idx}`, url);
        const targetProjId = activeProject?.id || (saved && (saved as any).id);
        if (targetProjId) {
          saveVisualImageToDb(`proj_${targetProjId}_shot_${idx}`, url);
        }
      }
    });
  };

  // Auto Full Pipeline Orchestrator (Requirement 2 & 3)
  const runAutoFullPipeline = async (customPrompt?: string) => {
    setIsAutoPipelineRunning(true);
    const promptText = customPrompt || topicInput || activeProject?.title || 'Video Promosi Kopi Susu Aren 30 Detik';
    
    try {
      // 1. Generate Ideas
      const newIdeas = await fetchPipelineIdeas({
        produk: promptText,
        targetAudiens: targetAudience,
        platform,
        tujuan: goal,
        karakter: activeCharacter?.name,
        karakterDnaId: activeCharacter?.id,
      });
      setIdeas(newIdeas);
      const chosenIdea = newIdeas[0] || INITIAL_IDEAS[0];
      setSelectedIdea(chosenIdea);

      // 2. Generate Script
      const newScript = await fetchPipelineScript(
        {
          produk: promptText,
          targetAudiens: targetAudience,
          platform,
          tujuan: goal,
          karakter: activeCharacter?.name,
          karakterDnaId: activeCharacter?.id,
        },
        chosenIdea
      );
      setScript(newScript);

      // 3. Generate Storyboard
      const newScenes = await fetchPipelineStoryboard(
        {
          produk: promptText,
          targetAudiens: targetAudience,
          platform,
          tujuan: goal,
          karakter: activeCharacter?.name,
          karakterDnaId: activeCharacter?.id,
        },
        newScript
      );
      setScenes(newScenes);

      // 4. Generate Shot List with Smart Motion and Prompts
      const rawShots = await fetchPipelineShotList(
        {
          produk: promptText,
          targetAudiens: targetAudience,
          platform,
          tujuan: goal,
          karakter: activeCharacter?.name,
          karakterDnaId: activeCharacter?.id,
        },
        newScenes
      );

      const enrichedShots: PipelineShot[] = rawShots.map((s, idx) => {
        const sceneObj = newScenes[idx] || scenes[idx];
        const motion = getSmartMotionForScene(sceneObj, s, idx);
        const isNone = s.characterId === 'none';
        const shotChar = isNone
          ? null
          : (s.characterId ? characters.find((c) => c.id === s.characterId) : null) || activeCharacter;

        const charName = shotChar?.name;
        const charNotes = shotChar?.visualNotes || shotChar?.notes;
        const imagePrompt = charName
          ? `Cinematic ${s.shotType || 'Medium Shot'}. Character: ${charName} (${charNotes || 'consistent appearance'}). Subject: ${s.subject}. Camera: ${motion.cameraAngle}, ${motion.cameraMovement}. Lighting: ${s.lighting}. Location: ${s.location}. Props: ${s.props}. 4k, clean focus.`
          : `Cinematic ${s.shotType || 'Medium Shot'}. Subject: ${s.subject}. Camera: ${motion.cameraAngle}, ${motion.cameraMovement}. Lighting: ${s.lighting}. Location: ${s.location}. Props: ${s.props}. 4k, clean focus.`;

        const videoPrompt = `[AI Video: ${s.shotNumber}] [Camera: ${s.shotType || 'Medium Shot'}, ${motion.cameraAngle}, ${motion.cameraMovement}] [Tempo: ${motion.speed}] Subject: ${s.subject}.${charName ? ` Character: ${charName}.` : ''} Lighting: ${s.lighting}. Location: ${s.location}. 24fps motion blur, realistic physics.`;

        return {
          ...s,
          cameraAngle: motion.cameraAngle,
          cameraMovement: motion.cameraMovement,
          motionSuggestion: motion.description,
          imagePrompt,
          videoPrompt,
          voiceOver: sceneObj?.voiceOver || '',
          negativePrompt: STANDARD_NEGATIVE_PROMPT,
          status: 'ready',
          characterId: shotChar?.id,
          characterName: shotChar?.name,
          character: shotChar ? {
            id: shotChar.id,
            name: shotChar.name,
            visualNotes: charNotes,
            imageUrl: shotChar.imageUrl || shotChar.imageReference,
          } : undefined,
        };
      });

      setShotList(enrichedShots);
      handleStageChange('shotlist');
      persistShotUpdate(enrichedShots);

      const narrationPkg = generateNarrationPackage(newScript, newScenes, { targetAudiens: targetAudience, platform }, activeCharacter);
      setNarrationPkg(narrationPkg);
      saveProject({
        id: activeProject?.id,
        title: chosenIdea.title || promptText,
        description: `Target: ${targetAudience} · Platform: ${platform} · 4 Scene Storyboard + Shot List`,
        category: 'video',
        status: 'ready',
        pipelineIdeas: newIdeas,
        pipelineScript: newScript,
        pipelineScenes: newScenes,
        pipelineShots: enrichedShots,
        narration: {
          script: narrationPkg.fullScript,
          voiceDirection: narrationPkg.voiceDirection,
          tone: narrationPkg.tone,
          pace: narrationPkg.pace,
        },
      }, true);

      if (setCreatorContext) {
        setCreatorContext((prev) => ({
          ...prev,
          autoRunPipeline: false,
          pipelineStage: 'shotlist',
          pipelineIdeas: newIdeas,
          pipelineScript: newScript,
          pipelineStoryboard: newScenes,
          pipelineShotList: enrichedShots,
        }));
      }

      showToast('✨ Konsep, naskah, storyboard, dan prompt selesai disiapkan! Silakan klik "✨ Buat Semua Visual".');
    } catch (err) {
      console.error('Auto pipeline error:', err);
      showToast('Sebagian proses otomatis selesai disiapkan.');
    } finally {
      setIsAutoPipelineRunning(false);
    }
  };

  useEffect(() => {
    if (creatorContext?.autoRunPipeline) {
      runAutoFullPipeline(creatorContext.rawPrompt || creatorContext.produk);
    }
  }, [creatorContext?.autoRunPipeline]);

  const handleGenerateShotList = async () => {
    setIsLoading(true);
    try {
      const newShots = await fetchPipelineShotList(
        {
          produk: topicInput,
          targetAudiens: targetAudience,
          platform,
          tujuan: goal,
          karakter: activeCharacter?.name,
          karakterDnaId: activeCharacter?.id,
          characterLock: activeCharacter
            ? {
                id: activeCharacter.id,
                name: activeCharacter.name,
                description: activeCharacter.description,
                notes: activeCharacter.visualNotes || activeCharacter.notes,
                imageUrl: activeCharacter.imageUrl || activeCharacter.imageReference,
              }
            : undefined,
        },
        scenes
      );

      // Pre-enrich new shots with active character and smart motion
      const enrichedShots: PipelineShot[] = newShots.map((s, idx) => {
        const sceneObj = scenes[idx];
        const motion = getSmartMotionForScene(sceneObj, s, idx);
        const isNone = s.characterId === 'none';
        const shotChar = isNone
          ? null
          : (s.characterId ? characters.find((c) => c.id === s.characterId) : null) || activeCharacter;

        const charName = shotChar?.name;
        const charNotes = shotChar?.visualNotes || shotChar?.notes;
        const imagePrompt = charName
          ? `Cinematic ${s.shotType || 'Medium Shot'}. Character: ${charName} (${charNotes || 'consistent appearance'}). Subject: ${s.subject}. Camera: ${motion.cameraAngle}, ${motion.cameraMovement}. Lighting: ${s.lighting}. Location: ${s.location}. Props: ${s.props}.`
          : `Cinematic ${s.shotType || 'Medium Shot'}. Subject: ${s.subject}. Camera: ${motion.cameraAngle}, ${motion.cameraMovement}. Lighting: ${s.lighting}. Location: ${s.location}. Props: ${s.props}.`;

        const videoPrompt = `[AI Video: ${s.shotNumber}] [Camera: ${s.shotType || 'Medium Shot'}, ${motion.cameraAngle}, ${motion.cameraMovement}] [Tempo: ${motion.speed}] Subject: ${s.subject}.${charName ? ` Character: ${charName}.` : ''} Lighting: ${s.lighting}. Location: ${s.location}. 24fps motion blur.`;

        return {
          ...s,
          cameraAngle: motion.cameraAngle,
          cameraMovement: motion.cameraMovement,
          motionSuggestion: motion.description,
          imagePrompt,
          videoPrompt,
          voiceOver: sceneObj?.voiceOver || '',
          negativePrompt: STANDARD_NEGATIVE_PROMPT,
          status: 'ready',
          characterId: shotChar?.id,
          characterName: shotChar?.name,
          character: shotChar
            ? {
                id: shotChar.id,
                name: shotChar.name,
                description: shotChar.description,
                visualNotes: charNotes,
                imageUrl: shotChar.imageUrl || shotChar.imageReference,
              }
            : undefined,
        };
      });

      setShotList(enrichedShots);
      handleStageChange('shotlist');
      persistShotUpdate(enrichedShots);
      showToast('Shot List produksi berhasil diracik!');
    } catch {
      showToast('Gagal membuat shot list');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSingleShotImage = async (shot: PipelineShot, idx: number) => {
    setShotImages((prev) => ({
      ...prev,
      [idx]: { loading: true, error: undefined, url: prev[idx]?.url },
    }));

    try {
      const isNone = shot.characterId === 'none';
      const shotChar = isNone
        ? null
        : (shot.characterId ? characters.find((c) => c.id === shot.characterId) : null) ||
          activeCharacter ||
          (shot.character
            ? ({
                id: shot.character.id || 'custom',
                name: shot.character.name,
                description: shot.character.description,
                visualNotes: shot.character.visualNotes,
                imageUrl: shot.character.imageUrl,
              } as CharacterDNA)
            : null);

      const charImageUrl = shotChar?.imageUrl || shotChar?.imageReference;
      const charVisualNotes = shotChar?.visualNotes || shotChar?.notes || shotChar?.visualDescription;

      const enrichedShot: PipelineShot = {
        ...shot,
        characterId: shotChar?.id,
        characterName: shotChar?.name,
        character: shotChar
          ? {
              id: shotChar.id,
              name: shotChar.name,
              description: shotChar.description,
              visualNotes: charVisualNotes,
              imageUrl: charImageUrl,
            }
          : undefined,
        visualPrompt: shotChar
          ? `Cinematic ${shot.shotType}. Character: ${shotChar.name}. Visual Features: ${charVisualNotes || ''}. Subject: ${shot.subject}. Camera: ${shot.cameraAngle}, ${shot.cameraMovement}. Lighting: ${shot.lighting}. Location: ${shot.location}. Props: ${shot.props}.`
          : `Cinematic ${shot.shotType}. Subject: ${shot.subject}. Camera: ${shot.cameraAngle}, ${shot.cameraMovement}. Lighting: ${shot.lighting}. Location: ${shot.location}. Props: ${shot.props}.`,
      };

      const enrichedContext: CreatorContext = {
        produk: topicInput,
        targetAudiens: targetAudience,
        platform,
        tujuan: goal,
        karakter: shotChar?.name,
        karakterDnaId: shotChar?.id,
        character: shotChar
          ? {
              id: shotChar.id,
              name: shotChar.name,
              description: shotChar.description,
              visualNotes: charVisualNotes,
              imageUrl: charImageUrl,
            }
          : undefined,
        characterLock: shotChar
          ? {
              id: shotChar.id,
              name: shotChar.name,
              description: shotChar.description,
              notes: charVisualNotes,
              imageUrl: charImageUrl,
            }
          : undefined,
      };

      const url = await fetchPipelineShotImage(enrichedShot, enrichedContext);

      console.log(`[HEJO Persistence Debug] Image URL received for shot ${shot.shotNumber}:`, url);

      setShotImages((prev) => ({
        ...prev,
        [idx]: { loading: false, url, error: undefined },
      }));

      const updatedShots = shotList.map((s, i) =>
        i === idx
          ? {
              ...s,
              imageUrl: url,
              image: url,
              status: 'completed',
              characterId: shotChar?.id,
              characterName: shotChar?.name,
              character: shotChar
                ? {
                    id: shotChar.id,
                    name: shotChar.name,
                    description: shotChar.description,
                    visualNotes: charVisualNotes,
                    imageUrl: charImageUrl,
                  }
                : undefined,
            }
          : s
      );
      persistShotUpdate(updatedShots);

      showToast(`Visual ${shot.shotNumber} berhasil dibuat!`);
    } catch (err: any) {
      console.error(`[HEJO Persistence Debug] Error generating shot ${shot.shotNumber}:`, err);
      setShotImages((prev) => ({
        ...prev,
        [idx]: {
          loading: false,
          error: 'Perlu dicoba lagi',
          url: prev[idx]?.url,
        },
      }));
      showToast(`Gagal membuat visual ${shot.shotNumber}. Silakan coba lagi.`);
    }
  };

  // Sequential Visual Generator with Step Progress (Requirement 6)
  const handleGenerateAllShotImages = async () => {
    if (isGeneratingAllImages || shotList.length === 0) return;

    setIsGeneratingAllImages(true);
    showToast(`Memulai pembuatan visual ${shotList.length} shot secara berurutan...`);

    const updatedShots = [...shotList];
    let successCount = 0;

    for (let idx = 0; idx < shotList.length; idx++) {
      const shot = shotList[idx];
      setVisualProgressText(`Visual ${idx + 1}/${shotList.length}`);
      setShotImages((prev) => ({
        ...prev,
        [idx]: { loading: true, error: undefined, url: prev[idx]?.url },
      }));

      try {
        const isNone = shot.characterId === 'none';
        const shotChar = isNone
          ? null
          : (shot.characterId ? characters.find((c) => c.id === shot.characterId) : null) ||
            activeCharacter ||
            (shot.character
              ? ({
                  id: shot.character.id || 'custom',
                  name: shot.character.name,
                  description: shot.character.description,
                  visualNotes: shot.character.visualNotes,
                  imageUrl: shot.character.imageUrl,
                } as CharacterDNA)
              : null);

        const charImageUrl = shotChar?.imageUrl || shotChar?.imageReference;
        const charVisualNotes = shotChar?.visualNotes || shotChar?.notes || shotChar?.visualDescription;

        const enrichedShot: PipelineShot = {
          ...shot,
          characterId: shotChar?.id,
          characterName: shotChar?.name,
          character: shotChar
            ? {
                id: shotChar.id,
                name: shotChar.name,
                description: shotChar.description,
                visualNotes: charVisualNotes,
                imageUrl: charImageUrl,
              }
            : undefined,
          visualPrompt: shotChar
            ? `Cinematic ${shot.shotType}. Character: ${shotChar.name}. Visual Features: ${charVisualNotes || ''}. Subject: ${shot.subject}. Camera: ${shot.cameraAngle}, ${shot.cameraMovement}. Lighting: ${shot.lighting}. Location: ${shot.location}. Props: ${shot.props}.`
            : `Cinematic ${shot.shotType}. Subject: ${shot.subject}. Camera: ${shot.cameraAngle}, ${shot.cameraMovement}. Lighting: ${shot.lighting}. Location: ${shot.location}. Props: ${shot.props}.`,
        };

        const enrichedContext: CreatorContext = {
          produk: topicInput,
          targetAudiens: targetAudience,
          platform,
          tujuan: goal,
          karakter: shotChar?.name,
          karakterDnaId: shotChar?.id,
          character: shotChar ? {
            id: shotChar.id,
            name: shotChar.name,
            description: shotChar.description,
            visualNotes: charVisualNotes,
            imageUrl: charImageUrl,
          } : undefined,
          characterLock: shotChar ? {
            id: shotChar.id,
            name: shotChar.name,
            description: shotChar.description,
            notes: charVisualNotes,
            imageUrl: charImageUrl,
          } : undefined,
        };

        const url = await fetchPipelineShotImage(enrichedShot, enrichedContext);

        setShotImages((prev) => ({
          ...prev,
          [idx]: { loading: false, url, error: undefined },
        }));

        updatedShots[idx] = {
          ...updatedShots[idx],
          imageUrl: url,
          image: url,
          status: 'completed',
          characterId: shotChar?.id,
          characterName: shotChar?.name,
        };
        successCount++;

        saveVisualImageToDb(`shot_${shot.shotNumber}_${shot.subject}`, url);
        saveVisualImageToDb(`shot_${shot.shotNumber}`, url);
        saveVisualImageToDb(`shot_idx_${idx}`, url);
        saveVisualImageToDb(`ctx_shot_${idx}`, url);
        if (activeProject?.id) {
          saveVisualImageToDb(`proj_${activeProject.id}_shot_${idx}`, url);
        }
      } catch (err: any) {
        console.error(`[HEJO Persistence Debug] Error generating shot ${shot.shotNumber}:`, err);
        setShotImages((prev) => ({
          ...prev,
          [idx]: {
            loading: false,
            error: 'Perlu dicoba lagi',
            url: prev[idx]?.url,
          },
        }));
        updatedShots[idx] = {
          ...updatedShots[idx],
          status: 'needs_retry',
        };
      }
    }

    persistShotUpdate(updatedShots);
    setIsGeneratingAllImages(false);
    setVisualProgressText(null);

    if (successCount === shotList.length) {
      showToast('Visual selesai 🎉 Siap lanjut ke Video!');
    } else {
      showToast(`Selesai: ${successCount}/${shotList.length} visual berhasil dibuat.`);
    }
  };

  const handleCopyContent = (text: string, stage: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStage(stage);
    showToast('Teks berhasil disalin ke clipboard!');
    setTimeout(() => setCopiedStage(null), 2000);
  };

  const handleSaveCurrentPipelineToProject = () => {
    const fullScriptText = `[0–3 detik] Hook\n${script.hook}\n\n[3–10 detik] Masalah\n${script.problem}\n\n[10–20 detik] Solusi\n${script.solution}\n\n[20–27 detik] Keunggulan\n${script.advantage}\n\n[27–30 detik] Call to Action\n${script.callToAction}`;

    const mergedShots = shotList.map((s, idx) => {
      const url = shotImages[idx]?.url || s.imageUrl || (s as any).image;
      return {
        ...s,
        imageUrl: url,
        image: url,
      };
    });

    setShotList(mergedShots);

    const saved = saveProject({
      id: activeProject?.id,
      title: `${selectedIdea.title || topicInput}`,
      description: `Target: ${targetAudience} · Platform: ${platform} · 4 Scene Storyboard + Shot List`,
      category: 'video',
      status: 'ready',
      script: fullScriptText,
      pipelineIdeas: ideas,
      pipelineScript: script,
      pipelineScenes: scenes,
      pipelineShots: mergedShots,
      selectedIdeaTitle: selectedIdea.title,
      tags: ['Creator Engine', platform, targetAudience],
    }, false);

    if (saved && (saved as any).id && setActiveProjectId) {
      setActiveProjectId((saved as any).id);
    }

    if (setCreatorContext) {
      setCreatorContext((prev) => ({
        ...prev,
        pipelineShotList: mergedShots,
        pipelineScript: script,
        pipelineStoryboard: scenes,
        pipelineIdeas: ideas,
        pipelineStage: pipelineStage,
      }));
    }

    // Persist all images in IndexedDB as well
    mergedShots.forEach((s, idx) => {
      const url = s.imageUrl;
      if (url && url !== '[IDB_IMAGE]') {
        saveVisualImageToDb(`shot_${s.shotNumber}_${s.subject}`, url);
        saveVisualImageToDb(`shot_${s.shotNumber}`, url);
        saveVisualImageToDb(`shot_idx_${idx}`, url);
        saveVisualImageToDb(`ctx_shot_${idx}`, url);
        const targetProjId = activeProject?.id || (saved && (saved as any).id);
        if (targetProjId) {
          saveVisualImageToDb(`proj_${targetProjId}_shot_${idx}`, url);
        }
      }
    });

    showToast(`Project "${selectedIdea.title || topicInput}" berhasil disimpan!`);
  };

  const handleDownloadProjectAudio = async (audioUrl: string, projectName: string) => {
    try {
      showToast('⬇️ Menyiapkan file audio Voice Over (.wav)...');
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${projectName.toLowerCase().replace(/\s+/g, '_')}_voiceover.wav`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
      showToast('✅ Audio Voice Over (.wav) berhasil diunduh!');
    } catch {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = `${projectName.toLowerCase().replace(/\s+/g, '_')}_voiceover.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('⬇️ Mengunduh file audio Voice Over (.wav)...');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* PROJECT WORKSPACE: Active Project & Sequential Progress Tracker */}
      <ProjectProgressBar
        project={activeProject}
        projects={projects}
        onSelectProject={(id) => {
          if (setActiveProjectId) setActiveProjectId(id);
        }}
        onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
        onNavigateStage={(stage) => handleStageChange(stage as any)}
        onOpenVoiceOver={onOpenVoiceOver}
        onNavigateTab={(tab) => {
          if (setNavTab) setNavTab(tab);
        }}
      />

      {/* 9 Alur Otomatis Progress Tracker (Requirement 2 & 13) */}
      <SimpleWorkflowProgress
        isAutoPipelineRunning={isAutoPipelineRunning}
        hasIdeas={ideas.length > 0}
        hasScript={Boolean(script?.hook)}
        hasStoryboard={scenes.length > 0}
        hasShotList={shotList.length > 0}
        hasVoiceOver={Boolean(activeProject?.voiceOver?.audioUrl)}
        imagesCompletedCount={Object.values(shotImages).filter((img) => Boolean(img?.url)).length}
        totalShotsCount={shotList.length}
        isGeneratingAllImages={isGeneratingAllImages}
        visualProgressText={visualProgressText}
        pipelineStage={pipelineStage}
        onGenerateAllVisuals={handleGenerateAllShotImages}
        onProceedToVideo={() => {
          handleStageChange('videoproduction');
          setVideoCurrentTime(0);
          setVideoCurrentShotIndex(0);
        }}
        onOpenVideoPack={() => {
          handleStageChange('videoproduction');
          setVideoProductionSubTab('videopack');
        }}
        onOpenVoiceOver={onOpenVoiceOver ? () => onOpenVoiceOver(activeProject?.voiceOver?.text || activeProject?.script || '') : undefined}
        userMode={userMode}
      />

      {/* Header Studio */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Clapperboard className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight font-serif">
              Studio Kreator
            </h1>
          </div>
          <p className="text-sm font-semibold text-emerald-700 mt-1">
            Alur Otomatis Creator Engine: IDE → SCRIPT → STORYBOARD → SHOT LIST → VIDEO PRODUKSI
          </p>
          <p className="text-xs text-stone-500 mt-0.5">
            Ubah ide mentah menjadi paket produksi video pendek siap rekam dalam 5 tahap terstruktur.
          </p>
        </div>

        {/* Global Save Button */}
        <button
          onClick={handleSaveCurrentPipelineToProject}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer hover:scale-[1.02]"
        >
          <BookmarkCheck className="w-4 h-4" />
          <span>💾 Simpan Seluruh Project</span>
        </button>
      </div>

      {/* Studio Project & Character Context Bar */}
      <div className="bg-stone-50 border border-stone-200/80 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-stone-600 flex-wrap">
          <span className="font-semibold text-stone-400">Project:</span>
          <span className="font-bold text-stone-800">{activeProject?.title || activeProject?.name || 'Project Studio'}</span>
          <span className="text-stone-300">|</span>
          <span className="font-semibold text-stone-400">Tahap:</span>
          <span className="font-bold text-emerald-700 capitalize">{pipelineStage}</span>
          <span className="text-stone-300">|</span>
          <span className="font-semibold text-stone-400">Voice Over:</span>
          {activeProject?.voiceOver?.audioUrl ? (
            <button
              type="button"
              onClick={() => onOpenVoiceOver && onOpenVoiceOver(activeProject.voiceOver?.text)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold hover:bg-emerald-200 transition-colors cursor-pointer"
              title="Voice Over sudah ada di project. Klik untuk dengarkan, unduh, atau ubah."
            >
              <span>Voice Over ✓</span>
              <span className="text-[10px] text-emerald-700">({activeProject.voiceOver.voiceCharacter})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                const combined = (scenes || []).map((s) => s.voiceOver).filter(Boolean).join(' ') || activeProject?.script || '';
                if (onOpenVoiceOver) onOpenVoiceOver(combined);
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold transition-colors cursor-pointer"
              title="Project belum memiliki Voice Over. Klik untuk buat dari naskah project."
            >
              <Mic className="w-3 h-3" />
              <span>+ Buat Voice Over</span>
            </button>
          )}
        </div>

        {/* Character Picker (Section 2 & 6: [foto] Bening Mentari ▼ or [+ Tambahkan Karakter]) */}
        <div className="relative flex items-center gap-2">
          <span className="font-bold text-stone-600">Karakter</span>
          
          <button
            type="button"
            onClick={() => setIsCharacterPickerOpen((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-stone-50 border border-stone-300 hover:border-emerald-600 rounded-xl shadow-2xs transition-all text-xs font-bold text-stone-800 cursor-pointer"
          >
            {activeCharacter ? (
              <>
                {activeCharacter.imageUrl || activeCharacter.imageReference ? (
                  <img
                    src={activeCharacter.imageUrl || activeCharacter.imageReference}
                    alt={activeCharacter.name}
                    className="w-5 h-5 rounded-md object-cover border border-stone-200"
                  />
                ) : (
                  <span className="w-5 h-5 rounded-md bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {activeCharacter.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="truncate max-w-[140px] sm:max-w-[200px]">{activeCharacter.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              </>
            ) : (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambahkan Karakter</span>
              </span>
            )}
          </button>

          {isCharacterPickerOpen && (
            <>
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setIsCharacterPickerOpen(false)} 
              />
              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-stone-200 rounded-2xl shadow-xl z-40 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2.5 py-1.5 border-b border-stone-100 flex items-center justify-between text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  <span>Pilih Karakter Studio</span>
                  {activeCharacter && (
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectCharacter('');
                        setIsCharacterPickerOpen(false);
                      }}
                      className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                    >
                      Lepas
                    </button>
                  )}
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1 py-1">
                  {characters.length === 0 ? (
                    <div className="p-3 text-center text-xs text-stone-400">
                      Belum ada karakter di perpustakaan.
                    </div>
                  ) : (
                    characters.map((c) => {
                      const isCurrent = activeCharacter?.id === c.id;

                      return (
                        <div
                          key={c.id}
                          onClick={() => {
                            handleSelectCharacter(c.id);
                            setIsCharacterPickerOpen(false);
                          }}
                          className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                            isCurrent ? 'bg-emerald-50 text-emerald-950 font-bold' : 'hover:bg-stone-50 text-stone-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {c.imageUrl || c.imageReference ? (
                              <img
                                src={c.imageUrl || c.imageReference}
                                alt={c.name}
                                className="w-7 h-7 rounded-lg object-cover border border-stone-200 shrink-0"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                                {c.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="truncate font-semibold">{c.name}</div>
                              <div className="text-[10px] text-stone-400 truncate">
                                {c.visualNotes || c.description || 'Karakter HEJO'}
                              </div>
                            </div>
                          </div>

                          {isCurrent && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="pt-1.5 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCharacterPickerOpen(false);
                      if (setNavTab) setNavTab('characters');
                    }}
                    className="w-full text-center py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Kelola Character Library</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* PIPELINE STEPPER NAVIGATOR */}
      <div className="bg-white border border-stone-200 rounded-2xl p-2 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1 sm:gap-2">
          {[
            { id: 'idea', num: '1', title: 'Ide Konten', icon: '💡', desc: '3 Konsep terarah' },
            { id: 'script', num: '2', title: 'Naskah 30s', icon: '✍️', desc: '5 Bagian waktu' },
            { id: 'storyboard', num: '3', title: 'Storyboard', icon: '🎬', desc: 'Visual & Aksi scene' },
            { id: 'shotlist', num: '4', title: 'Shot List', icon: '🎥', desc: 'Panduan kamera & visual' },
            { id: 'videoproduction', num: '5', title: 'Video Produksi', icon: '🎞️', desc: 'Timeline & Preview' },
          ].map((step) => {
            const isActive = pipelineStage === step.id;
            return (
              <button
                key={step.id}
                onClick={() => handleStageChange(step.id as any)}
                className={`p-3 rounded-xl text-left transition-all cursor-pointer flex items-center gap-3 ${
                  isActive
                    ? 'bg-emerald-50 border border-emerald-600/60 ring-2 ring-emerald-500/20 text-emerald-950 shadow-xs'
                    : 'bg-white hover:bg-stone-50 border border-transparent text-stone-600'
                }`}
              >
                <span className="text-xl shrink-0">{step.icon}</span>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">
                    {step.num}. {step.title}
                  </div>
                  <div className="text-[10px] text-stone-400 truncate">
                    {step.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          TAHAP 1: IDE GENERATOR
          ======================================================== */}
      {pipelineStage === 'idea' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Context Control Bar */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                Bisnis / Produk
              </label>
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="Contoh: Bisnis Laundry"
                className="w-full text-xs font-semibold px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                Target Audiens
              </label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Contoh: Mahasiswa"
                className="w-full text-xs font-semibold px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                Platform
              </label>
              <input
                type="text"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                placeholder="Contoh: TikTok"
                className="w-full text-xs font-semibold px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleGenerateIdeas}
                disabled={isLoading}
                className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isLoading ? 'Meracik...' : '🔄 Buat Ide Lain'}</span>
              </button>
            </div>
          </div>

          {/* 3 Ideas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {ideas.map((idea, idx) => {
              const isSelected = selectedIdea.id === idea.id;
              return (
                <div
                  key={idea.id}
                  className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-md'
                      : 'border-stone-200 hover:border-emerald-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        💡 IDE {idx + 1}
                      </span>
                      <span className="text-[11px] text-stone-400 font-medium">
                        ⏱️ {idea.duration}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-stone-900 leading-snug mb-2">
                      {idea.title}
                    </h3>

                    <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100 mb-3 text-xs italic text-stone-700">
                      "{idea.hook}"
                    </div>

                    <p className="text-xs text-stone-600 leading-relaxed mb-3">
                      <strong>Konsep:</strong> {idea.concept}
                    </p>

                    <div className="space-y-1 text-[11px] text-stone-500 border-t border-stone-100 pt-2.5">
                      <div>🎯 <strong>Target:</strong> {idea.targetAudience}</div>
                      <div>✨ <strong>Gaya:</strong> {idea.style}</div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-stone-100">
                    <button
                      onClick={() => handleSelectIdeaAndGenerateScript(idea)}
                      disabled={isLoading}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 hover:scale-[1.02]"
                    >
                      <span>💡 Pilih Ide {idx + 1} & Buat Naskah</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          TAHAP 2: SCRIPT GENERATOR (5 Bagian Waktu)
          ======================================================== */}
      {pipelineStage === 'script' && (
        <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                TAHAP 2: NASKAH 30 DETIK TERSTRUKTUR
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-stone-900">
                {script.title}
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Naskah ini dibagi ke dalam 5 bagian waktu sesuai standar video pendek viral.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() =>
                  handleCopyContent(
                    `[0–3 detik] Hook\n${script.hook}\n\n[3–10 detik] Masalah\n${script.problem}\n\n[10–20 detik] Solusi\n${script.solution}\n\n[20–27 detik] Keunggulan\n${script.advantage}\n\n[27–30 detik] Call to Action\n${script.callToAction}`,
                    'script'
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                {copiedStage === 'script' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>📋 Salin</span>
              </button>

              <button
                onClick={handleSaveCurrentPipelineToProject}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <span>💾 Simpan</span>
              </button>

              {onOpenVoiceOver && (
                <button
                  onClick={() =>
                    onOpenVoiceOver(
                      `${script.hook} ${script.problem} ${script.solution} ${script.advantage} ${script.callToAction}`
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl transition-all cursor-pointer hover:scale-[1.02]"
                  title="Buat Voice Over audio dari naskah ini"
                >
                  <Mic className="w-3.5 h-3.5 text-emerald-600" />
                  <span>🎤 Voice Over</span>
                </button>
              )}

              <button
                onClick={handleGenerateStoryboard}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer hover:scale-[1.02]"
              >
                <span>🎬 Buat Storyboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Banner Voice Over di Tahap Naskah (Rule 2, 3, 4, 5, 6) */}
          {activeProject?.voiceOver?.audioUrl ? (
            <div className="bg-emerald-50/80 border border-emerald-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-emerald-600 text-white rounded-xl shadow-2xs shrink-0">
                  <Volume2 className="w-4 h-4" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-emerald-950">
                      Voice Over ✓
                    </span>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Karakter {activeProject.voiceOver.voiceCharacter} · ±{activeProject.voiceOver.durationSeconds}s
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 mt-0.5">
                    Gaya {activeProject.voiceOver.style} · Tempo {activeProject.voiceOver.speed}x · Tersimpan di Project
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                <audio
                  controls
                  src={activeProject.voiceOver.audioUrl}
                  className="h-8 max-w-[220px]"
                />
                <button
                  type="button"
                  onClick={() => handleDownloadProjectAudio(activeProject.voiceOver!.audioUrl, activeProject.name || activeProject.title)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold rounded-xl border border-stone-200 transition-colors cursor-pointer"
                  title="Unduh file audio Voice Over (.wav)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh WAV</span>
                </button>
                {onOpenVoiceOver && (
                  <button
                    onClick={() => onOpenVoiceOver(activeProject.voiceOver?.text)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    title="Ganti Voice Over naskah"
                  >
                    Ganti Suara
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 bg-stone-200 text-stone-600 rounded-lg shrink-0">
                  <Mic className="w-4 h-4" />
                </span>
                <div>
                  <span className="font-bold text-stone-700">Voice Over belum dibuat</span>
                  <p className="text-[11px] text-stone-400">
                    Ubah 5 bagian naskah di bawah menjadi audio narasi alami dengan satu klik.
                  </p>
                </div>
              </div>
              {onOpenVoiceOver && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenVoiceOver(
                      `${script.hook} ${script.problem} ${script.solution} ${script.advantage} ${script.callToAction}`
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer hover:scale-[1.02]"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Buat Voice Over</span>
                </button>
              )}
            </div>
          )}

          {/* 5 Timed Parts */}
          <div className="space-y-4">
            {/* 1. Hook */}
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-extrabold text-emerald-900 uppercase">
                  [0–3 detik] Hook
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold">
                  Tujuan: Hentikan scroll penonton
                </span>
              </div>
              <textarea
                value={script.hook}
                onChange={(e) => setScript({ ...script, hook: e.target.value })}
                rows={2}
                className="w-full text-sm font-medium bg-white/95 px-3 py-2 border border-emerald-100 rounded-xl focus:outline-none focus:border-emerald-600"
              />
            </div>

            {/* 2. Masalah */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-extrabold text-stone-800 uppercase">
                  [3–10 detik] Masalah / Situasi
                </span>
                <span className="text-[10px] text-stone-500 font-semibold">
                  Tujuan: Membangun rasa relate
                </span>
              </div>
              <textarea
                value={script.problem}
                onChange={(e) => setScript({ ...script, problem: e.target.value })}
                rows={2}
                className="w-full text-sm font-medium bg-white/95 px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
              />
            </div>

            {/* 3. Solusi */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-extrabold text-stone-800 uppercase">
                  [10–20 detik] Solusi
                </span>
                <span className="text-[10px] text-stone-500 font-semibold">
                  Tujuan: Memperkenalkan penolong utama
                </span>
              </div>
              <textarea
                value={script.solution}
                onChange={(e) => setScript({ ...script, solution: e.target.value })}
                rows={2}
                className="w-full text-sm font-medium bg-white/95 px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
              />
            </div>

            {/* 4. Keunggulan */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-extrabold text-stone-800 uppercase">
                  [20–27 detik] Keunggulan
                </span>
                <span className="text-[10px] text-stone-500 font-semibold">
                  Tujuan: Bukti nilai lebih produk
                </span>
              </div>
              <textarea
                value={script.advantage}
                onChange={(e) => setScript({ ...script, advantage: e.target.value })}
                rows={2}
                className="w-full text-sm font-medium bg-white/95 px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
              />
            </div>

            {/* 5. Call to Action */}
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-extrabold text-emerald-900 uppercase">
                  [27–30 detik] Call to Action
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold">
                  Tujuan: Aksi konversi jelas
                </span>
              </div>
              <textarea
                value={script.callToAction}
                onChange={(e) => setScript({ ...script, callToAction: e.target.value })}
                rows={2}
                className="w-full text-sm font-medium bg-white/95 px-3 py-2 border border-emerald-100 rounded-xl focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAHAP 3: STORYBOARD GENERATOR (Multi-Scene)
          ======================================================== */}
      {pipelineStage === 'storyboard' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                TAHAP 3: STORYBOARD VISUAL & AKSI
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-stone-900">
                Storyboard 4 Scene ({platform})
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() =>
                  handleCopyContent(
                    scenes
                      .map(
                        (s) =>
                          `${s.sceneLabel}\nDurasi: ${s.duration}\nVisual: ${s.visual}\nAksi: ${s.action}\nVoice over: ${s.voiceOver}\nText: "${s.textOnScreen}"\nCamera: ${s.cameraShot}\nTransition: ${s.transition}`
                      )
                      .join('\n\n'),
                    'storyboard'
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                {copiedStage === 'storyboard' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>📋 Salin</span>
              </button>

              <button
                onClick={handleSaveCurrentPipelineToProject}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <span>💾 Simpan</span>
              </button>

              <button
                onClick={handleGenerateShotList}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer hover:scale-[1.02]"
              >
                <span>🎥 Buat Shot List</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Scenes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {scenes.map((scene, idx) => (
              <div
                key={idx}
                className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                  <span className="text-xs font-extrabold text-emerald-800 uppercase px-2.5 py-0.5 rounded-lg bg-emerald-100">
                    {scene.sceneLabel}
                  </span>
                  <span className="text-xs font-semibold text-stone-500">
                    ⏱️ {scene.duration}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-stone-700">
                  <div>
                    <strong className="text-stone-900 block text-[11px] uppercase tracking-wider">
                      Visual:
                    </strong>
                    <p className="mt-0.5">{scene.visual}</p>
                  </div>

                  <div>
                    <strong className="text-stone-900 block text-[11px] uppercase tracking-wider">
                      Aksi Subjek:
                    </strong>
                    <p className="mt-0.5">{scene.action}</p>
                  </div>

                  <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                    <strong className="text-emerald-900 block text-[11px] uppercase tracking-wider">
                      Dialog / Voice Over:
                    </strong>
                    <p className="mt-0.5 font-medium italic">{scene.voiceOver}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-100 text-[11px]">
                    <div>
                      <span className="text-stone-400 block font-bold">TEXT ON SCREEN</span>
                      <span className="font-semibold text-stone-800">{scene.textOnScreen}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block font-bold">CAMERA / TRANSITION</span>
                      <span className="font-semibold text-stone-800">{scene.cameraShot} · {scene.transition}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          TAHAP 4: SHOT LIST (Panduan Eksekusi Produksi)
          ======================================================== */}
      {pipelineStage === 'shotlist' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Narration Ready Card (Requirement 9: "🎙️ Narasi siap" & "Salin Narasi") */}
          <NarrationCard
            narration={narrationPkg}
            showToast={showToast}
            userMode={userMode}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                TAHAP 4: SHOT LIST & VISUAL
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-stone-900">
                Panduan Visual & Shot ({shotList.length} Shot)
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                HEJO otomatis memilih gerakan kamera dan menyiapkan prompt visual per adegan.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Requirement 6, 7 & 13: Single Prominent Action */}
              {Object.values(shotImages).filter((img) => Boolean(img?.url)).length >= shotList.length ? (
                <button
                  type="button"
                  onClick={() => {
                    handleStageChange('videoproduction');
                    setVideoCurrentTime(0);
                    setVideoCurrentShotIndex(0);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-xs transition-all cursor-pointer hover:scale-[1.02]"
                >
                  <span>Visual selesai 🎉 ▶ Lanjut ke Video</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGenerateAllShotImages}
                  disabled={isGeneratingAllImages}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-xs transition-all cursor-pointer hover:scale-[1.02] disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isGeneratingAllImages ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-200" />
                      <span>Memproses {visualProgressText || 'Visual...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-200" />
                      <span>✨ Buat Semua Visual</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  handleCopyContent(
                    shotList
                      .map(
                        (s) =>
                          `${s.shotNumber}\nScene: ${s.scene}\nJenis shot: ${s.shotType}\nSubject: ${s.subject}\nCamera angle: ${s.cameraAngle}\nCamera movement: ${s.cameraMovement}\nLighting: ${s.lighting}\nLocation: ${s.location}\nProps: ${s.props}\nDurasi: ${s.duration}`
                      )
                      .join('\n\n'),
                    'shotlist'
                  )
                }
                className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                {copiedStage === 'shotlist' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>📋 Salin Shot List</span>
              </button>

              <button
                type="button"
                onClick={handleSaveCurrentPipelineToProject}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer hover:scale-[1.02]"
              >
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span>💾 Simpan ke Project</span>
              </button>
            </div>
          </div>

          {/* Sequential Generation Progress Notice (Requirement 6) */}
          {isGeneratingAllImages && visualProgressText && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-950 animate-pulse">
              <div className="flex items-center gap-2 font-bold">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Memproses {visualProgressText} secara berurutan...</span>
              </div>
              <span className="text-emerald-700 font-medium">Mohon jangan menutup halaman ini</span>
            </div>
          )}

          {/* CHARACTER PICKER DI TAHAP SHOT LIST (CREATOR & PRO MODE) */}
          {userMode !== 'SIMPLE' && (
            <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                {activeCharacter?.imageUrl || activeCharacter?.imageReference ? (
                  <div className="w-11 h-11 rounded-xl overflow-hidden border border-emerald-300 shadow-2xs shrink-0">
                    <img
                      src={activeCharacter.imageUrl || activeCharacter.imageReference}
                      alt={activeCharacter.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs shrink-0">
                    {activeCharacter ? activeCharacter.name.charAt(0).toUpperCase() : <UserCircle2 className="w-6 h-6" />}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      Karakter Visual:
                    </span>
                    {activeCharacter ? (
                      <span className="text-xs font-extrabold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md">
                        {activeCharacter.name}
                      </span>
                    ) : (
                      <span className="text-xs text-stone-500 italic">
                        Belum dipilih
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-600 mt-0.5 truncate max-w-md">
                    {activeCharacter
                      ? (activeCharacter.visualNotes || activeCharacter.description || 'Referensi visual aktif untuk shot list.')
                      : 'Pilih karakter agar HEJO mengetahui karakter yang digunakan dalam visual shot ini.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-stone-600 hidden sm:inline">Karakter:</span>
                <div className="relative">
                  <select
                    value={activeCharacter?.id || ''}
                    onChange={(e) => handleSelectCharacter(e.target.value)}
                    className="text-xs font-bold px-3 py-2 bg-white border border-stone-300 rounded-xl focus:outline-none focus:border-emerald-600 shadow-2xs cursor-pointer text-stone-800"
                  >
                    <option value="">-- Pilih Karakter --</option>
                    {characters.filter((c) => Boolean(c && c.id)).map((c) => (
                      <option key={c.id} value={c.id}>
                        👤 {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (setNavTab) setNavTab('characters');
                  }}
                  className="text-xs font-bold px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1"
                  title="Buka Menu Karakter"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Karakter</span>
                </button>
              </div>
            </div>
          )}

          {/* Shot List Table / Cards using SimplifiedSceneCard (Requirement 4) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {shotList.map((shot, idx) => {
              const imgState = shotImages[idx];
              const rawUrl = shot.imageUrl || (shot as any).image || imgState?.url;
              const currentUrl = rawUrl && rawUrl !== '[IDB_IMAGE]' ? rawUrl : undefined;
              const isLoadingThis = imgState?.loading;
              const errorThis = imgState?.error;

              const isNone = shot.characterId === 'none';
              const shotEffectiveChar = isNone
                ? null
                : (shot.characterId ? characters.find((c) => Boolean(c && c.id === shot.characterId)) : null) ||
                  activeCharacter ||
                  (shot.character
                    ? ({
                        id: shot.character.id || 'custom',
                        name: shot.character.name,
                        description: shot.character.description,
                        visualNotes: shot.character.visualNotes,
                        imageUrl: shot.character.imageUrl,
                      } as CharacterDNA)
                    : null);

              return (
                <SimplifiedSceneCard
                  key={idx}
                  shot={shot}
                  index={idx}
                  voiceOverText={scenes[idx]?.voiceOver}
                  imageUrl={currentUrl}
                  isLoadingImage={isLoadingThis}
                  imageError={errorThis}
                  character={shotEffectiveChar}
                  characters={characters}
                  userMode={userMode}
                  onGenerateSingleImage={handleGenerateSingleShotImage}
                  onAssignCharacter={handleAssignCharacterToShot}
                  onUpdateShot={(i, updated) => {
                    const next = shotList.map((s, si) => (si === i ? { ...s, ...updated } : s));
                    persistShotUpdate(next);
                  }}
                  showToast={showToast}
                />
              );
            })}
          </div>

          {/* Banner Menuju Video Produksi */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-xs shrink-0">
                <Film className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-stone-900">
                  Visual 4 Shot Siap Dirangkai Jadi Video
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  Lanjutkan ke area Video Produksi untuk melihat urutan sekuensial Shot 01 → 02 → 03 → 04 dengan durasi per shot dan preview player.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                handleStageChange('videoproduction');
                setVideoCurrentTime(0);
                setVideoCurrentShotIndex(0);
              }}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer hover:scale-[1.02] shrink-0"
            >
              <Film className="w-4 h-4" />
              <span>🎬 Buat Video dari 4 Shot</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          TAHAP 5: VIDEO PRODUKSI (Timeline 4 Shot & Preview Player)
          ======================================================== */}
      {pipelineStage === 'videoproduction' && (() => {
        const activeVideoShot = shotList[videoCurrentShotIndex] || shotList[0] || INITIAL_SHOTS[0];
        const activeVideoShotImage = activeVideoShot?.imageUrl || (activeVideoShot as any)?.image || shotImages[videoCurrentShotIndex]?.url;
        const activeVideoScene = scenes[videoCurrentShotIndex] || scenes[0] || INITIAL_SCENES[0];

        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header Video Produksi */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    TAHAP 5: VIDEO PRODUKSI & TIMELINE
                  </span>
                  <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                    16:9 Widescreen
                  </span>
                </div>
                <h2 className="text-base sm:text-xl font-extrabold text-stone-900 mt-1">
                  Video Produksi ({shotList.length} Shot · {totalVideoDuration} Detik)
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Urutan sekuensial Shot 01 → Shot 02 → Shot 03 → Shot 04 siap eksekusi rekaman dan integrasi generator video AI.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVideoProductionSubTab('videopack')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer hover:scale-[1.02]"
                  title="Ubah timeline menjadi paket prompt video AI siap eksekusi"
                >
                  <Package className="w-4 h-4" />
                  <span>📦 Buat Video Pack</span>
                </button>

                <button
                  onClick={() => handleStageChange('shotlist')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Shot List</span>
                </button>

                <button
                  onClick={() =>
                    handleCopyContent(
                      shotList
                        .map(
                          (s, i) =>
                            `[${s.shotNumber}] ${s.scene} (${s.duration})\nJenis: ${s.shotType}\nSubjek: ${s.subject}\nKamera: ${s.cameraAngle} · ${s.cameraMovement}\nLighting: ${s.lighting}\nVoice Over: "${scenes[i]?.voiceOver || '-'}"\nVisual URL: ${s.imageUrl || 'Belum dibuat'}`
                        )
                        .join('\n\n---\n\n'),
                      'videoproduction'
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  {copiedStage === 'videoproduction' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>📋 Salin Rangkuman Video</span>
                </button>

                <button
                  onClick={handleSaveCurrentPipelineToProject}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer hover:scale-[1.02]"
                >
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  <span>💾 Simpan ke Project</span>
                </button>
              </div>
            </div>

            {/* View Switcher: Timeline Player vs Video Pack */}
            <div className="flex items-center justify-between gap-3 bg-stone-100/80 p-1.5 rounded-2xl border border-stone-200">
              <div className="inline-flex p-1 bg-white rounded-xl shadow-2xs border border-stone-200/80">
                <button
                  type="button"
                  onClick={() => setVideoProductionSubTab('timeline')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    videoProductionSubTab === 'timeline'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Timeline & Cinema Player</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVideoProductionSubTab('videopack')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    videoProductionSubTab === 'videopack'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Paket Video Pack ({shotList.length} Shot)</span>
                </button>
              </div>

              <span className="text-[11px] text-stone-500 hidden sm:inline-block pr-2 font-medium">
                {videoProductionSubTab === 'videopack'
                  ? 'Format prompt siap digunakan untuk generator video AI'
                  : `Pratinjau sekuensial durasi ${totalVideoDuration} detik`}
              </span>
            </div>

            {videoProductionSubTab === 'videopack' ? (
              <VideoPackView
                shots={shotList}
                activeProject={activeProject}
                characters={characters}
                activeCharacter={activeCharacter}
                scenes={scenes}
                showToast={showToast}
                onSaveVideoPackToProject={(videoPack) => {
                  const targetId = activeProject?.id;
                  const projTitle = activeProject?.title || selectedIdea?.title || topicInput || 'Project Video Studio';
                  saveProject({
                    id: targetId,
                    title: projTitle,
                    pipelineShots: shotList,
                    pipelineScenes: scenes,
                    currentStage: 'videoproduction',
                    videoPack,
                  }, true);
                  showToast(`Video Pack (${shotList.length} Shot · Rasio ${videoPack.aspectRatio}) disimpan ke project!`);
                }}
                onBackToTimeline={() => setVideoProductionSubTab('timeline')}
              />
            ) : (
              <>

            {/* Video Preview Cinema Player */}
            <div className="bg-stone-950 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl">
              {/* Cinema Screen (16:9) */}
              <div className="relative aspect-video w-full bg-stone-950 flex items-center justify-center overflow-hidden group">
                {activeVideoShotImage && activeVideoShotImage !== '[IDB_IMAGE]' ? (
                  <img
                    src={activeVideoShotImage}
                    alt={`Visual ${activeVideoShot.shotNumber}`}
                    className={`w-full h-full object-cover transition-all duration-700 ${
                      videoIsPlaying ? 'scale-105 brightness-105' : 'scale-100'
                    }`}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-6 text-stone-400">
                    <MonitorPlay className="w-12 h-12 text-stone-600 mb-3 animate-pulse" />
                    <span className="text-sm font-bold text-stone-200">
                      Visual {activeVideoShot.shotNumber}
                    </span>
                    <span className="text-xs text-stone-500 mt-1 max-w-sm">
                      {activeVideoShot.subject} ({activeVideoShot.shotType})
                    </span>
                    <button
                      onClick={() => handleStageChange('shotlist')}
                      className="mt-3 px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Buka Shot List untuk Generate Visual
                    </button>
                  </div>
                )}

                {/* Subtle Cinematic Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60 pointer-events-none" />

                {/* Top Overlay Badges */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-amber-400" />
                      <span>{activeVideoShot.shotNumber}</span>
                      <span className="text-stone-400 font-normal">({videoCurrentShotIndex + 1}/{shotList.length})</span>
                    </span>

                    <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-stone-200">
                      ⏱️ {activeVideoShot.duration}
                    </span>

                    <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-stone-200">
                      {activeVideoShot.shotType}
                    </span>

                    {(() => {
                      const videoEffectiveChar =
                        (activeVideoShot.characterId === 'none' ? null : (activeVideoShot.characterId ? characters.find((c) => Boolean(c && c.id === activeVideoShot.characterId)) : null)) ||
                        activeCharacter;
                      if (!videoEffectiveChar) return null;
                      const thumb = videoEffectiveChar.imageUrl || videoEffectiveChar.imageReference;
                      const displayName = videoEffectiveChar.name || 'Karakter';
                      return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-emerald-500/40 text-[11px] font-bold text-emerald-300">
                          {thumb ? (
                            <img src={thumb} alt={displayName} className="w-3.5 h-3.5 rounded-full object-cover" />
                          ) : (
                            <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white text-[8px] flex items-center justify-center font-bold">
                              {displayName.charAt(0).toUpperCase()}
                            </span>
                          )}
                          <span>{displayName}</span>
                        </span>
                      );
                    })()}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-xs font-mono font-bold text-emerald-400">
                      {formatTimecode(videoCurrentTime)} / {formatTimecode(totalVideoDuration)}
                    </span>
                  </div>
                </div>

                {/* Center Big Play/Pause overlay toggle on screen click */}
                <button
                  type="button"
                  onClick={handleTogglePlayVideo}
                  className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/30 transition-colors cursor-pointer"
                  title={videoIsPlaying ? 'Jeda' : 'Putar'}
                >
                  <div className={`w-16 h-16 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-transform ${
                    videoIsPlaying ? 'opacity-0 group-hover:opacity-100 scale-90' : 'opacity-100 scale-100'
                  }`}>
                    {videoIsPlaying ? (
                      <Pause className="w-7 h-7 text-white" />
                    ) : (
                      <Play className="w-7 h-7 text-white ml-1 fill-white" />
                    )}
                  </div>
                </button>

                {/* Bottom Storyboard Subtitle & Audio Overlay */}
                <div className="absolute bottom-4 left-4 right-4 pointer-events-none space-y-1.5">
                  {activeVideoScene?.voiceOver && (
                    <div className="bg-black/75 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2 text-center max-w-2xl mx-auto">
                      <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest block mb-0.5">
                        DIALOK / VOICE OVER
                      </span>
                      <p className="text-xs sm:text-sm font-semibold text-white italic">
                        "{activeVideoScene.voiceOver}"
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-stone-300 px-1">
                    <span className="bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs font-medium">
                      🎥 {activeVideoShot.cameraAngle} · {activeVideoShot.cameraMovement}
                    </span>
                    {activeVideoScene?.textOnScreen && (
                      <span className="bg-amber-900/70 border border-amber-500/30 text-amber-200 px-2 py-0.5 rounded font-bold">
                        TEXT: {activeVideoScene.textOnScreen}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Player Transport Controls & Scrubber */}
              <div className="bg-stone-900 border-t border-stone-800 p-4 sm:p-5 space-y-4">
                {/* Visual Scrubber Track */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-stone-400">
                    <span>{formatTimecode(videoCurrentTime)}</span>
                    <span className="text-stone-300 font-semibold">
                      Sekuens 4 Shot: [SHOT 01 (3s) → SHOT 02 (7s) → SHOT 03 (10s) → SHOT 04 (10s)]
                    </span>
                    <span>{formatTimecode(totalVideoDuration)}</span>
                  </div>

                  {/* Scrub bar with proportional segments */}
                  <div className="relative h-3 w-full bg-stone-800 rounded-full overflow-hidden flex cursor-pointer">
                    {parsedDurations.map((duration, idx) => {
                      const widthPct = (duration / totalVideoDuration) * 100;
                      const isActive = videoCurrentShotIndex === idx;
                      return (
                        <div
                          key={idx}
                          onClick={() => handleSeekToShot(idx)}
                          style={{ width: `${widthPct}%` }}
                          className={`h-full border-r border-stone-950 transition-colors ${
                            isActive
                              ? 'bg-amber-500/80 hover:bg-amber-400'
                              : idx < videoCurrentShotIndex
                              ? 'bg-emerald-600/80 hover:bg-emerald-500'
                              : 'bg-stone-700/80 hover:bg-stone-600'
                          }`}
                          title={`Loncat ke ${shotList[idx]?.shotNumber || `Shot ${idx + 1}`} (${duration}s)`}
                        />
                      );
                    })}

                    {/* Playhead Indicator */}
                    <div
                      style={{ left: `${Math.min(100, (videoCurrentTime / totalVideoDuration) * 100)}%` }}
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-md pointer-events-none transition-all duration-100"
                    />
                  </div>
                </div>

                {/* Control Buttons Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRestartVideo}
                      className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
                      title="Ulangi dari awal"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleSeekToShot(videoCurrentShotIndex - 1)}
                      disabled={videoCurrentShotIndex <= 0}
                      className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-300 hover:text-white transition-colors cursor-pointer"
                      title="Shot Sebelumnya"
                    >
                      <SkipBack className="w-4 h-4" />
                    </button>

                    <button
                      onClick={handleTogglePlayVideo}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md cursor-pointer transition-transform hover:scale-[1.03]"
                    >
                      {videoIsPlaying ? (
                        <>
                          <Pause className="w-4 h-4 fill-white" />
                          <span>Jeda Video</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                          <span>Putar Video (Preview 4 Shot)</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleSeekToShot(videoCurrentShotIndex + 1)}
                      disabled={videoCurrentShotIndex >= shotList.length - 1}
                      className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-stone-300 hover:text-white transition-colors cursor-pointer"
                      title="Shot Selanjutnya"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Shot Navigation Chips & Pengaturan Pro Toggle (Requirement 8) */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center bg-stone-800/80 p-1 rounded-xl border border-stone-700">
                      {shotList.map((shot, idx) => {
                        const isCurrent = videoCurrentShotIndex === idx;
                        return (
                          <button
                            key={idx}
                            onClick={() => handleSeekToShot(idx)}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'text-stone-400 hover:text-stone-200'
                            }`}
                          >
                            {shot.shotNumber}
                          </button>
                        );
                      })}
                    </div>

                    {/* Pengaturan Pro Button (Requirement 8) */}
                    <button
                      type="button"
                      onClick={() => setProSettingsOpen((prev) => !prev)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white rounded-xl border border-stone-700 text-xs font-bold cursor-pointer transition-colors"
                      title="Pengaturan teknis lanjutan"
                    >
                      <Sliders className="w-3.5 h-3.5 text-amber-400" />
                      <span>⚙️ Pengaturan Pro {proSettingsOpen ? '▴' : '▾'}</span>
                    </button>
                  </div>
                </div>

                {/* Collapsible Pengaturan Pro Details */}
                {proSettingsOpen && (
                  <div className="pt-3 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-300 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-400 text-[11px] uppercase">Kecepatan Preview:</span>
                      <div className="flex items-center gap-1 bg-stone-800 p-1 rounded-lg border border-stone-700">
                        {[0.75, 1, 1.25].map((speed) => (
                          <button
                            key={speed}
                            onClick={() => setVideoPlaybackSpeed(speed)}
                            className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                              videoPlaybackSpeed === speed
                                ? 'bg-amber-600 text-white'
                                : 'text-stone-400 hover:text-stone-200'
                            }`}
                          >
                            {speed}x
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-stone-400 text-[11px]">
                      <span>Aspect: <strong>16:9 Widescreen</strong></span>
                      <span>·</span>
                      <span>Coherence: <strong>24fps Motion</strong></span>
                      <span>·</span>
                      <span>Format: <strong>AI Video Pack Ready</strong></span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Audio Voice Over Strip di Video Produksi */}
            {activeProject?.voiceOver?.audioUrl ? (
              <div className="bg-emerald-50/80 border border-emerald-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
                    <Volume2 className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-emerald-950">
                        Voice Over ✓
                      </span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Karakter {activeProject.voiceOver.voiceCharacter} · ±{activeProject.voiceOver.durationSeconds}s
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 mt-0.5">
                      Gaya {activeProject.voiceOver.style} · Tempo {activeProject.voiceOver.speed}x · Tersimpan di Project
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                  <audio
                    controls
                    src={activeProject.voiceOver.audioUrl}
                    className="h-8 max-w-[220px]"
                  />
                  <button
                    type="button"
                    onClick={() => handleDownloadProjectAudio(activeProject.voiceOver!.audioUrl, activeProject.name || activeProject.title)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold rounded-xl border border-stone-200 transition-colors cursor-pointer"
                    title="Unduh file audio Voice Over (.wav)"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh WAV</span>
                  </button>
                  {onOpenVoiceOver && (
                    <button
                      type="button"
                      onClick={() => onOpenVoiceOver(activeProject.voiceOver?.text)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      title="Ganti Voice Over video"
                    >
                      Ganti Suara
                    </button>
                  )}
                </div>
              </div>
            ) : onOpenVoiceOver ? (
              <div className="bg-stone-50 border border-dashed border-stone-300 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-stone-200 text-stone-600 rounded-xl">
                    <Mic className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-stone-800">
                      Tambahkan Voice Over ke Video Project
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      Suarakan narasi naskah video dengan karakter kreator (Rina, Raka, Bayu, Bening).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const combined = scenes.map((s) => s.voiceOver).filter(Boolean).join(' ') || activeProject?.script || '';
                    onOpenVoiceOver(combined);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer hover:scale-[1.02]"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>🎤 Buat Voice Over</span>
                </button>
              </div>
            ) : null}

            {/* Sequential Timeline Track Visualization */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
                    <span>🎞️ Timeline Sekuensial 4 Shot</span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Total {totalVideoDuration} Detik
                    </span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Klik salah satu blok shot di bawah ini untuk melihat pratinjau visual dan informasi kamera.
                  </p>
                </div>
                <span className="text-xs font-mono text-stone-400 hidden sm:inline-block">
                  Alur: Shot 01 → Shot 02 → Shot 03 → Shot 04
                </span>
              </div>

              {/* Multi-Track Shot Blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {shotList.map((shot, idx) => {
                  const isCurrent = videoCurrentShotIndex === idx;
                  const rawUrl = shot.imageUrl || (shot as any).image || shotImages[idx]?.url;
                  const currentUrl = rawUrl && rawUrl !== '[IDB_IMAGE]' ? rawUrl : undefined;
                  const durationNum = parsedDurations[idx] || 5;

                  return (
                    <div
                      key={idx}
                      onClick={() => handleSeekToShot(idx)}
                      className={`rounded-2xl border p-3.5 transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                        isCurrent
                          ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-400/20 shadow-md'
                          : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/70'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-stone-900">
                          {shot.shotNumber}
                        </span>
                        <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                          ⏱️ {durationNum}s ({cumulativeTimes[idx]}s - {cumulativeTimes[idx + 1]}s)
                        </span>
                      </div>

                      {/* Shot Thumbnail */}
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-stone-900 border border-stone-200">
                        {currentUrl ? (
                          <img
                            src={currentUrl}
                            alt={`Shot ${shot.shotNumber}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-stone-400">
                            <ImageIcon className="w-5 h-5 text-stone-500 mb-1" />
                            <span className="text-[10px]">Visual belum dibuat</span>
                          </div>
                        )}
                        <div className="absolute bottom-1 left-1.5 px-1.5 py-0.2 rounded bg-black/70 backdrop-blur-xs text-[9px] font-bold text-white uppercase">
                          {shot.shotType}
                        </div>
                      </div>

                      <div className="space-y-1 text-xs text-stone-700">
                        <p className="font-semibold text-stone-900 line-clamp-1">
                          {shot.subject}
                        </p>
                        <p className="text-[11px] text-stone-500 line-clamp-1">
                          🎥 {shot.cameraAngle} · {shot.cameraMovement}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                        <span className="text-stone-400 font-semibold">{shot.scene}</span>
                        {currentUrl ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Visual Ada</span>
                          </span>
                        ) : (
                          <span className="text-stone-400">Draf</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Storyboard Sequential Flow Cards (Shot 01 → Shot 02 → Shot 03 → Shot 04) */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
                  <span>🎬 Urutan Eksekusi Storyboard (Shot 01 → Shot 02 → Shot 03 → Shot 04)</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Rincian naskah, aksi aktor, dan instruksi teknis kamera yang saling bersambung.
                </p>
              </div>

              <div className="space-y-3">
                {shotList.map((shot, idx) => {
                  const scene = scenes[idx] || scenes[0];
                  const rawUrl = shot.imageUrl || (shot as any).image || shotImages[idx]?.url;
                  const currentUrl = rawUrl && rawUrl !== '[IDB_IMAGE]' ? rawUrl : undefined;

                  return (
                    <div
                      key={idx}
                      className="border border-stone-200 rounded-2xl p-4 bg-stone-50/50 hover:bg-stone-50 transition-colors flex flex-col md:flex-row items-start md:items-center gap-4"
                    >
                      <div className="w-24 shrink-0">
                        <span className="text-xs font-black text-amber-900 uppercase bg-amber-100 px-2.5 py-1 rounded-lg block text-center">
                          {shot.shotNumber}
                        </span>
                        <span className="text-[10px] font-semibold text-stone-500 block text-center mt-1">
                          ⏱️ {shot.duration}
                        </span>
                      </div>

                      {/* Thumbnail Small */}
                      <div className="w-32 aspect-video rounded-xl overflow-hidden bg-stone-900 border border-stone-200 shrink-0">
                        {currentUrl ? (
                          <img
                            src={currentUrl}
                            alt={`Thumbnail ${shot.shotNumber}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-400">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 space-y-1 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-stone-900 text-sm">{shot.scene}: {shot.subject}</span>
                          <span className="px-2 py-0.5 bg-stone-200 text-stone-700 text-[10px] font-bold rounded-md uppercase">
                            {shot.shotType}
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                            {shot.cameraMovement}
                          </span>
                        </div>

                        {scene?.voiceOver && (
                          <p className="text-stone-700 italic bg-white p-2 rounded-lg border border-stone-200/80">
                            🗣️ "{scene.voiceOver}"
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-[11px] text-stone-500 pt-0.5">
                          <span>🎥 <strong>Sudut:</strong> {shot.cameraAngle}</span>
                          <span>💡 <strong>Lighting:</strong> {shot.lighting}</span>
                          <span>📍 <strong>Lokasi:</strong> {shot.location}</span>
                        </div>
                      </div>

                      {idx < shotList.length - 1 && (
                        <div className="hidden md:flex flex-col items-center justify-center text-amber-600 font-bold px-2">
                          <ArrowRight className="w-5 h-5" />
                          <span className="text-[9px] uppercase tracking-wider mt-0.5">Lanjut</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Video Generator AI Readiness Status Callout */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/90 rounded-2xl p-5 shadow-xs flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs text-stone-700">
                <h4 className="font-extrabold text-emerald-950 text-sm">
                  Status Video Produksi: Timeline Siap untuk Generator Video AI
                </h4>
                <p className="text-stone-600 leading-relaxed">
                  Semua 4 visual gambar, durasi waktu sekuensial (total {totalVideoDuration} detik), framing kamera, dan naskah dialog telah tersimpan permanen dan terstruktur rapi. Saat API render video otomatis diaktifkan, timeline ini langsung siap diterjemahkan menjadi file video utuh tanpa generate ulang.
                </p>
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 font-bold rounded text-[10px]">
                    ✓ 4 Shot Visual Tersimpan
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 font-bold rounded text-[10px]">
                    ✓ Audio Storyboard Siap
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 font-bold rounded text-[10px]">
                    ✓ Durasi {totalVideoDuration} Detik Terverifikasi
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setVideoProductionSubTab('videopack')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer hover:scale-[1.02] shrink-0"
              >
                <Package className="w-4 h-4" />
                <span>📦 Buka Video Pack</span>
              </button>
            </div>
          </>
        )}
      </div>
    );
  })()}
      {/* Quick Modal: Buat Project Baru */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreateProject={handleCreateNewProject}
      />
    </div>
  );
};
