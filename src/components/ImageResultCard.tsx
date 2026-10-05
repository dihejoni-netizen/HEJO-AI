import React, { useState } from 'react';
import { 
  ImageIcon, 
  Copy, 
  Check, 
  Sparkles, 
  Clapperboard, 
  RefreshCw,
  BookmarkPlus
} from 'lucide-react';
import { ImageResultData } from '../types';

interface ImageResultCardProps {
  data: ImageResultData;
  onGenerateVideo?: (prompt: string) => void;
  onSaveToProject?: () => void;
  showToast: (msg: string) => void;
}

export const ImageResultCard: React.FC<ImageResultCardProps> = ({
  data,
  onGenerateVideo,
  onSaveToProject,
  showToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(data.imageUrl || null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(data.prompt);
    setCopied(true);
    showToast('Prompt gambar berhasil disalin!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateImage = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    showToast('Menghubungi generator visual...');

    try {
      const res = await fetch('/api/hejo/pipeline/shot-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shot: {
            shotNumber: 'VISUAL',
            scene: 'Scene 1',
            subject: data.prompt,
            shotType: 'Medium Shot',
            cameraAngle: 'Eye level',
            lighting: 'Studio warm light',
            location: 'Studio',
            duration: '3 detik'
          },
          context: {}
        })
      });

      if (!res.ok) throw new Error('Generation not available');
      const json = await res.json();
      if (json.imageUrl) {
        setImagePreview(json.imageUrl);
        showToast('Gambar visual berhasil disiapkan!');
      } else {
        throw new Error('No imageUrl');
      }
    } catch {
      showToast('Visual generator sedang sibuk. Prompt gambar siap kamu gunakan di generator AI pilihan!');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mt-4 bg-white border border-stone-200/90 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-2xs">
            <ImageIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/70">
              🖼️ Visual & Prompt Gambar
            </span>
            <h3 className="text-sm sm:text-base font-extrabold text-stone-900 mt-0.5">
              Siap untuk Produksi Visual
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopyPrompt}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin' : 'Salin Prompt'}</span>
          </button>
        </div>
      </div>

      {/* Image Preview if available */}
      {imagePreview && (
        <div className="rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 max-h-72 flex items-center justify-center">
          <img 
            src={imagePreview} 
            alt="Preview Visual" 
            className="w-full h-auto object-cover max-h-72" 
          />
        </div>
      )}

      {/* Prompt Box */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-stone-700 block">
          Prompt Gambar (Midjourney / Flux / Imagen / Kling):
        </label>
        <p className="text-xs sm:text-sm font-mono text-stone-800 bg-stone-50 p-3.5 rounded-2xl border border-stone-200 leading-relaxed shadow-inner">
          {data.prompt}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
        {!imagePreview && (
          <button
            type="button"
            onClick={handleGenerateImage}
            disabled={isGenerating}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-emerald-600" />}
            <span>{isGenerating ? 'Menyiapkan Gambar...' : '✨ Buat Gambar Preview'}</span>
          </button>
        )}

        {onGenerateVideo && (
          <button
            type="button"
            onClick={() => onGenerateVideo(data.prompt)}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-extrabold shadow-2xs transition-all cursor-pointer hover:scale-[1.01]"
          >
            <Clapperboard className="w-3.5 h-3.5" />
            <span>🎬 Lanjut Buat Video Affiliate (20 Detik)</span>
          </button>
        )}
      </div>
    </div>
  );
};
