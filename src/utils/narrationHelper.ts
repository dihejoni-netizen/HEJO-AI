import { PipelineScript, PipelineScene, CharacterDNA, CreatorContext } from '../types';

export interface NarrationPackage {
  fullScript: string;
  voiceDirection: string;
  tone: string;
  pace: string;
  characterName?: string;
  scenesNarration: {
    sceneNumber: number;
    label: string;
    duration: string;
    text: string;
    direction: string;
  }[];
}

export function generateNarrationPackage(
  script?: Partial<PipelineScript>,
  scenes: PipelineScene[] = [],
  context: CreatorContext = {},
  character?: CharacterDNA | null
): NarrationPackage {
  const target = context.targetAudiens || 'audiens umum';
  const charName = character?.name || context.karakter;
  const tone = context.gaya || 'Hangat, ramah, dan meyakinkan';
  const pace = 'Natural & santai (130-140 kata per menit, ada jeda nafas)';

  const voiceDirection = charName
    ? `Dibawakan oleh persona "${charName}". Gaya bicara ${character?.speakingStyle || 'santai, ramah, artikulasi jelas'}, nada bersahabat menyapa ${target}.`
    : `Nada bicara bersahabat, artikulasi jelas, tidak kaku seperti membaca teks, ritme dinamis sesuai tempo video 30 detik untuk ${target}.`;

  const scenesNarration = scenes.map((sc, idx) => {
    let direction = 'Bicara santai';
    if (idx === 0) direction = 'Hook: antusias & menarik perhatian penonton';
    else if (idx === 1) direction = 'Empati: nada relate & pengertian';
    else if (idx === 2) direction = 'Solutif: nada ceria & meyakinkan';
    else direction = 'Call to action: nada mengajak & ramah';

    return {
      sceneNumber: sc.sceneNumber || idx + 1,
      label: sc.sceneLabel || `SCENE ${idx + 1}`,
      duration: sc.duration || '5 detik',
      text: sc.voiceOver || '',
      direction,
    };
  });

  const fullScript = scenesNarration
    .filter((s) => s.text && s.text.trim().length > 0)
    .map((s) => `[${s.label} - ${s.duration}]: "${s.text}"`)
    .join('\n\n') ||
    (script?.hook ? `[Hook]: "${script.hook}"\n\n[Masalah]: "${script.problem || ''}"\n\n[Solusi]: "${script.solution || ''}"\n\n[CTA]: "${script.callToAction || ''}"` : 'Narasi siap diracik.');

  return {
    fullScript,
    voiceDirection,
    tone,
    pace,
    characterName: charName,
    scenesNarration,
  };
}
