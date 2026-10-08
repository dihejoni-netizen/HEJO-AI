import React, { useState } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  BookmarkPlus, 
  Clapperboard, 
  Flame, 
  ArrowRight,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { MultiAffiliatePackage, AffiliateContentItem } from '../types';

interface MultiContentAffiliateCardProps {
  data: MultiAffiliatePackage;
  onSelectContentForVideo?: (item: AffiliateContentItem) => void;
  onSaveToProject?: (data: MultiAffiliatePackage) => void;
  showToast: (msg: string) => void;
}

export const MultiContentAffiliateCard: React.FC<MultiContentAffiliateCardProps> = ({
  data,
  onSelectContentForVideo,
  onSaveToProject,
  showToast,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isCopiedAll, setIsCopiedAll] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(data.contents[0]?.id || null);

  const handleCopy = (key: string, text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`${label} berhasil disalin!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyAll = () => {
    let fullText = `# PAKET KONTEN AFFILIATE: 1 PRODUK → ${data.contentCount} SUDUT PANDANG\nProduk: ${data.productName}\n\n`;
    data.contents.forEach((c) => {
      fullText += `========================================\nKONTEN #${c.angleIndex}: [${c.angleName}]\n${c.angleDescription}\n----------------------------------------\n[Hook]: "${c.hook}"\n\n[Naskah]:\n"${c.narration}"\n\n[CTA]:\n${c.callToAction}\n\n[Prompt Video Flow]:\n${c.videoPrompt || '-'}\n\n`;
    });

    navigator.clipboard.writeText(fullText.trim());
    setIsCopiedAll(true);
    showToast(`Seluruh paket (${data.contentCount} konten) berhasil disalin!`);
    setTimeout(() => setIsCopiedAll(false), 2500);
  };

  const handleSave = () => {
    if (onSaveToProject) {
      onSaveToProject(data);
    }
    setIsSaved(true);
    showToast(`Paket ${data.contentCount} konten affiliate berhasil disimpan ke project!`);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="mt-4 bg-white border border-stone-200/90 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-emerald-600 flex items-center justify-center text-white shadow-sm">
            <Flame className="w-5 h-5 text-amber-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
                1 Produk → {data.contentCount} Konten
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-stone-900 tracking-tight mt-0.5">
              {data.productName}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyAll}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            {isCopiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopiedAll ? 'Tersalin' : 'Salin Semua'}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
            <span>{isSaved ? 'Tersimpan' : 'Simpan'}</span>
          </button>
        </div>
      </div>

      <p className="text-xs text-stone-500 -mt-1 leading-relaxed">
        Setiap konten di bawah menggunakan angle berbeda agar akun affiliate kamu bervariasi dan menjangkau calon pembeli dengan tipe keresahan yang beragam:
      </p>

      {/* Content items list */}
      <div className="space-y-3.5">
        {data.contents.map((item) => {
          const isExpanded = expandedId === item.id;
          return (
            <div 
              key={item.id}
              className="bg-stone-50/80 border border-stone-200/80 rounded-2xl p-4 sm:p-4.5 space-y-3 transition-colors hover:border-emerald-400"
            >
              {/* Item Header */}
              <div 
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="flex items-start justify-between gap-3 cursor-pointer select-none"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {item.angleIndex}
                    </span>
                    <span className="text-sm font-extrabold text-stone-900">
                      Angle: {item.angleName}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1 pl-8">
                    {item.angleDescription}
                  </p>
                </div>

                <button 
                  type="button"
                  className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60"
                  aria-label={isExpanded ? 'Tutup detail' : 'Buka detail'}
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Hook Preview (Always visible) */}
              <div className="pl-8 text-xs text-stone-800 bg-white p-2.5 rounded-xl border border-stone-200/80 font-medium">
                <span className="font-bold text-amber-700 mr-1.5">⚡ Hook 3 Detik:</span>
                "{item.hook}"
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="pl-8 space-y-3 pt-1 border-t border-stone-200/70 animate-in fade-in duration-150">
                  {/* Naskah */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-stone-600">
                      <span>Naskah Utama:</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(`naskah-${item.id}`, item.narration, `Naskah Konten #${item.angleIndex}`);
                        }}
                        className="text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        {copiedKey === `naskah-${item.id}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>Salin Naskah</span>
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm text-stone-700 bg-white p-3 rounded-xl border border-stone-200 leading-relaxed italic">
                      "{item.narration}"
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="text-xs text-emerald-900 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200 font-semibold flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span>🛒 CTA:</span>
                      <span className="font-normal text-stone-700">{item.callToAction}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(`cta-${item.id}`, item.callToAction, 'CTA');
                      }}
                      className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer shrink-0"
                    >
                      {copiedKey === `cta-${item.id}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  {/* Actions for this specific content */}
                  <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => onSelectContentForVideo && onSelectContentForVideo(item)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-extrabold shadow-2xs transition-all cursor-pointer hover:scale-[1.02]"
                    >
                      <Clapperboard className="w-3.5 h-3.5" />
                      <span>🎬 Buat Video Flow untuk Konten Ini</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopy(`full-${item.id}`, `[Angle ${item.angleName}]\nHook: "${item.hook}"\nNaskah: "${item.narration}"\nCTA: ${item.callToAction}`, `Konten #${item.angleIndex}`)}
                      className="text-xs text-stone-500 hover:text-stone-900 font-semibold px-2 py-1 rounded-lg hover:bg-stone-200/60 transition-colors cursor-pointer"
                    >
                      {copiedKey === `full-${item.id}` ? '✓ Tersalin Lengkap' : 'Salin Lengkap'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
