import React from 'react';
import { X, Sprout, CheckCircle2, Sparkles, Compass, ShieldCheck, Layers } from 'lucide-react';

interface UpdateCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpdateCenterModal: React.FC<UpdateCenterModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-stone-900">
                Tentang HEJO AI & Roadmap
              </h2>
              <p className="text-xs text-stone-500">
                Taman Kreator (Creator Workspace) V1.0
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Philosophy */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-emerald-600" />
            <span>Prinsip Inti HEJO</span>
          </h3>
          <p className="text-sm font-semibold text-stone-900">
            “Canggih di belakang, sederhana di depan.”
          </p>
          <p className="text-xs text-stone-600 leading-relaxed">
            HEJO bukan sekadar prompt generator dan bukan marketplace kredit AI. HEJO adalah ruang kerja kreatif terpadu yang membantu pengguna dari titik nol (ide mentah) sampai naskah, storyboard, dan karya utuh tanpa kerumitan teknis.
          </p>
        </div>

        {/* Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 space-y-1">
            <span className="font-bold text-stone-900 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Bahasa Manusiawi</span>
            </span>
            <p className="text-stone-500 leading-relaxed">
              Memakai kosakata "Buatkan", "Lanjut", "Simpan", "Gunakan", bukan istilah kaku komputer.
            </p>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 space-y-1">
            <span className="font-bold text-stone-900 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Kejujuran AI</span>
            </span>
            <p className="text-stone-500 leading-relaxed">
              Tidak menampilkan tombol video palsu atau status render fiktif. Seluruh arsitektur siap dihubungkan ke model generasi resmi saat tersedia.
            </p>
          </div>
        </div>

        {/* Roadmap */}
        <div className="space-y-3 pt-2 border-t border-stone-100">
          <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
            Rencana Pengembangan Bertahap
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2 text-stone-700">
              <span className="w-2 h-2 rounded-full bg-emerald-600 mt-1 shrink-0"></span>
              <div>
                <strong>Tahap 1 (Saat Ini):</strong> Fondasi UI modern, Navigasi Taman Kreator, Voice Input, Studio Storyboard & Script, Character DNA, Product DNA, Project Library, Kotak Alat Kreatif.
              </div>
            </div>

            <div className="flex items-start gap-2 text-stone-500">
              <span className="w-2 h-2 rounded-full bg-stone-300 mt-1 shrink-0"></span>
              <div>
                <strong>Tahap 2:</strong> Integrasi langsung engine visual & video resmi dari provider AI saat jalur API resmi pengguna disematkan.
              </div>
            </div>

            <div className="flex items-start gap-2 text-stone-500">
              <span className="w-2 h-2 rounded-full bg-stone-300 mt-1 shrink-0"></span>
              <div>
                <strong>Tahap 3:</strong> Kolaborasi multi-kreator, integrasi kalender posting konten, dan sinkronisasi lintas perangkat.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            Mengerti & Mulai Berkarya
          </button>
        </div>
      </div>
    </div>
  );
};
