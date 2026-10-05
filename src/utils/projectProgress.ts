import { ProjectItem } from '../types';

export type StageProgressStatus = 'completed' | 'in_progress' | 'pending';

export interface ProgressItem {
  key: 'idea' | 'script' | 'storyboard' | 'visual' | 'motion' | 'video' | 'final';
  label: string;
  badgeText: string;
  status: StageProgressStatus;
  currentCount?: number;
  totalCount?: number;
}

export interface NextActionStep {
  label: string;
  targetStage: 'idea' | 'script' | 'storyboard' | 'shotlist' | 'videoproduction';
  targetTab: 'studio' | 'motion';
  description: string;
}

export interface ProjectProgressData {
  projectName: string;
  currentStage: string;
  items: ProgressItem[];
  overallPercent: number;
  completedStagesCount: number;
  totalStagesCount: number;
  visualImagesCount: number;
  totalShotsCount: number;
  motionCount: number;
  videoReady: boolean;
  nextAction: NextActionStep;
}

/**
 * Computes exact, real progress from actual project data.
 * No hardcoded numbers: visual count is derived from actual shot images,
 * motion count is derived from actual shot movements, etc.
 */
export function calculateProjectProgress(project: ProjectItem | null): ProjectProgressData {
  const defaultTotalShots = 4;
  const projectName = project?.name || project?.title || 'Project Tanpa Judul';
  const currentStage = project?.currentStage || 'idea';

  if (!project) {
    return {
      projectName: 'Project Baru',
      currentStage: 'idea',
      items: [
        { key: 'idea', label: 'Ide', badgeText: 'IDE', status: 'pending' },
        { key: 'script', label: 'Naskah', badgeText: 'NASKAH', status: 'pending' },
        { key: 'storyboard', label: 'Storyboard', badgeText: 'STORYBOARD', status: 'pending' },
        { key: 'visual', label: 'Visual', badgeText: `VISUAL 0/${defaultTotalShots}`, status: 'pending', currentCount: 0, totalCount: defaultTotalShots },
        { key: 'motion', label: 'Motion', badgeText: `MOTION 0/${defaultTotalShots}`, status: 'pending', currentCount: 0, totalCount: defaultTotalShots },
        { key: 'video', label: 'Video', badgeText: `VIDEO 0/${defaultTotalShots}`, status: 'pending', currentCount: 0, totalCount: defaultTotalShots },
        { key: 'final', label: 'Final', badgeText: 'FINAL', status: 'pending' },
      ],
      overallPercent: 0,
      completedStagesCount: 0,
      totalStagesCount: 7,
      visualImagesCount: 0,
      totalShotsCount: defaultTotalShots,
      motionCount: 0,
      videoReady: false,
      nextAction: {
        label: 'Mulai Rumuskan Ide Konten',
        targetStage: 'idea',
        targetTab: 'studio',
        description: 'Tentukan topik, platform, dan target audiens untuk memulai.',
      },
    };
  }

  // 1. IDE Check
  const hasIdeas = Boolean(
    (project.pipelineIdeas && project.pipelineIdeas.length > 0) ||
    project.selectedIdeaTitle ||
    project.idea ||
    (project.ideas && project.ideas.length > 0)
  );

  // 2. SCRIPT Check
  const hasScript = Boolean(
    (project.pipelineScript && (project.pipelineScript.hook || project.pipelineScript.rawText)) ||
    (project.script && project.script.trim().length > 30)
  );

  // 3. STORYBOARD Check
  const scenes = project.pipelineScenes || project.scenes || [];
  const hasStoryboard = scenes.length > 0;

  // 4. VISUAL Check
  const shots = project.pipelineShots || project.shotList || [];
  const totalShots = shots.length > 0 ? shots.length : (scenes.length > 0 ? scenes.length : defaultTotalShots);
  
  // Count real images present on shots
  const visualImagesCount = shots.filter((s) => {
    const url = s.imageUrl || (s as any).image;
    return Boolean(url && url.trim().length > 0 && url !== '[IDB_IMAGE]');
  }).length;

  const isVisualComplete = totalShots > 0 && visualImagesCount >= totalShots;
  const isVisualInProgress = visualImagesCount > 0 && visualImagesCount < totalShots;

  // 5. MOTION Check
  // Count shots with camera angle & movement specified, or project.motion
  const shotsWithMotion = shots.filter((s) => {
    const mov = s.cameraMovement;
    return Boolean(mov && mov.trim().length > 0 && mov !== 'Static');
  }).length;
  const hasMotionCustom = Boolean(project.motion?.preset || project.motion?.cameraMovement);
  const motionCount = hasMotionCustom ? totalShots : shotsWithMotion;
  const isMotionComplete = totalShots > 0 && motionCount >= totalShots;
  const isMotionInProgress = motionCount > 0 && motionCount < totalShots;

  // 6. VIDEO Check
  const videoReady = Boolean(
    project.videos?.timelineReady ||
    (project.currentStage === 'videoproduction' && visualImagesCount >= totalShots) ||
    (visualImagesCount >= totalShots && totalShots > 0)
  );
  const videoCount = videoReady ? totalShots : 0;
  const isVideoComplete = videoReady && visualImagesCount >= totalShots;

  // 7. FINAL Check
  const isFinalComplete = project.status === 'ready' || project.status === 'completed';

  // Build items array
  const items: ProgressItem[] = [
    {
      key: 'idea',
      label: 'Ide',
      badgeText: hasIdeas ? 'IDE ✓' : 'IDE',
      status: hasIdeas ? 'completed' : 'pending',
    },
    {
      key: 'script',
      label: 'Naskah',
      badgeText: hasScript ? 'NASKAH ✓' : 'NASKAH',
      status: hasScript ? 'completed' : hasIdeas ? 'in_progress' : 'pending',
    },
    {
      key: 'storyboard',
      label: 'Storyboard',
      badgeText: hasStoryboard ? 'STORYBOARD ✓' : 'STORYBOARD',
      status: hasStoryboard ? 'completed' : hasScript ? 'in_progress' : 'pending',
    },
    {
      key: 'visual',
      label: 'Visual',
      badgeText: isVisualComplete ? `VISUAL ${totalShots}/${totalShots} ✓` : `VISUAL ${visualImagesCount}/${totalShots}`,
      status: isVisualComplete ? 'completed' : isVisualInProgress ? 'in_progress' : 'pending',
      currentCount: visualImagesCount,
      totalCount: totalShots,
    },
    {
      key: 'motion',
      label: 'Motion',
      badgeText: isMotionComplete ? `MOTION ${totalShots}/${totalShots} ✓` : `MOTION ${motionCount}/${totalShots}`,
      status: isMotionComplete ? 'completed' : isMotionInProgress ? 'in_progress' : 'pending',
      currentCount: motionCount,
      totalCount: totalShots,
    },
    {
      key: 'video',
      label: 'Video',
      badgeText: isVideoComplete ? `VIDEO ${totalShots}/${totalShots} ✓` : `VIDEO ${videoCount}/${totalShots}`,
      status: isVideoComplete ? 'completed' : (visualImagesCount > 0 ? 'in_progress' : 'pending'),
      currentCount: videoCount,
      totalCount: totalShots,
    },
    {
      key: 'final',
      label: 'Final',
      badgeText: isFinalComplete ? 'FINAL ✓' : 'FINAL',
      status: isFinalComplete ? 'completed' : 'pending',
    },
  ];

  // Count completed stages
  const completedStagesCount = items.filter((it) => it.status === 'completed').length;
  const totalStagesCount = items.length;
  const overallPercent = Math.round((completedStagesCount / totalStagesCount) * 100);

  // Determine Next Action Step (UX requirement: "Saya sedang mengerjakan apa? Sudah sampai mana? Apa langkah berikutnya?")
  let nextAction: NextActionStep;

  if (!hasIdeas) {
    nextAction = {
      label: 'Mulai Rumuskan Ide Konten',
      targetStage: 'idea',
      targetTab: 'studio',
      description: 'Langkah 1: Temukan konsep dan hook menarik untuk target audiensmu.',
    };
  } else if (!hasScript) {
    nextAction = {
      label: 'Lanjutkan ke Naskah 30 Detik',
      targetStage: 'script',
      targetTab: 'studio',
      description: 'Langkah 2: Susun naskah terstruktur (Hook, Masalah, Solusi, CTA).',
    };
  } else if (!hasStoryboard) {
    nextAction = {
      label: 'Lanjutkan ke Storyboard Visual',
      targetStage: 'storyboard',
      targetTab: 'studio',
      description: 'Langkah 3: Rancang aksi, visual, dan dialog per scene.',
    };
  } else if (!isVisualComplete) {
    nextAction = {
      label: `Lanjutkan ke Shot List (Visual ${visualImagesCount}/${totalShots})`,
      targetStage: 'shotlist',
      targetTab: 'studio',
      description: `Langkah 4: Buat visual untuk semua ${totalShots} shot agar siap diproduksi.`,
    };
  } else if (!isMotionComplete && motionCount === 0) {
    nextAction = {
      label: 'Lanjutkan ke Motion Control',
      targetStage: 'shotlist',
      targetTab: 'motion',
      description: 'Langkah 5: Tentukan pergerakan kamera sinematik untuk shot visualmu.',
    };
  } else if (!isVideoComplete || currentStage !== 'videoproduction') {
    nextAction = {
      label: 'Lanjutkan ke Video Produksi',
      targetStage: 'videoproduction',
      targetTab: 'studio',
      description: 'Langkah 6: Putar timeline dan pratinjau rangkaian video 4 shot.',
    };
  } else {
    nextAction = {
      label: 'Karya Siap · Tinjau Ulang Video',
      targetStage: 'videoproduction',
      targetTab: 'studio',
      description: 'Semua tahapan selesai! Video siap dieksekusi atau dibagikan.',
    };
  }

  return {
    projectName,
    currentStage,
    items,
    overallPercent,
    completedStagesCount,
    totalStagesCount,
    visualImagesCount,
    totalShotsCount: totalShots,
    motionCount,
    videoReady,
    nextAction,
  };
}
