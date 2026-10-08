import { PipelineScene, PipelineShot, CharacterDNA } from '../types';

export interface SmartMotionResult {
  preset: string;
  cameraMovement: string;
  cameraAngle: string;
  speed: string;
  intensity: string;
  type: 'product_reveal' | 'energetic' | 'emotional' | 'transition';
  description: string;
}

/**
 * Otomatis memilih gerakan kamera berdasarkan konteks adegan (Requirement 5):
 * - Scene product reveal → Slow Push-in (Dolly In)
 * - Scene energetic → Dynamic Tracking
 * - Scene emotional → Slow Push-in / subtle orbit
 * - Scene transition → Pan / Reveal
 */
export function getSmartMotionForScene(
  scene?: Partial<PipelineScene>,
  shot?: Partial<PipelineShot>,
  idx: number = 0
): SmartMotionResult {
  const combined = `${scene?.visual || ''} ${scene?.action || ''} ${shot?.subject || ''} ${shot?.shotType || ''}`.toLowerCase();

  // 1. Energetic / Aktivitas dinamis
  if (
    combined.includes('jalan') ||
    combined.includes('lari') ||
    combined.includes('panik') ||
    combined.includes('antar') ||
    combined.includes('motor') ||
    combined.includes('kurir') ||
    combined.includes('buru') ||
    combined.includes('langkah') ||
    combined.includes('aktivitas')
  ) {
    return {
      preset: 'Dynamic Tracking Follow',
      cameraMovement: 'Dynamic tracking follow',
      cameraAngle: shot?.cameraAngle || 'Eye level',
      speed: 'Dinamis (1.5x)',
      intensity: 'Tinggi',
      type: 'energetic',
      description: 'Dynamic tracking mengikuti langkah subjek secara stabil dengan ritme dinamis.',
    };
  }

  // 2. Emotional / Perasaan / Tatapan / Relate
  if (
    combined.includes('lelah') ||
    combined.includes('tatap') ||
    combined.includes('senyum') ||
    combined.includes('napas') ||
    combined.includes('pikir') ||
    combined.includes('sedih') ||
    combined.includes('nikmat') ||
    combined.includes('ekspresi') ||
    combined.includes('wajah')
  ) {
    return {
      preset: 'Orbiting / Arc Shot',
      cameraMovement: 'Subtle orbit arc',
      cameraAngle: shot?.cameraAngle || 'Eye level',
      speed: 'Perlahan (0.7x)',
      intensity: 'Halus',
      type: 'emotional',
      description: 'Orbiting arc halus mengitari subjek untuk menangkap ekspresi emosi dan kedalaman visual.',
    };
  }

  // 3. Product Reveal / Hero / Produk / Minuman / Makanan
  if (
    combined.includes('produk') ||
    combined.includes('reveal') ||
    combined.includes('kopi') ||
    combined.includes('minuman') ||
    combined.includes('makanan') ||
    combined.includes('botol') ||
    combined.includes('gelas') ||
    combined.includes('es batu') ||
    idx === 0
  ) {
    return {
      preset: 'Slow Push-in (Dolly In)',
      cameraMovement: 'Slow push-in',
      cameraAngle: shot?.cameraAngle || 'Eye level',
      speed: 'Normal (1.0x)',
      intensity: 'Normal',
      type: 'product_reveal',
      description: 'Slow push-in bergerak perlahan mendekati subjek untuk membangun rasa intim dan fokus visual.',
    };
  }

  // 4. Transition / Reveal / Suasana
  return {
    preset: 'Pan Left / Right Reveal',
    cameraMovement: 'Smooth pan reveal',
    cameraAngle: shot?.cameraAngle || 'Eye level',
    speed: 'Normal (1.0x)',
    intensity: 'Normal',
    type: 'transition',
    description: 'Pan reveal bergerak mendatar untuk mengungkap kejutan suasana dan transisi yang rapi.',
  };
}

/**
 * Format structured MOTION_CONTEXT string untuk Chat HEJO (Requirement 5)
 */
export function formatMotionContextString(params: {
  preset: string;
  angle: string;
  speed: string;
  intensity?: string;
  subject?: string;
  scene?: string;
}): string {
  return `MOTION_CONTEXT:
preset=${params.preset}
angle=${params.angle}
speed=${params.speed}
intensity=${params.intensity || 'Normal'}
subject=${params.subject || 'subjek utama'}
scene=${params.scene || 'scene aktif'}`;
}

/**
 * Parse structured MOTION_CONTEXT dari pesan teks
 */
export function parseMotionContext(rawText: string): Record<string, string> | null {
  if (!rawText.includes('MOTION_CONTEXT:') && !rawText.includes('motion_context:')) {
    return null;
  }
  const lines = rawText.split('\n');
  const result: Record<string, string> = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.includes('=')) {
      const [key, ...rest] = trimmed.split('=');
      result[key.trim().toLowerCase()] = rest.join('=').trim();
    }
  }
  return Object.keys(result).length > 0 ? result : null;
}

export const STANDARD_NEGATIVE_PROMPT =
  'blurry, low quality, distorted anatomy, warped fingers, deformed limbs, floating artifacts, oversaturated colors, text watermark, amateur lighting';
