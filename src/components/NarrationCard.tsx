import React, { useState } from 'react';
import { Mic, Copy, Check, Volume2, ChevronDown, ChevronUp } from 'lucide-react';
import { NarrationPackage } from '../utils/narrationHelper';
import { UserMode } from '../types';

interface NarrationCardProps {
  narration?: NarrationPackage | null;
  onCopy?: () => void;
  showToast: (msg: string) => void;
  userMode: UserMode;
}

export const NarrationCard: React.FC<NarrationCardProps> = ({
  narration,
  showToast,
  userMode,
}) => {
  const [copied, setCopied] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  if (!narration) return null;

  const handleCopy = () => {
    const fullText = `🎙️ NARASI & VOICE DIRECTION (HEJO AI)
${narration.fullScript}

---
• Voice Direction: ${narration.voiceDirection}
• Tone: ${narration.tone}
• Tempo: ${narration.pace}${narration.characterName ? `\n• Pembawa / Karakter: ${narration.characterName}` : ''}`;

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    showToast('Narasi dan voice direction berhasil disalin!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 border border-emerald-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-2xs shrink-0">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-emerald-950">
                🎙️ Narasi siap
              </h3>
              <span className="text-[10px] font-bold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full">
                {narration.characterName ? `Karakter: ${narration.characterName}` : 'Voice Over'}
              </span>
            </div>
            <p className="text-xs text-stone-600 mt-0.5">
              {narration.tone} · Tempo natural
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {userMode !== 'SIMPLE' && (
            <button
              type="button"
              onClick={() => setShowDetail((prev) => !prev)}
              className="text-xs font-semibold text-stone-600 hover:text-stone-900 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white cursor-pointer flex items-center gap-1"
            >
              <span>{showDetail ? 'Sembunyikan' : 'Detail Voice'}</span>
              {showDetail ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer hover:scale-[1.02]"
            title="Salin narasi lengkap ke clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-200" />
                <span>Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Narasi</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Snippet Teks Narasi */}
      <div className="bg-white/90 border border-emerald-100 rounded-xl p-3 text-xs text-stone-700 italic leading-relaxed line-clamp-3">
        "{narration.fullScript.slice(0, 240)}..."
      </div>

      {/* Detail Voice Direction jika dibuka */}
      {showDetail && (
        <div className="bg-white border border-stone-200 rounded-xl p-3 text-xs space-y-2 text-stone-600 animate-in fade-in duration-150">
          <div>
            <span className="font-bold text-stone-500 uppercase text-[10px]">Arahan Suara (Voice Direction):</span>
            <p className="text-stone-800 mt-0.5">{narration.voiceDirection}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-stone-100 text-[11px]">
            <div><strong>Tone:</strong> {narration.tone}</div>
            <div><strong>Pace / Kecepatan:</strong> {narration.pace}</div>
          </div>
        </div>
      )}
    </div>
  );
};
