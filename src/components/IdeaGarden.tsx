import React, { useState } from 'react';
import { 
  Sprout, 
  Sparkles, 
  RefreshCw, 
  ArrowRight, 
  Copy, 
  Check, 
  BookmarkPlus, 
  Lightbulb,
  Compass
} from 'lucide-react';
import { IdeaCard, ActiveNavTab, UserMode } from '../types';
import { requestIdeas } from '../services/aiService';

interface IdeaGardenProps {
  ideas: IdeaCard[];
  setIdeas: React.Dispatch<React.SetStateAction<IdeaCard[]>>;
  userMode: UserMode;
  setActiveTab: (tab: ActiveNavTab) => void;
  showToast: (msg: string) => void;
  onSelectIdeaForChat: (idea: IdeaCard) => void;
  onSelectIdeaForStudio: (idea: IdeaCard) => void;
}

export const IdeaGarden: React.FC<IdeaGardenProps> = ({
  ideas,
  setIdeas,
  userMode,
  setActiveTab,
  showToast,
  onSelectIdeaForChat,
  onSelectIdeaForStudio,
}) => {
  const [selectedNiche, setSelectedNiche] = useState('Kuliner & Kopi');
  const [customNiche, setCustomNiche] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const niches = [
    'Kuliner & Kopi',
    'Bisnis Lokal & UMKM',
    'Edukasi & Tutorial',
    'Gaya Hidup & Fashion',
    'Storytelling & Pengalaman',
    'Tips Konten Kreator',
  ];

  const handleGenerate = async (nicheToUse?: string) => {
    const targetNiche = nicheToUse || customNiche || selectedNiche;
    setIsGenerating(true);
    try {
      const newIdeas = await requestIdeas(targetNiche);
      if (newIdeas && newIdeas.length > 0) {
        setIdeas(newIdeas);
        showToast(`Ide segar untuk "${targetNiche}" berhasil disemai!`);
      }
    } catch (err) {
      showToast('Gagal memuat ide, coba lagi beberapa saat');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Ide disalin ke clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <Sprout className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
              Kebun Ide (Idea Incubator)
            </h1>
          </div>
          <p className="text-sm text-stone-500 mt-1">
            Temukan inspirasi sudut pandang unik dan hook pembuka yang belum pernah terpikirkan.
          </p>
        </div>

        <button
          onClick={() => handleGenerate()}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-200 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>{isGenerating ? 'Menyemai Ide...' : 'Semai Ide Baru'}</span>
        </button>
      </div>

      {/* Niche Selector */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <label className="text-xs font-bold text-stone-700 block">
          Pilih Bidang / Niche Kontenmu:
        </label>
        <div className="flex flex-wrap gap-2">
          {niches.map((niche) => (
            <button
              key={niche}
              onClick={() => {
                setSelectedNiche(niche);
                setCustomNiche('');
                handleGenerate(niche);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedNiche === niche && !customNiche
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {niche}
            </button>
          ))}
        </div>

        {/* Custom Niche input */}
        <div className="pt-2 flex items-center gap-2">
          <input
            type="text"
            placeholder="Atau tulis bidang spesifik (misal: 'kerajinan gerabah', 'gym pemula', 'skincare herbal')..."
            value={customNiche}
            onChange={(e) => setCustomNiche(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleGenerate(customNiche);
            }}
            className="w-full text-xs sm:text-sm px-3.5 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-emerald-600"
          />
          <button
            onClick={() => handleGenerate(customNiche)}
            disabled={!customNiche.trim() || isGenerating}
            className="px-4 py-2 bg-stone-800 hover:bg-black disabled:bg-stone-200 text-white text-xs font-bold rounded-lg whitespace-nowrap"
          >
            Cari
          </button>
        </div>
      </div>

      {/* Idea Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ideas.map((idea) => (
          <div
            key={idea.id}
            className="bg-white border border-stone-200/90 hover:border-emerald-400 rounded-2xl p-5 shadow-sm hover:shadow transition-all flex flex-col justify-between group"
          >
            <div>
              {/* Category tags with zero-pill clean typographic separators */}
              <div className="flex items-center gap-2 text-xs text-stone-500 mb-2 font-medium">
                <span className="text-emerald-700 font-bold">{idea.niche}</span>
                <span>·</span>
                <span>{idea.format}</span>
                <span>·</span>
                <span>Tingkat: {idea.difficulty}</span>
              </div>

              {/* Title */}
              <h3 className="text-base font-bold text-stone-900 group-hover:text-emerald-900 transition-colors">
                {idea.title}
              </h3>

              {/* Angle */}
              <div className="mt-2 text-xs text-stone-600 bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                <span className="font-semibold text-stone-700">Sudut Pandang: </span>
                <span>{idea.angle}</span>
              </div>

              {/* Hook (The 3-second magnet) */}
              <div className="mt-3 p-3 bg-emerald-50/60 border border-emerald-100/90 rounded-xl">
                <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Hook 3 Detik Pertama</span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-stone-800 italic">
                  "{idea.hook}"
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between">
              <button
                onClick={() => handleCopy(idea.id, `${idea.title}\n\nHook: "${idea.hook}"\nSudut Pandang: ${idea.angle}`)}
                className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 transition-colors"
                title="Salin Ide"
              >
                {copiedId === idea.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === idea.id ? 'Tersalin' : 'Salin'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectIdeaForChat(idea)}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Kembangkan di Chat
                </button>
                <button
                  onClick={() => onSelectIdeaForStudio(idea)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1 transition-all"
                >
                  <span>Bawa ke Studio</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
