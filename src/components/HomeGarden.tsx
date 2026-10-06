import React, { useState, useRef, useEffect } from 'react';
import { 
  Lightbulb, 
  Clapperboard, 
  Image as ImageIcon, 
  Feather, 
  UserCircle2, 
  Package, 
  FolderKanban, 
  Mic, 
  MicOff, 
  Sparkles, 
  ArrowRight, 
  BookmarkPlus, 
  RefreshCw, 
  Copy, 
  Check, 
  Clock, 
  Plus, 
  HelpCircle,
  Camera,
  Coffee,
  Heart,
  GraduationCap,
  Smile
} from 'lucide-react';
import { ActiveNavTab, ChatMessage, ProjectItem, UserMode, CreatorContext, GoogleFlowConnection, FlowReadyData } from '../types';
import { sendChatMessage } from '../services/aiService';
import { calculateProjectProgress } from '../utils/projectProgress';
import { NewProjectModal } from './NewProjectModal';
import { FlowReadyCard } from './FlowReadyCard';
import { MultiContentAffiliateCard } from './MultiContentAffiliateCard';
import { PromptPackCard } from './PromptPackCard';
import { ImageResultCard } from './ImageResultCard';

interface HomeGardenProps {
  userMode: UserMode;
  setActiveTab: (tab: ActiveNavTab) => void;
  chatMessages: ChatMessage[];
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => ChatMessage;
  saveProject: (project: Partial<ProjectItem> & { title: string }) => void;
  createProject?: (name: string) => ProjectItem;
  showToast: (msg: string) => void;
  onOpenProjectInStudio: (title: string, script?: string) => void;
  projects?: ProjectItem[];
  setActiveProjectId?: (id: string | null) => void;
  creatorContext?: CreatorContext;
  setCreatorContext?: React.Dispatch<React.SetStateAction<CreatorContext>>;
  connection?: GoogleFlowConnection;
  onOpenConnectionModal?: () => void;
  onOpenFlowWorkspace?: (data: FlowReadyData) => void;
  onOpenVoiceOver?: (text?: string) => void;
}

