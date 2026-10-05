import React, { useState } from 'react';
import { 
  FolderKanban, 
  Plus, 
  Trash2, 
  Clapperboard, 
  Copy, 
  Check, 
  ArrowRight, 
  Search, 
  Clock, 
  FileText,
  Sparkles,
  Camera,
  Film
} from 'lucide-react';
import { ProjectItem, ActiveNavTab } from '../types';
import { calculateProjectProgress } from '../utils/projectProgress';
import { NewProjectModal } from './NewProjectModal';

interface ProjectLibraryViewProps {
  projects: ProjectItem[];
  saveProject: (project: Partial<ProjectItem> & { title: string }) => void;
  createProject?: (name: string) => ProjectItem;
  deleteProject: (id: string) => void;
  setActiveProjectId: (id: string | null) => void;
  setActiveTab: (tab: ActiveNavTab) => void;
  showToast: (msg: string) => void;
}

export const ProjectLibraryView: React.FC<ProjectLibraryViewProps> = ({
  projects,
  saveProject,
  createProject,
  deleteProject,
  setActiveProjectId,
  setActiveTab,
  showToast,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  const filteredProjects = projects.filter((p) => {
    if (!p) return false;
    const matchCategory = filterCategory === 'all' || p.category === filterCategory;
    const nameStr = (p.name || p.title || '').toLowerCase();
    const descStr = (p.description || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return matchCategory && (nameStr.includes(query) || descStr.includes(query));
  });

  const handleOpenProjectInStudio = (id: string) => {
    setActiveProjectId(id);
    setActiveTab('studio');
    showToast('Project dimuat di Studio');
  };

  const handleCreateNewProject = (name: string) => {
    if (createProject) {
      createProject(name);
    } else {
      saveProject({
        title: name,
        name: name,
        description: 'Project baru dimulai dari Project Saya.',
        category: 'video',
        status: 'draft',
        currentStage: 'idea',
        tags: ['Baru'],
      });
    }
    setActiveTab('studio');
  };

  const handleCopyScript = (id: string, script?: string) => {
    if (!script) {
      showToast('Belum ada naskah di project ini');
      return;
    }
    navigator.clipboard.writeText(script);
    setCopiedId(id);
    showToast('Naskah project disalin!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusLabel = (status: ProjectItem['status']) => {
    switch (status) {
      case 'ready':
        return { text: 'Siap Produksi', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
      case 'in_progress':
        return { text: 'Sedang Dikerjakan', color: 'text-amber-700 bg-amber-50 border-amber-200' };
      case 'completed':
        return { text: 'Selesai', color: 'text-blue-700 bg-blue-50 border-blue-200' };
      default:
        return { text: 'Draf', color: 'text-stone-600 bg-stone-100 border-stone-200' };
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header Project Saya */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/90 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <FolderKanban className="w-5 h-5 text-emerald-700" />
            </span>
            <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight font-serif">
              Project Saya
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Wadah utama seluruh proses pembuatan konten: Ide, Naskah, Storyboard, Shot List, Visual, dan Video.
          </p>
        </div>

        <button
          onClick={() => setIsNewProjectModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer hover:scale-[1.02] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Buat Project Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-stone-100 rounded-xl text-xs">
          {[
            { id: 'all', label: 'Semua Project' },
            { id: 'video', label: 'Video & Storyboard' },
            { id: 'campaign', label: 'Promosi & Bisnis' },
            { id: 'story', label: 'Naskah Cerita' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filterCategory === cat.id
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Cari nama project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
          />
        </div>
      </div>

      {/* Project Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-stone-300 rounded-2xl p-8">
          <FolderKanban className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h3 className="font-bold text-stone-700 text-sm">Belum ada project</h3>
          <p className="text-xs text-stone-400 mt-1 mb-4">
            Mulai karya barumu sekarang dengan membuat project pertama.
          </p>
          <button
            onClick={() => setIsNewProjectModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Buat Project Baru</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => {
            const statusBadge = getStatusLabel(project.status);
            const progress = calculateProjectProgress(project);

            return (
              <div
                key={project.id}
                className="bg-white border border-stone-200/90 hover:border-emerald-500 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  {/* Status & Category & Character */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${statusBadge.color}`}>
                        {statusBadge.text}
                      </span>
                      {(() => {
                        const firstChar = project.characters && project.characters.length > 0 ? project.characters[0] : null;
                        const charName = project.characterName || (typeof firstChar === 'string' ? firstChar : firstChar?.name) || null;
                        if (!charName) return null;
                        const charImg = typeof firstChar === 'object' && firstChar !== null ? (firstChar.imageUrl || (firstChar as any).imageReference) : undefined;

                        return (
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md inline-flex items-center gap-1.5">
                            {charImg ? (
                              <img src={charImg} alt={charName} className="w-3.5 h-3.5 rounded-full object-cover shrink-0" />
                            ) : (
                              <span>👤</span>
                            )}
                            <span className="truncate max-w-[120px]">{charName}</span>
                          </span>
                        );
                      })()}
                    </div>
                    <span className="text-[11px] text-stone-400 flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      <span>{project.updatedAt}</span>
                    </span>
                  </div>

                  {/* Project Title */}
                  <div>
                    <h3 className="font-extrabold text-stone-900 text-base group-hover:text-emerald-900 transition-colors line-clamp-1">
                      {project.name || project.title}
                    </h3>
                    <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  </div>

                  {/* Real Computed Progress Indicators (UX Requirement F) */}
                  <div className="bg-stone-50/80 rounded-xl p-3 border border-stone-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                        Progress Project
                      </span>
                      <span className="text-[11px] font-mono font-bold text-emerald-700">
                        {progress.overallPercent}%
                      </span>
                    </div>

                    {/* Progress Badges: VISUAL, MOTION, VIDEO */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className={`px-2 py-0.5 rounded-md font-bold ${
                        progress.visualImagesCount >= progress.totalShotsCount
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : progress.visualImagesCount > 0
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-stone-200/70 text-stone-500'
                      }`}>
                        Visual {progress.visualImagesCount}/{progress.totalShotsCount}
                      </span>

                      <span className={`px-2 py-0.5 rounded-md font-bold ${
                        progress.motionCount >= progress.totalShotsCount
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : progress.motionCount > 0
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-stone-200/70 text-stone-500'
                      }`}>
                        Motion {progress.motionCount}/{progress.totalShotsCount}
                      </span>

                      <span className={`px-2 py-0.5 rounded-md font-bold ${
                        progress.videoReady
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-stone-200/70 text-stone-500'
                      }`}>
                        Video {progress.videoReady ? progress.totalShotsCount : 0}/{progress.totalShotsCount}
                      </span>

                      {project.videoPack && (
                        <span className="px-2 py-0.5 rounded-md font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                          <span>📦 Pack ({project.videoPack.aspectRatio || '16:9'})</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopyScript(project.id, project.script)}
                      className="p-1.5 text-stone-400 hover:text-stone-700 rounded transition-colors cursor-pointer"
                      title="Salin Naskah Project"
                    >
                      {copiedId === project.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => deleteProject(project.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                      title="Hapus Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleOpenProjectInStudio(project.id)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer hover:scale-[1.02]"
                  >
                    <span>Lanjutkan</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Modal: Buat Project Baru */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreateProject={handleCreateNewProject}
      />
    </div>
  );
};

