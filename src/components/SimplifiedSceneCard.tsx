import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  RefreshCw, 
  AlertCircle, 
  Image as ImageIcon,
  UserCircle2,
  Camera,
  Film,
  Sparkles
} from 'lucide-react';
import { PipelineShot, CharacterDNA, UserMode } from '../types';
import { STANDARD_NEGATIVE_PROMPT } from '../utils/motionHelper';

interface SimplifiedSceneCardProps {
  shot: PipelineShot;
  index: number;
  voiceOverText?: string;
  imageUrl?: string;
  isLoadingImage?: boolean;
  imageError?: string;
  character?: CharacterDNA | null;
  characters?: CharacterDNA[];
  userMode: UserMode;
  onGenerateSingleImage: (shot: PipelineShot, idx: number) => void;
  onAssignCharacter?: (idx: number, characterId: string) => void;
  onUpdateShot?: (idx: number, updated: Partial<PipelineShot>) => void;
  showToast: (msg: string) => void;
}

export const SimplifiedSceneCard: React.FC<SimplifiedSceneCardProps> = ({
  shot,
  index,
  voiceOverText,
  imageUrl,
  isLoadingImage,
  imageError,
  character,
  characters = [],
  userMode,
  onGenerateSingleImage,
  onAssignCharacter,
  onUpdateShot,
  showToast,
}) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [customImagePrompt, setCustomImagePrompt] = useState(shot.imagePrompt || '');
  const [customVideoPrompt, setCustomVideoPrompt] = useState(shot.videoPrompt || '');

  const sceneLabel = shot.shotNumber 
    ? shot.shotNumber.toUpperCase() 
    : `SCENE ${String(index + 1).padStart(2, '0')}`;

  const durationLabel = shot.duration || '5 detik';
  const effectiveVoiceOver = voiceOverText || shot.voiceOver || 'Narasi visual terarah.';

  // Status mapping (Requirement 2 & 6)
  let statusLabel = 'Siap';
  let statusBadgeClass = 'bg-emerald-100 text-emerald-900 border border-emerald-300';

  if (isLoadingImage) {
    statusLabel = 'Menyiapkan...';
    statusBadgeClass = 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse';
  } else if (imageError) {
    statusLabel = 'Perlu dicoba lagi';
    statusBadgeClass = 'bg-rose-100 text-rose-900 border border-rose-300';
  } else if (imageUrl) {
    statusLabel = 'Selesai';
    statusBadgeClass = 'bg-emerald-100 text-emerald-900 border border-emerald-300';
  }

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Prompt disalin ke clipboard!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSavePrompts = () => {
    if (onUpdateShot) {
      onUpdateShot(index, {
        imagePrompt: customImagePrompt,
        videoPrompt: customVideoPrompt,
      });
      showToast('Prompt berhasil diperbarui!');
    }
    setIsEditingPrompt(false);
  };

  return (
    <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-3.5 transition-all hover:border-emerald-300">
      {/* 1. Header Sederhana: SCENE 01 · Status */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-stone-900 tracking-wider">
            {sceneLabel}
          </span>
          <span className="text-[10px] text-stone-400 font-medium">
            {shot.scene || `Scene ${index + 1}`}
          </span>
        </div>

        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${statusBadgeClass}`}>
          {statusLabel}
        </span>
      </div>

      {/* 2. Visual Preview (Requirement 4 & 6) */}
      <div className="relative rounded-2xl overflow-hidden bg-stone-900 border border-stone-200 aspect-video group">
        {isLoadingImage ? (
          <div className="w-full h-full bg-emerald-50/80 flex flex-col items-center justify-center p-3 text-center">
            <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mb-1.5" />
            <span className="text-xs font-bold text-emerald-900">
              Membuat visual {sceneLabel}...
            </span>
            <span className="text-[10px] text-emerald-700 mt-0.5">
              Mohon tunggu sebentar
            </span>
          </div>
        ) : imageError ? (
          <div className="w-full h-full bg-rose-50 flex flex-col items-center justify-center p-4 text-center">
            <AlertCircle className="w-6 h-6 text-rose-500 mb-1" />
            <span className="text-xs font-bold text-rose-900">
              Perlu dicoba lagi
            </span>
            <p className="text-[10px] text-rose-600 mt-0.5 mb-2.5 max-w-[200px] truncate">
              {imageError}
            </p>
            {/* Requirement 6: "↻ Coba Lagi" */}
            <button
              type="button"
              onClick={() => onGenerateSingleImage(shot, index)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>↻ Coba Lagi</span>
            </button>
          </div>
        ) : imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={`Visual ${sceneLabel}`}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {character && (
              <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-black/75 backdrop-blur-xs text-[10px] font-semibold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>{character.name}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-2">
              <button
                type="button"
                onClick={() => onGenerateSingleImage(shot, index)}
                className="px-2.5 py-1 bg-black/80 hover:bg-black text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                title="Generate ulang visual shot ini"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Regenerate</span>
              </button>
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-stone-50 flex flex-col items-center justify-center p-3 text-center">
            <ImageIcon className="w-6 h-6 text-stone-300 mb-1" />
            <span className="text-[11px] font-medium text-stone-500">
              Visual belum dibuat
            </span>
            <button
              type="button"
              onClick={() => onGenerateSingleImage(shot, index)}
              className="mt-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Visual</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Tampilan Sederhana: Narasi, Durasi, Status (Requirement 4) */}
      <div className="space-y-2 text-xs">
        <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100 space-y-1">
          <span className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider block">
            Narasi:
          </span>
          <p className="text-stone-800 font-medium italic line-clamp-2 leading-relaxed">
            "{effectiveVoiceOver}"
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-stone-600 px-1 pt-0.5">
          <span>
            Durasi: <strong className="text-stone-900">{durationLabel}</strong>
          </span>
          <span>
            Status: <strong className="text-emerald-700">{statusLabel}</strong>
          </span>
        </div>
      </div>

      {/* 4. Tombol Kecil: "Detail ▾" (Requirement 4) */}
      <div className="pt-2 border-t border-stone-100">
        <button
          type="button"
          onClick={() => setIsDetailOpen((prev) => !prev)}
          className="text-xs font-bold text-stone-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer py-1"
        >
          <span>{isDetailOpen ? 'Detail ▴' : 'Detail ▾'}</span>
          {isDetailOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {/* 5. Detail Box jika dibuka (Requirement 4) */}
        {isDetailOpen && (
          <div className="mt-2.5 p-3.5 bg-stone-50 rounded-2xl border border-stone-200/90 space-y-3 text-xs animate-in fade-in duration-150">
            {/* Image Prompt */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-extrabold text-stone-500 uppercase text-[10px]">
                  Image Prompt:
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(`img_${index}`, shot.imagePrompt || '')}
                  className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === `img_${index}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === `img_${index}` ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
              <p className="p-2.5 bg-white rounded-xl border border-stone-200 font-mono text-[11px] text-stone-700 leading-relaxed break-words">
                {shot.imagePrompt || 'Cinematic visual prompt otomatis disiapkan HEJO.'}
              </p>
            </div>

            {/* Video Prompt */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-extrabold text-stone-500 uppercase text-[10px]">
                  Video Prompt:
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(`vid_${index}`, shot.videoPrompt || '')}
                  className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === `vid_${index}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === `vid_${index}` ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
              <p className="p-2.5 bg-white rounded-xl border border-stone-200 font-mono text-[11px] text-stone-700 leading-relaxed break-words">
                {shot.videoPrompt || 'AI Video motion prompt otomatis disiapkan HEJO.'}
              </p>
            </div>

            {/* Camera, Motion, Lighting, Location */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-600 pt-1 border-t border-stone-200">
              <div>
                <strong className="text-stone-700 block">Camera:</strong>
                <span>{shot.cameraAngle || 'Eye level'} · {shot.shotType || 'Medium shot'}</span>
              </div>
              <div>
                <strong className="text-stone-700 block">Motion:</strong>
                <span>{shot.cameraMovement || 'Slow push-in'}</span>
              </div>
              <div>
                <strong className="text-stone-700 block">Lighting:</strong>
                <span>{shot.lighting || 'Cinematic natural'}</span>
              </div>
              <div>
                <strong className="text-stone-700 block">Location:</strong>
                <span>{shot.location || 'Studio'}</span>
              </div>
            </div>

            {/* Negative Prompt */}
            <div>
              <span className="font-extrabold text-stone-500 uppercase text-[10px] block mb-1">
                Negative Prompt:
              </span>
              <p className="p-2 bg-white/90 rounded-xl border border-stone-200 font-mono text-[10px] text-stone-500 leading-relaxed break-words">
                {shot.negativePrompt || STANDARD_NEGATIVE_PROMPT}
              </p>
            </div>

            {/* CREATOR & PRO Mode Controls (Requirement 10) */}
            {userMode !== 'SIMPLE' && (
              <div className="pt-2 border-t border-stone-200 flex items-center justify-between gap-2 flex-wrap text-xs">
                {/* Character Picker */}
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-stone-600 text-[11px]">Karakter:</span>
                  <select
                    value={shot.characterId || ''}
                    onChange={(e) => onAssignCharacter && onAssignCharacter(index, e.target.value)}
                    className="text-[11px] font-semibold px-2 py-1 bg-white border border-stone-300 rounded-lg text-stone-700 focus:outline-none"
                  >
                    <option value="">-- Ikuti Project --</option>
                    <option value="none">🚫 Tanpa Karakter</option>
                    {characters.map((c) => (
                      <option key={c.id} value={c.id}>
                        👤 {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Edit prompt toggle */}
                <button
                  type="button"
                  onClick={() => setIsEditingPrompt((prev) => !prev)}
                  className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  {isEditingPrompt ? 'Batal Edit' : '✏️ Edit Prompt'}
                </button>
              </div>
            )}

            {isEditingPrompt && (
              <div className="p-3 bg-white rounded-xl border border-emerald-300 space-y-2">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                  Edit Prompt Khusus:
                </span>
                <textarea
                  value={customImagePrompt}
                  onChange={(e) => setCustomImagePrompt(e.target.value)}
                  rows={2}
                  className="w-full text-xs font-mono p-2 border border-stone-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  placeholder="Edit Image Prompt..."
                />
                <textarea
                  value={customVideoPrompt}
                  onChange={(e) => setCustomVideoPrompt(e.target.value)}
                  rows={2}
                  className="w-full text-xs font-mono p-2 border border-stone-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  placeholder="Edit Video Prompt..."
                />
                <button
                  type="button"
                  onClick={handleSavePrompts}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