export const HomeGarden: React.FC<HomeGardenProps> = ({
  userMode,
  setActiveTab,
  chatMessages,
  addChatMessage,
  saveProject,
  createProject,
  showToast,
  onOpenProjectInStudio,
  projects = [],
  setActiveProjectId,
  creatorContext = {},
  setCreatorContext,
  connection,
  onOpenConnectionModal,
  onOpenFlowWorkspace,
  onOpenVoiceOver,
}) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  const isSubmittingRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const latestMessageRef = useRef<HTMLDivElement>(null);
  const typingIndicatorRef = useRef<HTMLDivElement>(null);

  const hasUserMessages = chatMessages.some((m) => m.sender === 'user');

  const toggleListening = () => {
    try {
      const SpeechRecognition =
        typeof window !== 'undefined'
          ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
          : null;

      if (!SpeechRecognition) {
        showToast('Perekam suara tidak didukung di browser ini. Kamu bisa langsung mengetik ya!');
        return;
      }

      if (!recognitionRef.current) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'id-ID';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript) {
            setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }

      if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      } else {
        recognitionRef.current.start();
        setIsListening(true);
        showToast('Mendengarkan... Silakan ceritakan ide kamu.');
      }
    } catch {
      setIsListening(false);
      showToast('Perekam suara tidak dapat diakses. Kamu bisa langsung mengetik ide ya!');
    }
  };

  const handleCreateVideoAuto = (customPrompt?: string) => {
    const promptToUse = (customPrompt || inputText).trim();
    if (!promptToUse) return;

    const title = promptToUse.length > 50 ? promptToUse.slice(0, 50) + '...' : promptToUse;
    const isTiktok = /tiktok/i.test(promptToUse);
    const isReels = /reels|instagram/i.test(promptToUse);
    const detectedPlatform = isTiktok ? 'TikTok' : isReels ? 'Instagram Reels' : 'TikTok';
    const detectedTarget = /mahasiswa/i.test(promptToUse)
      ? 'Mahasiswa'
      : /pekerja/i.test(promptToUse)
      ? 'Pekerja Kantor'
      : /anak muda/i.test(promptToUse)
      ? 'Anak Muda'
      : 'Audiens Umum';

    // 1. Create or save project
    saveProject({
      title: title,
      name: title,
      description: promptToUse,
      category: 'video',
      status: 'in_progress',
      currentStage: 'idea',
      tags: ['Video AI', detectedPlatform],
    });

    // 2. Set creatorContext with auto-run pipeline trigger
    if (setCreatorContext) {
      setCreatorContext((prev) => ({
        ...prev,
        produk: promptToUse,
        tujuan: 'video promosi',
        platform: detectedPlatform,
        targetAudiens: detectedTarget,
        durasi: '30 detik',
        pipelineStage: 'idea',
        autoRunPipeline: true,
        rawPrompt: promptToUse,
      }));
    }

    showToast('✨ HEJO menyiapkan alur video otomatis untukmu...');
    setActiveTab('studio');
  };

  const handleSendMessage = async (customText?: string) => {
    if (isSubmittingRef.current || isLoading) return;

    const messageToSend = (customText || inputText).trim();
    if (!messageToSend) return;

    isSubmittingRef.current = true;
    setIsLoading(true);

    if (!customText) {
      setInputText('');
    }

    // Add user message
    addChatMessage({
      sender: 'user',
      text: messageToSend,
    });

    // Scroll halus dan tenang ke pesan yang baru dikirim / indikator HEJO
    setTimeout(() => {
      typingIndicatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 60);

    try {
      const response = await sendChatMessage(
        messageToSend,
        chatMessages,
        userMode,
        creatorContext
      );

      let mergedContext = { ...creatorContext };
      if (response.updatedContext) {
        for (const [key, val] of Object.entries(response.updatedContext)) {
          if (val !== undefined && val !== null && val !== '') {
            (mergedContext as any)[key] = val;
          }
        }
        if (setCreatorContext) {
          setCreatorContext(mergedContext);
        }
      }

      addChatMessage({
        sender: 'hejo',
        text: response.reply,
        quickActions: response.suggestedActions,
        attachedDraft: response.structuredDraft || undefined,
        flowReady: response.flowReady || response.structuredDraft?.flowReady || response.structuredDraft?.meta?.flowReady || undefined,
        multiAffiliate: response.multiAffiliate || response.structuredDraft?.multiAffiliate || response.structuredDraft?.meta?.multiAffiliate || undefined,
        promptPack: response.promptPack || response.structuredDraft?.promptPack || response.structuredDraft?.meta?.promptPack || undefined,
        imageResult: response.imageResult || response.structuredDraft?.imageResult || response.structuredDraft?.meta?.imageResult || undefined,
        creatorContext: mergedContext,
      });
    } catch {
      addChatMessage({
        sender: 'hejo',
        text: 'Maaf, terjadi sedikit jeda. Kamu bisa langsung coba lagi ya.',
        quickActions: ['Coba lagi', 'Buat naskah video', 'Cari ide lain'],
      });
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
      setTimeout(() => {
        latestMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  };

  const handleActionPrompt = () => {
    const text = inputText.trim();
    if (text) {
      if (/prompt/i.test(text)) {
        handleSendMessage(text);
      } else {
        handleSendMessage(`Buat prompt untuk: ${text}`);
      }
    } else {
      handleSendMessage('Buat prompt visual, video, dan konten affiliate untuk produk saya.');
    }
  };

  const handleActionImage = () => {
    const text = inputText.trim();
    if (text) {
      if (/gambar/i.test(text)) {
        handleSendMessage(text);
      } else {
        handleSendMessage(`Buat gambar produk ini terlihat premium: ${text}`);
      }
    } else {
      setInputText('Buat gambar produk ini terlihat premium: ');
      textareaRef.current?.focus();
      showToast('Apa yang ingin kamu lihat? Tuliskan deskripsi produk atau suasana visual lalu tekan Buat Gambar.');
    }
  };

  const handleActionVideo = () => {
    const text = inputText.trim();
    if (text) {
      if (/video|detik|affiliate/i.test(text)) {
        handleSendMessage(text);
      } else {
        handleSendMessage(`Buat video affiliate untuk ${text} 20 detik.`);
      }
    } else {
      handleSendMessage('Buat video affiliate produk ini 20 detik.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isSubmittingRef.current && !isLoading && !e.nativeEvent.isComposing) {
        handleSendMessage();
      }
    }
  };

  // Pilihan Cepat (6 pilihan + "Saya belum tahu")
  const quickChoices = [
    {
      id: 'ide',
      label: 'Saya butuh ide',
      icon: '💡',
      action: () => handleSendMessage('💡 Saya butuh ide'),
    },
    {
      id: 'video',
      label: 'Saya mau buat video',
      icon: '🎬',
      action: () => handleSendMessage('🎬 Saya mau buat video'),
    },
    {
      id: 'gambar',
      label: 'Saya mau buat gambar',
      icon: '🖼️',
      action: () => handleSendMessage('🖼️ Saya mau buat gambar'),
    },
    {
      id: 'script',
      label: 'Saya mau buat script',
      icon: '✍️',
      action: () => handleSendMessage('✍️ Saya mau buat script'),
    },
    {
      id: 'karakter',
      label: 'Saya mau membuat karakter',
      icon: '👤',
      action: () => handleSendMessage('👤 Saya mau membuat karakter'),
    },
    {
      id: 'produk',
      label: 'Saya mau membuat konten produk',
      icon: '📦',
      action: () => handleSendMessage('📦 Saya mau membuat konten produk'),
    },
    {
      id: 'affiliate',
      label: 'Video Affiliate 20s (Flow)',
      icon: '🚀',
      action: () => handleSendMessage('Buat video affiliate produk ini 20 detik.'),
    },
  ];

  const handleActionClick = (action: string) => {
    if (isSubmittingRef.current || isLoading) return;

    if (action.includes('Lanjut ke Flow') || action.includes('Buka Flow')) {
      const lastMsgWithFlow = [...chatMessages].reverse().find((m) => m.flowReady || m.attachedDraft?.flowReady);
      if (lastMsgWithFlow?.attachedDraft?.content) {
        navigator.clipboard.writeText(lastMsgWithFlow.attachedDraft.content);
      }
      try {
        window.open('https://labs.google/flow', '_blank', 'noopener,noreferrer');
        showToast('🚀 Membuka Flow AI di tab baru! Seluruh prompt sudah disalin.');
      } catch {
        showToast('Izinkan pop-up browser untuk membuka Flow.');
      }
      return;
    }

    if (action.includes('Karakter') && (action.includes('Buka') || action.includes('DNA') || action.includes('Saya'))) {
      setActiveTab('characters');
      return;
    }
    if (action.includes('Studio') && (action.includes('Buka') || action.includes('Rinci'))) {
      setActiveTab('studio');
      return;
    }
    if (action.includes('Voice Over') || action.includes('suara') || action.includes('Suara') || action.includes('Audio')) {
      const lastDraft = [...chatMessages].reverse().find((m) => m.attachedDraft)?.attachedDraft;
      const textToVoice = lastDraft?.content || 'Halo kreator, ini suara dari HEJO AI.';
      if (onOpenVoiceOver) {
        onOpenVoiceOver(textToVoice);
        return;
      }
    }

    if (action.includes('Salin')) {
      const lastDraft = [...chatMessages].reverse().find((m) => m.attachedDraft)?.attachedDraft;
      if (lastDraft) {
        handleCopyText('latest', lastDraft.content);
        return;
      }
    }
    if (action.includes('Simpan') && !action.includes('Studio')) {
      const lastDraft = [...chatMessages].reverse().find((m) => m.attachedDraft)?.attachedDraft;
      if (lastDraft) {
        handleSaveToProject(lastDraft.title, lastDraft.content);
        return;
      }
    }
    if (action.includes('Edit')) {
      setActiveTab('studio');
      return;
    }
    handleSendMessage(action);
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Teks berhasil disalin!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveToProject = (title: string, content: string) => {
    saveProject({
      title: title || 'Karya Baru HEJO',
      description: content.slice(0, 120) + '...',
      category: 'video',
      script: content,
      status: 'ready',
      tags: ['Creator Engine', 'HEJO AI'],
    });
    showToast(`"${title}" berhasil disimpan ke Project!`);
  };

  // Get recent 3 projects
  const recentProjects = projects.filter((p) => Boolean(p && p.id)).slice(0, 3);

  const handleCreateNewProject = (name: string) => {
    if (createProject) {
      createProject(name);
    } else {
      saveProject({
        title: name,
        name: name,
        description: 'Project baru dimulai dari Beranda HEJO AI.',
        category: 'video',
        status: 'draft',
        currentStage: 'idea',
        tags: ['Baru'],
      });
    }
    setActiveTab('studio');
  };

  const handleOpenExistingProject = (project: ProjectItem) => {
    if (setActiveProjectId) {
      setActiveProjectId(project.id);
    }
    setActiveTab('studio');
  };

  const renderChatInputBox = () => (
    <div className="text-left w-full">
      <div className="bg-white border-2 border-emerald-500/50 focus-within:border-emerald-600 rounded-3xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              hasUserMessages
                ? "Ketik balasan untuk HEJO (contoh: 'Buat lebih mewah', 'Ganti durasi jadi 15 detik')..."
                : "Contoh: Buat 5 video affiliate untuk produk ini, masing-masing 20 detik..."
            }
            rows={hasUserMessages ? 2 : 3}
            className="w-full text-stone-800 placeholder-stone-400 bg-transparent resize-none focus:outline-none text-base sm:text-lg leading-relaxed pr-10"
          />
          {isListening && (
            <div className="absolute top-0 right-0 flex items-center gap-1 text-xs text-rose-600 font-medium bg-rose-50 px-2.5 py-1 rounded-full animate-pulse border border-rose-200">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Mendengarkan...</span>
            </div>
          )}
        </div>

        {/* 3 Contoh Sederhana */}
        <div className="flex items-center gap-2 text-xs text-stone-500 mt-2.5 pt-1.5 flex-wrap border-t border-stone-100">
          <span className="font-bold text-stone-400">Contoh:</span>
          {[
            'Buat video affiliate untuk produk ini',
            'Buat gambar produk ini',
            'Buat prompt video',
          ].map((ex, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setInputText(ex)}
              className="text-stone-600 hover:text-emerald-800 hover:bg-emerald-50 px-2.5 py-1 rounded-lg border border-stone-200/80 hover:border-emerald-300 transition-colors cursor-pointer text-left font-medium text-[11px] sm:text-xs"
            >
              “{ex}”
            </button>
          ))}
        </div>

        {/* Bottom Bar: Tombol Bicara & Tombol Kirim */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100 flex-wrap gap-2">
          <button
            type="button"
            onClick={toggleListening}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              isListening
                ? 'bg-rose-500 text-white shadow-sm ring-2 ring-rose-300'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
            title="Bicara dengan Mikrofon"
          >
            {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-emerald-600" />}
            <span>{isListening ? 'Selesai' : '🎤 Bicara'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <span>Kirim</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* HANYA 3 AKSI UTAMA (Requirement 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-left">
        <button
          type="button"
          onClick={handleActionPrompt}
          disabled={isLoading}
          className="flex items-center justify-center gap-2.5 p-4 rounded-2xl bg-white border-2 border-stone-200/90 hover:border-indigo-500 hover:bg-indigo-50/40 shadow-xs hover:shadow-md transition-all font-black text-stone-800 hover:text-indigo-900 cursor-pointer active:scale-[0.98] group"
        >
          <span className="text-xl group-hover:scale-110 transition-transform">📝</span>
          <span className="text-xs sm:text-sm tracking-wide">BUAT PROMPT</span>
        </button>

        <button
          type="button"
          onClick={handleActionImage}
          disabled={isLoading}
          className="flex items-center justify-center gap-2.5 p-4 rounded-2xl bg-white border-2 border-stone-200/90 hover:border-emerald-500 hover:bg-emerald-50/40 shadow-xs hover:shadow-md transition-all font-black text-stone-800 hover:text-emerald-900 cursor-pointer active:scale-[0.98] group"
        >
          <span className="text-xl group-hover:scale-110 transition-transform">🖼️</span>
          <span className="text-xs sm:text-sm tracking-wide">BUAT GAMBAR</span>
        </button>

        <button
          type="button"
          onClick={handleActionVideo}
          disabled={isLoading}
          className="flex items-center justify-center gap-2.5 p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-700/20 transition-all font-black text-xs sm:text-sm tracking-wide cursor-pointer hover:scale-[1.01] active:scale-[0.98] group"
        >
          <span className="text-xl group-hover:scale-110 transition-transform">🎬</span>
          <span>BUAT VIDEO</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-16">
      {/* 1. BAGIAN UTAMA BERANDA: SIMPLE OUTSIDE, POWERFUL INSIDE */}
      <section className="text-center pt-2 sm:pt-4 max-w-3xl mx-auto px-4">
        {/* Judul & Subjudul Sederhana - Tenang dan Stabil */}
        <h1 className="font-black text-stone-900 tracking-tight text-3xl sm:text-4xl">
          Apa yang ingin kamu buat?
        </h1>
        <p className="text-stone-600 max-w-xl mx-auto leading-relaxed mt-1.5 text-sm sm:text-base">
          Ceritakan saja. HEJO akan membantu menyiapkan semuanya.
        </p>

        {/* Kotak Input Utama saat belum ada percakapan aktif */}
        {!hasUserMessages && (
          <div className="mt-6">
            {renderChatInputBox()}
          </div>
        )}
      </section>

      {/* RUANG OBROLAN INTERAKTIF DENGAN HEJO (Teman Kreator) */}
      {chatMessages.length > 0 && (
        <section className="max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-200/80">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Percakapan dengan Teman Kreator (HEJO)
              </h2>
            </div>
            <span className="text-[11px] text-stone-400">
              Taman Kreator
            </span>
          </div>

          {/* Creator Context (Visible only in CREATOR or PRO mode, hidden in SIMPLE mode) */}
          {userMode !== 'SIMPLE' && (creatorContext.tujuan || creatorContext.produk || creatorContext.platform || creatorContext.gaya) && (
            <div className="mb-4 px-3.5 py-2 bg-emerald-50/70 border border-emerald-200/90 rounded-xl text-xs text-stone-700 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="font-bold text-emerald-900 uppercase tracking-wider">Konteks Karya:</span>
                {creatorContext.tujuan && <span className="bg-white/80 px-2 py-0.5 rounded border border-emerald-100">🎯 {creatorContext.tujuan}</span>}
                {creatorContext.platform && <span className="bg-white/80 px-2 py-0.5 rounded border border-emerald-100">📱 {creatorContext.platform}</span>}
                {creatorContext.produk && <span className="bg-white/80 px-2 py-0.5 rounded border border-emerald-100">📦 {creatorContext.produk}</span>}
                {creatorContext.gaya && <span className="bg-white/80 px-2 py-0.5 rounded border border-emerald-100">🎨 {creatorContext.gaya}</span>}
              </div>
              <button
                onClick={() => {
                  saveProject({
                    title: `Karya ${creatorContext.produk || creatorContext.tujuan || 'Baru'}`,
                    description: `Platform: ${creatorContext.platform || 'Umum'} · Gaya: ${creatorContext.gaya || 'Santai'}`,
                    category: 'video',
                    status: 'in_progress',
                  });
                }}
                className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
              >
                + Simpan ke Project
              </button>
            </div>
          )}

          <div className="space-y-5">
            {chatMessages.map((msg, idx) => {
              const isHejo = msg.sender === 'hejo';
              const isLatest = idx === chatMessages.length - 1;
              return (
                <div
                  key={msg.id}
                  ref={isLatest ? latestMessageRef : undefined}
                  className={`flex flex-col ${isHejo ? 'items-start' : 'items-end'}`}
                >
                  {/* Sender Label */}
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[11px] font-bold text-stone-600">
                      {isHejo ? 'HEJO' : 'Kamu'}
                    </span>
                    <span className="text-[10px] text-stone-400">· {msg.timestamp}</span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-2xl rounded-2xl px-4 py-3.5 text-sm sm:text-base leading-relaxed ${
                      isHejo
                        ? 'bg-white border border-stone-200/90 text-stone-800 shadow-sm'
                        : 'bg-emerald-600 text-white rounded-br-sm'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>

                    {/* FLOW READY CARD (Requirement 4 & 5) */}
                    {(msg.flowReady || msg.attachedDraft?.type === 'flow_ready' || msg.attachedDraft?.flowReady || msg.attachedDraft?.meta?.flowReady) && (
                      <FlowReadyCard
                        data={
                          msg.flowReady ||
                          msg.attachedDraft?.flowReady ||
                          msg.attachedDraft?.meta?.flowReady || {
                            productName: 'Produk Rekomendasi Affiliate',
                            totalDuration: '20 detik',
                            sceneCount: 2,
                            scenes: [],
                          }
                        }
                        connection={connection}
                        onOpenConnectionModal={onOpenConnectionModal}
                        onSaveToProject={(flowData) => {
                          saveProject({
                            title: `Video Affiliate: ${flowData.productName}`,
                            description: `${flowData.sceneCount} Scene · ${flowData.totalDuration} (Siap untuk Flow)`,
                            category: 'video',
                            status: 'ready',
                            script: msg.attachedDraft?.content || undefined,
                            tags: ['Affiliate', 'Flow AI'],
                          });
                        }}
                        onOpenStudio={(flowData) => {
                          onOpenProjectInStudio(
                            `Video Affiliate: ${flowData.productName}`,
                            msg.attachedDraft?.content
                          );
                        }}
                        onOpenFlowWorkspace={onOpenFlowWorkspace}
                        onOpenVoiceOver={onOpenVoiceOver}
                        showToast={showToast}
                      />
                    )}

                    {/* MULTI-CONTENT AFFILIATE CARD (Requirement 4) */}
                    {(msg.multiAffiliate || msg.attachedDraft?.type === 'multi_affiliate' || msg.attachedDraft?.multiAffiliate || msg.attachedDraft?.meta?.multiAffiliate) && (
                      <MultiContentAffiliateCard
                        data={
                          msg.multiAffiliate ||
                          msg.attachedDraft?.multiAffiliate ||
                          msg.attachedDraft?.meta?.multiAffiliate!
                        }
                        onSelectContentForVideo={(item) => {
                          handleSendMessage(`Buat video affiliate untuk konten ini: "${item.hook}" dengan durasi 20 detik.`);
                        }}
                        onSaveToProject={(multiData) => {
                          saveProject({
                            title: `Paket Affiliate: ${multiData.productName}`,
                            description: `1 Produk → ${multiData.contentCount} Konten Berbeda`,
                            category: 'campaign',
                            status: 'ready',
                            script: msg.attachedDraft?.content || undefined,
                            tags: ['Affiliate', 'Multi Content'],
                          });
                          showToast(`Paket ${multiData.contentCount} konten affiliate disimpan ke Project!`);
                        }}
                        showToast={showToast}
                      />
                    )}

                    {/* PROMPT PACK CARD (Requirement 9) */}
                    {(msg.promptPack || msg.attachedDraft?.type === 'prompt_pack' || msg.attachedDraft?.promptPack || msg.attachedDraft?.meta?.promptPack) && (
                      <PromptPackCard
                        data={
                          msg.promptPack ||
                          msg.attachedDraft?.promptPack ||
                          msg.attachedDraft?.meta?.promptPack!
                        }
                        onSaveToProject={() => {
                          const pack = msg.promptPack || msg.attachedDraft?.promptPack || msg.attachedDraft?.meta?.promptPack!;
                          saveProject({
                            title: pack.title,
                            description: `Kategori: ${pack.category} · Prompt Global & Panduan Indonesia`,
                            category: 'video',
                            status: 'draft',
                            script: msg.attachedDraft?.content || pack.promptGlobal,
                            tags: ['Prompt Pack', pack.category],
                          });
                          showToast('Prompt berhasil disimpan ke Project!');
                        }}
                        onGenerateVideoFromPrompt={(p) => {
                          handleSendMessage(`Buat video affiliate 20 detik berdasarkan prompt ini: ${p}`);
                        }}
                        showToast={showToast}
                      />
                    )}

                    {/* IMAGE RESULT CARD (Requirement 8) */}
                    {(msg.imageResult || msg.attachedDraft?.type === 'image_result' || msg.attachedDraft?.imageResult || msg.attachedDraft?.meta?.imageResult) && (
                      <ImageResultCard
                        data={
                          msg.imageResult ||
                          msg.attachedDraft?.imageResult ||
                          msg.attachedDraft?.meta?.imageResult!
                        }
                        onGenerateVideo={(p) => {
                          handleSendMessage(`Buat video affiliate 20 detik berdasarkan visual ini: ${p}`);
                        }}
                        onSaveToProject={() => {
                          const img = msg.imageResult || msg.attachedDraft?.imageResult || msg.attachedDraft?.meta?.imageResult!;
                          saveProject({
                            title: `Visual: ${img.prompt.slice(0, 35)}...`,
                            description: `Prompt: ${img.prompt}`,
                            category: 'video',
                            status: 'draft',
                            tags: ['Visual', 'Gambar'],
                          });
                          showToast('Visual berhasil disimpan ke Project!');
                        }}
                        showToast={showToast}
                      />
                    )}

                    {/* Attached Structured Draft Preview (Creator Engine Pipeline) */}
                    {msg.attachedDraft && 
                      msg.attachedDraft.type !== 'flow_ready' && 
                      msg.attachedDraft.type !== 'multi_affiliate' && 
                      msg.attachedDraft.type !== 'prompt_pack' && 
                      msg.attachedDraft.type !== 'image_result' && 
                      !msg.flowReady && 
                      !msg.multiAffiliate && 
                      !msg.promptPack && 
                      !msg.imageResult && (
                      <div className="mt-4 p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-stone-800 shadow-xs">
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-emerald-200/70 text-emerald-900">
                              {msg.attachedDraft.type === 'idea' && '💡 IDE KONTEN'}
                              {msg.attachedDraft.type === 'script' && '✍️ NASKAH STRUKTUR'}
                              {msg.attachedDraft.type === 'storyboard' && '🎬 STORYBOARD'}
                              {msg.attachedDraft.type === 'shotlist' && '🎥 SHOT LIST'}
                              {msg.attachedDraft.type === 'character' && '👤 KARAKTER DNA'}
                              {msg.attachedDraft.type === 'product' && '📦 PRODUK DNA'}
                            </span>
                            <span className="text-xs font-bold text-stone-900 truncate max-w-xs sm:max-w-md">
                              {msg.attachedDraft.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() =>
                                handleCopyText(msg.id, msg.attachedDraft!.content)
                              }
                              className="p-1.5 text-stone-500 hover:text-emerald-700 hover:bg-emerald-100/60 rounded-lg transition-colors cursor-pointer"
                              title="Salin Konten"
                            >
                              {copiedId === msg.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() =>
                                handleSaveToProject(
                                  msg.attachedDraft!.title,
                                  msg.attachedDraft!.content
                                )
                              }
                              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                            >
                              <BookmarkPlus className="w-3 h-3" />
                              <span>Simpan</span>
                            </button>
                          </div>
                        </div>

                        <div className="text-xs sm:text-sm font-mono whitespace-pre-line bg-white/95 p-3.5 rounded-xl border border-emerald-100 text-stone-800 max-h-72 overflow-y-auto leading-relaxed shadow-inner">
                          {msg.attachedDraft.content}
                        </div>

                        {/* Pipeline Stage Action Buttons */}
                        <div className="mt-3 pt-2.5 border-t border-emerald-100 flex flex-wrap items-center justify-between gap-2">
                          <button
                            onClick={() =>
                              onOpenProjectInStudio(
                                msg.attachedDraft!.title,
                                msg.attachedDraft!.content
                              )
                            }
                            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                          >
                            <span>🎬 Buka di Studio</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>

                          {onOpenVoiceOver && (
                            <button
                              onClick={() => onOpenVoiceOver(msg.attachedDraft!.content)}
                              className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer hover:scale-[1.02]"
                            >
                              🎤 Buat Voice Over
                            </button>
                          )}

                          {msg.attachedDraft.type === 'script' && (
                            <button
                              onClick={() => handleSendMessage('🎬 Buat Storyboard')}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer hover:scale-[1.02]"
                            >
                              🎬 Buat Storyboard
                            </button>
                          )}

                          {msg.attachedDraft.type === 'storyboard' && (
                            <button
                              onClick={() => handleSendMessage('🎥 Buat Shot List')}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer hover:scale-[1.02]"
                            >
                              🎥 Buat Shot List
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 6. RESPONS CHAT: Langkah Berikutnya & Pilihan Cepat Ramah */}
                  {isHejo && msg.quickActions && msg.quickActions.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {msg.quickActions.map((action, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() => handleActionClick(action)}
                          className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer hover:scale-[1.02]"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Indikator Typing Alami & Tenang saat HEJO sedang menyiapkan */}
            {isLoading && (
              <div ref={typingIndicatorRef} className="flex flex-col items-start pt-1">
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[11px] font-bold text-stone-600">HEJO</span>
                  <span className="text-[10px] text-stone-400">· Teman Kreator</span>
                </div>
                <div className="rounded-2xl px-4 py-3 bg-white border border-stone-200 text-stone-700 shadow-xs flex items-center gap-2.5 text-xs sm:text-sm">
                  <span className="inline-flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse [animation-delay:150ms]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse [animation-delay:300ms]"></span>
                  </span>
                  <span className="font-medium text-stone-600">HEJO sedang menyiapkan...</span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Kolom Chat Utama Lanjutan di bawah percakapan (Tetap mudah ditemukan) */}
          <div className="mt-6 pt-4 border-t border-stone-100">
            {renderChatInputBox()}
          </div>
        </section>
      )}

      {/* 4. PROJECT TERAKHIR */}
      <section className="max-w-3xl mx-auto px-4 pt-4 border-t border-stone-200/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <FolderKanban className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-stone-900">
              📁 Project Terakhir
            </h2>
          </div>

          <button
            onClick={() => setIsNewProjectModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Buat Project</span>
          </button>
        </div>

        {recentProjects.length === 0 ? (
          <div className="p-8 text-center bg-white border border-dashed border-stone-300 rounded-2xl">
            <FolderKanban className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-stone-700">
              Belum ada project. Yuk mulai berkarya.
            </p>
            <p className="text-xs text-stone-400 mt-0.5 mb-4">
              Semua ide dan naskah yang kamu simpan akan muncul rapi di sini.
            </p>
            <button
              onClick={() => setIsNewProjectModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Buat Project Pertama</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {recentProjects.map((project) => {
              const prog = calculateProjectProgress(project);
              const productName = (project as any).productName || project.tags?.find(t => t.startsWith('Produk:'))?.replace('Produk:', '') || 'Produk Affiliate';
              const contentType = project.category === 'campaign' ? 'Paket Affiliate' : project.category === 'video' ? 'Video Affiliate' : 'Konten Kreatif';
              const contentCount = project.pipelineShots?.length ? `${project.pipelineShots.length} Scene` : project.description?.match(/(\d+)\s*(scene|konten)/i)?.[0] || '1 Konten';
              const statusLabel = project.status === 'ready' ? 'Siap Produksi' : project.status === 'completed' ? 'Selesai' : 'Sedang Dikerjakan';

              return (
                <div
                  key={project.id}
                  onClick={() => handleOpenExistingProject(project)}
                  className="p-4 bg-white border border-stone-200 rounded-2xl hover:border-emerald-500 hover:shadow-sm transition-all text-left group cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] text-stone-400">
                      <span className="font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                        {contentType}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{project.updatedAt}</span>
                      </span>
                    </div>

                    <h3 className="font-extrabold text-stone-900 text-sm group-hover:text-emerald-800 transition-colors line-clamp-1">
                      {project.name || project.title}
                    </h3>

                    {/* Informasi Ringkas: Produk, Jumlah Konten, Status */}
                    <div className="text-xs text-stone-600 space-y-1.5 bg-stone-50/80 p-2.5 rounded-xl border border-stone-100">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400 text-[11px]">Produk:</span>
                        <span className="font-bold text-stone-800 truncate max-w-[140px]">{productName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400 text-[11px]">Jumlah Konten:</span>
                        <span className="font-semibold text-stone-800">{contentCount}</span>
                      </div>
                      {project.voiceOver?.audioUrl && (
                        <div className="flex items-center justify-between pt-1 border-t border-stone-200/60">
                          <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                            🎙️ Voice Over:
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                            {project.voiceOver.voiceCharacter} ({project.voiceOver.durationSeconds}s)
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-1 border-t border-stone-200/60">
                        <span className="text-stone-400 text-[11px]">Status:</span>
                        <span className="font-bold text-emerald-700">{statusLabel} ({prog.overallPercent}%)</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs text-emerald-700 font-bold group-hover:text-emerald-900">
                    <span>Lanjutkan</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Quick Modal: Buat Project Baru */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreateProject={handleCreateNewProject}
      />
    </div>
  );
};
