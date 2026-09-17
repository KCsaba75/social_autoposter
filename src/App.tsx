import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ListFilter,
  Eye,
  PenTool,
  CheckCircle2,
  AlertCircle,
  Database,
  Sparkles,
  Info,
  X,
} from 'lucide-react';
import { Post, Platform, PostStatus, CustomContent } from './types';
import {
  apiFetchPosts,
  apiCreatePost,
  apiUpdatePost,
  apiDeletePost,
  getStoredSupabaseConfig,
} from './lib/supabase';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { CalendarView } from './components/CalendarView';
import { ListView } from './components/ListView';
import { PostStudioModal } from './components/PostStudioModal';
import { SupabaseSetupModal } from './components/SupabaseSetupModal';
import { SocialAccountsModal } from './components/SocialAccountsModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { AiCampaignModal } from './components/AiCampaignModal';
import { ApiWebhookModal } from './components/ApiWebhookModal';
import { getStoredSocialAccounts } from './lib/socialAccounts';
import { canDeletePost } from './lib/postPermissions';

export default function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isMockMode, setIsMockMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'calendar' | 'list'>('calendar');
  const [calendarViewMode, setCalendarViewMode] = useState<'month' | 'week'>('month');

  // Workstation Layout State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isComposerModalOpen, setIsComposerModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [postsPendingDelete, setPostsPendingDelete] = useState<Post[]>([]);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isApiWebhookModalOpen, setIsApiWebhookModalOpen] = useState(false);
  const [socialAccounts, setSocialAccounts] = useState(() => getStoredSocialAccounts());
  const [dismissMockBanner, setDismissMockBanner] = useState(false);

  // Global filters & search
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<PostStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Composer active state (shared with live preview for instant updates)
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [selectedDateForNew, setSelectedDateForNew] = useState<Date | null>(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(new Date());

  const [currentPlatforms, setCurrentPlatforms] = useState<Platform[]>([
    'instagram',
  ]);
  const [currentText, setCurrentText] = useState<string>(
    '🚀 Készülj fel valami újra! Hamarosan érkezik a legújabb termékfrissítésünk, rengeteg izgalmas funkcióval. Csatlakozz te is a korai hozzáféréshez! ✨👇'
  );
  const [currentMedia, setCurrentMedia] = useState<string[]>([
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80',
  ]);
  const [currentCustomContent, setCurrentCustomContent] = useState<CustomContent>({
    instagram: {
      hashtags: '#socialmedia #innovation #productlaunch #tech #growth',
      firstComment: 'Iratkozz fel a hírlevelünkre a profilunk linkjén!',
      isReel: false,
    },
    youtube: {
      title: 'Termékfrissítés 2026 - Új korszak a közösségi médiában',
      description: 'Ismerd meg a legfrissebb fejlesztéseinket és funkcióinkat!',
      visibility: 'public',
    },
    threads: {
      threadReplies: ['Milyen funkciót látnál a legszívesebben a következő verzióban?'],
    },
  });

  const [currentScheduledAt, setCurrentScheduledAt] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    return new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  });

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Load posts
  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await apiFetchPosts();
      setPosts(res.posts);
      setIsMockMode(res.isMock);
    } catch (e) {
      console.error(e);
      showToast('Nem sikerült a posztok betöltése', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cfg = getStoredSupabaseConfig();
    if (cfg?.url && cfg?.anonKey) {
      fetch('/api/config/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg),
      }).catch(() => {});
    }
    loadPosts();
  }, []);

  // Post save handler
  const handleSavePost = async (
    postData: Omit<Post, 'id' | 'created_at'> & { id?: string },
    action: 'draft' | 'schedule' | 'publish'
  ) => {
    try {
      if (postData.id) {
        // Update existing
        await apiUpdatePost(postData.id, postData);
        showToast(
          action === 'publish'
            ? 'Poszt azonnal közzétéve!'
            : action === 'draft'
              ? 'Piszkozat sikeresen frissítve!'
              : 'Poszt ütemezése sikeresen frissítve!'
        );
      } else {
        // Create new
        await apiCreatePost(postData);
        showToast(
          action === 'publish'
            ? 'Új poszt azonnal közzétéve!'
            : action === 'draft'
              ? 'Új piszkozat elmentve!'
              : 'Új poszt sikeresen időzítve a naptárba!'
        );
      }

      await loadPosts();
      setEditingPost(null);
      setIsComposerModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Mentési hiba történt';
      showToast(msg, 'error');
    }
  };

  // Delete post handlers with future / draft validation
  const handleRequestDelete = (post: Post) => {
    const perm = canDeletePost(post);
    if (!perm.allowed) {
      showToast(perm.reason || 'Csak a jövőben időzített posztok és piszkozatok törölhetők!', 'error');
      return;
    }
    setPostsPendingDelete([post]);
    setIsDeleteModalOpen(true);
  };

  const handleRequestBatchDelete = (postsToDelete: Post[]) => {
    const deletables = postsToDelete.filter((p) => canDeletePost(p).allowed);
    if (deletables.length === 0) {
      showToast('A kiválasztott posztok közül egyik sem törölhető (csak jövőbeli vagy piszkozat).', 'error');
      return;
    }
    setPostsPendingDelete(deletables);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (ids: string[]) => {
    try {
      for (const id of ids) {
        await apiDeletePost(id);
      }
      showToast(
        ids.length > 1
          ? `${ids.length} db poszt sikeresen törölve.`
          : 'Poszt sikeresen törölve.'
      );
      await loadPosts();
      if (editingPost && ids.includes(editingPost.id)) {
        setEditingPost(null);
        setIsComposerModalOpen(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Törlési hiba';
      showToast(msg, 'error');
    }
  };

  const handleDeletePostById = async (id: string) => {
    const post = posts.find((p) => p.id === id);
    if (post) {
      handleRequestDelete(post);
    } else {
      await handleConfirmDelete([id]);
    }
  };

  // Publish now handler
  const handlePublishNow = async (post: Post) => {
    try {
      await apiUpdatePost(post.id, {
        status: 'published',
        scheduled_at: new Date().toISOString(),
      });
      showToast(`A(z) "${post.base_text.slice(0, 20)}..." poszt közzétéve!`);
      await loadPosts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Hiba történt';
      showToast(msg, 'error');
    }
  };

  // Click date on calendar to create post - opens modal
  const handleSelectDateForNewPost = (date: Date) => {
    setSelectedDateForNew(date);
    setEditingPost(null);

    // Update scheduledAt
    const d = new Date(date);
    d.setHours(12, 0, 0, 0);
    const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setCurrentScheduledAt(iso);
    setCurrentText('');
    setCurrentMedia([]);
    setCurrentCustomContent({});

    setIsComposerModalOpen(true);
  };

  // Click post to edit - opens modal
  const handleSelectPostToEdit = (post: Post) => {
    setEditingPost(post);
    // Enforce 1 post = 1 platform
    const targetPlatform = post.platforms && post.platforms.length > 0 ? [post.platforms[0]] : (['instagram'] as Platform[]);
    setCurrentPlatforms(targetPlatform);
    setCurrentText(post.base_text);
    setCurrentMedia(post.media_urls || []);
    setCurrentCustomContent(post.custom_content || {});
    setCurrentScheduledAt(
      new Date(new Date(post.scheduled_at).getTime() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    );

    setIsComposerModalOpen(true);
  };

  const handleStartNewBlankPost = () => {
    setEditingPost(null);
    setSelectedDateForNew(new Date());
    setCurrentPlatforms(['instagram']);
    setCurrentText('');
    setCurrentMedia([]);
    setCurrentCustomContent({});
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    setCurrentScheduledAt(
      new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    );
    setIsComposerModalOpen(true);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#090b10] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Precision Bar */}
      <Header
        posts={posts}
        activeView={activeView}
        setActiveView={setActiveView}
        calendarViewMode={calendarViewMode}
        setCalendarViewMode={setCalendarViewMode}
        selectedDate={selectedCalendarDate}
        setSelectedDate={setSelectedCalendarDate}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onNewPost={handleStartNewBlankPost}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onOpenSocialModal={() => setIsSocialModalOpen(true)}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onOpenApiWebhookModal={() => setIsApiWebhookModalOpen(true)}
        connectedSocialCount={(Object.values(socialAccounts) as { connected: boolean }[]).filter((a) => a.connected).length}
        isMockMode={isMockMode}
      />

      {/* Mock Mode Alert Banner (Compact & dismissible) */}
      {isMockMode && !dismissMockBanner && (
        <div className="bg-[#121620] border-b border-white/[0.06] px-4 py-1.5 text-xs text-slate-300 flex items-center justify-between shrink-0 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>
              <strong>Demó / Helyi Mód Aktív:</strong> Az alkalmazás helyi mentéssel fut. Minden funkció és időzítés azonnal működik!
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSupabaseModalOpen(true)}
              className="text-emerald-400 hover:underline text-[11px]"
            >
              Supabase SQL Séma & Csatlakozás
            </button>
            <button
              onClick={() => setDismissMockBanner(true)}
              className="text-slate-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Full-Screen Workstation Layout: Left Sidebar + Remaining Full-Width Calendar/List Stage */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        {/* Left Navigation Sidebar / Channel Rail */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          posts={posts}
          selectedPlatform={selectedPlatform}
          setSelectedPlatform={setSelectedPlatform}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          currentCalendarDate={selectedCalendarDate}
          onJumpToDate={(d) => setSelectedCalendarDate(d)}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          onOpenSocialModal={() => setIsSocialModalOpen(true)}
          onOpenAiModal={() => setIsAiModalOpen(true)}
          onOpenApiWebhookModal={() => setIsApiWebhookModalOpen(true)}
          isMockMode={isMockMode}
          onNewPost={handleStartNewBlankPost}
        />

        {/* Center Main Stage (Calendar or List) - Takes ALL remaining space */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#0b0e14]">
          {activeView === 'calendar' ? (
            <CalendarView
              posts={posts}
              selectedDate={selectedCalendarDate}
              setSelectedDate={setSelectedCalendarDate}
              viewMode={calendarViewMode}
              onSelectDateForNewPost={handleSelectDateForNewPost}
              onSelectPostToEdit={handleSelectPostToEdit}
              onDeletePost={handleDeletePostById}
              onRequestDelete={handleRequestDelete}
              filterPlatform={selectedPlatform}
              filterStatus={selectedStatus}
              searchQuery={searchQuery}
            />
          ) : (
            <ListView
              posts={posts}
              onSelectPostToEdit={handleSelectPostToEdit}
              onDeletePost={handleDeletePostById}
              onRequestDelete={handleRequestDelete}
              onRequestBatchDelete={handleRequestBatchDelete}
              onPublishNow={handlePublishNow}
              onNewPost={handleStartNewBlankPost}
              filterPlatform={selectedPlatform}
              filterStatus={selectedStatus}
              searchQuery={searchQuery}
            />
          )}
        </main>
      </div>

      {/* Post Studio Modal (Side-by-side: Bal oldal szerkesztő, Jobb oldal élő előnézet) */}
      <PostStudioModal
        isOpen={isComposerModalOpen}
        onClose={() => {
          setIsComposerModalOpen(false);
          setEditingPost(null);
        }}
        initialPost={editingPost}
        targetDate={selectedDateForNew}
        onSave={handleSavePost}
        onDeletePost={handleRequestDelete}
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

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div
            className={`px-3.5 py-2.5 rounded-lg shadow-xl flex items-center gap-2 border text-xs font-medium ${
              toast.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-800/80 shadow-rose-950/40'
                : toast.type === 'info'
                  ? 'bg-[#121620] text-slate-200 border-white/[0.1] shadow-black/40'
                  : 'bg-emerald-950/90 text-emerald-200 border-emerald-800/80 shadow-emerald-950/40'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Future Scheduled Posts & Drafts */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        postsToDelete={postsPendingDelete}
        onConfirm={handleConfirmDelete}
      />

      {/* Supabase Setup & SQL Schema Modal */}
      <SupabaseSetupModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onConnectionChanged={loadPosts}
        isMockMode={isMockMode}
      />

      {/* Social Accounts & Credentials Setup Modal */}
      <SocialAccountsModal
        isOpen={isSocialModalOpen}
        onClose={() => setIsSocialModalOpen(false)}
        onAccountsUpdated={() => setSocialAccounts(getStoredSocialAccounts())}
      />

      {/* AI Post & Campaign Generator Modal */}
      <AiCampaignModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onPostsGeneratedAndSaved={async (newPosts) => {
          // 1. Reset any search / platform / status filters so user immediately sees the new draft
          setSelectedStatus('all');
          setSelectedPlatform('all');
          setSearchQuery('');

          // 2. Immediately merge new posts into React state so UI updates without waiting for network
          setPosts((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const toAdd = newPosts.filter((p) => !existingIds.has(p.id));
            return [...toAdd, ...prev];
          });

          // 3. Jump the calendar to the first generated post's date
          if (newPosts.length > 0 && newPosts[0].scheduled_at) {
            const postDate = new Date(newPosts[0].scheduled_at);
            if (!isNaN(postDate.getTime())) {
              setSelectedCalendarDate(postDate);
            }
          }

          showToast(
            `${newPosts.length} db AI poszt piszkozat (draft) mentve és betöltve a naptárba!`,
            'success'
          );

          await loadPosts();
        }}
        targetDate={
          selectedCalendarDate
            ? new Date(selectedCalendarDate.getTime() - selectedCalendarDate.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16)
            : undefined
        }
      />

      {/* API & Webhook Ingestion Modal */}
      <ApiWebhookModal
        isOpen={isApiWebhookModalOpen}
        onClose={() => setIsApiWebhookModalOpen(false)}
        onPostIngested={async (newPosts) => {
          setSelectedStatus('all');
          setSelectedPlatform('all');
          setSearchQuery('');

          setPosts((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const toAdd = newPosts.filter((p) => !existingIds.has(p.id));
            return [...toAdd, ...prev];
          });

          if (newPosts.length > 0 && newPosts[0].scheduled_at) {
            const postDate = new Date(newPosts[0].scheduled_at);
            if (!isNaN(postDate.getTime())) {
              setSelectedCalendarDate(postDate);
            }
          }

          showToast(
            `${newPosts.length} db poszt fogadva az API-n keresztül (draftként a naptárban)!`,
            'success'
          );

          await loadPosts();
        }}
      />
    </div>
  );
}
