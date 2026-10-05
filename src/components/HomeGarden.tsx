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
import { ActiveNavTab, ChatMessage, ProjectItem, UserMode, CreatorContext } from '../types';
import { sendChatMessage } from '../services/aiService';
import { calculateProjectProgress } from '../utils/projectProgress';
import { NewProjectModal } from './NewProjectModal';

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
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
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
  ];

  const handleActionClick = (action: string) => {
    if (isSubmittingRef.current || isLoading) return;

    if (action.includes('Karakter') && (action.includes('Buka') || action.includes('DNA') || action.includes('Saya'))) {
      setActiveTab('characters');
      return;
    }
    if (action.includes('Studio') && (action.includes('Buka') || action.includes('Rinci'))) {
      setActiveTab('studio');
      return;
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

  return (
    <div className="space-y-12 pb-16">
      {/* 1. BAGIAN UTAMA BERANDA */}
      <section className="text-center pt-4 sm:pt-8 max-w-3xl mx-auto px-4">
        {/* Subtle decorative leaf badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/70 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Taman Kreator · Canggih di belakang, sederhana di depan</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-stone-900 tracking-tight font-serif">
          HEJO AI
        </h1>
        <p className="mt-1 text-lg sm:text-xl font-bold text-emerald-700">
          “Bikin Konten Jadi Mudah”
        </p>
        
        <p className="mt-3 text-stone-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Ceritakan saja apa yang ingin kamu buat. HEJO akan membantu dari ide sampai menjadi karya.
        </p>

        {/* Kotak Percakapan Utama yang Besar dan Mudah Digunakan */}
        <div className="mt-7 text-left">
          <div className="bg-white border-2 border-emerald-500/50 focus-within:border-emerald-600 rounded-3xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ceritakan apa yang ingin kamu buat..."
                rows={3}
                className="w-full text-stone-800 placeholder-stone-400 bg-transparent resize-none focus:outline-none text-base sm:text-lg leading-relaxed pr-10"
              />
              {isListening && (
                <div className="absolute top-0 right-0 flex items-center gap-1 text-xs text-rose-600 font-medium bg-rose-50 px-2.5 py-1 rounded-full animate-pulse border border-rose-200">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span>Mendengarkan...</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
              {/* Tombol 🎤 Bicara */}
              <button
                type="button"
                onClick={toggleListening}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white shadow-sm ring-2 ring-rose-300'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
                title="Bicara dengan Mikrofon"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-600" />}
                <span>{isListening ? 'Selesai Bicara' : '🎤 Bicara'}</span>
              </button>

              {/* Tombol ✨ Buatkan */}
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isLoading}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-200 disabled:text-stone-400 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-emerald-700/20 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Membuatkan...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                    <span>✨ Buatkan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 2. PILIHAN CEPAT (Di bawah kotak percakapan) */}
        <div className="mt-5">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2.5 text-left">
            Pilihan Cepat:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-left">
            {quickChoices.map((choice) => (
              <button
                key={choice.id}
                onClick={choice.action}
                className="p-3 bg-white border border-stone-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/40 hover:shadow-xs transition-all flex items-center gap-2.5 group cursor-pointer"
              >
                <span className="text-xl group-hover:scale-110 transition-transform">
                  {choice.icon}
                </span>
                <span className="font-semibold text-xs sm:text-sm text-stone-800 group-hover:text-emerald-800">
                  {choice.label}
                </span>
              </button>
            ))}
          </div>

          {/* 3. “SAYA BELUM TAHU” */}
          <div className="mt-3">
            <button
              onClick={() => handleSendMessage('🤷 Saya belum tahu mau membuat apa')}
              className="w-full p-3 bg-gradient-to-r from-amber-50 to-emerald-50/60 border border-amber-200/80 hover:border-emerald-500 rounded-xl transition-all flex items-center justify-between group text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl group-hover:scale-110 transition-transform">
                  🤷
                </span>
                <div>
                  <span className="font-bold text-xs sm:text-sm text-stone-900 group-hover:text-emerald-900">
                    Saya belum tahu mau membuat apa
                  </span>
                  <p className="text-[11px] text-stone-500">
                    Tidak masalah! HEJO akan bertanya ramah untuk membantumu menemukan ide.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-700 opacity-80 group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </div>
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
            {chatMessages.map((msg) => {
              const isHejo = msg.sender === 'hejo';
              return (
                <div
                  key={msg.id}
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

                    {/* Attached Structured Draft Preview (Creator Engine Pipeline) */}
                    {msg.attachedDraft && (
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
            <div ref={chatBottomRef} />
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

              return (
                <div
                  key={project.id}
                  onClick={() => handleOpenExistingProject(project)}
                  className="p-4 bg-white border border-stone-200 rounded-2xl hover:border-emerald-500 hover:shadow-sm transition-all text-left group cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1.5">
                      <span className="font-semibold text-emerald-700 uppercase tracking-wider text-[10px]">
                        {project.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{project.updatedAt}</span>
                      </span>
                    </div>
                    <h3 className="font-bold text-stone-900 text-sm group-hover:text-emerald-800 transition-colors line-clamp-1">
                      {project.name || project.title}
                    </h3>
                    <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>

                    {/* Progress chips */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className={`px-1.5 py-0.5 rounded font-bold ${
                        prog.visualImagesCount >= prog.totalShotsCount
                          ? 'bg-emerald-100 text-emerald-900'
                          : prog.visualImagesCount > 0
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-stone-100 text-stone-500'
                      }`}>
                        Visual {prog.visualImagesCount}/{prog.totalShotsCount}
                      </span>

                      <span className="px-1.5 py-0.5 rounded font-bold bg-stone-100 text-stone-600">
                        Motion {prog.motionCount}/{prog.totalShotsCount}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-[11px] text-emerald-700 font-bold group-hover:text-emerald-900">
                    <span>Lanjutkan Project</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
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
