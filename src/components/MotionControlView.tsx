import React, { useState } from 'react';
import { 
  Camera, 
  Sparkles, 
  Copy, 
  Check, 
  ArrowRight, 
  Sliders, 
  Compass, 
  Video, 
  Layers, 
  Eye, 
  Move, 
  Maximize2, 
  RotateCw, 
  HelpCircle,
  Clapperboard,
  Film
} from 'lucide-react';
import { CreatorContext, UserMode, ProjectItem } from '../types';
import { formatMotionContextString } from '../utils/motionHelper';

interface MotionControlViewProps {
  userMode: UserMode;
  showToast: (msg: string) => void;
  creatorContext?: CreatorContext;
  onSendDraftToChat?: (text: string) => void;
  setActiveTab?: (tab: any) => void;
  activeProject?: ProjectItem | null;
  saveProject?: (project: Partial<ProjectItem> & { title: string }) => void;
}

interface CameraMotionPreset {
  id: string;
  name: string;
  category: 'Dasar' | 'Sinematik' | 'Dinamis';
  iconName: string;
  description: string;
  promptIndo: string;
  promptGlobal: string;
  bestFor: string;
}

const MOTION_PRESETS: CameraMotionPreset[] = [
  {
    id: 'push-in',
    name: 'Slow Push-in (Dolly In)',
    category: 'Sinematik',
    iconName: 'Maximize2',
    description: 'Kamera bergerak perlahan mendekati subjek untuk membangun rasa intim dan fokus emosional.',
    promptIndo: 'Kamera perlahan bergerak maju (slow push-in) mendekati subjek, transisi halus dengan depth of field sinematik.',
    promptGlobal: 'Slow cinematic push-in dolly shot toward the subject, shallow depth of field, 4k 24fps motion blur.',
    bestFor: 'Hook pembuka, pengungkapan ekspresi, atau peluncuran produk.'
  },
  {
    id: 'orbit-360',
    name: 'Orbiting / Arc Shot',
    category: 'Sinematik',
    iconName: 'RotateCw',
    description: 'Kamera mengitari subjek secara melingkar memperlihatkan dimensi 3D lingkungan sekitar.',
    promptIndo: 'Kamera berputar mengelilingi subjek (smooth 180-degree orbit shot) mempertahankan subjek tetap di tengah bingkai.',
    promptGlobal: 'Smooth rotational orbit arc camera movement orbiting around subject, seamless tracking, dynamic lighting.',
    bestFor: 'Pameran produk 360°, momen emosional, atau showcase outfit karakter.'
  },
  {
    id: 'tracking-follow',
    name: 'Dynamic Tracking Follow',
    category: 'Dinamis',
    iconName: 'Move',
    description: 'Kamera mengikuti pergerakan langkah subjek dari samping atau depan dengan stabil.',
    promptIndo: 'Kamera tracking stabil mengikuti gerakan langkah subjek, framing eye-level konsisten.',
    promptGlobal: 'Gimbal stabilized tracking shot following subject walking forward, eye-level camera framing, fluid motion.',
    bestFor: 'Adegan perjalanan, aktivitas kerja/kuliah, atau rutinitas harian.'
  },
  {
    id: 'pan-reveal',
    name: 'Pan Left / Right Reveal',
    category: 'Dasar',
    iconName: 'Compass',
    description: 'Kamera menoleh mendatar dari satu titik untuk mengungkap kejutan atau suasana tempat.',
    promptIndo: 'Kamera bergeser mendatar (slow horizontal pan) dari suasana ruangan menuju subjek yang tersenyum.',
    promptGlobal: 'Smooth horizontal panning shot revealing subject in environment, cinematic lighting transition.',
    bestFor: 'Transisi suasana, sebelum dan sesudah (before/after), serta scene pembuka.'
  },
  {
    id: 'pedestal-up',
    name: 'Tilt & Pedestal Up',
    category: 'Sinematik',
    iconName: 'Layers',
    description: 'Kamera terangkat vertikal dari bawah ke atas memperlihatkan postur megah dan percaya diri.',
    promptIndo: 'Kamera bergerak naik vertikal (pedestal up shot) dari detail produk ke wajah subjek.',
    promptGlobal: 'Smooth vertical pedestal shot moving upward from lower detail to eye-level portrait, dramatic reveal.',
    bestFor: 'Hero shot, OOTD karakter, dan penegasan solusi di akhir video.'
  },
  {
    id: 'fpv-rush',
    name: 'FPV Flythrough / Rush',
    category: 'Dinamis',
    iconName: 'Eye',
    description: 'Gerakan cepat menembus ruang memberikan sensasi imersif dan adrenalin tinggi.',
    promptIndo: 'Kamera FPV bergerak cepat meluncur mendekati subjek dengan motion blur energik.',
    promptGlobal: 'Dynamic FPV style swoop motion rushing toward subject, energetic pacing, hyper-smooth stabilization.',
    bestFor: 'Video tren TikTok, konten olahraga, atau hook 1 detik pertama.'
  },
];

