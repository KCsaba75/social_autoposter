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
import { PostComposer } from './components/PostComposer';
import { LivePreview } from './components/LivePreview';
import { SupabaseSetupModal } from './components/SupabaseSetupModal';

export default function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isMockMode, setIsMockMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'calendar' | 'list'>('calendar');
  const [calendarViewMode, setCalendarViewMode] = useState<'month' | 'week'>('month');

  // Workstation Layout State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [rightPanelTab, setRightPanelTab] = useState<'composer' | 'preview'>('composer');
  const [isComposerOpenMobile, setIsComposerOpenMobile] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
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
    'facebook',
    'threads',
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
      setIsComposerOpenMobile(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Mentési hiba történt';
      showToast(msg, 'error');
    }
  };

  // Delete post handler
  const handleDeletePost = async (id: string) => {
    try {
      await apiDeletePost(id);
      showToast('Poszt sikeresen törölve.');
      await loadPosts();
      if (editingPost?.id === id) {
        setEditingPost(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Törlési hiba';
      showToast(msg, 'error');
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

  // Click date on calendar to create post
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

    setIsRightPanelOpen(true);
    setRightPanelTab('composer');
    setIsComposerOpenMobile(true);
  };

  // Click post to edit
  const handleSelectPostToEdit = (post: Post) => {
    setEditingPost(post);
    setCurrentPlatforms(post.platforms);
    setCurrentText(post.base_text);
    setCurrentMedia(post.media_urls || []);
    setCurrentCustomContent(post.custom_content || {});
    setCurrentScheduledAt(
      new Date(new Date(post.scheduled_at).getTime() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    );

    setIsRightPanelOpen(true);
    setRightPanelTab('composer');
    setIsComposerOpenMobile(true);
  };

  const handleStartNewBlankPost = () => {
    setEditingPost(null);
    setSelectedDateForNew(new Date());
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
    setIsRightPanelOpen(true);
    setRightPanelTab('composer');
    setIsComposerOpenMobile(true);
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
        isMockMode={isMockMode}
        isRightPanelOpen={isRightPanelOpen}
        setIsRightPanelOpen={setIsRightPanelOpen}
        isComposerOpenMobile={isComposerOpenMobile}
        setIsComposerOpenMobile={setIsComposerOpenMobile}
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

      {/* Full-Screen Workstation Layout */}
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
          isMockMode={isMockMode}
        />

        {/* Center Main Stage (Calendar or List) - Takes available space */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#0b0e14]">
          {activeView === 'calendar' ? (
            <CalendarView
              posts={posts}
              selectedDate={selectedCalendarDate}
              setSelectedDate={setSelectedCalendarDate}
              viewMode={calendarViewMode}
              onSelectDateForNewPost={handleSelectDateForNewPost}
              onSelectPostToEdit={handleSelectPostToEdit}
              onDeletePost={handleDeletePost}
              filterPlatform={selectedPlatform}
              filterStatus={selectedStatus}
              searchQuery={searchQuery}
            />
          ) : (
            <ListView
              posts={posts}
              onSelectPostToEdit={handleSelectPostToEdit}
              onDeletePost={handleDeletePost}
              onPublishNow={handlePublishNow}
              onNewPost={handleStartNewBlankPost}
              filterPlatform={selectedPlatform}
              filterStatus={selectedStatus}
              searchQuery={searchQuery}
            />
          )}
        </main>

        {/* Right Studio Panel (Composer & Live Preview) - Collapsible with layout toggle */}
        {isRightPanelOpen && (
          <aside className="w-full sm:w-[420px] lg:w-[460px] 2xl:w-[500px] shrink-0 h-full flex flex-col bg-[#0d1117] border-l border-white/[0.08] overflow-hidden z-20">
            {/* Panel Switcher Tabs */}
            <div className="h-11 border-b border-white/[0.08] px-3 flex items-center justify-between shrink-0 bg-[#0d1117]">
              <div className="flex items-center gap-1 bg-[#121620] p-0.5 rounded-lg border border-white/[0.06] text-xs">
                <button
                  onClick={() => setRightPanelTab('composer')}
                  className={`px-3 py-1 rounded-md font-medium flex items-center gap-1.5 transition-all ${
                    rightPanelTab === 'composer'
                      ? 'bg-white/[0.12] text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  id="tab-composer"
                >
                  <PenTool className="w-3 h-3 text-emerald-400" />
                  <span>Szerkesztő</span>
                </button>
                <button
                  onClick={() => setRightPanelTab('preview')}
                  className={`px-3 py-1 rounded-md font-medium flex items-center gap-1.5 transition-all ${
                    rightPanelTab === 'preview'
                      ? 'bg-white/[0.12] text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  id="tab-preview"
                >
                  <Eye className="w-3 h-3 text-blue-400" />
                  <span>Élő Előnézet</span>
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsRightPanelOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                  title="Panel elrejtése (Teljes képernyős naptár)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden">
              {rightPanelTab === 'composer' ? (
                <PostComposer
                  initialPost={editingPost}
                  targetDate={selectedDateForNew}
                  onSave={handleSavePost}
                  onCancelEdit={() => setEditingPost(null)}
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
              ) : (
                <LivePreview
                  platforms={currentPlatforms}
                  baseText={currentText}
                  mediaUrls={currentMedia}
                  customContent={currentCustomContent}
                  scheduledAt={currentScheduledAt}
                />
              )}
            </div>
          </aside>
        )}
      </div>

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

      {/* Supabase Setup & SQL Schema Modal */}
      <SupabaseSetupModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onConnectionChanged={loadPosts}
        isMockMode={isMockMode}
      />
    </div>
  );
}
