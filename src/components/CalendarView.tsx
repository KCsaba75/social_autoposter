import React from 'react';
import {
  Plus,
  Clock,
  Trash2,
  ExternalLink,
  ImageIcon,
  CheckCircle2,
  AlertCircle,
  FileText,
  Film,
  Clapperboard,
} from 'lucide-react';
import { Post, Platform, PostStatus } from '../types';
import { PLATFORM_CONFIGS, STATUS_CONFIG } from '../lib/constants';
import { PlatformIcon } from './PlatformIcon';

interface CalendarViewProps {
  posts: Post[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  viewMode: 'month' | 'week';
  onSelectDateForNewPost: (date: Date) => void;
  onSelectPostToEdit: (post: Post) => void;
  onDeletePost: (id: string) => void;
  filterPlatform: Platform | 'all';
  filterStatus: PostStatus | 'all';
  searchQuery: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  posts,
  selectedDate,
  setSelectedDate,
  viewMode,
  onSelectDateForNewPost,
  onSelectPostToEdit,
  onDeletePost,
  filterPlatform,
  filterStatus,
  searchQuery,
}) => {
  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth();

  // Month calculation
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const startingDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
  const totalDaysInMonth = lastDayOfMonth.getDate();
  const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();

  const days: { date: Date; isCurrentMonth: boolean }[] = [];

  // Previous month trailing days
  for (let i = startingDayIndex - 1; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - 1, prevMonthLastDay - i);
    days.push({ date: d, isCurrentMonth: false });
  }

  // Current month days
  for (let i = 1; i <= totalDaysInMonth; i++) {
    const d = new Date(currentYear, currentMonth, i);
    days.push({ date: d, isCurrentMonth: true });
  }

  // Remaining days (fill up to 35 or 42)
  const totalCells = days.length > 35 ? 42 : 35;
  const remainingCells = totalCells - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    const d = new Date(currentYear, currentMonth + 1, i);
    days.push({ date: d, isCurrentMonth: false });
  }

  // Week view: 7 days of the selected week (Mon - Sun)
  const currentDayOfWeek = (selectedDate.getDay() + 6) % 7;
  const weekStart = new Date(selectedDate);
  weekStart.setDate(selectedDate.getDate() - currentDayOfWeek);

  const weekDays: { date: Date; isCurrentMonth: boolean }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    weekDays.push({ date: d, isCurrentMonth: d.getMonth() === currentMonth });
  }

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    if (filterPlatform !== 'all' && !post.platforms.includes(filterPlatform)) {
      return false;
    }
    if (filterStatus !== 'all' && post.status !== filterStatus) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = post.base_text.toLowerCase().includes(q);
      const matchYtTitle = post.custom_content?.youtube?.title?.toLowerCase().includes(q);
      if (!matchText && !matchYtTitle) return false;
    }
    return true;
  });

  const getPostsForDate = (date: Date) => {
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();

    return filteredPosts
      .filter((post) => {
        const pDate = new Date(post.scheduled_at);
        return (
          pDate.getFullYear() === y &&
          pDate.getMonth() === m &&
          pDate.getDate() === d
        );
      })
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const weekDayNames = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];

  const displayDays = viewMode === 'week' ? weekDays : days;
  const numRows = viewMode === 'week' ? 1 : totalCells / 7;

  return (
    <div className="w-full h-full flex flex-col bg-[#0b0e14] overflow-hidden select-none">
      {/* Weekday headers bar */}
      <div className="grid grid-cols-7 border-b border-white/[0.08] bg-[#0d1117] shrink-0">
        {weekDayNames.map((name, idx) => (
          <div
            key={name}
            className="py-2.5 px-3 text-center border-r border-white/[0.04] last:border-r-0"
          >
            <span className="text-[11px] font-mono font-semibold tracking-wider uppercase text-slate-400">
              {name}
            </span>
          </div>
        ))}
      </div>

      {/* Grid container - edge to edge full screen height utilization */}
      {viewMode === 'month' ? (
        <div
          className={`grid grid-cols-7 flex-1 h-full overflow-hidden`}
          style={{ gridTemplateRows: `repeat(${numRows}, minmax(0, 1fr))` }}
        >
          {displayDays.map(({ date, isCurrentMonth }, idx) => {
            const dayPosts = getPostsForDate(date);
            const activeToday = isToday(date);
            const isSelected = isSameDay(date, selectedDate);

            return (
              <div
                key={idx}
                onClick={() => {
                  setSelectedDate(date);
                  onSelectDateForNewPost(date);
                }}
                className={`group relative flex flex-col p-2 border-r border-b border-white/[0.06] transition-colors overflow-hidden cursor-pointer ${
                  activeToday
                    ? 'bg-emerald-500/[0.04]'
                    : isSelected
                      ? 'bg-white/[0.03]'
                      : isCurrentMonth
                        ? 'bg-[#0b0e14] hover:bg-white/[0.02]'
                        : 'bg-[#080a0f] opacity-40 hover:opacity-70'
                }`}
              >
                {/* Cell Top: Date Number & Quick Add Button */}
                <div className="flex items-center justify-between mb-1.5 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-mono font-semibold px-1.5 py-0.5 rounded ${
                        activeToday
                          ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                          : isSelected
                            ? 'bg-white/[0.12] text-white'
                            : isCurrentMonth
                              ? 'text-slate-300'
                              : 'text-slate-600'
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {dayPosts.length > 0 && (
                      <span className="text-[10px] font-mono text-slate-500">
                        {dayPosts.length} poszt
                      </span>
                    )}
                  </div>

                  {/* Quick Add Button on Cell Hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDate(date);
                      onSelectDateForNewPost(date);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-emerald-500 hover:text-slate-950 text-slate-400 transition-all"
                    title="Új poszt időzítése erre a napra"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Posts inside cell - scrollable with sleek titanium pills */}
                <div className="flex-1 flex flex-col gap-1 overflow-y-auto pr-0.5">
                  {dayPosts.map((post) => {
                    const postTime = new Date(post.scheduled_at).toLocaleTimeString(
                      'hu-HU',
                      { hour: '2-digit', minute: '2-digit' }
                    );

                    return (
                      <div
                        key={post.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPostToEdit(post);
                        }}
                        className="group/card px-2 py-1.5 rounded-md bg-[#121620] hover:bg-[#181d2a] border border-white/[0.06] hover:border-emerald-500/40 transition-all flex flex-col gap-1 text-[11px] shadow-xs cursor-pointer"
                      >
                        {/* Card Header: Platform icons + Time + Format Badges + Status indicator */}
                        <div className="flex items-center justify-between gap-1 text-[10px]">
                          <div className="flex items-center gap-1 overflow-hidden">
                            <div className="flex items-center -space-x-1 shrink-0">
                              {post.platforms.map((p) => (
                                <PlatformIcon key={p} platform={p} size="sm" />
                              ))}
                            </div>
                            <span className="font-mono text-slate-400 font-medium ml-1">
                              {postTime}
                            </span>
                            {/* Reel or Story Badge */}
                            {(post.custom_content?.instagram?.format === 'reel' ||
                              post.custom_content?.facebook?.format === 'reel' ||
                              post.custom_content?.instagram?.isReel) && (
                              <span className="shrink-0 px-1 py-0.2 rounded text-[9px] font-mono font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-0.5" title="Reels formátum">
                                <Film className="w-2.5 h-2.5" />
                                <span>Reel</span>
                              </span>
                            )}
                            {(post.custom_content?.instagram?.format === 'story' ||
                              post.custom_content?.facebook?.format === 'story') && (
                              <span className="shrink-0 px-1 py-0.2 rounded text-[9px] font-mono font-medium bg-pink-500/20 text-pink-300 border border-pink-500/30 flex items-center gap-0.5" title="Story formátum">
                                <Clapperboard className="w-2.5 h-2.5" />
                                <span>Story</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {post.media_urls && post.media_urls.length > 0 && (
                              <ImageIcon className="w-3 h-3 text-slate-400" />
                            )}
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                post.status === 'published'
                                  ? 'bg-blue-400'
                                  : post.status === 'scheduled'
                                    ? 'bg-emerald-400'
                                    : post.status === 'draft'
                                      ? 'bg-amber-400'
                                      : 'bg-rose-400'
                              }`}
                              title={`Állapot: ${post.status}`}
                            />
                          </div>
                        </div>

                        {/* Card Text snippet */}
                        <p className="line-clamp-2 text-slate-200 leading-snug break-words">
                          {post.base_text ||
                            post.custom_content?.youtube?.title ||
                            'Nincs szöveg megadva'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Week View: 7 Full-Height Columns side by side */
        <div className="grid grid-cols-7 flex-1 h-full overflow-hidden divide-x divide-white/[0.06]">
          {weekDays.map(({ date }, idx) => {
            const dayPosts = getPostsForDate(date);
            const activeToday = isToday(date);
            const isSelected = isSameDay(date, selectedDate);

            return (
              <div
                key={idx}
                onClick={() => {
                  setSelectedDate(date);
                  onSelectDateForNewPost(date);
                }}
                className={`flex flex-col h-full overflow-hidden transition-colors cursor-pointer ${
                  activeToday
                    ? 'bg-emerald-500/[0.03]'
                    : isSelected
                      ? 'bg-white/[0.02]'
                      : 'bg-[#0b0e14] hover:bg-white/[0.01]'
                }`}
              >
                {/* Column header */}
                <div className="p-3 border-b border-white/[0.06] flex items-center justify-between shrink-0 bg-[#0d1117]/60">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-sm font-bold px-2 py-0.5 rounded ${
                        activeToday
                          ? 'bg-emerald-500 text-slate-950'
                          : 'text-slate-200 bg-white/[0.06]'
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {date.toLocaleString('hu-HU', { month: 'short' })}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDate(date);
                      onSelectDateForNewPost(date);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.08]"
                    title="Poszt hozzáadása"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Day Posts List in Column */}
                <div className="flex-1 p-2.5 space-y-2 overflow-y-auto">
                  {dayPosts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs py-8">
                      <Clock className="w-5 h-5 mb-1.5 opacity-40" />
                      <span>Nincs ütemezés</span>
                    </div>
                  ) : (
                    dayPosts.map((post) => {
                      const postTime = new Date(post.scheduled_at).toLocaleTimeString(
                        'hu-HU',
                        { hour: '2-digit', minute: '2-digit' }
                      );

                      return (
                        <div
                          key={post.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPostToEdit(post);
                          }}
                          className="p-2.5 rounded-lg bg-[#121620] hover:bg-[#181d2a] border border-white/[0.07] hover:border-emerald-500/40 transition-all flex flex-col gap-2 shadow-xs group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {post.platforms.map((p) => (
                                <PlatformIcon key={p} platform={p} size="sm" />
                              ))}
                              <span className="font-mono text-xs text-slate-300 font-medium ml-1">
                                {postTime}
                              </span>
                              {(post.custom_content?.instagram?.format === 'reel' ||
                                post.custom_content?.facebook?.format === 'reel' ||
                                post.custom_content?.instagram?.isReel) && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                                  <Film className="w-3 h-3" />
                                  <span>Reel</span>
                                </span>
                              )}
                              {(post.custom_content?.instagram?.format === 'story' ||
                                post.custom_content?.facebook?.format === 'story') && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-pink-500/20 text-pink-300 border border-pink-500/30 flex items-center gap-1">
                                  <Clapperboard className="w-3 h-3" />
                                  <span>Story</span>
                                </span>
                              )}
                            </div>

                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded capitalize ${
                                post.status === 'published'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : post.status === 'scheduled'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {post.status}
                            </span>
                          </div>

                          <p className="text-xs text-slate-200 line-clamp-3 leading-relaxed">
                            {post.base_text || post.custom_content?.youtube?.title}
                          </p>

                          {post.media_urls && post.media_urls.length > 0 && (
                            <div className="relative rounded-md overflow-hidden h-24 border border-white/[0.06] bg-black/40">
                              <img
                                src={post.media_urls[0]}
                                alt="Media"
                                className="w-full h-full object-cover"
                              />
                              {post.media_urls.length > 1 && (
                                <span className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-mono text-white">
                                  +{post.media_urls.length - 1}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
