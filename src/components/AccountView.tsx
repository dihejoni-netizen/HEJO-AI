import React, { useState } from 'react';
import { 
  UserCircle2, 
  ExternalLink, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  FolderKanban, 
  ArrowRight,
  Info,
  RotateCcw,
  LogOut,
  Plus,
  Trash2,
  AlertTriangle,
  KeyRound,
  Check
} from 'lucide-react';
import { HejoUser, FlowGoogleAccount, GoogleFlowConnection, ActiveNavTab } from '../types';

interface AccountViewProps {
  user: HejoUser | null;
  flowAccounts: FlowGoogleAccount[];
  activeFlowAccount: FlowGoogleAccount | null;
  isOAuthConfigured: boolean;
  onSetActiveFlowAccount: (id: string) => Promise<void>;
  onRemoveFlowAccount: (id: string) => Promise<void>;
  onLogout: () => Promise<void>;
  onOpenFlowWorkspace?: () => void;
  connection?: GoogleFlowConnection;
  projectCount: number;
  setActiveTab: (tab: ActiveNavTab) => void;
  showToast: (msg: string) => void;
}

export const AccountView: React.FC<AccountViewProps> = ({
  user,
  flowAccounts,
  activeFlowAccount,
  isOAuthConfigured,
  onSetActiveFlowAccount,
  onRemoveFlowAccount,
  onLogout,
  onOpenFlowWorkspace,
  connection,
  projectCount,
  setActiveTab,
  showToast,
}) => {
  const [showConfigHelp, setShowConfigHelp] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLoginWithGoogle = () => {
    if (!isOAuthConfigured) {
      setShowConfigHelp(true);
      showToast('Google OAuth belum dikonfigurasi. Siapkan credentials di .env.');
      return;
    }
    window.location.href = '/api/auth/google/login';
  };

  const handleLinkFlowAccount = () => {
    if (!isOAuthConfigured) {
      setShowConfigHelp(true);
      showToast('Implementasi OAuth sudah disiapkan, tetapi pengujian login nyata membutuhkan Google OAuth credentials.');
      return;
    }
    window.location.href = '/api/auth/google/link-flow';
  };

  const handleOpenFlow = () => {
    if (onOpenFlowWorkspace) {
      onOpenFlowWorkspace();
      return;
    }
    try {
      window.open('https://labs.google/flow', '_blank', 'noopener,noreferrer');
      const accountEmail = activeFlowAccount?.email || connection?.googleEmail || 'Google Anda';
      showToast(`Membuka Flow AI untuk akun: ${accountEmail}...`);
    } catch {
      showToast('Gagal membuka tab baru. Silakan izinkan pop-up browser.');
    }
  };

  const handleResetChat = () => {
    try {
      localStorage.removeItem('hejo_chat_messages');
      showToast('Riwayat chat berhasil dibersihkan.');
      setTimeout(() => window.location.reload(), 500);
    } catch {
      showToast('Gagal membersihkan cache chat.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Title */}
      <div className="text-center pt-2 sm:pt-4">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
          Akun & Layanan Ekosistem
        </h1>
        <p className="mt-1.5 text-stone-500 text-xs sm:text-sm">
          Kelola identitas HEJO AI dan koneksi multi-akun Google untuk Flow AI.
        </p>
      </div>

      {/* Notice if OAuth not yet configured */}
      {!isOAuthConfigured && (
        <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 sm:p-5 text-xs text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Konfigurasi Google OAuth Server</span>
          </div>
          <p className="leading-relaxed">
            Implementasi OAuth server-side sudah disiapkan dengan aman (CSRF protection, secure session cookies, token isolation). Namun, pengujian login nyata membutuhkan <strong>Google OAuth credentials</strong> di file <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-[11px]">.env</code> server.
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowConfigHelp(!showConfigHelp)}
              className="text-amber-800 font-bold underline hover:text-amber-950 cursor-pointer"
            >
              {showConfigHelp ? 'Sembunyikan panduan konfigurasi' : 'Lihat variabel yang diperlukan (.env)'}
            </button>
          </div>

          {showConfigHelp && (
            <div className="mt-2 p-3 bg-white/90 border border-amber-200 rounded-xl font-mono text-[11px] text-stone-800 space-y-1">
              <p className="font-bold text-stone-900 font-sans mb-1">Tambahkan di file .env:</p>
              <p>GOOGLE_CLIENT_ID=&quot;your_google_client_id.apps.googleusercontent.com&quot;</p>
              <p>GOOGLE_CLIENT_SECRET=&quot;your_google_client_secret&quot;</p>
              <p>GOOGLE_OAUTH_REDIRECT_URI=&quot;http://localhost:3000/api/auth/google/callback&quot;</p>
              <p>SESSION_SECRET=&quot;your_random_secret_key&quot;</p>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* A. IDENTITAS PENGGUNA HEJO (Requirement A) */}
      {/* ======================================================== */}
      <div className="bg-white border border-stone-200/90 rounded-3xl p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <UserCircle2 className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
              AKUN HEJO
            </h2>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
            user ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-100 text-stone-600'
          }`}>
            {user ? 'Terotentikasi' : 'Belum Masuk'}
          </span>
        </div>

        {!user ? (
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-stone-900">
                Masuk dengan Google
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Gunakan akun Google milikmu untuk menyimpan seluruh project dan mengelola akun Flow secara aman tanpa menyimpan password di HEJO.
              </p>
            </div>

            <div>
              <button
                type="button"
                onClick={handleLoginWithGoogle}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3 bg-white hover:bg-stone-50 text-stone-800 border-2 border-stone-300 hover:border-emerald-600 font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer hover:scale-[1.01]"
              >
                {/* Google Colorful G Icon */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Masuk dengan Google</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-3.5">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-emerald-300 shadow-xs"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-lg border border-emerald-300">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="font-extrabold text-stone-900 text-base">
                  {user.name}
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 font-mono">
                  {user.email}
                </p>
                <span className="text-[10px] text-stone-400">
                  ID HEJO: {user.id.slice(0, 10)}...
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-rose-700 border border-stone-200 hover:border-rose-200 text-xs font-bold rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* B & C. AKUN FLOW (Multi-Account & Flow Priority) */}
      {/* ======================================================== */}
      <div className="bg-white border border-stone-200/90 rounded-3xl p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
                  AKUN FLOW
                </h2>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/70">
                  Prioritas Video
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Hubungkan akun Google yang kamu gunakan untuk Flow. HEJO tidak meminta atau menyimpan password Google.
              </p>
            </div>
          </div>
        </div>

        {/* List of Connected Flow Accounts */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Akun Flow yang terhubung
          </h3>

          {flowAccounts.length === 0 ? (
            <div className="p-4 bg-stone-50 border border-dashed border-stone-300 rounded-2xl text-center space-y-2">
              <p className="text-xs sm:text-sm text-stone-600">
                Belum ada akun Google Flow yang terhubung.
              </p>
              <p className="text-[11px] text-stone-400">
                Kamu bisa menghubungkan satu atau lebih akun Google untuk produksi video Flow.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {flowAccounts.map((acc) => {
                const isActive = Boolean(activeFlowAccount && acc.id === activeFlowAccount.id);

                return (
                  <div
                    key={acc.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-emerald-50/80 border-emerald-300 shadow-2xs'
                        : 'bg-white border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base shrink-0">
                        {isActive ? '🟢' : '⚪'}
                      </span>
                      {acc.picture ? (
                        <img
                          src={acc.picture}
                          alt={acc.name}
                          className="w-8 h-8 rounded-full object-cover border border-stone-200 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-stone-200 text-stone-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {acc.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-stone-900 truncate">
                            {acc.email}
                          </span>
                          {isActive && (
                            <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-extrabold rounded-md shadow-2xs shrink-0">
                              Aktif
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500 truncate">
                          {acc.name} · Terhubung {acc.linkedAt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-3 py-1.5 rounded-xl border border-emerald-300">
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Akun Aktif</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSetActiveFlowAccount(acc.id)}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 border border-stone-200 hover:border-emerald-300 text-stone-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          Gunakan
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onRemoveFlowAccount(acc.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus koneksi akun ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Button: + Tambah Akun Google */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleLinkFlowAccount}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer hover:scale-[1.01]"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Akun Google</span>
            </button>

            {activeFlowAccount && (
              <button
                type="button"
                onClick={handleOpenFlow}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
              >
                <span>🚀 Buka Flow</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Security & Ownership Pledge (Requirement D & F) */}
        <div className="p-4 bg-stone-50 border border-stone-100 rounded-2xl space-y-1.5 text-xs text-stone-600">
          <div className="flex items-center gap-2 font-bold text-stone-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Keamanan OAuth Google & Akun Mandiri</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            HEJO menggunakan Google OAuth resmi dengan izin minimal (OpenID Connect: profil & email). HEJO tidak pernah meminta atau menyimpan password Google maupun password Flow. Video diproduksi langsung pada browser kamu dengan akun resmi milikmu sendiri.
          </p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* C. WORKSPACE & PROJECT SAYA */}
      {/* ======================================================== */}
      <div className="bg-white border border-stone-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FolderKanban className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-stone-900 text-sm sm:text-base">
              Workspace & Project Saya
            </h3>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            {projectCount} Project Tersimpan
          </span>
        </div>

        <p className="text-xs text-stone-500 leading-relaxed">
          Semua karya yang kamu simpan dari obrolan dengan HEJO tersimpan aman di browser dan dapat dilanjutkan kapan saja.
        </p>

        <div className="pt-1">
          <button
            type="button"
            onClick={() => setActiveTab('projects')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            <span>Buka Daftar Project</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* D. PEMBERSIHAN CACHE CHAT */}
      {/* ======================================================== */}
      <div className="bg-white border border-stone-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
        <h3 className="font-bold text-stone-900 text-sm">
          Mulai Ulang Percakapan
        </h3>
        <p className="text-xs text-stone-500 leading-relaxed">
          Jika kamu ingin memulai sesi percakapan baru dari awal dan mengosongkan riwayat obrolan di halaman Buat:
        </p>
        <button
          type="button"
          onClick={handleResetChat}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-700 text-xs font-semibold rounded-xl border border-stone-200 hover:border-rose-200 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Bersihkan Riwayat Chat</span>
        </button>
      </div>

      {/* Footer Branding */}
      <div className="text-center text-xs text-stone-400 pt-2 space-y-1">
        <p className="font-bold text-stone-600">HEJO AI — AI Creative Assistant</p>
        <p>Simple outside, powerful inside · Versi 1.2</p>
      </div>
    </div>
  );
};
