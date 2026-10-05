import React, { useState } from 'react';
import { 
  FileText, 
  Copy, 
  Check, 
  Sparkles, 
  BookmarkPlus, 
  Clapperboard, 
  Camera 
} from 'lucide-react';
import { PromptPackData } from '../types';

interface PromptPackCardProps {
  data: PromptPackData;
  onSaveToProject?: () => void;
  onGenerateVideoFromPrompt?: (prompt: string) => void;
  showToast: (msg: string) => void;
}

export const PromptPackCard: React.FC<PromptPackCardProps> = ({
  data,
  onSaveToProject,
  onGenerateVideoFromPrompt,
  showToast,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`${label} berhasil disalin!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="mt-4 bg-white border border-stone-200/90 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-600 flex items-center justify-center text-white shadow-2xs">
            <Sparkles className="w-4 h-4 text-emerald-100" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/70">
              📝 Prompt Siap Disalin
            </span>
            <h3 className="text-sm sm:text-base font-extrabold text-stone-900 mt-0.5">
              {data.title}
            </h3>
          </div>
        </div>

        {onSaveToProject && (
          <button
            type="button"
            onClick={onSaveToProject}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span>Simpan</span>
          </button>
        )}
      </div>

      {/* 1. Prompt Global (AI Generator) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold text-stone-700">
          <span className="text-emerald-800">Prompt Global (Generator AI):</span>
          <button
            type="button"
            onClick={() => handleCopy('global', data.promptGlobal, 'Prompt Global')}
            className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            {copiedKey === 'global' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey === 'global' ? 'Tersalin!' : 'Salin Prompt'}</span>
          </button>
        </div>
        <p className="text-xs sm:text-sm font-mono text-stone-800 bg-stone-50 p-3.5 rounded-2xl border border-stone-200 leading-relaxed shadow-inner">
          {data.promptGlobal}
        </p>
      </div>

      {/* 2. Panduan Indonesia */}
      {data.promptIndo && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-stone-500">
            <span>Panduan & Terjemahan (ID):</span>
            <button
              type="button"
              onClick={() => handleCopy('indo', data.promptIndo, 'Panduan Indonesia')}
              className="text-stone-400 hover:text-stone-700 p-1"
              title="Salin Panduan ID"
            >
              {copiedKey === 'indo' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-xs text-stone-600 bg-white p-2.5 rounded-xl border border-stone-100 leading-relaxed">
            {data.promptIndo}
          </p>
        </div>
      )}

      {/* 3. Negative Prompt & Tips */}
      {data.negativePrompt && (
        <div className="flex items-center justify-between text-[11px] text-stone-500 bg-stone-50 p-2 rounded-xl border border-stone-100">
          <div className="truncate pr-2">
            <span className="font-semibold text-rose-700">Negative Prompt: </span>
            <span className="font-mono text-stone-600">{data.negativePrompt}</span>
          </div>
          <button
            type="button"
            onClick={() => handleCopy('negative', data.negativePrompt!, 'Negative Prompt')}
            className="text-stone-400 hover:text-stone-700 p-1 shrink-0"
            title="Salin Negative Prompt"
          >
            {copiedKey === 'negative' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      )}

      {/* Action to proceed to video */}
      {onGenerateVideoFromPrompt && (
        <div className="pt-2 border-t border-stone-100">
          <button
            type="button"
            onClick={() => onGenerateVideoFromPrompt(data.promptGlobal)}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-extrabold shadow-2xs transition-all cursor-pointer hover:scale-[1.01]"
          >
            <Clapperboard className="w-3.5 h-3.5" />
            <span>🎬 Buat Video Affiliate dari Prompt Ini (20 Detik)</span>
          </button>
        </div>
      )}
    </div>
  );
};
