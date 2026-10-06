import React from 'react';
import { 
  Sparkles, 
  Home, 
  Camera,
  Sprout, 
  Clapperboard, 
  UserCircle2, 
  Package, 
  FolderKanban, 
  Wrench, 
  Info,
  Menu,
  X
} from 'lucide-react';
import { ActiveNavTab, UserMode, GoogleFlowConnection } from '../types';

interface NavbarProps {
  activeTab: ActiveNavTab;
  setActiveTab: (tab: ActiveNavTab) => void;
  userMode: UserMode;
  setUserMode: (mode: UserMode) => void;
  projectCount: number;
  onOpenUpdateCenter: () => void;
  activeProjectName?: string;
  connection?: GoogleFlowConnection;
  onOpenConnectionModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  userMode,
  setUserMode,
  projectCount,
  onOpenUpdateCenter,
  activeProjectName,
  connection,
  onOpenConnectionModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Navigasi Utama Sederhana (Requirement 1): [Buat] [Project] [Akun]
  const navItems: { id: ActiveNavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Buat', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'projects', label: 'Project', icon: <FolderKanban className="w-4 h-4" /> },
    { id: 'account', label: 'Akun', icon: <UserCircle2 className="w-4 h-4" /> },
  ];

  const handleSelectTab = (tab: ActiveNavTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Brand */}
          <div 
            onClick={() => handleSelectTab('home')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Sprout className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-stone-900 group-hover:text-emerald-700 transition-colors">
                HEJO AI
              </span>
            </div>
          </div>

          {/* Navigation Links Desktop: [Buat] [Project] [Akun] */}
          <nav className="hidden sm:flex items-center gap-1.5 bg-stone-100/80 p-1 rounded-xl border border-stone-200/60">
            {navItems.map((item) => {
              const isActive = activeTab === item.id || (item.id === 'home' && (activeTab as string) === 'create');
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.id === 'projects' && projectCount > 0 && (
                    <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'
                    }`}>
                      {projectCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Flow AI Status Indicator (Pure Status - Not a Button) */}
          <div className="hidden sm:flex items-center gap-2.5">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border select-none transition-colors ${
                connection?.isConnected
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                  : 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs'
              }`}
              title={
                connection?.isConnected
                  ? `Flow AI: Terhubung (${connection.googleEmail || 'Akun Aktif'})`
                  : 'Flow AI: Belum terhubung (Kelola di menu Akun)'
              }
            >
              <span className="text-[10px]">{connection?.isConnected ? '🟢' : '🟡'}</span>
              <span className="font-extrabold text-[11px]">Flow AI</span>
              <span className="text-[10px] text-stone-400">·</span>
              <span className="text-[11px] font-medium">
                {connection?.isConnected ? 'Terhubung' : 'Belum terhubung'}
              </span>
            </div>
          </div>

          {/* Mobile menu toggle */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg"
              aria-label="Buka navigasi"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown: [Buat] [Project] [Akun] */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-stone-200 bg-white px-4 pt-2 pb-4 space-y-3">
          <div className="grid grid-cols-3 gap-1.5 bg-stone-100 p-1 rounded-xl">
            {navItems.map((item) => {
              const isActive = activeTab === item.id || (item.id === 'home' && (activeTab as string) === 'create');
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`flex flex-col items-center gap-1 py-2 text-xs font-bold rounded-lg text-center ${
                    isActive
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-stone-700'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-stone-100">
            <div
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold border select-none transition-colors ${
                connection?.isConnected
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : 'bg-amber-50 text-amber-900 border-amber-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{connection?.isConnected ? '🟢' : '🟡'}</span>
                <span>Flow AI: {connection?.isConnected ? 'Terhubung' : 'Belum terhubung'}</span>
              </div>
              <span className="text-[11px] text-stone-500 font-normal">
                {connection?.isConnected ? 'Status Aktif' : 'Status'}
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
