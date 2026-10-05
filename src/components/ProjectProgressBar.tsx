import React, { useState } from 'react';
import { 
  FolderKanban, 
  ChevronDown, 
  Plus, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  Layers
} from 'lucide-react';
import { ProjectItem } from '../types';
import { calculateProjectProgress } from '../utils/projectProgress';

interface ProjectProgressBarProps {
  project: ProjectItem | null;
  projects?: ProjectItem[];
  onSelectProject?: (id: string) => void;
  onOpenNewProjectModal?: () => void;
  onNavigateStage?: (stage: 'idea' | 'script' | 'storyboard' | 'shotlist' | 'videoproduction') => void;
  onNavigateTab?: (tab: any) => void;
  compact?: boolean;
}

export const ProjectProgressBar: React.FC<ProjectProgressBarProps> = ({
  project,
  projects = [],
  onSelectProject,
  onOpenNewProjectModal,
  onNavigateStage,
  onNavigateTab,
  compact = false,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const progressData = calculateProjectProgress(project);

  const handleNextAction = () => {
    if (progressData.nextAction.targetTab === 'motion' && onNavigateTab) {
      onNavigateTab('motion');
      return;
    }
    if (onNavigateStage) {
      onNavigateStage(progressData.nextAction.targetStage);
    }
  };

  const handleStageClick = (key: string) => {
    if (key === 'motion') {
      if (onNavigateTab) onNavigateTab('motion');
      return;
    }
    const stageMap: Record<string, 'idea' | 'script' | 'storyboard' | 'shotlist' | 'videoproduction'> = {
      idea: 'idea',
      script: 'script',
      storyboard: 'storyboard',
      visual: 'shotlist',
      video: 'videoproduction',
      final: 'videoproduction',
    };
    const target = stageMap[key];
    if (target && onNavigateStage) {
      onNavigateStage(target);
    }
  };

  return (
    <div className="bg-white border border-stone-200/90 rounded-2xl shadow-xs overflow-hidden transition-all">
      {/* Top Bar: Project Identity & Primary CTA */}
      <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100">
        {/* Left: Active Project Selector */}
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 shrink-0 shadow-2xs">
              <FolderKanban className="w-5 h-5 text-emerald-700" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Project Workspace
                </span>
                <span className="text-xs text-stone-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{project?.updatedAt || 'Baru saja'}</span>
                </span>
              </div>

              {/* Project Title with Dropdown Toggle */}
              <div className="flex items-center gap-2 mt-0.5">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="group inline-flex items-center gap-1.5 font-extrabold text-stone-900 hover:text-emerald-800 text-base sm:text-lg tracking-tight transition-colors cursor-pointer text-left"
                >
                  <span className="truncate max-w-[220px] sm:max-w-sm">
                    {progressData.projectName}
                  </span>
                  <ChevronDown className="w-4 h-4 text-stone-400 group-hover:text-emerald-700 transition-transform" />
                </button>

                {onOpenNewProjectModal && (
                  <button
                    type="button"
                    onClick={onOpenNewProjectModal}
                    title="Buat Project Baru"
                    className="p-1 rounded-lg text-stone-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Project Switcher Dropdown */}
          {isDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setIsDropdownOpen(false)} 
              />
              <div className="absolute left-0 top-full mt-2 w-80 max-h-72 overflow-y-auto bg-white border border-stone-200 rounded-2xl shadow-xl z-40 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between px-3 py-1.5 text-[11px] font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100 mb-1">
                  <span>Daftar Project Saya</span>
                  {onOpenNewProjectModal && (
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenNewProjectModal();
                      }}
                      className="text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Baru</span>
                    </button>
                  )}
                </div>

                {projects.filter((p) => Boolean(p && p.id)).map((p) => {
                  const isActive = p.id === project?.id;
                  const itemProgress = calculateProjectProgress(p);
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        if (onSelectProject) onSelectProject(p.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                        isActive
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-950 font-bold'
                          : 'hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs truncate font-semibold">
                          {p.name || p.title}
                        </div>
                        <div className="text-[10px] text-stone-400 mt-0.5">
                          Visual {itemProgress.visualImagesCount}/{itemProgress.totalShotsCount} · {p.updatedAt}
                        </div>
                      </div>
                      {isActive && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Right: The Single Primary CTA Button (UX Principle: "Apa langkah berikutnya?") */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <span className="text-[10px] font-semibold text-stone-400 block uppercase tracking-wider">
              Langkah Berikutnya
            </span>
            <span className="text-xs font-semibold text-stone-600 max-w-xs truncate block">
              {progressData.nextAction.description}
            </span>
          </div>

          <button
            type="button"
            onClick={handleNextAction}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer hover:scale-[1.02] shrink-0"
          >
            <span>{progressData.nextAction.label}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Bar: Sequential Progress Steps Indicator */}
      <div className="bg-stone-50/70 p-3 sm:px-5 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Progress Badges Track */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {progressData.items.map((item, idx) => {
            const isCompleted = item.status === 'completed';
            const isInProgress = item.status === 'in_progress';
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleStageClick(item.key)}
                title={`Klik untuk menuju ke tahap ${item.label}`}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 border ${
                  isCompleted
                    ? 'bg-emerald-100/90 text-emerald-900 border-emerald-300 shadow-2xs hover:bg-emerald-200'
                    : isInProgress
                    ? 'bg-amber-100/90 text-amber-950 border-amber-300 ring-2 ring-amber-400/20 shadow-2xs animate-pulse hover:bg-amber-200'
                    : 'bg-white text-stone-400 border-stone-200 hover:text-stone-700 hover:border-stone-300'
                }`}
              >
                <span>{item.badgeText}</span>
              </button>
            );
          })}
        </div>

        {/* Overall Completion Percentage */}
        <div className="flex items-center gap-2 text-xs shrink-0 self-end sm:self-auto">
          <div className="w-20 bg-stone-200 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${progressData.overallPercent}%` }}
            />
          </div>
          <span className="font-mono font-bold text-stone-600 text-[11px]">
            {progressData.overallPercent}%
          </span>
        </div>
      </div>
    </div>
  );
};
