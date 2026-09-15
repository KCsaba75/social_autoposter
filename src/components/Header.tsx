import React from 'react';
import {
  Calendar as CalendarIcon,
  ListFilter,
  Plus,
  Database,
  Layers,
  Send,
  CheckCircle2,
  Clock,
  FileText,
  PanelRightClose,
  PanelRightOpen,
  Search,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  SlidersHorizontal,
} from 'lucide-react';
import { Post } from '../types';

interface HeaderProps {
  posts: Post[];
  activeView: 'calendar' | 'list';
  setActiveView: (view: 'calendar' | 'list') => void;
  calendarViewMode: 'month' | 'week';
  setCalendarViewMode: (mode: 'month' | 'week') => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onNewPost: () => void;
  onOpenSupabaseModal: () => void;
  isMockMode: boolean;
  isRightPanelOpen: boolean;
  setIsRightPanelOpen: (open: boolean) => void;
  isComposerOpenMobile: boolean;
  setIsComposerOpenMobile: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  posts,
  activeView,
  setActiveView,
  calendarViewMode,
  setCalendarViewMode,
  selectedDate,
  setSelectedDate,
  searchQuery,
  setSearchQuery,
  onNewPost,
  onOpenSupabaseModal,
  isMockMode,
  isRightPanelOpen,
  setIsRightPanelOpen,
  isComposerOpenMobile,
  setIsComposerOpenMobile,
}) => {
  const scheduledCount = posts.filter((p) => p.status === 'scheduled').length;
  const publishedCount = posts.filter((p) => p.status === 'published').length;
  const draftCount = posts.filter((p) => p.status === 'draft').length;

  const handlePrev = () => {
    const next = new Date(selectedDate);
    if (calendarViewMode === 'month') {
      next.setMonth(next.getMonth() - 1);
    } else {
      next.setDate(next.getDate() - 7);
    }
    setSelectedDate(next);
  };

  const handleNext = () => {
    const next = new Date(selectedDate);
    if (calendarViewMode === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else {
      next.setDate(next.getDate() + 7);
    }
    setSelectedDate(next);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const formattedDateTitle = selectedDate.toLocaleString('hu-HU', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="h-14 w-full bg-[#0d1117] border-b border-white/[0.08] px-3.5 flex items-center justify-between gap-3 shrink-0 z-30 select-none">
      {/* Left: Brand & Workspace */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Send className="w-4 h-4 -rotate-12 translate-x-0.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-bold text-sm text-white tracking-tight">PostPulse</span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-400 border border-white/[0.06]">
                Studio
              </span>
            </div>
          </div>
        </div>

        <div className="hidden md:block h-4 w-px bg-white/[0.08]" />

        {/* Date Navigator in Header */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrev}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Előző"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className="px-2 py-0.5 rounded text-xs font-mono text-slate-300 hover:text-white hover:bg-white/[0.06] border border-white/[0.06] transition-colors"
          >
            Ma
          </button>
          <button
            onClick={handleNext}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Következő"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="text-xs font-medium text-slate-200 capitalize font-mono ml-1 hidden sm:inline">
            {formattedDateTitle}
          </span>
        </div>
      </div>

      {/* Center: Search & View Switcher */}
      <div className="flex items-center gap-2 flex-1 max-w-md justify-center">
        {/* Search */}
        <div className="relative w-full max-w-xs hidden lg:block">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Keresés tartalomban..."
            className="w-full bg-[#121620] border border-white/[0.06] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white"
            >
              ×
            </button>
          )}
        </div>

        {/* View mode switcher */}
        <div className="flex items-center bg-[#121620] p-0.5 rounded-lg border border-white/[0.06] text-xs">
          <button
            onClick={() => {
              setActiveView('calendar');
              setCalendarViewMode('month');
            }}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              activeView === 'calendar' && calendarViewMode === 'month'
                ? 'bg-white/[0.12] text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hónap
          </button>
          <button
            onClick={() => {
              setActiveView('calendar');
              setCalendarViewMode('week');
            }}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              activeView === 'calendar' && calendarViewMode === 'week'
                ? 'bg-white/[0.12] text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hét
          </button>
          <button
            onClick={() => setActiveView('list')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              activeView === 'list'
                ? 'bg-white/[0.12] text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Lista
          </button>
        </div>
      </div>

      {/* Right: Quick Stats, Panel Toggle & Primary CTA */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Quick Stats Pill */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 bg-[#121620] rounded-lg border border-white/[0.06] text-xs font-mono">
          <span className="text-emerald-400 font-semibold">{scheduledCount}</span>
          <span className="text-slate-500">időzítve</span>
          <span className="text-white/[0.1]">•</span>
          <span className="text-blue-400 font-semibold">{publishedCount}</span>
          <span className="text-slate-500">kész</span>
        </div>

        {/* Right Studio Panel Expand/Collapse Toggle */}
        <button
          onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
          className={`p-1.5 rounded-lg border transition-all ${
            isRightPanelOpen
              ? 'bg-white/[0.08] text-white border-white/[0.1]'
              : 'text-slate-400 hover:text-white border-white/[0.06] hover:bg-white/[0.04]'
          }`}
          title={isRightPanelOpen ? 'Oldalpanel elrejtése (Teljes képernyős naptár)' : 'Oldalpanel megjelenítése'}
          id="toggle-right-panel-btn"
        >
          {isRightPanelOpen ? (
            <PanelRightClose className="w-4 h-4 text-emerald-400" />
          ) : (
            <PanelRightOpen className="w-4 h-4" />
          )}
        </button>

        {/* Primary Action Button */}
        <button
          onClick={onNewPost}
          className="h-8 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
          id="header-new-post-btn"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Új Poszt</span>
        </button>
      </div>
    </header>
  );
};
