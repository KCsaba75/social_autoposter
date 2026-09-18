import React, { useState } from 'react';
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
  MessageSquare,
  Hash,
  Lock,
  Calendar,
  CheckSquare,
  Square,
  Sparkles,
  Building2,
  User,
  Users,
} from 'lucide-react';
import { Post, Platform, PostStatus } from '../types';
import { PLATFORM_CONFIGS } from '../lib/constants';
import { PlatformIcon } from './PlatformIcon';
import { canDeletePost, formatFutureTimeRemaining } from '../lib/postPermissions';
import { getStoredMultiAccounts } from '../lib/socialAccounts';

interface ListViewProps {
  posts: Post[];
  onSelectPostToEdit: (post: Post) => void;
  onDeletePost: (id: string) => void;
  onRequestDelete?: (post: Post) => void;
  onRequestBatchDelete?: (posts: Post[]) => void;
  onPublishNow: (post: Post) => void;
  onOpenFacebookVerifier?: (post?: Post) => void;
  onNewPost: () => void;
  filterPlatform: Platform | 'all';
  filterStatus: PostStatus | 'all';
  searchQuery: string;
}

export const ListView: React.FC<ListViewProps> = ({
  posts,
  onSelectPostToEdit,
  onDeletePost,
  onRequestDelete,
  onRequestBatchDelete,
  onPublishNow,
  onOpenFacebookVerifier,
  onNewPost,
  filterPlatform,
  filterStatus,
  searchQuery,
}) => {
  const [onlyFutureAndDrafts, setOnlyFutureAndDrafts] = useState(false);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);

  const filteredPosts = posts
    .filter((post) => {
      if (filterPlatform !== 'all' && !post.platforms.includes(filterPlatform)) {
        return false;
      }
      if (filterStatus !== 'all' && post.status !== filterStatus) {
        return false;
      }
      if (onlyFutureAndDrafts) {
        const canDel = canDeletePost(post);
        if (!canDel.allowed) return false;
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

  const deletableFilteredPosts = filteredPosts.filter((p) => canDeletePost(p).allowed);

  const toggleSelectAll = () => {
    if (selectedPostIds.length === deletableFilteredPosts.length && deletableFilteredPosts.length > 0) {
      setSelectedPostIds([]);
    } else {
      setSelectedPostIds(deletableFilteredPosts.map((p) => p.id));
    }
  };

  const toggleSelectPost = (id: string) => {
    setSelectedPostIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeletePost = (post: Post) => {
    if (onRequestDelete) {
      onRequestDelete(post);
    } else {
      onDeletePost(post.id);
    }
  };

  const handleBatchDelete = () => {
    const toDelete = posts.filter((p) => selectedPostIds.includes(p.id));
    if (toDelete.length === 0) return;
    if (onRequestBatchDelete) {
      onRequestBatchDelete(toDelete);
    } else {
      toDelete.forEach((p) => onDeletePost(p.id));
    }
    setSelectedPostIds([]);
  };

  const getAccountLabel = (post: Post): string | null => {
    if (post.target_accounts && post.target_accounts.length > 0) {
      return post.target_accounts.map((a) => a.name).join(', ');
    }
    if (post.account_ids && post.account_ids.length > 0) {
      const accs = getStoredMultiAccounts();
      const matches = accs.filter((a) => post.account_ids!.includes(a.id));
      if (matches.length > 0) {
        return matches.map((m) => m.name).join(', ');
      }
    }
    if (post.custom_content?.facebook?.targetName) {
      return post.custom_content.facebook.targetName;
    }
    if (post.custom_content?.youtube?.channelName) {
      return post.custom_content.youtube.channelName;
    }
    return null;
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0b0e14] overflow-hidden">
      {/* Table Header Row & Controls */}
      <div className="bg-[#0d1117] border-b border-white/[0.08] px-4 py-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0 text-[11px] font-mono">
        <div className="flex items-center gap-3">
          {/* Select all checkbox for deletable items */}
          {deletableFilteredPosts.length > 0 && (
            <button
              type="button"
              onClick={toggleSelectAll}
              className="text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
              title="Összes jövőbeli és vázlat poszt kijelölése"
            >
              {selectedPostIds.length === deletableFilteredPosts.length && selectedPostIds.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-emerald-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-500" />
              )}
            </button>
          )}

          <span className="uppercase tracking-wider text-slate-400 font-semibold">
            Tartalom ({filteredPosts.length})
          </span>

          {/* Quick toggle: Only future & drafts */}
          <button
            type="button"
            onClick={() => setOnlyFutureAndDrafts(!onlyFutureAndDrafts)}
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono border transition-all flex items-center gap-1 ${
              onlyFutureAndDrafts
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs'
                : 'bg-white/[0.04] text-slate-400 border-white/[0.08] hover:text-slate-200'
            }`}
            title="Csak a mostani időponthoz képest jövőbeli időzített posztok és vázlatok mutatása"
            id="filter-only-future-drafts-btn"
          >
            <Clock className="w-2.5 h-2.5" />
            <span>Csak jövőbeli & vázlatok</span>
          </button>
        </div>

        {/* Right side: Batch actions if selected, or table columns info */}
        <div className="flex items-center gap-4">
          {selectedPostIds.length > 0 ? (
            <div className="flex items-center gap-2 animate-fadeIn">
              <span className="text-emerald-400 font-medium">
                {selectedPostIds.length} kijelölve
              </span>
              <button
                onClick={handleBatchDelete}
                className="px-2.5 py-1 rounded bg-rose-600/90 hover:bg-rose-500 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                id="batch-delete-future-posts-btn"
              >
                <Trash2 className="w-3 h-3" />
                <span>Kijelöltek törlése</span>
              </button>
              <button
                onClick={() => setSelectedPostIds([])}
                className="text-slate-400 hover:text-white text-[10px] underline"
              >
                Mégse
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-10 text-slate-400 uppercase tracking-wider">
              <span>Platformok</span>
              <span className="hidden md:inline">Időzítés</span>
              <span className="hidden lg:inline">Állapot</span>
              <span>Műveletek</span>
            </div>
          )}
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
              {onlyFutureAndDrafts
                ? 'Nincs a jövőben időzített poszt vagy vázlat a jelenlegi feltételekkel.'
                : 'Módosítsd a szűrőket a bal oldalsávban, vagy hozz létre egy új posztot!'}
            </p>
            {onlyFutureAndDrafts ? (
              <button
                onClick={() => setOnlyFutureAndDrafts(false)}
                className="px-3 py-1.5 rounded-lg bg-white/[0.08] text-white font-medium text-xs hover:bg-white/[0.12] transition-colors"
              >
                Összes poszt megjelenítése
              </button>
            ) : (
              <button
                onClick={onNewPost}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-semibold text-xs hover:bg-emerald-400 transition-colors"
              >
                + Új Poszt Létrehozása
              </button>
            )}
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

            const deleteInfo = canDeletePost(post);
            const isDeletable = deleteInfo.allowed;
            const isSelected = selectedPostIds.includes(post.id);
            const timeRemaining = formatFutureTimeRemaining(post.scheduled_at);

            return (
              <div
                key={post.id}
                onClick={() => onSelectPostToEdit(post)}
                className={`group px-4 py-3 transition-colors flex items-center justify-between gap-4 cursor-pointer ${
                  isSelected
                    ? 'bg-rose-500/[0.06] border-l-2 border-rose-500'
                    : 'hover:bg-white/[0.02]'
                }`}
              >
                {/* Left: Checkbox & Thumbnail & Text snippet */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Selection Checkbox for deletable posts */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isDeletable) toggleSelectPost(post.id);
                    }}
                    className="shrink-0"
                  >
                    {isDeletable ? (
                      <button
                        type="button"
                        className="text-slate-500 hover:text-slate-300 p-0.5 transition-colors"
                        title={isSelected ? 'Kijelölés megszüntetése' : 'Kijelölés törléshez'}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-rose-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600 hover:text-slate-400" />
                        )}
                      </button>
                    ) : (
                      <div className="w-4 h-4" />
                    )}
                  </div>

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
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] font-mono text-slate-500">
                        ID: {post.id.slice(0, 8)}
                      </span>

                      {/* Target Account Badge */}
                      {getAccountLabel(post) && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1" title="Célfiók / Célcsatorna">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                          <span className="font-semibold">{getAccountLabel(post)}</span>
                        </span>
                      )}

                      {/* Deletable future indicator badge */}
                      {deleteInfo.type === 'future_scheduled' && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-0.5" title="Aktuális időhöz képest a jövőben van">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{timeRemaining}</span>
                        </span>
                      )}

                      {deleteInfo.type === 'draft' && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          Vázlat
                        </span>
                      )}

                      {/* Facebook Target Type indicator */}
                      {post.platforms.includes('facebook') && post.custom_content?.facebook?.targetType === 'profile' && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1" title="Facebook Személyes Profil">
                          <User className="w-2.5 h-2.5" />
                          <span>FB Profil</span>
                        </span>
                      )}
                      {post.platforms.includes('facebook') && post.custom_content?.facebook?.targetType === 'both' && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1" title="Facebook Üzleti Oldal + Profil">
                          <Users className="w-2.5 h-2.5" />
                          <span>FB Oldal+Profil</span>
                        </span>
                      )}
                      {post.platforms.includes('facebook') && (!post.custom_content?.facebook?.targetType || post.custom_content?.facebook?.targetType === 'page') && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1" title="Facebook Üzleti Oldal">
                          <Building2 className="w-2.5 h-2.5" />
                          <span>FB Oldal</span>
                        </span>
                      )}

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
                      {post.custom_content?.youtube?.format === 'shorts' && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1">
                          <Film className="w-2.5 h-2.5" />
                          <span>Shorts</span>
                        </span>
                      )}
                      {(Boolean(post.custom_content?.instagram?.hashtags) || Boolean(post.custom_content?.facebook?.hashtags)) && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono text-blue-300 bg-blue-500/15 border border-blue-500/25 flex items-center gap-1" title="Hashtagek beállítva">
                          <Hash className="w-2.5 h-2.5" />
                          <span>Hashtag</span>
                        </span>
                      )}
                      {(Boolean(post.custom_content?.instagram?.firstComment) || Boolean(post.custom_content?.facebook?.firstComment)) && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono text-sky-300 bg-sky-500/15 border border-sky-500/25 flex items-center gap-1" title="Első komment beállítva">
                          <MessageSquare className="w-2.5 h-2.5" />
                          <span>Első komment</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right columns */}
                <div className="flex items-center gap-6 sm:gap-8 shrink-0">
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
                    {onOpenFacebookVerifier && post.platforms.includes('facebook') && (
                      <button
                        onClick={() => onOpenFacebookVerifier(post)}
                        className="p-1.5 rounded-md hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 transition-colors"
                        title="Facebook közzététel ellenőrzése (Valós állapot, miért nem ment ki, 1-kattintásos közzététel)"
                        id={`verify-fb-btn-${post.id}`}
                      >
                        <Search className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {post.status !== 'published' && (
                      <button
                        onClick={() => onPublishNow(post)}
                        className="p-1.5 rounded-md hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-300 transition-colors"
                        title="Azonnali közzététel"
                        id={`publish-btn-${post.id}`}
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onSelectPostToEdit(post)}
                      className="p-1.5 rounded-md hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
                      title="Szerkesztés"
                      id={`edit-btn-${post.id}`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete button: Active for future scheduled posts and drafts! */}
                    {isDeletable ? (
                      <button
                        onClick={() => handleDeletePost(post)}
                        className="p-1.5 rounded-md hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                        title={
                          post.status === 'draft'
                            ? 'Piszkozat törlése'
                            : 'Jövőbeli időzítés visszavonása és törlése'
                        }
                        id={`delete-btn-${post.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span
                        className="p-1.5 text-slate-600 cursor-not-allowed opacity-50"
                        title={deleteInfo.reason || 'Nem törölhető'}
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    )}
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

