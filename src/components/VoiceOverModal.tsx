import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Mic, 
  Play, 
  Pause, 
  Download, 
  BookmarkPlus, 
  Sparkles, 
  Volume2, 
  Check, 
  RefreshCw,
  Gauge,
  Sliders,
  Music2,
  FileAudio,
  Layers,
  Clapperboard,
  CheckCircle2
} from 'lucide-react';
import { ProjectItem } from '../types';

interface VoiceOverModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialText?: string;
  activeProject?: ProjectItem | null;
  onSaveToProject?: (audioData: {
    audioUrl: string;
    text: string;
    voiceCharacter: string;
    voiceName: string;
    style: string;
    speed: number;
    durationSeconds: number;
  }) => void;
  showToast: (msg: string) => void;
}

interface VoiceCharacterOption {
  id: string;
  name: string;
  gender: string;
  description: string;
  geminiVoice: string;
  badge: string;
}

interface VoiceStyleOption {
  id: string;
  name: string;
  description: string;
}

export const VOICE_CHARACTERS_LIST: VoiceCharacterOption[] = [
  {
    id: 'rina',
    name: 'Rina',
    gender: 'Wanita',
    description: 'Ramah, bersahabat & ceria. Cocok untuk narasi kreator harian & rekomendasi produk.',
    geminiVoice: 'Kore',
    badge: '🌸 Sahabat',
  },
  {
    id: 'raka',
    name: 'Raka',
    gender: 'Pria',
    description: 'Enerjik, percaya diri & to-the-point. Sangat cocok untuk video FYP & promo kilat.',
    geminiVoice: 'Puck',
    badge: '⚡ FYP Viral',
  },
  {
    id: 'bayu',
    name: 'Bayu',
    gender: 'Pria',
    description: 'Berwibawa, jelas & terpercaya. Pas untuk ulasan mendalam & bisnis.',
    geminiVoice: 'Zephyr',
    badge: '🎙️ Profesional',
  },
  {
    id: 'bening',
    name: 'Bening',
    gender: 'Wanita',
    description: 'Lembut, elegan & menenangkan. Cocok untuk produk estetika & self-care.',
    geminiVoice: 'Fenrir',
    badge: '🍃 Elegan',
  },
];

export const VOICE_STYLES_LIST: VoiceStyleOption[] = [
  {
    id: 'casual',
    name: '☕ Sahabat & Kasual',
    description: 'Santai seperti mengobrol hangat dengan sahabat.',
  },
  {
    id: 'fyp',
    name: '🚀 FYP (Cepat & Menarik)',
    description: 'Intonasi cepat, antusias, dan langsung memikat di 3 detik awal.',
  },
  {
    id: 'storyteller',
    name: '📖 Storyteller (Bercerita)',
    description: 'Hangat, mengalir, dan membawa penonton masuk ke suasana cerita.',
  },
  {
    id: 'commercial',
    name: '💼 Bisnis & Review',
    description: 'Jelas, meyakinkan, dan profesional tanpa terasa memaksa.',
  },
];

export const VOICE_SPEEDS_LIST = [
  { label: '🐢 Santai (0.85x)', value: 0.85 },
  { label: '⚖️ Normal (1.0x)', value: 1.0 },
  { label: '⚡ Cepat FYP (1.2x)', value: 1.2 },
];

