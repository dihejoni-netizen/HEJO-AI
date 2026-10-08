import React, { useState } from 'react';
import { 
  Sparkles, 
  ExternalLink, 
  Copy, 
  Check, 
  BookmarkPlus, 
  Film, 
  Clapperboard, 
  ImageIcon, 
  Mic, 
  ShoppingBag, 
  RefreshCw,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { FlowReadyData, FlowReadyScene, GoogleFlowConnection } from '../types';

interface FlowReadyCardProps {
  data: FlowReadyData;
  connection?: GoogleFlowConnection;
  onOpenConnectionModal?: () => void;
  onSaveToProject?: (data: FlowReadyData) => void;
  onOpenStudio?: (data: FlowReadyData) => void;
  onOpenFlowWorkspace?: (data: FlowReadyData) => void;
  onOpenVoiceOver?: (narrationText: string) => void;
  showToast: (msg: string) => void;
  flowUrl?: string;
}

export const FlowReadyCard: React.FC<FlowReadyCardProps> = ({
  data,
  connection,
  onOpenConnectionModal,
  onSaveToProject,
  onOpenStudio,
  onOpenFlowWorkspace,
  onOpenVoiceOver,
  showToast,
  flowUrl = 'https://labs.google/flow',
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isCopiedAll, setIsCopiedAll] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [sceneImages, setSceneImages] = useState<Record<number, string>>({});
  const [generatingImgIndex, setGeneratingImgIndex] = useState<number | null>(null);

  const handleCopyText = (key: string, text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`${label} berhasil disalin!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const compileAllPromptsText = (): string => {
    let fullText = `# HEJO AI · MATERI SIAP UNTUK FLOW\n`;
    fullText += `Produk: ${data.productName}\n`;
    fullText += `Total Scene: ${data.sceneCount} Scene\n`;
    fullText += `Total Durasi: ${data.totalDuration}\n`;
    fullText += `Catatan: Gunakan prompt video ini langsung pada akun Flow AI milik Anda.\n\n`;

    data.scenes.forEach((s) => {
      fullText += `========================================================\n`;
      fullText += `SCENE ${s.sceneNumber} (${s.duration})\n`;
      fullText += `========================================================\n`;
      fullText += `[Storyboard]:\n${s.storyboard}\n\n`;
      fullText += `[Prompt Video (Flow AI)]:\n${s.videoPrompt}\n\n`;
      fullText += `[Prompt Gambar Referensi]:\n${s.imagePrompt}\n\n`;
      fullText += `[Narasi Audio]:\n"${s.narration}"\n\n`;
      if (s.cta) {
        fullText += `[CTA]:\n${s.cta}\n\n`;
      }
    });

    return fullText.trim();
  };

  const handleCopyAllPrompts = () => {
    const text = compileAllPromptsText();
    navigator.clipboard.writeText(text);
    setIsCopiedAll(true);
    showToast(`Seluruh prompt (${data.sceneCount} scene) berhasil disalin ke clipboard!`);
    setTimeout(() => setIsCopiedAll(false), 2500);
  };

  // Tombol Utama: [🚀 Lanjut ke Flow] (Requirement 3 & 4)
  const handleProceedToFlow = () => {
    // 1. Salin seluruh prompt ke clipboard untuk kenyamanan pengguna
    const text = compileAllPromptsText();
    try {
      navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }

    // 2. Buka ruang kerja Flow HEJO terlebih dahulu jika handler tersedia
    if (onOpenFlowWorkspace) {
      onOpenFlowWorkspace(data);
      showToast('🚀 Membuka Ruang Kerja Flow AI dengan materi Flow Pack!');
      return;
    }

    // 3. Fallback: Buka tab baru ke Flow secara aman
    try {
      window.open(flowUrl, '_blank', 'noopener,noreferrer');
      showToast('🚀 Membuka Flow AI di tab baru! Seluruh prompt sudah disalin.');
    } catch {
      showToast('Gagal membuka tab baru. Silakan izinkan pop-up browser untuk membuka Flow.');
    }
  };

  const handleSave = () => {
    if (onSaveToProject) {
      onSaveToProject(data);
    }
    setIsSaved(true);
    showToast(`Materi Flow "${data.productName}" tersimpan di project!`);
    setTimeout(() => setIsSaved(false), 2500);
  };

  // Generate reference image without blocking workflow (Requirement 6)
  const handleGenerateReferenceImage = async (scene: FlowReadyScene, idx: number) => {
    if (generatingImgIndex !== null) return;
    setGeneratingImgIndex(idx);
    showToast(`Menyiapkan gambar referensi untuk Scene ${scene.sceneNumber}...`);

    try {
      const res = await fetch('/api/hejo/pipeline/shot-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shot: {
            shotNumber: `SCENE ${scene.sceneNumber}`,
            scene: `Scene ${scene.sceneNumber}`,
            subject: data.productName,
            shotType: 'Medium Shot',
            cameraAngle: 'Eye level',
            cameraMovement: 'Cinematic push-in',
            lighting: 'Natural studio light',
            location: 'Studio',
            duration: scene.duration,
          },
          context: {
            produk: data.productName,
            platform: data.platform || 'TikTok',
          },
        }),
      });

      if (!res.ok) throw new Error('Gagal request gambar');
      const resData = await res.json();
      if (resData.imageUrl) {
        setSceneImages((prev) => ({ ...prev, [idx]: resData.imageUrl }));
        showToast(`Gambar referensi Scene ${scene.sceneNumber} siap!`);
      } else {
        throw new Error('Tidak ada imageUrl');
      }
    } catch {
      // Tetap lanjutkan, prompt gambar tetap tampil (Requirement 6)
      showToast('Visual generator sedang sibuk. Prompt gambar tetap siap untuk kamu gunakan!');
    } finally {
      setGeneratingImgIndex(null);
    }
  };

  return (
    <div className="mt-4 bg-gradient-to-b from-stone-900 to-stone-950 border-2 border-emerald-500/80 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden animate-in fade-in duration-200">
      {/* Decorative background glow */}
      <div className="absolute -top-10 -right-10 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* 1. Header: Siap untuk Flow */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/30">
            <Film className="w-5 h-5 text-emerald-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black tracking-tight text-white">
                🎬 Siap untuk Flow
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-400 mt-0.5">
              <span className="font-bold text-emerald-400">{data.sceneCount} Scene</span>
              <span>·</span>
              <span className="font-bold text-stone-300">{data.totalDuration}</span>
              {data.productName && (
                <>
                  <span>·</span>
                  <span className="text-stone-300 font-semibold truncate max-w-[200px]">
                    {data.productName}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Connection status pill */}
        <div className="flex items-center gap-2">
          {connection?.isConnected ? (
            <button
              type="button"
              onClick={onOpenConnectionModal}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-500/50 rounded-full text-xs font-semibold cursor-pointer transition-colors"
              title="Koneksi Google/Flow aktif (Klik untuk melihat)"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Flow Terhubung</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenConnectionModal}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-950/80 hover:bg-amber-900/90 text-amber-300 border border-amber-500/50 rounded-full text-xs font-semibold cursor-pointer transition-colors"
              title="Hubungkan akun Google/Flow Anda"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Flow Belum Terhubung</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Scenes List */}
      <div className="py-5 space-y-5">
        {data.scenes.map((scene, idx) => {
          const currentImg = sceneImages[idx] || scene.imageUrl;
          const isGeneratingThis = generatingImgIndex === idx;

          return (
            <div 
              key={idx}
              className="bg-stone-850/90 border border-stone-800 rounded-2xl p-4 sm:p-5 space-y-4 hover:border-emerald-500/40 transition-colors"
            >
              {/* Scene Title & Duration */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.8 bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 text-xs font-extrabold rounded-lg">
                    Scene {scene.sceneNumber}
                  </span>
                  <span className="text-xs font-semibold text-stone-300">
                    {scene.duration}
                  </span>
                </div>

                {/* Optional Image Reference trigger (Requirement 6) */}
                {!currentImg ? (
                  <button
                    type="button"
                    onClick={() => handleGenerateReferenceImage(scene, idx)}
                    disabled={isGeneratingThis}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingThis ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Menyiapkan visual...</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-3 h-3" />
                        <span>+ Visual Preview</span>
                      </>
                    )}
                  </button>
                ) : (
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>Visual siap</span>
                  </span>
                )}
              </div>

              {/* Optional Visual Thumbnail Preview */}
              {currentImg && (
                <div className="rounded-xl overflow-hidden border border-stone-700 max-w-sm max-h-48 bg-stone-900">
                  <img
                    src={currentImg}
                    alt={`Preview Scene ${scene.sceneNumber}`}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              {/* [Storyboard] */}
              <div className="bg-stone-900/80 border border-stone-800/90 rounded-xl p-3.5 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-stone-400">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <Clapperboard className="w-3.5 h-3.5" />
                    <span>[Storyboard]</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(`sb-${idx}`, scene.storyboard, `Storyboard Scene ${scene.sceneNumber}`)}
                    className="text-stone-400 hover:text-emerald-300 p-1 rounded transition-colors cursor-pointer"
                    title="Salin Storyboard"
                  >
                    {copiedKey === `sb-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
                  {scene.storyboard}
                </p>
              </div>

              {/* [Prompt Video] */}
              <div className="bg-stone-900/80 border border-emerald-900/60 rounded-xl p-3.5 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-1.5 text-teal-400">
                    <Film className="w-3.5 h-3.5" />
                    <span>[Prompt Video untuk Flow]</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(`vp-${idx}`, scene.videoPrompt, `Prompt Video Scene ${scene.sceneNumber}`)}
                    className="text-stone-400 hover:text-emerald-300 p-1 rounded transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                    title="Salin Prompt Video"
                  >
                    {copiedKey === `vp-${idx}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 text-[10px]">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Salin</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs sm:text-sm font-mono text-emerald-100 bg-stone-950/60 p-2.5 rounded-lg border border-emerald-950 leading-relaxed">
                  {scene.videoPrompt}
                </p>
              </div>

              {/* [Prompt Gambar Referensi] */}
              <div className="bg-stone-900/80 border border-stone-800/90 rounded-xl p-3.5 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-stone-400">
                  <div className="flex items-center gap-1.5 text-stone-300">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>[Prompt Gambar]</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(`ip-${idx}`, scene.imagePrompt, `Prompt Gambar Scene ${scene.sceneNumber}`)}
                    className="text-stone-400 hover:text-emerald-300 p-1 rounded transition-colors cursor-pointer"
                    title="Salin Prompt Gambar"
                  >
                    {copiedKey === `ip-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-xs text-stone-300 font-mono bg-stone-950/50 p-2 rounded border border-stone-800 leading-relaxed">
                  {scene.imagePrompt}
                </p>
              </div>

              {/* [Narasi & CTA] */}
              <div className="bg-stone-900/80 border border-stone-800/90 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-stone-400">
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <Mic className="w-3.5 h-3.5" />
                    <span>[Narasi]</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {onOpenVoiceOver && scene.narration && (
                      <button
                        type="button"
                        onClick={() => onOpenVoiceOver(scene.narration)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-700/60 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                        title={`Buat audio Voice Over untuk narasi Scene ${scene.sceneNumber}`}
                      >
                        <Mic className="w-3 h-3 text-amber-400" />
                        <span>Suarakan Scene</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCopyText(`nr-${idx}`, scene.narration, `Narasi Scene ${scene.sceneNumber}`)}
                      className="text-stone-400 hover:text-emerald-300 p-1 rounded transition-colors cursor-pointer"
                      title="Salin Narasi"
                    >
                      {copiedKey === `nr-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-stone-100 italic leading-relaxed pl-1 border-l-2 border-amber-500/60">
                  "{scene.narration}"
                </p>

                {scene.cta && (
                  <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                      <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                      <span>CTA:</span>
                      <span className="text-stone-300">{scene.cta}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Primary & Secondary Actions Bar (Requirement 4 & 5) */}
      <div className="pt-4 border-t border-stone-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Tombol Utama: [🚀 Lanjut ke Flow] */}
        <button
          type="button"
          onClick={handleProceedToFlow}
          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-sm sm:text-base font-black shadow-lg shadow-emerald-600/30 transition-all cursor-pointer hover:scale-[1.02]"
        >
          <span>🚀 Lanjut ke Flow</span>
          <ExternalLink className="w-4 h-4" />
        </button>

        {/* Tombol Tambahan: [📋 Salin Semua Prompt] & [💾 Simpan ke Project] */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyAllPrompts}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold border border-stone-700 transition-colors cursor-pointer"
            title="Salin seluruh prompt dan naskah"
          >
            {isCopiedAll ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>📋 Salin Semua Prompt</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-200 text-xs font-bold border border-emerald-700/60 transition-colors cursor-pointer"
            title="Simpan materi ini ke project HEJO"
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Tersimpan</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="w-4 h-4" />
                <span>💾 Simpan</span>
              </>
            )}
          </button>

          {onOpenVoiceOver && (
            <button
              type="button"
              onClick={() => {
                const combinedNarrations = data.scenes
                  .map((s) => s.narration)
                  .filter(Boolean)
                  .join(' ');
                onOpenVoiceOver(combinedNarrations || `Video affiliate ${data.productName}`);
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl bg-emerald-900/90 hover:bg-emerald-800 text-emerald-200 text-xs font-bold border border-emerald-600/60 transition-colors cursor-pointer"
              title="Buat Voice Over audio untuk seluruh narasi video"
            >
              <span>🎤 Voice Over</span>
            </button>
          )}

          {onOpenStudio && (
            <button
              type="button"
              onClick={() => onOpenStudio(data)}
              className="hidden lg:inline-flex items-center justify-center gap-1 px-3 py-3 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 text-xs font-bold border border-stone-700 transition-colors cursor-pointer"
              title="Buka rincian di Studio"
            >
              <span>🎬 Studio</span>
            </button>
          )}
        </div>
      </div>

      {/* Safety Notice regarding Flow execution */}
      <p className="mt-3 text-[11px] text-stone-400 text-center leading-relaxed">
        Tombol <strong>Lanjut ke Flow</strong> akan menyalin seluruh prompt dan membuka halaman Flow AI di browser Anda. HEJO tidak mengakses password atau membuat video otomatis tanpa kendali Anda.
      </p>
    </div>
  );
};
