import React, { useState, useRef } from 'react';
import { 
  UserCircle2, 
  Plus, 
  Trash2, 
  Sparkles, 
  Edit3, 
  ArrowRight,
  X,
  Upload,
  Image as ImageIcon,
  FolderKanban,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { CharacterDNA, ActiveNavTab, ProjectItem } from '../types';

interface CharacterDNAViewProps {
  characters: CharacterDNA[];
  projects?: ProjectItem[];
  activeProject?: ProjectItem | null;
  saveCharacter: (char: Partial<CharacterDNA> & { name: string }) => void;
  deleteCharacter: (id: string) => void;
  assignCharacterToProject?: (projectId: string, char: CharacterDNA) => void;
  setActiveProjectId?: (id: string) => void;
  setActiveTab: (tab: ActiveNavTab) => void;
  showToast: (msg: string) => void;
  onUseCharacterInChat: (char: CharacterDNA) => void;
}

// Preset foto contoh untuk kemudahan pengguna jika belum punya foto sendiri
const SAMPLE_IMAGE_PRESETS = [
  {
    label: 'Pria Santai',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80',
    desc: 'Pria muda kasual'
  },
  {
    label: 'Wanita Ramah',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=500&q=80',
    desc: 'Wanita muda ceria'
  },
  {
    label: 'Pria Barista',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80',
    desc: 'Pria hangat berkacamata'
  },
  {
    label: 'Kucing Lucu',
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=500&q=80',
    desc: 'Kucing oranye menggemaskan'
  }
];

export const CharacterDNAView: React.FC<CharacterDNAViewProps> = ({
  characters,
  projects = [],
  activeProject = null,
  saveCharacter,
  deleteCharacter,
  assignCharacterToProject,
  setActiveProjectId,
  setActiveTab,
  showToast,
  onUseCharacterInChat,
}) => {
  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<CharacterDNA | null>(null);
  const [selectedCharacterForDetail, setSelectedCharacterForDetail] = useState<CharacterDNA | null>(null);
  const [characterToAssign, setCharacterToAssign] = useState<CharacterDNA | null>(null);
  const [characterToDelete, setCharacterToDelete] = useState<CharacterDNA | null>(null);

  // Form Fields (Minimal: Nama, Gambar, Deskripsi, Catatan Visual)
  const [formName, setFormName] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formVisualNotes, setFormVisualNotes] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Buka Form Tambah Karakter Baru
  const handleOpenAddForm = () => {
    setEditingCharacter(null);
    setFormName('');
    setFormImageUrl('');
    setFormDescription('');
    setFormVisualNotes('');
    setUploadError(null);
    setIsFormModalOpen(true);
  };

  // Buka Form Edit Karakter
  const handleOpenEditForm = (char: CharacterDNA, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingCharacter(char);
    setFormName(char.name || '');
    setFormImageUrl(char.imageUrl || char.imageReference || '');
    setFormDescription(char.description || char.tagline || '');
    setFormVisualNotes(char.visualNotes || char.notes || char.visualDescription || '');
    setUploadError(null);
    setIsFormModalOpen(true);
  };

  // Handle Upload Gambar Lokal (Convert ke Data URL agar persistent)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Harap pilih file gambar (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 2.5 * 1024 * 1024) {
      setUploadError('Ukuran gambar maksimal 2.5MB agar penyimpanan tetap ringan');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setFormImageUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Simpan Karakter (Form Submission)
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Nama karakter tidak boleh kosong');
      return;
    }

    const trimmedName = formName.trim();
    const finalDesc = formDescription.trim() || `${trimmedName}, karakter di HEJO AI.`;
    const finalNotes = formVisualNotes.trim();

    saveCharacter({
      id: editingCharacter ? editingCharacter.id : undefined,
      name: trimmedName,
      imageUrl: formImageUrl.trim(),
      imageReference: formImageUrl.trim(),
      description: finalDesc,
      tagline: finalDesc,
      visualNotes: finalNotes,
      notes: finalNotes,
      speakingStyle: editingCharacter?.speakingStyle || 'Santai',
    });

    setIsFormModalOpen(false);

    // Update selected detail jika sedang melihat detail karakter tersebut
    if (selectedCharacterForDetail && selectedCharacterForDetail.id === editingCharacter?.id) {
      setSelectedCharacterForDetail({
        ...selectedCharacterForDetail,
        name: trimmedName,
        imageUrl: formImageUrl.trim(),
        imageReference: formImageUrl.trim(),
        description: finalDesc,
        visualNotes: finalNotes,
        notes: finalNotes,
      });
    }
  };

  // Konfirmasi & Eksekusi Hapus Karakter
  const handleConfirmDelete = () => {
    if (!characterToDelete) return;
    deleteCharacter(characterToDelete.id);
    if (selectedCharacterForDetail?.id === characterToDelete.id) {
      setSelectedCharacterForDetail(null);
    }
    setCharacterToDelete(null);
  };

  // Gunakan di Project (Buka Modal Pilihan Project)
  const handleOpenAssignModal = (char: CharacterDNA, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCharacterToAssign(char);
  };

  // Eksekusi penugasan karakter ke project tertentu
  const handleExecuteAssignToProject = (targetProject: ProjectItem) => {
    if (!characterToAssign) return;

    if (assignCharacterToProject) {
      assignCharacterToProject(targetProject.id, characterToAssign);
    }

    if (setActiveProjectId) {
      setActiveProjectId(targetProject.id);
    }

    showToast(`Karakter "${characterToAssign.name}" dihubungkan ke project "${targetProject.title || targetProject.name}"!`);
    setCharacterToAssign(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* ========================================================
          1. HEADER MENU: KARAKTER SAYA + [+ Tambah Karakter]
          ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <UserCircle2 className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight font-serif">
              Karakter Saya
            </h1>
          </div>
          <p className="text-sm font-semibold text-emerald-700 mt-1">
            Simpan karakter yang sering kamu gunakan, panggil kembali kapan saja di Project & Studio.
          </p>
          <p className="text-xs text-stone-500 mt-0.5">
            Asset referensi visual untuk konsistensi gambar, video, dan narasi.
          </p>
        </div>

        {/* Tombol Utama: [+ Tambah Karakter] */}
        <button
          onClick={handleOpenAddForm}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Karakter</span>
        </button>
      </div>

      {/* ========================================================
          EMPTY STATE: "Belum ada karakter"
          ======================================================== */}
      {characters.length === 0 ? (
        <div className="p-12 text-center bg-white border border-dashed border-stone-300 rounded-2xl max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4">
            <UserCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-stone-900">
            Belum ada karakter
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-sm mx-auto">
            Tambahkan karakter yang sering kamu gunakan.
          </p>
          <button
            onClick={handleOpenAddForm}
            className="mt-5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Karakter</span>
          </button>
        </div>
      ) : (
        /* ========================================================
            LIST KARAKTER (Grid Sederhana & Konsisten)
            ======================================================== */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {characters.filter((char) => Boolean(char && char.id)).map((char) => {
            const charImg = char.imageUrl || char.imageReference;
            const visualNotesText = char.visualNotes || char.notes || char.visualDescription;

            return (
              <div
                key={char.id}
                onClick={() => setSelectedCharacterForDetail(char)}
                className="bg-white border border-stone-200 hover:border-emerald-500/70 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group relative"
              >
                <div>
                  {/* Foto Karakter / Thumbnail Utama (Requirement 7) */}
                  {charImg ? (
                    <div className="w-full h-44 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 mb-3.5 relative">
                      <img 
                        src={charImg} 
                        alt={char.name || 'Karakter'} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-stone-900/70 backdrop-blur-xs text-white text-[10px] font-bold">
                        Karakter
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-24 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white font-extrabold text-2xl shadow-xs mb-3.5">
                      {(char.name || 'C').charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Header Info Karakter */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                        KARAKTER
                      </span>
                      {char.updatedAt && (
                        <span className="text-[10px] text-stone-400 font-medium">
                          {char.updatedAt}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-stone-900 truncate group-hover:text-emerald-700 transition-colors">
                      {char.name}
                    </h3>
                  </div>

                  {/* Deskripsi Singkat */}
                  <div className="mb-3 bg-stone-50/80 p-3 rounded-xl border border-stone-100">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-0.5">
                      DESKRIPSI
                    </span>
                    <p className="text-xs text-stone-700 line-clamp-2 leading-relaxed">
                      {char.description || 'Belum ada deskripsi singkat.'}
                    </p>
                  </div>

                  {/* Catatan Visual */}
                  {visualNotesText && (
                    <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-100/60 mb-2">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-0.5">
                        CATATAN VISUAL
                      </span>
                      <p className="text-xs text-emerald-950 font-medium line-clamp-2 leading-relaxed">
                        {visualNotesText}
                      </p>
                    </div>
                  )}
                </div>

                {/* Quick Card Actions */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    onClick={(e) => handleOpenAssignModal(char, e)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer hover:scale-[1.02]"
                    title="Gunakan karakter ini di Project aktif atau project lain"
                  >
                    <FolderKanban className="w-3.5 h-3.5" />
                    <span>Gunakan di Project</span>
                  </button>

                  <button
                    onClick={(e) => handleOpenEditForm(char, e)}
                    className="px-2.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    title="Edit Karakter"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCharacterToDelete(char);
                    }}
                    className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Hapus Karakter"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          5. DETAIL KARAKTER MODAL
          (Gambar, Nama, Deskripsi, Catatan visual, Tombol: Gunakan di Project, Edit, Hapus)
          ======================================================== */}
      {selectedCharacterForDetail && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Top Bar */}
            <div className="bg-stone-50 px-6 py-4 border-b border-stone-200 flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                Detail Karakter
              </span>
              <button
                onClick={() => setSelectedCharacterForDetail(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                {selectedCharacterForDetail.imageUrl || selectedCharacterForDetail.imageReference ? (
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shadow-xs shrink-0">
                    <img
                      src={selectedCharacterForDetail.imageUrl || selectedCharacterForDetail.imageReference}
                      alt={selectedCharacterForDetail.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white font-extrabold text-3xl shadow-xs shrink-0">
                    {selectedCharacterForDetail.name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="text-center sm:text-left flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    NAMA KARAKTER
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
                    {selectedCharacterForDetail.name}
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Ditambahkan: {selectedCharacterForDetail.createdAt || 'Baru saja'}
                  </p>
                </div>
              </div>

              {/* Deskripsi */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                  Deskripsi Singkat
                </span>
                <p className="text-xs sm:text-sm text-stone-800 leading-relaxed">
                  {selectedCharacterForDetail.description || 'Tidak ada deskripsi singkat.'}
                </p>
              </div>

              {/* Catatan Visual */}
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                  Catatan Visual
                </span>
                <p className="text-xs sm:text-sm text-emerald-950 font-medium leading-relaxed">
                  {selectedCharacterForDetail.visualNotes || 
                   selectedCharacterForDetail.notes || 
                   selectedCharacterForDetail.visualDescription || 
                   'Belum ada catatan visual spesifik.'}
                </p>
              </div>

              {/* Actions Footer */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <button
                  onClick={() => {
                    const char = selectedCharacterForDetail;
                    setSelectedCharacterForDetail(null);
                    handleOpenAssignModal(char);
                  }}
                  className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer hover:scale-[1.02]"
                >
                  <FolderKanban className="w-4 h-4" />
                  <span>Gunakan di Project</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      const char = selectedCharacterForDetail;
                      setSelectedCharacterForDetail(null);
                      handleOpenEditForm(char);
                    }}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => {
                      const char = selectedCharacterForDetail;
                      setSelectedCharacterForDetail(null);
                      setCharacterToDelete(char);
                    }}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Hapus
                  </button>
                </div>
              </div>

              {/* Fitur Chat HEJO Tetap Dipertahankan */}
              <div className="text-center pt-2">
                <button
                  onClick={() => {
                    const char = selectedCharacterForDetail;
                    setSelectedCharacterForDetail(null);
                    onUseCharacterInChat(char);
                  }}
                  className="text-xs font-semibold text-stone-500 hover:text-emerald-700 inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Gunakan dalam Chat HEJO</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          2. FORM SEDERHANA: TAMBAH / EDIT KARAKTER
          Minimal: Nama, Gambar, Deskripsi, Catatan Visual
          ======================================================== */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-6">
            <div className="bg-stone-50 px-6 py-4 border-b border-stone-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                  {editingCharacter ? 'Edit Karakter' : 'Karakter Baru'}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-stone-900">
                  {editingCharacter ? `Edit: ${editingCharacter.name}` : 'Tambah Karakter'}
                </h2>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-4">
              {/* Field 1: Nama Karakter */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Nama Karakter <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              {/* Field 2: Gambar Referensi */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Gambar Referensi
                </label>
                
                {/* Preview jika gambar ada */}
                {formImageUrl && (
                  <div className="relative mb-2 w-20 h-20 rounded-xl overflow-hidden border border-stone-200 group">
                    <img 
                      src={formImageUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover" 
                    />
                    <button
                      type="button"
                      onClick={() => setFormImageUrl('')}
                      className="absolute inset-0 bg-stone-900/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold"
                    >
                      Hapus
                    </button>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="URL gambar (https://...) atau upload foto"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    className="flex-1 text-xs px-3.5 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Foto</span>
                  </button>
                </div>

                {uploadError && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">
                    {uploadError}
                  </p>
                )}

                {/* Preset Gambar Cepat */}
                <div className="mt-2">
                  <span className="text-[10px] font-semibold text-stone-400 block mb-1">
                    Atau gunakan contoh foto referensi:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SAMPLE_IMAGE_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormImageUrl(preset.url)}
                        className="text-[10px] font-medium px-2 py-1 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg text-stone-600 transition-colors cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Field 3: Deskripsi Singkat */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Deskripsi Singkat
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Pria Indonesia usia sekitar 25 tahun."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              {/* Field 4: Catatan Visual */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Catatan Visual
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Rambut hitam pendek, wajah ramah, tubuh sedang."
                  value={formVisualNotes}
                  onChange={(e) => setFormVisualNotes(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
                <p className="text-[10px] text-stone-400 mt-0.5">
                  Catatan ini akan menjadi panduan konsistensi saat membuat visual & video.
                </p>
              </div>

              {/* Tombol Simpan */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2.5 text-stone-600 hover:bg-stone-100 text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer hover:scale-[1.02]"
                >
                  Simpan Karakter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          6. MODAL "GUNAKAN DI PROJECT"
          Pilih project yang tersedia / gunakan di project aktif
          ======================================================== */}
      {characterToAssign && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-stone-50 px-6 py-4 border-b border-stone-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                  Hubungkan Karakter
                </span>
                <h3 className="text-base font-bold text-stone-900">
                  Gunakan "{characterToAssign.name}" di Project
                </h3>
              </div>
              <button
                onClick={() => setCharacterToAssign(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Opsi 1: Project Aktif Sekarang */}
              {activeProject && (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                      Project Aktif Saat Ini
                    </span>
                    <span className="text-[10px] bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-md font-semibold">
                      Aktif
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-emerald-950 truncate">
                    {activeProject.title || activeProject.name}
                  </h4>
                  <p className="text-xs text-emerald-800/80 mt-0.5 line-clamp-1">
                    {activeProject.description}
                  </p>
                  
                  <button
                    onClick={() => {
                      handleExecuteAssignToProject(activeProject);
                      setActiveTab('studio');
                    }}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Gunakan di Project Ini &amp; Buka Studio</span>
                  </button>
                </div>
              )}

              {/* Opsi 2: Daftar Project Lainnya */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  {activeProject ? 'Atau Pilih Project Lain:' : 'Pilih Project yang Tersedia:'}
                </label>

                {projects.length === 0 ? (
                  <div className="p-4 text-center bg-stone-50 border border-dashed border-stone-200 rounded-xl text-xs text-stone-500">
                    Belum ada project yang dibuat. Buat project baru di Studio atau Beranda.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {projects.map((proj) => {
                      const isAssigned = proj.characterDnaId === characterToAssign.id || 
                        Boolean(proj.characters?.some((c) => (typeof c === 'string' ? c === characterToAssign.id : c?.id === characterToAssign.id)));

                      return (
                        <div
                          key={proj.id}
                          className="flex items-center justify-between gap-3 p-3 bg-stone-50 hover:bg-stone-100/80 rounded-xl border border-stone-200 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <h5 className="text-xs font-bold text-stone-900 truncate">
                              {proj.title || proj.name}
                            </h5>
                            <span className="text-[10px] text-stone-400 block">
                              Diperbarui: {proj.updatedAt || 'Baru saja'}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              handleExecuteAssignToProject(proj);
                              setActiveTab('studio');
                            }}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0 ${
                              isAssigned
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                          >
                            {isAssigned ? '✓ Buka di Studio' : 'Gunakan & Buka'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tombol ke Studio */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                <button
                  onClick={() => setCharacterToAssign(null)}
                  className="text-xs text-stone-500 hover:text-stone-800 font-semibold cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    setCharacterToAssign(null);
                    setActiveTab('studio');
                  }}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Buka Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          CONFIRM DELETE MODAL
          ======================================================== */}
      {characterToDelete && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900">
              Hapus Karakter?
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Yakin ingin menghapus karakter <strong className="text-stone-800">"{characterToDelete.name}"</strong>? Karakter yang sudah dihapus tidak dapat dipulihkan.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                onClick={() => setCharacterToDelete(null)}
                className="flex-1 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
