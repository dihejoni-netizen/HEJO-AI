import React from 'react';
import { 
  X, 
  ExternalLink, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  UserCircle2, 
  Layers
} from 'lucide-react';
import { GoogleFlowConnection, FlowGoogleAccount } from '../types';

interface GoogleFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection: GoogleFlowConnection;
  activeFlowAccount?: FlowGoogleAccount | null;
  isOAuthConfigured?: boolean;
  onConnect?: (email: string) => void;
  onDisconnect?: () => void;
  onOpenAccount: () => void;
  onOpenFlowWorkspace: () => void;
  showToast: (msg: string) => void;
}

export const GoogleFlowModal: React.FC<GoogleFlowModalProps> = ({
  isOpen,
  onClose,
  connection,
  activeFlowAccount,
  isOAuthConfigured = false,
  onConnect,
  onDisconnect,
  onOpenAccount,
  onOpenFlowWorkspace,
  showToast,
}) => {
  if (!isOpen) return null;

  const activeEmail = activeFlowAccount?.email || connection?.googleEmail || null;
  const isConnected = connection.isConnected || Boolean(activeEmail);

  const handleConnectGoogle = () => {
    onClose();
    if (isOAuthConfigured) {
      window.location.href = '/api/auth/google/link-flow';
    } else {
      onOpenAccount();
      showToast('Buka menu Akun untuk menghubungkan akun Google.');
    }
  };

  const handleOpenFlow = () => {
    onClose();
    onOpenFlowWorkspace();
  };

  const handleManageAccount = () => {
    onClose();
    onOpenAccount();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200/90 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative blur */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${
              isConnected ? 'bg-emerald-600 shadow-xs' : 'bg-amber-500 shadow-xs'
            }`}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-stone-900 tracking-tight">
                {isConnected ? 'Flow AI — Terhubung' : 'Flow AI — Belum terhubung'}
              </h3>
              <p className="text-[11px] text-stone-500">
                Ekosistem Produksi Video HEJO AI
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body content based on connection status */}
        <div className="py-4 space-y-4">
          {isConnected ? (
            /* JIKA SUDAH TERHUBUNG */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-stone-800 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🟢</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                    Status: Aktif
                  </span>
                </div>
                <div className="pt-1">
                  <span className="text-xs text-stone-500 block">Akun aktif:</span>
                  <span className="font-mono font-bold text-sm text-stone-900 break-all">
                    {activeEmail}
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed pt-1 border-t border-emerald-200/60">
                  Akun Flow aktif ini digunakan sebagai konteks produksi video Anda di Google Flow.
                </p>
              </div>

              {/* Action Buttons: [Buka Flow] & [Kelola Akun] */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleOpenFlow}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs text-xs sm:text-sm transition-all cursor-pointer hover:scale-[1.01]"
                >
                  <Layers className="w-4 h-4" />
                  <span>Buka Flow</span>
                </button>

                <button
                  type="button"
                  onClick={handleManageAccount}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  <UserCircle2 className="w-3.5 h-3.5 text-stone-600" />
                  <span>Kelola Akun</span>
                </button>
              </div>
            </div>
          ) : (
            /* JIKA BELUM TERHUBUNG */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-stone-800 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🟡</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    Status: Belum Terhubung
                  </span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed pt-1">
                  Akun Google untuk Flow AI belum terhubung. Hubungkan akun Google yang kamu gunakan untuk Flow agar HEJO dapat menyesuaikan workflow dan konteks akun aktif kamu.
                </p>
              </div>

              {/* Action Buttons: [Hubungkan Google] & [Kelola Akun] */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleConnectGoogle}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs text-xs sm:text-sm transition-all cursor-pointer hover:scale-[1.01]"
                >
                  <span>Hubungkan Google</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleManageAccount}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  <UserCircle2 className="w-3.5 h-3.5 text-stone-600" />
                  <span>Kelola Akun</span>
                </button>
              </div>
            </div>
          )}

          {/* Keamanan & Transparansi */}
          <div className="p-3 bg-stone-50 border border-stone-200/70 rounded-xl space-y-1 text-[11px] text-stone-500">
            <div className="flex items-center gap-1.5 font-bold text-stone-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Keamanan Sandi Terjaga</span>
            </div>
            <p className="leading-relaxed">
              HEJO tidak pernah meminta atau menyimpan password Google Anda. Autentikasi berjalan resmi menggunakan Google OAuth.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-stone-100 text-right">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-stone-400 hover:text-stone-700 font-medium cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
