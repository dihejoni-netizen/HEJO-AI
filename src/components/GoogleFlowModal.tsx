import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  Unlink,
  Radio
} from 'lucide-react';
import { GoogleFlowConnection } from '../types';

interface GoogleFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection: GoogleFlowConnection;
  onConnect: (email: string) => void;
  onDisconnect: () => void;
  flowUrl?: string;
  isOAuthConfigured?: boolean;
  onOpenAccount?: () => void;
  showToast: (msg: string) => void;
}

export const GoogleFlowModal: React.FC<GoogleFlowModalProps> = ({
  isOpen,
  onClose,
  connection,
  onConnect,
  onDisconnect,
  flowUrl = 'https://labs.google/flow',
  isOAuthConfigured = false,
  onOpenAccount,
  showToast,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [isInputOpen, setIsInputOpen] = useState(false);

  if (!isOpen) return null;

  const handleConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = emailInput.trim();
    if (!clean) {
      showToast('Masukkan alamat email Google Anda.');
      return;
    }
    if (!clean.includes('@')) {
      showToast('Format email tidak valid.');
      return;
    }
    onConnect(clean);
    setEmailInput('');
    setIsInputOpen(false);
  };

  const handleOpenFlow = () => {
    try {
      window.open(flowUrl, '_blank', 'noopener,noreferrer');
      showToast('Membuka Flow AI pada akun Google Anda...');
    } catch {
      showToast('Gagal membuka tab baru. Silakan izinkan pop-up browser.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-stone-200/90 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle top decoration */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <Sparkles className="w-6 h-6 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-stone-900 tracking-tight">
                  Status Ekosistem: Flow AI
                </h3>
              </div>
              <p className="text-xs text-stone-500 font-medium">
                Prioritas Google Ecosystem untuk Produksi Video
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Box */}
        <div className="py-5 space-y-4">
          {/* Status Box */}
          <div className={`p-4 rounded-2xl border transition-all ${
            connection.isConnected
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : 'bg-amber-50/80 border-amber-200 text-stone-900'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">
                  {connection.isConnected ? '🟢' : '🟡'}
                </span>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
                    Flow AI
                  </span>
                  <span className="font-extrabold text-sm sm:text-base">
                    {connection.isConnected ? 'Terhubung' : 'Belum terhubung'}
                  </span>
                </div>
              </div>

              {connection.isConnected && (
                <span className="px-2.5 py-1 bg-emerald-600 text-white text-[11px] font-bold rounded-lg shadow-2xs">
                  Aktif
                </span>
              )}
            </div>

            {/* If connected: display user's Google email */}
            {connection.isConnected && connection.googleEmail && (
              <div className="mt-3 pt-3 border-t border-emerald-200/70 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-800 font-semibold">Akun Google:</span>
                  <span className="font-mono font-bold text-emerald-950 bg-white/80 px-2 py-0.5 rounded border border-emerald-200">
                    {connection.googleEmail}
                  </span>
                </div>
                {connection.connectedAt && (
                  <p className="text-[10px] text-emerald-700 mt-1 text-right">
                    Terhubung sejak {connection.connectedAt}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons based on connection status */}
          {!connection.isConnected ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  if (isOAuthConfigured) {
                    window.location.href = '/api/auth/google/link-flow';
                  } else if (onOpenAccount) {
                    onOpenAccount();
                    onClose();
                  } else {
                    setIsInputOpen(!isInputOpen);
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-700/20 text-sm transition-all cursor-pointer hover:scale-[1.01]"
              >
                <span>Hubungkan Google</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {onOpenAccount && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenAccount();
                    onClose();
                  }}
                  className="w-full text-center text-xs text-stone-500 hover:text-emerald-700 underline pt-1 cursor-pointer"
                >
                  Buka Pengaturan Akun & Multi-Akun
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5 pt-1">
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleOpenFlow}
                  className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md shadow-emerald-700/20 text-sm transition-all cursor-pointer hover:scale-[1.01]"
                >
                  <span>Buka Flow</span>
                  <ExternalLink className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={onDisconnect}
                  className="w-full sm:w-auto px-4 py-3 bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-700 border border-stone-200 hover:border-rose-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  title="Putuskan hubungan akun Google di HEJO"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  <span>Putuskan</span>
                </button>
              </div>

              {onOpenAccount && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenAccount();
                    onClose();
                  }}
                  className="w-full text-center text-xs text-emerald-800 font-bold hover:underline pt-1 cursor-pointer"
                >
                  Kelola / Ganti Akun Flow di menu Akun →
                </button>
              )}
            </div>
          )}

          {/* Privacy & Safety Statement */}
          <div className="p-3.5 bg-stone-50 border border-stone-200/80 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-stone-700 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Prinsip Keamanan & Privasi HEJO</span>
            </div>
            <ul className="text-[11px] text-stone-600 space-y-1 list-disc list-inside leading-relaxed pl-1">
              <li>HEJO tidak pernah meminta atau menyimpan password Flow / Google Anda.</li>
              <li>Produksi video berjalan langsung di Flow menggunakan akun Google Anda sendiri.</li>
              <li>HEJO tidak mengklaim otomatisasi tanpa izin; HEJO menyiapkan materi & prompt terbaik untuk Anda eksekusi.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
          <span>HEJO AI · Partner Kreator Affiliate</span>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-600 font-semibold hover:text-stone-900 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
