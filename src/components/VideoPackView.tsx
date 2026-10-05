import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Copy, 
  Check, 
  BookmarkCheck, 
  ArrowLeft, 
  Layers, 
  Sparkles, 
  Video, 
  Camera, 
  Clock, 
  UserCircle2, 
  Sliders, 
  Film, 
  CheckCircle2, 
  Compass, 
  Sun, 
  MapPin, 
  Box, 
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { PipelineShot, ProjectItem, CharacterDNA, PipelineScene, VideoPackData, VideoPackShot } from '../types';

interface VideoPackViewProps {
  shots: PipelineShot[];
  activeProject: ProjectItem | null;
  characters?: CharacterDNA[];
  activeCharacter?: CharacterDNA | null;
  scenes?: PipelineScene[];
  showToast: (msg: string) => void;
  onSaveVideoPackToProject: (videoPack: VideoPackData) => void;
  onBackToTimeline?: () => void;
}

export const VideoPackView: React.FC<VideoPackViewProps> = ({
  shots,
  activeProject,
  characters = [],
  activeCharacter,
  scenes = [],
  showToast,
  onSaveVideoPackToProject,
  onBackToTimeline,
}) => {
  // Format Aspect Ratio: 16:9, 9:16, 1:1
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>(() => {
    return activeProject?.videoPack?.aspectRatio || '16:9';
  });

  // Global Speed/Intensity
  const [speedIntensity, setSpeedIntensity] = useState<'Normal (1.0x)' | 'Slow (0.7x)' | 'Dynamic (1.5x)'>('Normal (1.0x)');

  // Active Prompt View Tab per shot: 'global' | 'indo'
  const [promptViewMode, setPromptViewMode] = useState<Record<number, 'global' | 'indo'>>({});

  // Copied states
  const [copiedShotIndex, setCopiedShotIndex] = useState<number | null>(null);
  const [isCopiedAll, setIsCopiedAll] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Sync if activeProject already has a saved videoPack
  useEffect(() => {
    if (activeProject?.videoPack?.aspectRatio) {
      setAspectRatio(activeProject.videoPack.aspectRatio);
    }
  }, [activeProject?.videoPack?.aspectRatio]);

  // Total Duration
  const totalDuration = shots.reduce((acc, s) => {
    const num = parseInt(s.duration || '0', 10);
    return acc + (isNaN(num) ? 5 : num);
  }, 0) || 30;

  const projectName = activeProject?.name || activeProject?.title || 'Project Video Studio';

  // Helper to build prompt for a shot
  const buildPromptsForShot = (shot: PipelineShot, idx: number) => {
    const isNone = shot.characterId === 'none';
    const effectiveChar = isNone
      ? null
      : (shot.characterId ? characters.find((c) => Boolean(c && c.id === shot.characterId)) : null) ||
        activeCharacter ||
        (shot.character ? shot.character : null);

    const charName = effectiveChar?.name && effectiveChar.name !== 'none' ? effectiveChar.name : '';
    const charNotes = effectiveChar ? (effectiveChar.visualNotes || (effectiveChar as any).notes || effectiveChar.description || '') : '';
    const charDetailTag = charName
      ? ` Character: ${charName} (${charNotes ? charNotes.replace(/[\r\n]+/g, ', ') : 'consistent actor look'}).`
      : '';

    const scene = scenes[idx];
    const voiceOverText = scene?.voiceOver ? ` Spoken Audio / Dialogue: "${scene.voiceOver}".` : '';

    // Global English Prompt (Runway Gen-3, Kling, Luma Dream Machine, Sora, Pika, Hailuo)
    const promptGlobal = `[AI Video Shot: ${shot.shotNumber}] [Aspect Ratio: ${aspectRatio}] [Camera: ${shot.shotType || 'Medium Shot'}, ${shot.cameraAngle || 'Eye level'}, ${shot.cameraMovement || 'cinematic motion'}] [Tempo: ${speedIntensity}] Subject & Action: ${shot.subject}.${charDetailTag} Location: ${shot.location || 'Indoor studio'}. Lighting: ${shot.lighting || 'Natural cinematic lighting'}. Props: ${shot.props || 'none'}.${voiceOverText} 4K resolution, 24fps motion blur, high dynamic range, photorealistic physics, clean cinematic grading.`;

    // Indonesian Production & Director Prompt
    const promptIndo = `🎬 PANDUAN PRODUKSI & PROMPT: ${shot.shotNumber} (${shot.duration || '3 detik'})
• Format Aspek: ${aspectRatio}
• Subjek & Aksi: ${shot.subject}
• Sudut & Gerakan Kamera: ${shot.cameraAngle || 'Eye level'} · ${shot.cameraMovement || 'Static'} (${shot.shotType || 'Medium shot'})
• Tempo / Kecepatan: ${speedIntensity}
${charName ? `• Referensi Karakter: ${charName}${charNotes ? ` (${charNotes})` : ''}` : '• Referensi Karakter: Tanpa karakter khusus (Fokus subjek & produk)'}
• Tata Cahaya (Lighting): ${shot.lighting || 'Natural cinematic light'}
• Lokasi (Location): ${shot.location || 'Studio'}
• Properti (Props): ${shot.props || '-'}
${scene?.voiceOver ? `• Dialog / Audio: "${scene.voiceOver}"` : ''}`;

    return { promptGlobal, promptIndo, effectiveChar };
  };

  // Compile full video pack data structure
  const compileVideoPackData = (): VideoPackData => {
    const packShots: VideoPackShot[] = shots.map((shot, idx) => {
      const { promptGlobal, promptIndo, effectiveChar } = buildPromptsForShot(shot, idx);
      const rawUrl = shot.imageUrl || (shot as any).image;
      const imageUrl = rawUrl && rawUrl !== '[IDB_IMAGE]' ? rawUrl : undefined;

      return {
        shotNumber: shot.shotNumber,
        duration: shot.duration,
        imageUrl,
        character: effectiveChar
          ? {
              id: effectiveChar.id,
              name: effectiveChar.name,
              description: effectiveChar.description,
              visualNotes: effectiveChar.visualNotes || (effectiveChar as any).notes,
              imageUrl: effectiveChar.imageUrl || (effectiveChar as any).imageReference,
            }
          : undefined,
        subject: shot.subject,
        cameraShot: shot.shotType,
        cameraAngle: shot.cameraAngle,
        cameraMotion: shot.cameraMovement,
        speedIntensity,
        lighting: shot.lighting,
        location: shot.location,
        props: shot.props || '-',
        promptVideoAiGlobal: promptGlobal,
        promptVideoAiIndo: promptIndo,
      };
    });

    return {
      id: `pack-${activeProject?.id || 'studio'}-${Date.now()}`,
      projectName,
      aspectRatio,
      createdAt: activeProject?.videoPack?.createdAt || 'Hari ini',
      updatedAt: 'Baru saja',
      totalDuration: `${totalDuration} detik`,
      shots: packShots,
    };
  };

  // Copy Single Prompt
  const handleCopySinglePrompt = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedShotIndex(idx);
    showToast(`Prompt video AI ${shots[idx]?.shotNumber || 'shot'} berhasil disalin!`);
    setTimeout(() => setCopiedShotIndex(null), 2000);
  };

  // Copy All Prompts
  const handleCopyAllPrompts = () => {
    const fullText = shots
      .map((shot, idx) => {
        const { promptGlobal, promptIndo } = buildPromptsForShot(shot, idx);
        return `========================================================
${shot.shotNumber} (${shot.duration}) · FORMAT ${aspectRatio}
========================================================
[PROMPT VIDEO AI (GLOBAL)]:
${promptGlobal}

[PANDUAN DIREKTUR & DETAIL TEKNIS (ID)]:
${promptIndo}`;
      })
      .join('\n\n\n');

    const header = `# HEJO AI - VIDEO PRODUCTION PACK
Project: ${projectName}
Format Rasio: ${aspectRatio}
Total Shot: ${shots.length} Shot
Total Durasi: ${totalDuration} Detik
Dibuat: Baru saja
Catatan: Siap digunakan langsung di generator video AI (Kling, Runway, Luma, Sora, Pika) maupun panduan kamera.

`;

    navigator.clipboard.writeText(header + fullText);
    setIsCopiedAll(true);
    showToast(`Seluruh paket prompt (${shots.length} shot) berhasil disalin ke clipboard!`);
    setTimeout(() => setIsCopiedAll(false), 2500);
  };

  // Save Video Pack to Project
  const handleSaveToProject = () => {
    const videoPack = compileVideoPackData();
    onSaveVideoPackToProject(videoPack);
    setIsSaved(true);
    showToast(`Video Pack (${shots.length} Shot · Rasio ${aspectRatio}) tersimpan di project!`);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Control Deck */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-850 to-emerald-950 border border-emerald-700/40 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold mb-2">
              <Package className="w-3.5 h-3.5" />
              <span>Paket Siap Eksekusi Video AI</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Video Pack: {projectName}
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-2xl leading-relaxed">
              Paket sekuensial {shots.length} shot lengkap dengan visual reference, character locking, instruksi kamera, dan prompt terstruktur yang siap disalin ke generator video AI (Kling, Runway Gen-3, Luma, Sora).
            </p>
          </div>

          {/* Quick Primary Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {onBackToTimeline && (
              <button
                type="button"
                onClick={onBackToTimeline}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-200 text-xs font-bold border border-stone-700 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Timeline Player</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyAllPrompts}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md transition-all cursor-pointer hover:scale-[1.02]"
            >
              {isCopiedAll ? (
                <>
                  <Check className="w-4 h-4 text-emerald-200" />
                  <span>Semua Prompt Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Salin Semua Prompt ({shots.length} Shot)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSaveToProject}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-extrabold text-xs shadow-md transition-all cursor-pointer hover:scale-[1.02]"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4 text-stone-950" />
                  <span>Tersimpan di Project!</span>
                </>
              ) : (
                <>
                  <BookmarkCheck className="w-4 h-4" />
                  <span>Simpan ke Project</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Global Parameter Bar: Aspect Ratio & Tempo Selector */}
        <div className="mt-5 pt-4 border-t border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          {/* Aspect Ratio Selector (Requirement 6) */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-stone-300 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
              <Film className="w-3.5 h-3.5 text-emerald-400" />
              <span>Format Rasio Video:</span>
            </span>

            <div className="inline-flex p-1 bg-stone-900/90 rounded-xl border border-stone-700">
              {[
                { id: '16:9', label: '16:9 Landscape', desc: 'YouTube / Monitor' },
                { id: '9:16', label: '9:16 Vertikal', desc: 'TikTok / Reels / Shorts' },
                { id: '1:1', label: '1:1 Persegi', desc: 'Instagram Feed' },
              ].map((fmt) => {
                const isSelected = aspectRatio === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => {
                      setAspectRatio(fmt.id as any);
                      showToast(`Format video diubah ke ${fmt.label}`);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500 text-stone-950 shadow-sm'
                        : 'text-stone-300 hover:text-white hover:bg-stone-800'
                    }`}
                  >
                    <span>{fmt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Speed / Intensity Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-stone-300 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Intensitas Gerakan:</span>
            </span>

            <div className="inline-flex p-1 bg-stone-900/90 rounded-xl border border-stone-700">
              {(['Slow (0.7x)', 'Normal (1.0x)', 'Dynamic (1.5x)'] as const).map((spd) => {
                const isSelected = speedIntensity === spd;
                return (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setSpeedIntensity(spd)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-stone-950 shadow-sm'
                        : 'text-stone-300 hover:text-white hover:bg-stone-800'
                    }`}
                  >
                    {spd}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Video Pack Cards (One Card per Shot) */}
      <div className="space-y-5">
        <div className="flex items-center justify-between text-xs text-stone-600 px-1">
          <span className="font-bold text-stone-800">
            Daftar {shots.length} Shot Siap Eksekusi (Total Durasi: {totalDuration} Detik)
          </span>
          <span className="text-[11px] text-stone-500">
            Pilih format tab prompt: Bahasa Inggris (Standar AI) atau Bahasa Indonesia (Panduan Kru)
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {shots.map((shot, idx) => {
            const rawUrl = shot.imageUrl || (shot as any).image;
            const currentUrl = rawUrl && rawUrl !== '[IDB_IMAGE]' ? rawUrl : undefined;
            const { promptGlobal, promptIndo, effectiveChar } = buildPromptsForShot(shot, idx);

            const isCurrentCopied = copiedShotIndex === idx;
            const currentMode = promptViewMode[idx] || 'global';

            const charThumb = effectiveChar?.imageUrl || (effectiveChar as any)?.imageReference;
            const charName = effectiveChar?.name && effectiveChar.name !== 'none' ? effectiveChar.name : null;
            const charNotes = effectiveChar ? (effectiveChar.visualNotes || (effectiveChar as any).notes || effectiveChar.description || '') : '';

            return (
              <div
                key={idx}
                className="bg-white border border-stone-200/90 rounded-3xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all space-y-5"
              >
                {/* Shot Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="px-3.5 py-1 rounded-xl bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-2xs">
                      {shot.shotNumber}
                    </span>

                    <h3 className="font-extrabold text-stone-900 text-base sm:text-lg">
                      {shot.scene}: {shot.subject}
                    </h3>

                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-extrabold text-xs">
                      ⏱️ {shot.duration || '3 detik'}
                    </span>

                    <span className="px-2.5 py-0.5 rounded-lg bg-stone-100 text-stone-700 font-semibold text-xs border border-stone-200">
                      Rasio {aspectRatio}
                    </span>
                  </div>

                  {/* Copy Button for This Specific Shot */}
                  <button
                    type="button"
                    onClick={() =>
                      handleCopySinglePrompt(
                        currentMode === 'global' ? promptGlobal : promptIndo,
                        idx
                      )
                    }
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs hover:scale-[1.02] shrink-0"
                  >
                    {isCurrentCopied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-700" />
                        <span>Prompt Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-emerald-700" />
                        <span>Salin Prompt {shot.shotNumber}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 2-Column Body: Left (Visual & Character Ref) + Right (Production Specs & AI Prompt) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left Column (5 Cols): Visual Thumbnail & Character Reference Box */}
                  <div className="lg:col-span-5 space-y-4">
                    {/* Visual / Image Reference Card */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-stone-500 font-semibold">
                        <span className="flex items-center gap-1.5 text-stone-700 font-bold uppercase tracking-wider text-[11px]">
                          <Camera className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Visual Reference (Still)</span>
                        </span>
                        <span>{currentUrl ? '✓ Gambar Ada' : 'Belum Ada'}</span>
                      </div>

                      <div className={`relative rounded-2xl overflow-hidden bg-stone-900 border border-stone-200 ${
                        aspectRatio === '9:16' ? 'aspect-[9/16] max-h-72 mx-auto' : aspectRatio === '1:1' ? 'aspect-square max-h-72 mx-auto' : 'aspect-video'
                      }`}>
                        {currentUrl ? (
                          <img
                            src={currentUrl}
                            alt={`Visual reference for ${shot.shotNumber}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 text-stone-400">
                            <Film className="w-8 h-8 text-stone-600 mb-2" />
                            <span className="text-xs font-semibold text-stone-300">Visual Still Belum Tersedia</span>
                            <span className="text-[10px] text-stone-500 mt-0.5">Generate gambar di tahap Shot List untuk referensi frame</span>
                          </div>
                        )}

                        <div className="absolute bottom-2 left-2.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[10px] font-bold text-white uppercase">
                          {shot.shotType || 'Medium Shot'}
                        </div>
                      </div>
                    </div>

                    {/* Character Reference Box (Requirement 3 & 9) */}
                    <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                          <UserCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Referensi Karakter</span>
                        </span>
                        {charName ? (
                          <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md">
                            Karakter Terkunci
                          </span>
                        ) : (
                          <span className="text-[10px] text-stone-400">Mode Lingkungan</span>
                        )}
                      </div>

                      {charName ? (
                        <div className="flex items-start gap-3 pt-1">
                          {charThumb ? (
                            <div className="w-12 h-12 rounded-xl overflow-hidden border border-emerald-300 shadow-2xs shrink-0 bg-stone-200">
                              <img src={charThumb} alt={charName} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-2xs shrink-0">
                              {charName.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <h4 className="font-extrabold text-stone-900 text-xs sm:text-sm truncate">
                              {charName}
                            </h4>
                            <p className="text-[11px] text-stone-600 mt-0.5 line-clamp-2 leading-relaxed">
                              {charNotes || 'Karakter utama konsisten untuk seluruh pengambilan gambar.'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-stone-500 italic py-1">
                          Tanpa referensi karakter khusus. Prompt difokuskan pada subjek, produk, dan lokasi sekitar.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Column (7 Cols): Parameters & AI Video Prompts */}
                  <div className="lg:col-span-7 space-y-4">
                    {/* Technical Parameter Matrix Badges */}
                    <div className="bg-stone-50/80 rounded-2xl p-4 border border-stone-200 space-y-3">
                      <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                        Spesifikasi Parameter Pengambilan Gambar
                      </span>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                        <div className="bg-white p-2.5 rounded-xl border border-stone-200/80">
                          <span className="text-[10px] text-stone-400 font-semibold block uppercase">Framing / Shot</span>
                          <span className="font-extrabold text-stone-800 truncate block mt-0.5">{shot.shotType || 'Medium Shot'}</span>
                        </div>

                        <div className="bg-white p-2.5 rounded-xl border border-stone-200/80">
                          <span className="text-[10px] text-stone-400 font-semibold block uppercase">Sudut Kamera</span>
                          <span className="font-extrabold text-stone-800 truncate block mt-0.5">{shot.cameraAngle || 'Eye level'}</span>
                        </div>

                        <div className="bg-white p-2.5 rounded-xl border border-stone-200/80">
                          <span className="text-[10px] text-stone-400 font-semibold block uppercase">Gerakan Kamera</span>
                          <span className="font-extrabold text-emerald-800 truncate block mt-0.5">{shot.cameraMovement || 'Static'}</span>
                        </div>

                        <div className="bg-white p-2.5 rounded-xl border border-stone-200/80">
                          <span className="text-[10px] text-stone-400 font-semibold block uppercase">Tata Cahaya</span>
                          <span className="font-extrabold text-stone-800 truncate block mt-0.5">{shot.lighting || 'Natural light'}</span>
                        </div>

                        <div className="bg-white p-2.5 rounded-xl border border-stone-200/80">
                          <span className="text-[10px] text-stone-400 font-semibold block uppercase">Lokasi</span>
                          <span className="font-extrabold text-stone-800 truncate block mt-0.5">{shot.location || 'Studio'}</span>
                        </div>

                        <div className="bg-white p-2.5 rounded-xl border border-stone-200/80">
                          <span className="text-[10px] text-stone-400 font-semibold block uppercase">Properti (Props)</span>
                          <span className="font-extrabold text-stone-800 truncate block mt-0.5">{shot.props || '-'}</span>
                        </div>
                      </div>
                    </div>

                    {/* AI Video Prompt Card Box */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="inline-flex p-1 bg-stone-100 rounded-xl border border-stone-200">
                          <button
                            type="button"
                            onClick={() => setPromptViewMode((prev) => ({ ...prev, [idx]: 'global' }))}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              currentMode === 'global'
                                ? 'bg-stone-900 text-white shadow-xs'
                                : 'text-stone-600 hover:text-stone-900'
                            }`}
                          >
                            <span>Prompt Video AI (Global)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPromptViewMode((prev) => ({ ...prev, [idx]: 'indo' }))}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              currentMode === 'indo'
                                ? 'bg-emerald-700 text-white shadow-xs'
                                : 'text-stone-600 hover:text-stone-900'
                            }`}
                          >
                            <span>Panduan Sutradara (ID)</span>
                          </button>
                        </div>

                        <span className="text-[11px] text-stone-400 font-mono">
                          {currentMode === 'global' ? 'Runway · Kling · Luma · Sora' : 'SOP Tim Produksi'}
                        </span>
                      </div>

                      {/* Prompt Display Container */}
                      {currentMode === 'global' ? (
                        <div className="p-4 bg-stone-950 text-stone-200 rounded-2xl border border-stone-800 font-mono text-xs leading-relaxed relative group">
                          <p className="whitespace-pre-line select-all">{promptGlobal}</p>
                          <div className="mt-3 pt-2.5 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400">
                            <span>Format: Aspect Ratio {aspectRatio} · 24fps motion blur</span>
                            <button
                              type="button"
                              onClick={() => handleCopySinglePrompt(promptGlobal, idx)}
                              className="text-emerald-400 hover:text-emerald-300 font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Salin Text Prompt</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-stone-50 text-stone-800 rounded-2xl border border-stone-200 text-xs leading-relaxed">
                          <p className="whitespace-pre-line select-all font-mono text-[11px]">{promptIndo}</p>
                          <div className="mt-3 pt-2.5 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500">
                            <span>Catatan: Panduan lengkap untuk kru kamera, penata gaya, dan lighting</span>
                            <button
                              type="button"
                              onClick={() => handleCopySinglePrompt(promptIndo, idx)}
                              className="text-emerald-700 hover:text-emerald-800 font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Salin Panduan</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Summary & Workflow Integration Footer */}
      <div className="bg-white border border-stone-200 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h4 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
            <span>📦 Video Pack Siap Digunakan</span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              {shots.length} Shot Terstruktur
            </span>
          </h4>
          <p className="text-xs text-stone-500 mt-0.5">
            Salin prompt di atas untuk dimasukkan ke generator video AI eksternal atau bagikan dengan tim produksi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopyAllPrompts}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer hover:scale-[1.02]"
          >
            <Copy className="w-4 h-4" />
            <span>Salin Semua Prompt ({shots.length} Shot)</span>
          </button>

          <button
            type="button"
            onClick={handleSaveToProject}
            className="flex items-center gap-2 px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <BookmarkCheck className="w-4 h-4 text-emerald-700" />
            <span>Simpan ke Project</span>
          </button>
        </div>
      </div>
    </div>
  );
};
