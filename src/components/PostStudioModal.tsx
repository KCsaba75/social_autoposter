import React, { useState, useEffect } from 'react';
import { X, Send, Eye, PenTool, Sparkles, Calendar, Clock, Layers } from 'lucide-react';
import { Platform, Post, CustomContent } from '../types';
import { PostComposer } from './PostComposer';
import { LivePreview } from './LivePreview';
import { PlatformIcon } from './PlatformIcon';
import { PLATFORM_CONFIGS } from '../lib/constants';

interface PostStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPost: Post | null;
  targetDate: Date | null;
  onSave: (
    postData: Omit<Post, 'id' | 'created_at'> & { id?: string },
    action: 'draft' | 'schedule' | 'publish'
  ) => void;
  onDeletePost?: (post: Post) => void;
  currentPlatforms: Platform[];
  setCurrentPlatforms: (platforms: Platform[]) => void;
  currentText: string;
  setCurrentText: (text: string) => void;
  currentMedia: string[];
  setCurrentMedia: (media: string[]) => void;
  currentCustomContent: CustomContent;
  setCurrentCustomContent: (content: CustomContent) => void;
  currentScheduledAt: string;
  setCurrentScheduledAt: (date: string) => void;
}

export const PostStudioModal: React.FC<PostStudioModalProps> = ({
  isOpen,
  onClose,
  initialPost,
  targetDate,
  onSave,
  onDeletePost,
  currentPlatforms,
  setCurrentPlatforms,
  currentText,
  setCurrentText,
  currentMedia,
  setCurrentMedia,
  currentCustomContent,
  setCurrentCustomContent,
  currentScheduledAt,
  setCurrentScheduledAt,
}) => {
  // Mobile / tablet switcher (on large screens both are visible side-by-side)
  const [mobileActiveTab, setMobileActiveTab] = useState<'composer' | 'preview'>('composer');

  // Listen to Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activePlatform: Platform = currentPlatforms[0] || 'instagram';
  const platformConfig = PLATFORM_CONFIGS[activePlatform];

  const formattedDate = currentScheduledAt
    ? new Date(currentScheduledAt).toLocaleString('hu-HU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 lg:p-6 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Modal Dialog Container */}
      <div className="relative w-full max-w-[1560px] h-[95vh] max-h-[960px] bg-[#0c1017] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden flex flex-col select-none ring-1 ring-white/[0.05]">
        {/* Modal Top Navigation Bar */}
        <div className="h-14 bg-[#0e131d] border-b border-white/[0.08] px-4 sm:px-6 flex items-center justify-between shrink-0">
          {/* Left: Title, Active Platform badge & Target Date */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Send className="w-4 h-4 -rotate-12 translate-x-0.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white">
                  {initialPost ? 'Poszt Módosítása' : 'Új Poszt Ütemezése'}
                </h2>
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-xs">
                  <PlatformIcon platform={activePlatform} size="sm" />
                  <span className="capitalize text-slate-200 font-medium">
                    {platformConfig.name}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-emerald-400" />
                <span>Időzítve: {formattedDate || 'Azonnali'}</span>
              </p>
            </div>
          </div>

          {/* Center: Mobile View Switcher (Visible only on < lg) */}
          <div className="lg:hidden flex items-center bg-[#121620] p-0.5 rounded-lg border border-white/[0.08] text-xs">
            <button
              onClick={() => setMobileActiveTab('composer')}
              className={`px-3 py-1 rounded-md font-medium flex items-center gap-1.5 transition-all ${
                mobileActiveTab === 'composer'
                  ? 'bg-white/[0.14] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <PenTool className="w-3 h-3 text-emerald-400" />
              <span>Szerkesztő</span>
            </button>
            <button
              onClick={() => setMobileActiveTab('preview')}
              className={`px-3 py-1 rounded-md font-medium flex items-center gap-1.5 transition-all ${
                mobileActiveTab === 'preview'
                  ? 'bg-white/[0.14] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3 h-3 text-blue-400" />
              <span>Élő Előnézet</span>
            </button>
          </div>

          {/* Center Info on Desktop */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-[#121620] border border-white/[0.06] text-xs text-slate-400 font-mono">
            <span className="text-emerald-400 font-semibold">Bal oldal:</span>
            <span>Szerkesztő & beállítások</span>
            <span className="text-white/[0.2]">•</span>
            <span className="text-blue-400 font-semibold">Jobb oldal:</span>
            <span>Valós idejű élő előnézet</span>
          </div>

          {/* Right: Close Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              title="Bezárás (Esc)"
              id="close-composer-modal-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body: 2 Columns on desktop (Left: Composer, Right: LivePreview) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Column: Post Composer (Szerkesztő) */}
          <div
            className={`w-full lg:w-[52%] xl:w-[50%] h-full flex flex-col border-b lg:border-b-0 lg:border-r border-white/[0.08] overflow-hidden bg-[#0d1117] ${
              mobileActiveTab === 'preview' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <PostComposer
              initialPost={initialPost}
              targetDate={targetDate}
              onSave={onSave}
              onCancelEdit={onClose}
              onDelete={onDeletePost}
              currentPlatforms={currentPlatforms}
              setCurrentPlatforms={setCurrentPlatforms}
              currentText={currentText}
              setCurrentText={setCurrentText}
              currentMedia={currentMedia}
              setCurrentMedia={setCurrentMedia}
              currentCustomContent={currentCustomContent}
              setCurrentCustomContent={setCurrentCustomContent}
              currentScheduledAt={currentScheduledAt}
              setCurrentScheduledAt={setCurrentScheduledAt}
            />
          </div>

          {/* Right Column: Live Preview (Élő nézet) */}
          <div
            className={`w-full lg:w-[48%] xl:w-[50%] h-full flex flex-col overflow-hidden bg-[#090b10] ${
              mobileActiveTab === 'composer' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <LivePreview
              platforms={currentPlatforms}
              baseText={currentText}
              mediaUrls={currentMedia}
              customContent={currentCustomContent}
              scheduledAt={currentScheduledAt}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
