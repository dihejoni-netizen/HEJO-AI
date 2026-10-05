import React from 'react';
import { Sparkles, Check, ArrowRight, RefreshCw, Film, Package } from 'lucide-react';
import { UserMode } from '../types';

interface SimpleWorkflowProgressProps {
  isAutoPipelineRunning: boolean;
  hasIdeas: boolean;
  hasScript: boolean;
  hasStoryboard: boolean;
  hasShotList: boolean;
  imagesCompletedCount: number;
  totalShotsCount: number;
  isGeneratingAllImages: boolean;
  visualProgressText?: string | null;
  pipelineStage: string;
  onGenerateAllVisuals: () => void;
  onProceedToVideo: () => void;
  onOpenVideoPack?: () => void;
  userMode: UserMode;
}

export const SimpleWorkflowProgress: React.FC<SimpleWorkflowProgressProps> = ({
  isAutoPipelineRunning,
  hasIdeas,
  hasScript,
  hasStoryboard,
  hasShotList,
  imagesCompletedCount,
  totalShotsCount,
  isGeneratingAllImages,
  visualProgressText,
  pipelineStage,
  onGenerateAllVisuals,
  onProceedToVideo,
  onOpenVideoPack,
  userMode,
}) => {
  // Determine statuses for the 9 progress items (Requirement 2)
  const allVisualsDone = totalShotsCount > 0 && imagesCompletedCount >= totalShotsCount;
  const isVideoStage = pipelineStage === 'videoproduction';

  // Overall status: "Sedang menyiapkan..." | "Siap dilanjutkan" | "Selesai"
  let overallStatusText = 'Siap dilanjutkan';
  let overallStatusBadgeClass = 'bg-emerald-100 text-emerald-900 border-emerald-300';

  if (isAutoPipelineRunning || isGeneratingAllImages) {
    overallStatusText = 'Sedang menyiapkan...';
    overallStatusBadgeClass = 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse';
  } else if (allVisualsDone && isVideoStage) {
    overallStatusText = 'Selesai';
    overallStatusBadgeClass = 'bg-teal-100 text-teal-900 border-teal-300';
  }

  // 9 items defined by Requirement 2
  const progressItems = [
    {
      id: 'ide',
      label: 'Ide',
      done: hasIdeas,
      inProgress: isAutoPipelineRunning && !hasIdeas,
    },
    {
      id: 'naskah',
      label: 'Naskah & Narasi',
      done: hasScript,
      inProgress: isAutoPipelineRunning && hasIdeas && !hasScript,
    },
    {
      id: 'storyboard',
      label: 'Storyboard',
      done: hasStoryboard,
      inProgress: isAutoPipelineRunning && hasScript && !hasStoryboard,
    },
    {
      id: 'prompt_gambar',
      label: 'Prompt Gambar',
      done: hasShotList,
      inProgress: isAutoPipelineRunning && hasStoryboard && !hasShotList,
    },
    {
      id: 'prompt_video',
      label: 'Prompt Video',
      done: hasShotList,
      inProgress: isAutoPipelineRunning && hasStoryboard && !hasShotList,
    },
    {
      id: 'prompt_narasi',
      label: 'Prompt Narasi',
      done: hasScript && hasStoryboard,
      inProgress: isAutoPipelineRunning && hasStoryboard && !hasShotList,
    },
    {
      id: 'visual',
      label: 'Membuat Visual',
      done: allVisualsDone,
      inProgress: isGeneratingAllImages,
      progressInfo: isGeneratingAllImages && visualProgressText ? visualProgressText : imagesCompletedCount > 0 ? `${imagesCompletedCount}/${totalShotsCount}` : undefined,
    },
    {
      id: 'motion',
      label: 'Motion',
      done: hasShotList, // Smart motion is automatically assigned to all shots (Requirement 5)
      inProgress: false,
    },
    {
      id: 'video',
      label: 'Produksi Video',
      done: isVideoStage,
      inProgress: false,
    },
  ];

  return (
    <div className="bg-white border border-stone-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header with status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
              Alur Otomatis HEJO
            </span>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${overallStatusBadgeClass}`}>
              {overallStatusText}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            HEJO menyiapkan setiap komponen secara otomatis dari ide menjadi video siap pakai.
          </p>
        </div>

        {/* Action Button: Single prominent Next Step CTA (Requirement 13) */}
        <div>
          {!allVisualsDone && !isGeneratingAllImages && (
            <button
              type="button"
              onClick={onGenerateAllVisuals}
              disabled={isAutoPipelineRunning || !hasShotList}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer hover:scale-[1.02] disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>✨ Buat Semua Visual</span>
            </button>
          )}

          {isGeneratingAllImages && (
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs sm:text-sm font-bold animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Memproses {visualProgressText || 'Visual...'}</span>
            </div>
          )}

          {allVisualsDone && !isVideoStage && (
            <button
              type="button"
              onClick={onProceedToVideo}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer hover:scale-[1.02]"
            >
              <span>Visual selesai 🎉 ▶ Lanjut ke Video</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {isVideoStage && onOpenVideoPack && (
            <button
              type="button"
              onClick={onOpenVideoPack}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-black text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer hover:scale-[1.02]"
            >
              <Package className="w-4 h-4" />
              <span>🎬 Buat Video Pack</span>
            </button>
          )}
        </div>
      </div>

      {/* 9 Sederhana Progress Items Grid (Requirement 2) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
        {progressItems.map((item) => {
          return (
            <div
              key={item.id}
              className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between transition-all ${
                item.done
                  ? 'bg-emerald-50/70 border-emerald-200/90 text-emerald-950'
                  : item.inProgress
                  ? 'bg-amber-50 border-amber-300 text-amber-950 animate-pulse'
                  : 'bg-stone-50 border-stone-200/80 text-stone-500'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  item.done
                    ? 'bg-emerald-600 text-white'
                    : item.inProgress
                    ? 'bg-amber-500 text-white'
                    : 'bg-stone-200 text-stone-600'
                }`}>
                  {item.done ? '✓' : item.inProgress ? '⏳' : '○'}
                </span>
                {item.progressInfo && (
                  <span className="text-[10px] font-extrabold text-emerald-800">
                    {item.progressInfo}
                  </span>
                )}
              </div>
              <span className={`text-[11px] font-bold truncate ${item.done ? 'text-stone-900' : 'text-stone-600'}`}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
