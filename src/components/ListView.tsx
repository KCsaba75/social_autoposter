import React from 'react';
import {
  Clock,
  Trash2,
  Edit3,
  Send,
  AlertCircle,
  CheckCircle2,
  Layers,
  Search,
  ExternalLink,
  Film,
  Clapperboard,
} from 'lucide-react';
import { Post, Platform, PostStatus } from '../types';
import { PLATFORM_CONFIGS } from '../lib/constants';
import { PlatformIcon } from './PlatformIcon';

interface ListViewProps {
  posts: Post[];
  onSelectPostToEdit: (post: Post) => void;
  onDeletePost: (id: string) => void;
  onPublishNow: (post: Post) => void;
  onNewPost: () => void;
  filterPlatform: Platform | 'all';
  filterStatus: PostStatus | 'all';
  searchQuery: string;
}

export const ListView: React.FC<ListViewProps> = ({
  posts,
  onSelectPostToEdit,
  onDeletePost,
  onPublishNow,
  onNewPost,
  filterPlatform,
  filterStatus,
  searchQuery,
}) => {
  const filteredPosts = posts
    .filter((post) => {
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
    })
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  return (
    <div className="w-full h-full flex flex-col bg-[#0b0e14] overflow-hidden">
      {/* Table Header Row */}
      <div className="h-10 bg-[#0d1117] border-b border-white/[0.08] px-4 flex items-center justify-between shrink-0 text-[11px] font-mono uppercase tracking-wider text-slate-400">
        <div className="flex items-center gap-2">
          <span>Tartalom ({filteredPosts.length})</span>
        </div>
        <div className="flex items-center gap-12 mr-2">
          <span className="hidden sm:inline">Platformok</span>
          <span className="hidden md:inline">Időzítés</span>
          <span className="hidden lg:inline">Állapot</span>
          <span>Műveletek</span>
        </div>
      </div>

      {/* List / Table Items */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
        {filteredPosts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-500 mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200 mb-1">
              Nem található poszt a megadott szűrőkkel
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              Módosítsd a szűrőket a bal oldalsávban, vagy hozz létre egy új posztot!
            </p>
            <button
              onClick={onNewPost}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-semibold text-xs hover:bg-emerald-400 transition-colors"
            >
              + Új Poszt Létrehozása
            </button>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const dateObj = new Date(post.scheduled_at);
            const dateStr = dateObj.toLocaleDateString('hu-HU', {
              month: 'short',
              day: 'numeric',
            });
            const timeStr = dateObj.toLocaleTimeString('hu-HU', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={post.id}
                onClick={() => onSelectPostToEdit(post)}
                className="group px-4 py-3 hover:bg-white/[0.02] transition-colors flex items-center justify-between gap-4 cursor-pointer"
              >
                {/* Left: Thumbnail & Text snippet */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {post.media_urls && post.media_urls.length > 0 ? (
                    <img
                      src={post.media_urls[0]}
                      alt="Thumbnail"
                      className="w-12 h-12 rounded-lg object-cover border border-white/[0.08] shrink-0 bg-black/40"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 text-slate-600">
                      <Clock className="w-5 h-5" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-200 font-medium line-clamp-1 group-hover:text-emerald-300 transition-colors">
                      {post.base_text ||
                        post.custom_content?.youtube?.title ||
                        'Szöveg nélküli poszt'}
                    </p>
                    {post.custom_content?.youtube?.title && post.base_text && (
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {post.custom_content.youtube.title}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono text-slate-500">
                        ID: {post.id.slice(0, 8)}
                      </span>
                      {(post.custom_content?.instagram?.format === 'reel' ||
                        post.custom_content?.facebook?.format === 'reel' ||
                        post.custom_content?.instagram?.isReel) && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                          <Film className="w-2.5 h-2.5" />
                          <span>Reel</span>
                        </span>
                      )}
                      {(post.custom_content?.instagram?.format === 'story' ||
                        post.custom_content?.facebook?.format === 'story') && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-pink-500/20 text-pink-300 border border-pink-500/30 flex items-center gap-1">
                          <Clapperboard className="w-2.5 h-2.5" />
                          <span>Story</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right columns */}
                <div className="flex items-center gap-8 shrink-0">
                  {/* Platforms */}
                  <div className="hidden sm:flex items-center -space-x-1">
                    {post.platforms.map((plat) => (
                      <PlatformIcon key={plat} platform={plat} size="sm" />
                    ))}
                  </div>

                  {/* Scheduled time */}
                  <div className="hidden md:flex flex-col text-right font-mono text-xs">
                    <span className="text-slate-200 font-medium">{dateStr}</span>
                    <span className="text-slate-400 text-[11px]">{timeStr}</span>
                  </div>

                  {/* Status */}
                  <div className="hidden lg:block">
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded-full capitalize ${
                        post.status === 'published'
                          ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                          : post.status === 'scheduled'
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      }`}
                    >
                      {post.status}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {post.status !== 'published' && (
                      <button
                        onClick={() => onPublishNow(post)}
                        className="p-1.5 rounded-md hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-300 transition-colors"
                        title="Azonnali közzététel"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onSelectPostToEdit(post)}
                      className="p-1.5 rounded-md hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
                      title="Szerkesztés"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeletePost(post.id)}
                      className="p-1.5 rounded-md hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Törlés"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