export const MotionControlView: React.FC<MotionControlViewProps> = ({
  userMode,
  showToast,
  creatorContext = {},
  onSendDraftToChat,
  setActiveTab,
  activeProject,
  saveProject,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<CameraMotionPreset>(MOTION_PRESETS[0]);
  const [cameraAngle, setCameraAngle] = useState<'eye-level' | 'low-angle' | 'high-angle' | 'dutch-angle'>('eye-level');
  const [speedIntensity, setSpeedIntensity] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [subjectInput, setSubjectInput] = useState(
    creatorContext.karakter || creatorContext.produk || 'Karakter utama sedang beraktivitas'
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Compute final generated motion prompts
  const currentAngleLabel = {
    'eye-level': 'Eye Level (Sejajar Mata)',
    'low-angle': 'Low Angle (Sudut Rendah Berwibawa)',
    'high-angle': 'High Angle (Sudut Tinggi Menyeluruh)',
    'dutch-angle': 'Dutch Angle (Sudut Miring Dramatis)'
  }[cameraAngle];

  const currentSpeedLabel = {
    'slow': 'Perlahan & Elegan (Cinematic 0.7x)',
    'normal': 'Natural & Stabil (1.0x)',
    'fast': 'Dinamis & Cepat (1.5x)'
  }[speedIntensity];

  const generatedPromptIndo = `Instruksi Gerakan Kamera:
- Jenis Gerakan: ${selectedPreset.name}
- Sudut Kamera: ${currentAngleLabel}
- Kecepatan Gerakan: ${currentSpeedLabel}
- Subjek / Fokus: ${subjectInput}
- Panduan Visual: ${selectedPreset.promptIndo}
${creatorContext.produk ? `- Produk Terlibat: ${creatorContext.produk}` : ''}
${creatorContext.karakter ? `- Karakter Pembawa: ${creatorContext.karakter}` : ''}`;

  const generatedPromptGlobal = `[Camera Motion: ${selectedPreset.name}] [Angle: ${cameraAngle}] [Speed: ${speedIntensity} cinematic tempo] ${selectedPreset.promptGlobal} Subject: ${subjectInput}. Photorealistic, 8k resolution, cinematic lighting, 24fps motion coherence.`;

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Prompt kamera berhasil disalin!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleApplyToChat = () => {
    const intensityLabel = speedIntensity === 'fast' ? 'Tinggi' : speedIntensity === 'slow' ? 'Halus' : 'Normal';
    const structuredMotionText = formatMotionContextString({
      preset: selectedPreset.name,
      angle: currentAngleLabel,
      speed: currentSpeedLabel,
      intensity: intensityLabel,
      subject: subjectInput || creatorContext.karakter || creatorContext.produk || 'subjek utama',
      scene: 'scene aktif',
    });

    if (saveProject && activeProject) {
      saveProject({
        id: activeProject.id,
        title: activeProject.title,
        motion: {
          preset: selectedPreset.name,
          cameraMovement: selectedPreset.name,
          customPrompt: generatedPromptGlobal,
        },
      });
    }

    if (onSendDraftToChat) {
      onSendDraftToChat(structuredMotionText);
      showToast('Kamera motion terstruktur dikirim ke percakapan HEJO!');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-emerald-800 via-teal-900 to-stone-900 rounded-2xl p-6 sm:p-8 text-white shadow-sm border border-emerald-700/30">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/50 border border-emerald-500/30 text-emerald-200 text-xs font-semibold mb-3">
            <Camera className="w-3.5 h-3.5" />
            Motion Control Studio
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Sutradarai Kamera Video Anda
          </h1>
          <p className="mt-2 text-sm sm:text-base text-stone-200 leading-relaxed">
            Atur pergerakan kamera, sudut pengambilan, dan tempo adegan dengan bahasa sederhana. 
            Hasil prompt kamera siap digunakan langsung untuk generator video maupun panduan syuting nyata.
          </p>
        </div>
      </div>

      {/* Main Grid: Control Panel & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Preset Selector & Adjustments (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Preset Selection Card */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
            <h2 className="text-base font-bold text-stone-800 mb-1 flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-600" />
              1. Pilih Gerakan Kamera
            </h2>
            <p className="text-xs text-stone-500 mb-4">
              Pilih gaya pergerakan kamera yang paling sesuai dengan emosi cerita.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MOTION_PRESETS.map((preset) => {
                const isSelected = selectedPreset.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedPreset(preset)}
                    className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                        : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-stone-800">
                        {preset.name}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        preset.category === 'Sinematik' 
                          ? 'bg-amber-100 text-amber-800'
                          : preset.category === 'Dinamis'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-stone-100 text-stone-700'
                      }`}>
                        {preset.category}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 line-clamp-2">
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Adjustments: Angle, Speed, Subject */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-stone-800 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              2. Parameter Pengambilan Gambar
            </h2>

            {/* Subjek / Fokus Input */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Subjek & Fokus Adegan
              </label>
              <input
                type="text"
                value={subjectInput}
                onChange={(e) => setSubjectInput(e.target.value)}
                placeholder="Contoh: Barista menyeduh kopi / Mahasiswa panik cucian menumpuk"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Camera Angle */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2">
                Sudut Kamera (Angle)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'eye-level', label: 'Eye Level', sub: 'Sejajar Mata' },
                  { id: 'low-angle', label: 'Low Angle', sub: 'Dari Bawah' },
                  { id: 'high-angle', label: 'High Angle', sub: 'Dari Atas' },
                  { id: 'dutch-angle', label: 'Dutch Angle', sub: 'Miring Dramatis' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCameraAngle(item.id as any)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      cameraAngle === item.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                        : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-white'
                    }`}
                  >
                    <div className="text-xs">{item.label}</div>
                    <div className="text-[10px] text-stone-400 mt-0.5">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Motion Speed */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2">
                Kecepatan & Intensitas Gerakan
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'slow', label: 'Lambat / Slow', desc: 'Cinematic & Mewah' },
                  { id: 'normal', label: 'Sedang / Normal', desc: 'Stabil & Nyaman' },
                  { id: 'fast', label: 'Cepat / Fast', desc: 'Energik & Hook' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSpeedIntensity(item.id as any)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      speedIntensity === item.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                        : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-white'
                    }`}
                  >
                    <div className="text-xs">{item.label}</div>
                    <div className="text-[10px] text-stone-400 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Output & Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Preset Summary Card */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                  Preset Terpilih
                </span>
                <h3 className="text-base font-bold text-stone-900">
                  {selectedPreset.name}
                </h3>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
            </div>

            <div className="text-xs text-stone-600 space-y-2 bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
              <p><strong>Rekomendasi Pemakaian:</strong> {selectedPreset.bestFor}</p>
              <p><strong>Karakter Emosi:</strong> {selectedPreset.description}</p>
            </div>

            {/* Generated Indonesian Prompt */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700">
                  Panduan Sutradara (Bahasa Indonesia)
                </span>
                <button
                  onClick={() => handleCopy('indo', generatedPromptIndo)}
                  className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-medium cursor-pointer"
                >
                  {copiedKey === 'indo' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'indo' ? 'Tersalin' : 'Salin'}
                </button>
              </div>
              <div className="p-3 bg-stone-100 rounded-xl text-xs text-stone-800 whitespace-pre-line font-mono text-[11px] leading-relaxed border border-stone-200">
                {generatedPromptIndo}
              </div>
            </div>

            {/* Generated Global Video AI Prompt */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700">
                  Prompt Video AI (Global Standard)
                </span>
                <button
                  onClick={() => handleCopy('global', generatedPromptGlobal)}
                  className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-medium cursor-pointer"
                >
                  {copiedKey === 'global' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'global' ? 'Tersalin' : 'Salin'}
                </button>
              </div>
              <div className="p-3 bg-stone-900 rounded-xl text-xs text-stone-200 whitespace-pre-line font-mono text-[11px] leading-relaxed border border-stone-800">
                {generatedPromptGlobal}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 flex flex-col gap-2">
              {saveProject && (
                <button
                  onClick={() => {
                    const targetProjId = activeProject?.id;
                    const targetProjTitle = activeProject?.title || activeProject?.name || 'Project Video Studio';
                    saveProject({
                      id: targetProjId,
                      title: targetProjTitle,
                      motion: {
                        preset: selectedPreset.name,
                        cameraMovement: selectedPreset.promptIndo,
                        customPrompt: generatedPromptGlobal,
                      },
                    });
                    showToast(`Preset motion "${selectedPreset.name}" disimpan ke project!`);
                    if (setActiveTab) setActiveTab('studio');
                  }}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer hover:scale-[1.01]"
                >
                  <Film className="w-4 h-4" />
                  <span>Simpan ke Project & Kembali ke Studio</span>
                </button>
              )}

              <button
                onClick={handleApplyToChat}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Gunakan dalam Chat HEJO
              </button>

              {setActiveTab && (
                <button
                  onClick={() => setActiveTab('studio')}
                  className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-stone-200 transition-all cursor-pointer"
                >
                  <Clapperboard className="w-4 h-4 text-emerald-700" />
                  Buka Storyboard di Studio
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
