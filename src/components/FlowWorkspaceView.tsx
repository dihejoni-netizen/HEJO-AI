import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ExternalLink, 
  Sparkles, 
  Copy, 
  Check, 
  ShieldCheck, 
  AlertTriangle, 
  Film, 
  Video, 
  Layers, 
  ChevronRight, 
  RefreshCw,
  UserCircle2,
  Info
} from 'lucide-react';
import { FlowReadyData, FlowGoogleAccount, GoogleFlowConnection } from '../types';

interface FlowWorkspaceViewProps {
  activeFlowAccount: FlowGoogleAccount | null;
  connection: GoogleFlowConnection;
  flowPack: FlowReadyData | null;
  onBackToHejo: () => void;
  onOpenAccount: () => void;
  showToast: (msg: string) => void;
  flowUrl?: string;
}

export const FlowWorkspaceView: React.FC<FlowWorkspaceViewProps> = ({
  activeFlowAccount,
  connection,
  flowPack,
  onBackToHejo,
  onOpenAccount,
  showToast,
  flowUrl = 'https://labs.google/flow',
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isCopiedAll, setIsCopiedAll] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [activeTabPanel, setActiveTabPanel] = useState<'embed' | 'guide'>('embed');

  const activeEmail = activeFlowAccount?.email || connection?.googleEmail || null;
  const isConnected = Boolean(activeEmail);

  const handleCopyText = (key: string, text: string, label: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      showToast(`${label} berhasil disalin!`);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      showToast('Gagal menyalin ke clipboard.');
    }
  };

  const compileAllPrompts = (): string => {
    if (!flowPack) return '';
    let out = `# HEJO AI · FLOW PACK\n`;
    out += `Produk: ${flowPack.productName}\n`;
    out += `Total Scene: ${flowPack.sceneCount} Scene (${flowPack.totalDuration})\n\n`;
    flowPack.scenes.forEach((s) => {
      out += `========================================================\n`;
      out += `SCENE ${s.sceneNumber} (${s.duration})\n`;
      out += `========================================================\n`;
      out += `[Storyboard]: ${s.storyboard}\n\n`;
      out += `[Prompt Video (Flow AI)]:\n${s.videoPrompt}\n\n`;
      out += `[Prompt Gambar Referensi]:\n${s.imagePrompt}\n\n`;
      out += `[Narasi Audio]: "${s.narration}"\n\n`;
      if (s.cta) out += `[CTA]: ${s.cta}\n\n`;
    });
    return out.trim();
  };

  const handleCopyAll = () => {
    const text = compileAllPrompts();
    if (!text) {
      showToast('Tidak ada materi Flow Pack untuk disalin.');
      return;
    }
    try {
      navigator.clipboard.writeText(text);
      setIsCopiedAll(true);
      showToast('Seluruh materi Flow Pack berhasil disalin ke clipboard!');
      setTimeout(() => setIsCopiedAll(false), 2500);
    } catch {
      showToast('Gagal menyalin ke clipboard.');
    }
  };

  const handleOpenFlowInNewTab = () => {
    try {
      window.open(flowUrl, '_blank', 'noopener,noreferrer');
      showToast(`Membuka Google Flow untuk akun: ${activeEmail || 'Google Anda'}...`);
    } catch {
      showToast('Gagal membuka tab baru. Izinkan pop-up pada browser Anda.');
    }
  };

  return (
    <div className="space-y-4 pb-16 animate-in fade-in duration-200">
      {/* 1. TOP TOOLBAR: Navigasi & Status Akun */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToHejo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="Kembali ke halaman utama HEJO"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke HEJO</span>
          </button>

          <div className="h-4 w-px bg-stone-200 hidden sm:block" />

          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-stone-900 flex items-center gap-2">
              <span>Ruang Kerja Flow AI</span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                Ecosystem Hub
              </span>
            </h1>
          </div>
        </div>

        {/* Right side: Akun Google Aktif & Tombol Tab Baru */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs border ${
            isConnected 
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
              : 'bg-amber-50 text-amber-900 border-amber-300'
          }`}>
            <span className="text-[10px]">{isConnected ? '🟢' : '🟡'}</span>
            <span className="font-semibold text-[11px]">
              {isConnected ? (
                <>Akun Flow Aktif: <strong className="font-mono">{activeEmail}</strong></>
              ) : (
                'Akun Google belum terhubung'
              )}
            </span>
            <button
              type="button"
              onClick={onOpenAccount}
              className="ml-1 text-[11px] underline font-bold text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              {isConnected ? 'Ganti' : 'Hubungkan'}
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenFlowInNewTab}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer hover:scale-[1.01]"
            title="Buka Google Flow di tab baru"
          >
            <span>Buka Flow di Tab Baru</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE: SPLIT SCREEN (GOOGLE FLOW + FLOW PACK HEJO) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* KOLOM KIRI (7/12): GOOGLE FLOW VIEWER / EMBEDDING CONTAINER */}
        <div className="lg:col-span-7 bg-white border border-stone-200/90 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3 flex flex-col min-h-[640px]">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-extrabold text-stone-800 tracking-tight">
                Google Flow (labs.google/flow)
              </span>
            </div>

            <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setActiveTabPanel('embed')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  activeTabPanel === 'embed'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Layar Flow
              </button>
              <button
                type="button"
                onClick={() => setActiveTabPanel('guide')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  activeTabPanel === 'guide'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Panduan Produksi
              </button>
            </div>
          </div>

          {activeTabPanel === 'embed' ? (
            <div className="flex-1 flex flex-col space-y-3">
              {/* Security & X-Frame-Options Notice Banner */}
              <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3 text-xs text-stone-600 space-y-1.5">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="leading-relaxed">
                      Google Flow menerapkan proteksi keamanan standar Google (<strong>X-Frame-Options</strong> &amp; <strong>Content Security Policy</strong>) untuk melindungi sesi login akun Anda.
                    </p>
                    <p className="text-[11px] text-stone-500">
                      Jika tampilan di bawah ini tidak dapat dimuat atau terhalang oleh browser Anda, gunakan tombol di bawah untuk langsung membuka Google Flow di tab baru.
                    </p>
                  </div>
                </div>
                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenFlowInNewTab}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-emerald-50 text-emerald-800 font-bold border border-emerald-300 rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    <span>🚀 Buka Flow di Tab Baru</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIframeError(!iframeError)}
                    className="text-[11px] text-stone-400 hover:text-stone-700 underline cursor-pointer"
                  >
                    {iframeError ? 'Coba Tampilkan Kembali' : 'Tampilan Terblokir?'}
                  </button>
                </div>
              </div>

              {/* Iframe View or Blocked Fallback */}
              {!iframeError ? (
                <div className="relative flex-1 min-h-[500px] bg-stone-100 rounded-2xl overflow-hidden border border-stone-200">
                  <iframe
                    src={flowUrl}
                    title="Google Flow AI Workspace"
                    className="w-full h-full min-h-[500px] border-0"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    onError={() => setIframeError(true)}
                  />
                </div>
              ) : (
                <div className="flex-1 min-h-[460px] flex flex-col items-center justify-center p-6 text-center bg-stone-50/80 rounded-2xl border border-dashed border-stone-300 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="max-w-md space-y-1">
                    <h3 className="font-extrabold text-stone-900 text-sm sm:text-base">
                      Google Flow tidak mengizinkan tampilan di dalam HEJO pada browser ini.
                    </h3>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Ini adalah mekanisme keamanan resmi Google (X-Frame-Options: SAMEORIGIN) untuk menjaga kerahasiaan otentikasi akun Google Anda.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleOpenFlowInNewTab}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs text-xs sm:text-sm transition-all cursor-pointer hover:scale-[1.01]"
                    >
                      <span>Buka Flow di Tab Baru</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-400">
                    Materi Flow Pack di sebelah kanan tetap siap untuk langsung Anda salin ke Google Flow.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Tab: Panduan Alur Kerja Flow */
            <div className="flex-1 space-y-4 py-2 text-stone-700 text-xs sm:text-sm leading-relaxed">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200/90 rounded-2xl space-y-2">
                <h3 className="font-extrabold text-emerald-950 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  <span>3 Langkah Produksi Video Affiliate dengan HEJO + Flow</span>
                </h3>
                <ol className="space-y-2 text-stone-700 list-decimal list-inside pl-1 text-xs">
                  <li>
                    <strong>Siapkan Materi di HEJO:</strong> HEJO telah membagi hook, durasi, prompt video, dan narasi per scene di panel kanan (Flow Pack).
                  </li>
                  <li>
                    <strong>Buka Google Flow:</strong> Klik tombol <em>&quot;Buka Flow di Tab Baru&quot;</em> untuk masuk ke antarmuka produksi resmi Google Flow dengan akun Anda.
                  </li>
                  <li>
                    <strong>Tempel &amp; Render:</strong> Salin prompt scene per scene dengan tombol <em>Salin</em> di panel kanan, lalu tempelkan ke project Flow Anda.
                  </li>
                </ol>
              </div>

              <div className="p-4 bg-white border border-stone-200 rounded-2xl space-y-2">
                <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider">
                  Tips Efisiensi Kreator Affiliate:
                </h4>
                <ul className="space-y-1.5 text-xs text-stone-600 list-disc list-inside">
                  <li>Gunakan prompt video bahasa Inggris yang sudah diformat HEJO untuk hasil model Flow yang optimal.</li>
                  <li>Sesuaikan rasio aspek (9:16 untuk TikTok/Reels/Shorts, 16:9 untuk YouTube horizontal).</li>
                  <li>Gunakan narasi audio yang telah disiapkan HEJO untuk sulih suara (voiceover).</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* KOLOM KANAN (5/12): FLOW PACK HEJO (Materi Siap Salin) */}
        <div className="lg:col-span-5 bg-white border border-stone-200/90 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-stone-900 tracking-tight">
                  Flow Pack HEJO
                </h2>
                <p className="text-[11px] text-stone-500">
                  Materi Siap Pakai untuk Google Flow
                </p>
              </div>
            </div>

            {flowPack && (
              <button
                type="button"
                onClick={handleCopyAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="Salin seluruh scene ke clipboard"
              >
                {isCopiedAll ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Semua</span>
                  </>
                )}
              </button>
            )}
          </div>

          {flowPack ? (
            <div className="space-y-3.5">
              {/* Ringkasan Produk */}
              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/80 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Produk:</span>
                  <span className="font-extrabold text-stone-900">{flowPack.productName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Durasi &amp; Adegan:</span>
                  <span className="font-semibold text-emerald-800">
                    {flowPack.sceneCount} Scene · {flowPack.totalDuration}
                  </span>
                </div>
              </div>

              {/* Scene List Cards */}
              <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                {flowPack.scenes.map((scene) => (
                  <div
                    key={scene.sceneNumber}
                    className="p-3.5 bg-white border border-stone-200 rounded-2xl shadow-2xs space-y-2.5 hover:border-emerald-300 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-stone-900 bg-stone-100 px-2 py-0.5 rounded-md">
                        SCENE {scene.sceneNumber}
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        ⏱️ {scene.duration}
                      </span>
                    </div>

                    {/* Storyboard Note */}
                    <p className="text-xs text-stone-600 italic bg-stone-50 p-2 rounded-xl border border-stone-100">
                      &quot;{scene.storyboard}&quot;
                    </p>

                    {/* Video Prompt */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-stone-700">🎬 Prompt Video (Flow):</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(`v-${scene.sceneNumber}`, scene.videoPrompt, `Prompt Scene ${scene.sceneNumber}`)}
                          className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer"
                        >
                          {copiedKey === `v-${scene.sceneNumber}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Disalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Salin</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="p-2 bg-stone-900 text-stone-100 font-mono text-[11px] rounded-xl select-all break-words leading-relaxed max-h-24 overflow-y-auto">
                        {scene.videoPrompt}
                      </div>
                    </div>

                    {/* Narasi Audio */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-stone-700">🎙️ Narasi Audio:</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(`n-${scene.sceneNumber}`, scene.narration, `Narasi Scene ${scene.sceneNumber}`)}
                          className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer"
                        >
                          {copiedKey === `n-${scene.sceneNumber}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Disalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Salin</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="p-2 bg-stone-50 text-stone-800 text-[11px] rounded-xl border border-stone-200/80 leading-relaxed">
                        &quot;{scene.narration}&quot;
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Empty State for Flow Pack */
            <div className="p-6 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-300 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-stone-200 text-stone-500 mx-auto flex items-center justify-center">
                <Film className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-stone-800 text-xs sm:text-sm">
                  Belum Ada Flow Pack Aktif
                </h3>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  Ceritakan ide atau produk affiliate Anda di menu <strong>[Buat]</strong>. Klik tombol <em>&quot;🚀 Lanjut ke Flow&quot;</em> pada hasil video untuk memuat seluruh prompt ke panel ini.
                </p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={onBackToHejo}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Mulai Buat Video</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* 3. TRANSPARENCY NOTICE (Requirement 4) */}
      <div className="p-3.5 bg-stone-100/80 border border-stone-200/90 rounded-2xl text-xs text-stone-500 flex items-center gap-2.5">
        <Info className="w-4 h-4 text-stone-400 shrink-0" />
        <p className="leading-relaxed text-[11px]">
          <strong>Catatan Resmi:</strong> HEJO AI bertindak sebagai asisten persiapan materi (prompt, script, storyboard, narasi). Eksekusi rendering video dilakukan langsung di Google Flow menggunakan akun resmi milik Anda.
        </p>
      </div>
    </div>
  );
};
