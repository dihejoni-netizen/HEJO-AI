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
import { ActiveNavTab, UserMode } from '../types';

interface NavbarProps {
  activeTab: ActiveNavTab;
  setActiveTab: (tab: ActiveNavTab) => void;
  userMode: UserMode;
  setUserMode: (mode: UserMode) => void;
  projectCount: number;
  onOpenUpdateCenter: () => void;
  activeProjectName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  userMode,
  setUserMode,
  projectCount,
  onOpenUpdateCenter,
  activeProjectName,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems: { id: ActiveNavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Beranda', icon: <Home className="w-4 h-4" /> },
    { id: 'ideas', label: 'Ide', icon: <Sprout className="w-4 h-4" /> },
    { id: 'studio', label: 'Studio', icon: <Clapperboard className="w-4 h-4" /> },
    { id: 'motion', label: 'Motion Control', icon: <Camera className="w-4 h-4" /> },
    { id: 'characters', label: 'Karakter', icon: <UserCircle2 className="w-4 h-4" /> },
    { id: 'products', label: 'Produk', icon: <Package className="w-4 h-4" /> },
    { id: 'projects', label: 'Project Saya', icon: <FolderKanban className="w-4 h-4" /> },
    { id: 'tools', label: 'Tools', icon: <Wrench className="w-4 h-4" /> },
  ];

  const handleSelectTab = (tab: ActiveNavTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-stone-50/95 backdrop-blur-md border-b border-stone-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-stone-900 group-hover:text-emerald-700 transition-colors">
                  HEJO AI
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-widest bg-emerald-100/80 px-1.5 py-0.5 rounded">
                  Workspace
                </span>
              </div>
              <p className="text-[11px] text-stone-500 -mt-1 font-medium hidden sm:block">
                Taman Kreator Indonesia
              </p>
            </div>
          </div>

          {/* Navigation Links Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.id === 'projects' && projectCount > 0 && (
                    <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isActive ? 'bg-emerald-800 text-emerald-100' : 'bg-stone-200 text-stone-700'
                    }`}>
                      {projectCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls: User Mode + Info Modal */}
          <div className="hidden sm:flex items-center gap-3">
            {activeProjectName && (
              <button
                onClick={() => handleSelectTab('projects')}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-lg text-xs font-semibold max-w-[180px] truncate cursor-pointer transition-colors"
                title={`Project Aktif: ${activeProjectName} (Buka Project Saya)`}
              >
                <FolderKanban className="w-3.5 h-3.5 shrink-0 text-emerald-700" />
                <span className="truncate">{activeProjectName}</span>
              </button>
            )}

            {/* Mode Switcher */}
            <div className="flex items-center p-0.5 bg-stone-200/70 rounded-lg text-xs">
              {(['SIMPLE', 'CREATOR', 'PRO'] as UserMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setUserMode(mode)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                    userMode === mode
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                  title={`Mode ${mode}: ${
                    mode === 'SIMPLE' ? 'Bahasa ramah & panduan mudah' : mode === 'CREATOR' ? 'Struktur naskah & shot list' : 'Kontrol parameter narasi lengkap'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* About / Update Info */}
            <button
              onClick={onOpenUpdateCenter}
              className="p-2 text-stone-500 hover:text-emerald-700 hover:bg-stone-100 rounded-lg transition-colors"
              title="Tentang HEJO AI & Roadmap"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenUpdateCenter}
              className="p-1.5 text-stone-600 hover:text-stone-900"
            >
              <Info className="w-4 h-4" />
            </button>
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

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-stone-200 bg-stone-50 px-4 pt-2 pb-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-left ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'text-stone-700 bg-stone-100 hover:bg-stone-200'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-stone-200">
            <p className="text-[11px] font-semibold text-stone-500 mb-1.5">PILIH MODE PENGGUNA:</p>
            <div className="grid grid-cols-3 gap-1 bg-stone-200/80 p-1 rounded-lg text-xs">
              {(['SIMPLE', 'CREATOR', 'PRO'] as UserMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setUserMode(mode);
                  }}
                  className={`py-1 text-center font-semibold rounded-md ${
                    userMode === mode
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-stone-600'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
