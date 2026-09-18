import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Layers,
  Clock,
  CheckCircle2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Filter,
  Sliders,
  Sparkles,
  Database,
  ExternalLink,
  ChevronDown,
  Hash,
  Share2,
  Plus,
  Link2,
  Code,
} from 'lucide-react';
import { Platform, Post, PostStatus } from '../types';
import { PLATFORM_CONFIGS } from '../lib/constants';
import { PlatformIcon } from './PlatformIcon';
import { AppIcon } from './AppIcon';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  posts: Post[];
  selectedPlatform: Platform | 'all';
  setSelectedPlatform: (p: Platform | 'all') => void;
  selectedStatus: PostStatus | 'all';
  setSelectedStatus: (s: PostStatus | 'all') => void;
  currentCalendarDate: Date;
  onJumpToDate: (date: Date) => void;
  onOpenSupabaseModal: () => void;
  isMockMode: boolean;
  onNewPost?: () => void;
  onOpenSocialModal?: () => void;
  onOpenAiModal?: () => void;
  onOpenApiWebhookModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  posts,
  selectedPlatform,
  setSelectedPlatform,
  selectedStatus,
  setSelectedStatus,
  currentCalendarDate,
  onJumpToDate,
  onOpenSupabaseModal,
  isMockMode,
  onNewPost,
  onOpenSocialModal,
  onOpenAiModal,
  onOpenApiWebhookModal,
}) => {
  // Mini Calendar internal navigation
  const [miniCalMonth, setMiniCalMonth] = useState(new Date(currentCalendarDate));

  const scheduledCount = posts.filter((p) => p.status === 'scheduled').length;
  const publishedCount = posts.filter((p) => p.status === 'published').length;
  const draftCount = posts.filter((p) => p.status === 'draft').length;

  const getPlatformCount = (plat: Platform) => {
    return posts.filter((p) => p.platforms.includes(plat)).length;
  };

  // Mini calendar calculation
  const y = miniCalMonth.getFullYear();
  const m = miniCalMonth.getMonth();
  const firstDay = new Date(y, m, 1);
  const lastDay = new Date(y, m + 1, 0);
  const startDayIdx = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();

  const miniDays: { day: number; date: Date; isCurrentMonth: boolean; hasPost: boolean }[] = [];

  // Prev month padding
  const prevMonthDays = new Date(y, m, 0).getDate();
  for (let i = startDayIdx - 1; i >= 0; i--) {
    const d = new Date(y, m - 1, prevMonthDays - i);
    miniDays.push({ day: prevMonthDays - i, date: d, isCurrentMonth: false, hasPost: false });
  }

  // Current month
  for (let i = 1; i <= totalDays; i++) {
    const d = new Date(y, m, i);
    const hasPost = posts.some((p) => {
      const pDate = new Date(p.scheduled_at);
      return (
        pDate.getFullYear() === y &&
        pDate.getMonth() === m &&
        pDate.getDate() === i
      );
    });
    miniDays.push({ day: i, date: d, isCurrentMonth: true, hasPost });
  }

  // Next month padding
  const remain = (7 - (miniDays.length % 7)) % 7;
  for (let i = 1; i <= remain; i++) {
    const d = new Date(y, m + 1, i);
    miniDays.push({ day: i, date: d, isCurrentMonth: false, hasPost: false });
  }

  const isToday = (d: Date) => {
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  };

  const isSelected = (d: Date) => {
    return (
      d.getDate() === currentCalendarDate.getDate() &&
      d.getMonth() === currentCalendarDate.getMonth() &&
      d.getFullYear() === currentCalendarDate.getFullYear()
    );
  };

  const miniMonthName = miniCalMonth.toLocaleString('hu-HU', { month: 'short', year: 'numeric' });

  if (isCollapsed) {
    return (
      <aside className="w-14 shrink-0 bg-[#0d1117] border-r border-white/[0.08] flex flex-col items-center py-3.5 justify-between select-none">
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => setIsCollapsed(false)}
            className="group p-1 rounded-xl hover:ring-1 hover:ring-emerald-500/40 transition-all"
            title="PostPulse Studio - Oldalsáv kibontása"
            id="expand-sidebar-logo-btn"
          >
            <AppIcon size="sm" />
          </button>

          <button
            onClick={() => setIsCollapsed(false)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Oldalsáv kibontása"
            id="expand-sidebar-btn"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {onNewPost && (
            <button
              onClick={onNewPost}
              className="w-9 h-9 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-md shadow-emerald-500/20 transition-all active:scale-95"
              title="Új Poszt Ütemezése (+)"
              id="sidebar-collapsed-new-post-btn"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}

          {onOpenAiModal && (
            <button
              onClick={onOpenAiModal}
              className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 hover:bg-purple-600/30 text-purple-300 flex items-center justify-center transition-all"
              title="AI Poszt & Időzítés Generátor (Gemini Flash)"
              id="sidebar-collapsed-ai-btn"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
            </button>
          )}

          {onOpenApiWebhookModal && (
            <button
              onClick={onOpenApiWebhookModal}
              className="w-9 h-9 rounded-xl bg-cyan-600/20 border border-cyan-500/40 hover:bg-cyan-600/30 text-cyan-300 flex items-center justify-center transition-all"
              title="API & Webhook Ingestion (POST /api/posts)"
              id="sidebar-collapsed-api-btn"
            >
              <Code className="w-4 h-4 text-cyan-400" />
            </button>
          )}

          <div className="w-8 h-px bg-white/[0.08]" />

          {/* Quick channel icons */}
          <div className="flex flex-col gap-2">
            {(['facebook', 'instagram', 'threads', 'youtube'] as Platform[]).map((plat) => {
              const active = selectedPlatform === plat;
              return (
                <button
                  key={plat}
                  onClick={() => setSelectedPlatform(active ? 'all' : plat)}
                  className={`p-2 rounded-lg transition-all relative ${
                    active
                      ? 'bg-white/[0.12] text-white ring-1 ring-emerald-500/50'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                  title={`${PLATFORM_CONFIGS[plat].name} szűrés (${getPlatformCount(plat)})`}
                >
                  <PlatformIcon platform={plat} size="sm" />
                  {getPlatformCount(plat) > 0 && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>

          {onOpenSocialModal && (
            <button
              onClick={onOpenSocialModal}
              className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-white/[0.06] transition-colors"
              title="Social Fiókok és hitelesítő adatok csatlakoztatása"
              id="sidebar-collapsed-connect-social-btn"
            >
              <Link2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={onOpenSupabaseModal}
          className={`p-2 rounded-lg transition-colors ${
            isMockMode ? 'text-amber-400 hover:bg-amber-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'
          }`}
          title={isMockMode ? 'Mock Adatok (Kattints a beállításhoz)' : 'Supabase Csatlakoztatva'}
        >
          <Database className="w-4 h-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-64 shrink-0 bg-[#0d1117] border-r border-white/[0.08] flex flex-col justify-between select-none overflow-y-auto">
      <div className="p-3.5 space-y-4">
        {/* Workspace Brand Box */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <AppIcon size="sm" />
            <div>
              <div className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                <span>PostPulse Studio</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Workspace #01</div>
            </div>
          </div>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Oldalsáv összecsukása"
            id="collapse-sidebar-btn"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Primary New Post Trigger Button */}
        {onNewPost && (
          <button
            onClick={onNewPost}
            className="w-full h-9 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-500/15 transition-all active:scale-[0.98]"
            id="sidebar-new-post-btn"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Új Poszt Ütemezése</span>
          </button>
        )}

        {/* AI & API Webhook Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          {onOpenAiModal && (
            <button
              onClick={onOpenAiModal}
              className="h-8 px-2 rounded-lg border border-purple-500/40 bg-gradient-to-r from-purple-500/15 to-indigo-500/15 hover:from-purple-500/25 hover:to-indigo-500/25 text-purple-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              title="AI Poszt & Időzítés Generátor (Gemini Flash)"
              id="sidebar-ai-generator-btn"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>AI Posztok</span>
            </button>
          )}
          {onOpenApiWebhookModal && (
            <button
              onClick={onOpenApiWebhookModal}
              className="h-8 px-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              title="API & Webhook Ingestion (POST /api/posts)"
              id="sidebar-api-webhook-btn"
            >
              <Code className="w-3.5 h-3.5 text-cyan-400" />
              <span>API / Ingest</span>
            </button>
          )}
        </div>

        {/* Mini Calendar Navigator */}
        <div className="bg-[#121620] border border-white/[0.06] rounded-xl p-3">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-medium text-slate-200 capitalize font-mono">
              {miniMonthName}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  setMiniCalMonth(new Date(miniCalMonth.setMonth(miniCalMonth.getMonth() - 1)))
                }
                className="p-1 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() =>
                  setMiniCalMonth(new Date(miniCalMonth.setMonth(miniCalMonth.getMonth() + 1)))
                }
                className="p-1 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-500 mb-1 font-mono">
            <span>H</span>
            <span>K</span>
            <span>S</span>
            <span>C</span>
            <span>P</span>
            <span>S</span>
            <span>V</span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {miniDays.map((item, idx) => {
              const selected = isSelected(item.date);
              const today = isToday(item.date);

              return (
                <button
                  key={idx}
                  onClick={() => onJumpToDate(item.date)}
                  className={`h-6 rounded flex flex-col items-center justify-center text-[11px] font-mono transition-colors relative ${
                    selected
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : today
                        ? 'border border-emerald-500/50 text-emerald-300 font-semibold'
                        : item.isCurrentMonth
                          ? 'text-slate-300 hover:bg-white/[0.08]'
                          : 'text-slate-600 hover:text-slate-400'
                  }`}
                >
                  <span>{item.day}</span>
                  {item.hasPost && !selected && (
                    <span className="w-1 h-1 rounded-full bg-emerald-400 -mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Channels Section */}
        <div>
          <div className="flex items-center justify-between px-1 mb-1.5">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
              Csatornák
            </span>
            <div className="flex items-center gap-2">
              {onOpenSocialModal && (
                <button
                  onClick={onOpenSocialModal}
                  className="px-1.5 py-0.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-[10px] text-blue-400 hover:text-blue-300 font-mono flex items-center gap-1 border border-blue-500/25 transition-all"
                  title="Social platformok és bejelentkezési adatok kezelése (Hozzáadás, Szerkesztés, Törlés)"
                  id="sidebar-channels-connect-btn"
                >
                  <Link2 className="w-2.5 h-2.5" />
                  <span>Kezelés</span>
                </button>
              )}
              {selectedPlatform !== 'all' && (
                <button
                  onClick={() => setSelectedPlatform('all')}
                  className="text-[10px] text-emerald-400 hover:underline font-mono"
                >
                  Összes
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1">
            {(['facebook', 'instagram', 'threads', 'youtube'] as Platform[]).map((plat) => {
              const count = getPlatformCount(plat);
              const isPlatActive = selectedPlatform === plat;

              return (
                <button
                  key={plat}
                  onClick={() => setSelectedPlatform(isPlatActive ? 'all' : plat)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                    isPlatActive
                      ? 'bg-white/[0.1] text-white font-medium ring-1 ring-white/[0.15]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <PlatformIcon platform={plat} size="sm" />
                    <span className="capitalize">{plat}</span>
                  </div>
                  <span
                    className={`font-mono text-[11px] px-1.5 py-0.5 rounded ${
                      count > 0 ? 'bg-white/[0.08] text-slate-200' : 'text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Filters */}
        <div>
          <div className="flex items-center justify-between px-1 mb-1.5">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
              Állapot Szűrő
            </span>
            {selectedStatus !== 'all' && (
              <button
                onClick={() => setSelectedStatus('all')}
                className="text-[10px] text-emerald-400 hover:underline font-mono"
              >
                Visszaállítás
              </button>
            )}
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                selectedStatus === 'all'
                  ? 'bg-white/[0.1] text-white font-medium ring-1 ring-white/[0.15]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>Minden poszt</span>
              </div>
              <span className="font-mono text-[11px] text-slate-400">{posts.length}</span>
            </button>

            <button
              onClick={() => setSelectedStatus('scheduled')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                selectedStatus === 'scheduled'
                  ? 'bg-emerald-500/20 text-emerald-300 font-medium ring-1 ring-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Időzített</span>
              </div>
              <span className="font-mono text-[11px] text-emerald-400">{scheduledCount}</span>
            </button>

            <button
              onClick={() => setSelectedStatus('published')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                selectedStatus === 'published'
                  ? 'bg-blue-500/20 text-blue-300 font-medium ring-1 ring-blue-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Közzétett</span>
              </div>
              <span className="font-mono text-[11px] text-blue-400">{publishedCount}</span>
            </button>

            <button
              onClick={() => setSelectedStatus('draft')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                selectedStatus === 'draft'
                  ? 'bg-amber-500/20 text-amber-300 font-medium ring-1 ring-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Piszkozat</span>
              </div>
              <span className="font-mono text-[11px] text-amber-400">{draftCount}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Footer: Supabase Status */}
      <div className="p-3 border-t border-white/[0.06] bg-[#0a0d13]">
        <button
          onClick={onOpenSupabaseModal}
          className={`w-full px-2.5 py-2 rounded-lg border text-xs flex items-center justify-between transition-all ${
            isMockMode
              ? 'bg-amber-950/20 border-amber-800/40 text-amber-300 hover:bg-amber-900/30'
              : 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300 hover:bg-emerald-900/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5" />
            <span className="font-medium text-[11px]">
              {isMockMode ? 'Demó / Helyi Mód' : 'Supabase Éles'}
            </span>
          </div>
          <span
            className={`w-2 h-2 rounded-full ${
              isMockMode ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
            }`}
          />
        </button>
      </div>
    </aside>
  );
};