export const VoiceOverModal: React.FC<VoiceOverModalProps> = ({
  isOpen,
  onClose,
  initialText = '',
  activeProject,
  onSaveToProject,
  showToast,
}) => {
  const characters = VOICE_CHARACTERS_LIST;
  const styles = VOICE_STYLES_LIST;
  const speeds = VOICE_SPEEDS_LIST;

  const [text, setText] = useState(initialText);
  const [selectedCharacter, setSelectedCharacter] = useState<string>('rina');
  const [selectedStyle, setSelectedStyle] = useState<string>('casual');
  const [selectedSpeed, setSelectedSpeed] = useState<number>(1.0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeSceneTab, setActiveSceneTab] = useState<'all' | number>('all');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Extract project scenes and narrations
  const rawScenes = activeProject?.pipelineScenes || activeProject?.scenes || [];
  const sceneNarrations = rawScenes
    .map((s, idx) => ({
      sceneNumber: (s as any).sceneNumber || idx + 1,
      title: (s as any).title || (s as any).sceneLabel || `Scene ${idx + 1}`,
      duration: (s as any).duration || (s as any).durationSeconds ? `${(s as any).duration || (s as any).durationSeconds}s` : '5s',
      narration: ((s as any).voiceOver || (s as any).spokenAudio || (s as any).narration || '').trim(),
    }))
    .filter((s) => Boolean(s.narration));
  const combinedFromScenes = sceneNarrations.map((s) => s.narration).join(' ');
  const defaultProjectScript = combinedFromScenes || activeProject?.script || activeProject?.pipelineScript?.rawText || '';

  // Calculate target duration & word pacing (Requirement 7)
  const targetDurationSec = (() => {
    const raw = (activeProject as any)?.durasi || (activeProject?.pipelineScript as any)?.duration || activeProject?.description || '';
    const match = raw.match(/(\d+)\s*(detik|s|sec)/i);
    if (match) return parseInt(match[1], 10);
    if (rawScenes.length > 0) {
      const sum = rawScenes.reduce((acc, s) => {
        const d = parseInt((s as any).duration || (s as any).durationSeconds || '0', 10);
        return acc + (isNaN(d) ? 0 : d);
      }, 0);
      if (sum > 0) return sum;
    }
    return 30;
  })();

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const estimatedDurationSec = Math.max(1, Math.round(wordCount / (2.4 * selectedSpeed)));

  // Prefill existing saved audio or incoming text when modal opens (Requirement 6)
  useEffect(() => {
    if (!isOpen) return;

    if (activeProject?.voiceOver?.audioUrl) {
      // Use existing saved Voice Over without recreating
      setGeneratedAudioUrl(activeProject.voiceOver.audioUrl);
      setAudioDuration(activeProject.voiceOver.durationSeconds || 0);
      setIsSaved(true);

      if (activeProject.voiceOver.text && !initialText) {
        setText(activeProject.voiceOver.text);
      } else if (initialText) {
        setText(initialText);
      } else if (defaultProjectScript) {
        setText(defaultProjectScript);
      }

      // Restore character if matching
      const foundChar = characters.find(
        (c) =>
          c.name.toLowerCase() === activeProject.voiceOver?.voiceCharacter?.toLowerCase() ||
          c.id === activeProject.voiceOver?.voiceCharacter?.toLowerCase()
      );
      if (foundChar) setSelectedCharacter(foundChar.id);

      // Restore style if matching
      const foundStyle = styles.find(
        (s) =>
          s.name.toLowerCase() === activeProject.voiceOver?.style?.toLowerCase() ||
          s.id === activeProject.voiceOver?.style?.toLowerCase()
      );
      if (foundStyle) setSelectedStyle(foundStyle.id);

      if (activeProject.voiceOver.speed) {
        setSelectedSpeed(activeProject.voiceOver.speed);
      }
    } else {
      // New Voice Over creation: use project script as primary source (Requirement 6)
      if (initialText) {
        setText(initialText);
      } else if (defaultProjectScript) {
        setText(defaultProjectScript);
      }
      setGeneratedAudioUrl(null);
      setAudioDuration(0);
      setIsSaved(false);
    }
  }, [isOpen, activeProject, initialText]);

  if (!isOpen) return null;

  const handleGenerateAudio = async () => {
    const cleanText = text.trim();
    if (!cleanText) {
      showToast('Tulis atau tempelkan naskah yang ingin disuarakan.');
      return;
    }

    setIsGenerating(true);
    setIsPlaying(false);
    setIsSaved(false);

    try {
      const activeChar = characters.find((c) => c.id === selectedCharacter) || characters[0];
      const activeStyleObj = styles.find((s) => s.id === selectedStyle) || styles[0];

      const res = await fetch('/api/hejo/voice-over', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          voiceCharacter: activeChar.id,
          voiceName: activeChar.geminiVoice,
          style: activeStyleObj.id,
          speed: selectedSpeed,
          projectId: activeProject?.id,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data.audioUrl) {
        setGeneratedAudioUrl(data.audioUrl);
        setAudioDuration(data.durationSeconds || 5);
        showToast('✨ Audio Voice Over berhasil dihasilkan!');

        // Auto-play preview after small delay
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
            setIsPlaying(true);
          }
        }, 300);
      } else {
        throw new Error('Tidak ada audio URL yang diterima');
      }
    } catch (err: any) {
      console.warn('Backend TTS error, generating browser synthesized audio fallback:', err);
      // Fallback: Web Speech API synthesis or simulated audio preview
      generateBrowserSpeechFallback(cleanText);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateBrowserSpeechFallback = (cleanText: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'id-ID';
      utterance.rate = selectedSpeed;
      utterance.pitch = selectedCharacter === 'rina' || selectedCharacter === 'bening' ? 1.15 : 0.95;

      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      window.speechSynthesis.speak(utterance);
      setGeneratedAudioUrl('/generated-audio/preview.wav');
      setAudioDuration(Math.max(3, Math.round(cleanText.split(/\s+/).length / 2.5)));
      showToast('🔊 Memutar pratinjau suara lokal!');
    } else {
      showToast('Gagal menghasilkan audio. Periksa koneksi internet Anda.');
    }
  };

  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSaveAudio = () => {
    if (!generatedAudioUrl) return;
    const activeChar = characters.find((c) => c.id === selectedCharacter) || characters[0];
    const activeStyleObj = styles.find((s) => s.id === selectedStyle) || styles[0];

    if (onSaveToProject) {
      onSaveToProject({
        audioUrl: generatedAudioUrl,
        text: text.trim(),
        voiceCharacter: activeChar.name,
        voiceName: activeChar.geminiVoice,
        style: activeStyleObj.name,
        speed: selectedSpeed,
        durationSeconds: audioDuration,
      });
    }

    setIsSaved(true);
    showToast('💾 Voice Over berhasil disimpan ke Project!');
  };

  const handleDownloadAudio = async () => {
    if (!generatedAudioUrl) return;
    try {
      showToast('⬇️ Menyiapkan file audio Voice Over (.wav)...');
      const response = await fetch(generatedAudioUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `hejo_voiceover_${selectedCharacter}_${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
      showToast('✅ Audio Voice Over (.wav) berhasil diunduh!');
    } catch {
      // Direct anchor link fallback
      const a = document.createElement('a');
      a.href = generatedAudioUrl;
      a.download = `hejo_voiceover_${selectedCharacter}_${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('⬇️ Mengunduh file audio Voice Over (.wav)...');
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 bg-emerald-50/40">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
              <Mic className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-stone-900">
                Voice Over (Mesin Suara HEJO)
              </h2>
              <p className="text-[11px] text-stone-500">
                Ubah naskah menjadi audio alami dengan karakter suara kreator
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-left">
          {/* Status Aset Voice Over di Project (Rule 3 & 5) */}
          {activeProject?.voiceOver?.audioUrl && (
            <div className="p-3.5 bg-emerald-50/90 border border-emerald-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 bg-emerald-600 text-white rounded-lg shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-emerald-950">Voice Over ✓</span>
                    <span className="text-emerald-700 font-semibold">Tersimpan di Project</span>
                  </div>
                  <p className="text-[11px] text-stone-600 mt-0.5">
                    Karakter: <strong>{activeProject.voiceOver.voiceCharacter}</strong> · Durasi: ±{activeProject.voiceOver.durationSeconds}s · Siap diputar atau diunduh
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={handleDownloadAudio}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold rounded-xl border border-stone-200 shadow-2xs transition-colors cursor-pointer"
                  title="Unduh file WAV tersimpan"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh WAV</span>
                </button>
              </div>
            </div>
          )}

          {/* Sumber Naskah & Pilihan Scene (Requirement 6 & 8) */}
          {sceneNarrations.length > 0 && (
            <div className="space-y-1.5 bg-stone-50/80 p-2.5 rounded-2xl border border-stone-200/80">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-stone-600 flex items-center gap-1">
                  <Clapperboard className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Kaitkan dengan Scene Video:</span>
                </span>
                <span className="text-stone-400">Pilih narasi per scene atau naskah utuh</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSceneTab('all');
                    setText(combinedFromScenes || defaultProjectScript);
                  }}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    activeSceneTab === 'all'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white text-stone-600 border border-stone-200 hover:border-emerald-300'
                  }`}
                >
                  🎬 Semua Naskah Video
                </button>
                {sceneNarrations.map((sc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveSceneTab(sc.sceneNumber);
                      setText(sc.narration);
                    }}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      activeSceneTab === sc.sceneNumber
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white text-stone-600 border border-stone-200 hover:border-emerald-300'
                    }`}
                  >
                    Scene {sc.sceneNumber} ({sc.duration})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Naskah Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                ✍️ Naskah yang Disuarakan
              </label>
              <span className="text-[11px] text-stone-400">
                {text.length} karakter · {wordCount} kata
              </span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Tuliskan naskah atau narasi di sini. Contoh: 'Sering bingung nyari produk yang berkualitas? Stop scroll dulu...'"
              rows={3}
              className="w-full text-sm text-stone-800 placeholder-stone-400 bg-stone-50 border border-stone-200 rounded-2xl p-3.5 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all leading-relaxed"
            />
          </div>

          {/* Saran Durasi & Pacing Video (Requirement 7) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-stone-100/80 rounded-2xl border border-stone-200 text-xs text-stone-700">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-stone-200 rounded-lg">⏱️</span>
              <span>
                Estimasi Suara: <strong>±{estimatedDurationSec}s</strong> ({wordCount} kata)
              </span>
              <span className="text-stone-300">·</span>
              <span className="text-stone-500">Target Video: <strong>{targetDurationSec}s</strong></span>
            </div>

            <div>
              {estimatedDurationSec > targetDurationSec + 4 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900 bg-amber-100 border border-amber-300/80 px-2 py-0.5 rounded-lg">
                  ⚠️ Naskah agak panjang (+{estimatedDurationSec - targetDurationSec}s) · Saran: gunakan tempo 1.2x (FYP)
                </span>
              ) : estimatedDurationSec < targetDurationSec - 8 && wordCount > 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-600 bg-stone-200 px-2 py-0.5 rounded-lg">
                  ℹ️ Ringkas · Tersisa ±{targetDurationSec - estimatedDurationSec}s untuk jeda/outro
                </span>
              ) : wordCount > 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-900 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-lg">
                  ✨ Durasi pas dengan target video {targetDurationSec} detik!
                </span>
              ) : null}
            </div>
          </div>

          {/* 1. Pilih Karakter Suara (4 Pilihan Ringkas) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                👤 Karakter Suara
              </label>
              <span className="text-[11px] text-emerald-700 font-semibold">
                Karakter Aktif: {characters.find(c => c.id === selectedCharacter)?.name}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {characters.map((char) => {
                const isSelected = selectedCharacter === char.id;
                return (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => setSelectedCharacter(char.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/30 shadow-xs'
                        : 'bg-white border-stone-200 hover:border-emerald-300 hover:bg-stone-50/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-extrabold text-stone-900">
                          {char.name}
                        </span>
                        <span className="text-[10px] font-bold text-stone-500">
                          {char.gender}
                        </span>
                      </div>
                      <span className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded-md mb-1.5">
                        {char.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-500 line-clamp-2 leading-tight">
                      {char.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Pilih Gaya & Tempo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Gaya Suara */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <Music2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Gaya Pembawaan</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {styles.map((st) => {
                  const isSelected = selectedStyle === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSelectedStyle(st.id)}
                      className={`p-2 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-white border-stone-200 text-stone-700 hover:border-emerald-300'
                      }`}
                    >
                      {st.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tempo Kecepatan */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tempo Suara</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {speeds.map((sp) => {
                  const isSelected = selectedSpeed === sp.value;
                  return (
                    <button
                      key={sp.value}
                      type="button"
                      onClick={() => setSelectedSpeed(sp.value)}
                      className={`p-2 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-white border-stone-200 text-stone-700 hover:border-emerald-300'
                      }`}
                    >
                      {sp.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tombol Utama: Hasilkan Voice Over */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleGenerateAudio}
              disabled={isGenerating || !text.trim()}
              className="w-full py-3.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>HEJO sedang menghasilkan suara...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>▶️ Hasilkan Voice Over</span>
                </>
              )}
            </button>
          </div>

          {/* Audio Player Hasil */}
          {generatedAudioUrl && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-600 text-white rounded-lg">
                    <FileAudio className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-stone-900">
                      Audio Voice Over Siap
                    </h3>
                    <p className="text-[10px] text-stone-500">
                      Karakter {characters.find(c => c.id === selectedCharacter)?.name} · Tempo {selectedSpeed}x
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-800">
                  {formatTime(currentTime)} / {formatTime(audioDuration)}
                </span>
              </div>

              {/* Native Audio Element */}
              <audio
                ref={audioRef}
                src={generatedAudioUrl}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleAudioEnded}
                className="hidden"
              />

              {/* Custom Player Controls */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlayAudio}
                  className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-sm transition-all cursor-pointer"
                  title={isPlaying ? 'Jeda' : 'Putar Audio'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>

                {/* Progress Bar / Waveform bar */}
                <div className="flex-1 bg-stone-200/90 h-2 rounded-full overflow-hidden relative cursor-pointer"
                     onClick={(e) => {
                       if (audioRef.current && audioDuration > 0) {
                         const rect = e.currentTarget.getBoundingClientRect();
                         const pos = (e.clientX - rect.left) / rect.width;
                         audioRef.current.currentTime = pos * audioDuration;
                       }
                     }}>
                  <div 
                    className="bg-emerald-600 h-full transition-all duration-100"
                    style={{ width: `${audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons: Simpan ke Project & Unduh */}
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-emerald-200/60 flex-wrap">
                <button
                  type="button"
                  onClick={handleDownloadAudio}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold rounded-xl border border-stone-200 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Audio (.wav)</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAudio}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {isSaved ? <Check className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                  <span>{isSaved ? 'Tersimpan di Project' : 'Simpan ke Project'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
