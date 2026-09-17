import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Clock,
  Save,
  Image as ImageIcon,
  Video,
  UploadCloud,
  X,
  Smile,
  Hash,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  Calendar as CalendarIcon,
  Sparkles,
  RefreshCw,
  Plus,
  Lock,
  Globe,
  Compass,
  Film,
  Clapperboard,
  Link2,
  Music,
  Info,
  Play,
  MessageSquare,
  Trash2,
  Building2,
  User,
  Users,
} from 'lucide-react';
import {
  Platform,
  Post,
  PostStatus,
  MediaFormat,
  FacebookTargetType,
  CustomContent,
  InstagramCustomContent,
  YouTubeCustomContent,
  ThreadsCustomContent,
  FacebookCustomContent,
} from '../types';
import {
  PLATFORM_CONFIGS,
  SAMPLE_EMOJIS,
  SAMPLE_IMAGES,
} from '../lib/constants';
import { PlatformIcon } from './PlatformIcon';
import { apiUploadMedia } from '../lib/supabase';
import { canDeletePost } from '../lib/postPermissions';

interface PostComposerProps {
  initialPost?: Post | null;
  targetDate?: Date | null;
  onSave: (
    post: Omit<Post, 'id' | 'created_at'> & { id?: string },
    action: 'draft' | 'schedule' | 'publish'
  ) => Promise<void>;
  onCancelEdit?: () => void;
  onDelete?: (post: Post) => void;
  // State lifted for real-time live preview
  currentPlatforms: Platform[];
  setCurrentPlatforms: (p: Platform[]) => void;
  currentText: string;
  setCurrentText: (t: string) => void;
  currentMedia: string[];
  setCurrentMedia: (m: string[]) => void;
  currentCustomContent: CustomContent;
  setCurrentCustomContent: (c: CustomContent) => void;
  currentScheduledAt: string;
  setCurrentScheduledAt: (s: string) => void;
}

export const PostComposer: React.FC<PostComposerProps> = ({
  initialPost,
  targetDate,
  onSave,
  onCancelEdit,
  onDelete,
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
  const [activeTab, setActiveTab] = useState<'general' | Platform>('general');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active single platform - enforce 1 post = 1 platform policy
  const selectedPlatform: Platform = currentPlatforms[0] || 'instagram';

  // Sync initial post if provided
  useEffect(() => {
    if (initialPost) {
      const p =
        initialPost.platforms && initialPost.platforms.length > 0
          ? [initialPost.platforms[0]]
          : (['instagram'] as Platform[]);
      setCurrentPlatforms(p);
      setActiveTab(p[0]);
      setCurrentText(initialPost.base_text);
      setCurrentMedia(initialPost.media_urls || []);
      setCurrentCustomContent(initialPost.custom_content || {});
      setCurrentScheduledAt(initialPost.scheduled_at);
    } else if (targetDate) {
      // Set to target date at 12:00 if new post on a date
      const d = new Date(targetDate);
      d.setHours(12, 0, 0, 0);
      const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setCurrentScheduledAt(iso);
    }
  }, [initialPost, targetDate]);

  // Ensure scheduled date defaults to tomorrow 10:00 if empty
  useEffect(() => {
    if (!currentScheduledAt) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      const iso = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setCurrentScheduledAt(iso);
    }
  }, [currentScheduledAt]);

  // Single-platform selection handler (1 post = 1 platform)
  const handleSelectPlatform = (p: Platform) => {
    setCurrentPlatforms([p]);
    setActiveTab(p);
  };

  // Media file upload handler
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setIsUploading(true);
    setUploadProgress(10);
    setUploadMessage('Feltöltés a Supabase Storage social-media-assets bucketbe...');

    try {
      const result = await apiUploadMedia(file, (percent) => {
        setUploadProgress(percent);
      });

      setCurrentMedia([...currentMedia, result.url]);
      setUploadMessage(
        result.isMock
          ? 'Média hozzáadva (helyi mock URL)'
          : 'Sikeresen feltöltve a Supabase Storage-ba!'
      );
      setTimeout(() => setUploadMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Feltöltési hiba';
      setUploadMessage(`Hiba: ${msg}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveMedia = (indexToRemove: number) => {
    setCurrentMedia(currentMedia.filter((_, idx) => idx !== indexToRemove));
  };

  const handleInsertSampleImage = (url: string) => {
    setCurrentMedia([...currentMedia, url]);
  };

  const handleInsertEmoji = (emoji: string) => {
    setCurrentText((prev) => prev + emoji);
  };

  // Quick preset dates
  const handleQuickDatePreset = (preset: 'now' | 'plus1h' | 'today18' | 'tomorrow09' | 'tomorrow18') => {
    const d = new Date();
    if (preset === 'now') {
      // 2 minutes in future
      d.setMinutes(d.getMinutes() + 2);
    } else if (preset === 'plus1h') {
      d.setHours(d.getHours() + 1);
    } else if (preset === 'today18') {
      d.setHours(18, 0, 0, 0);
    } else if (preset === 'tomorrow09') {
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
    } else if (preset === 'tomorrow18') {
      d.setDate(d.getDate() + 1);
      d.setHours(18, 0, 0, 0);
    }

    const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setCurrentScheduledAt(iso);
  };

  // Form submission
  const handleSubmit = async (action: 'draft' | 'schedule' | 'publish') => {
    if (!currentText.trim() && currentMedia.length === 0) {
      alert('Kérjük, adj meg szöveget vagy tölts fel egy médiatartalmat!');
      return;
    }

    setIsSubmitting(true);
    try {
      let status: PostStatus = 'scheduled';
      let scheduleIso = new Date(currentScheduledAt).toISOString();

      if (action === 'draft') {
        status = 'draft';
      } else if (action === 'publish') {
        status = 'published';
        scheduleIso = new Date().toISOString();
      }

      await onSave(
        {
          id: initialPost?.id,
          scheduled_at: scheduleIso,
          status,
          base_text: currentText,
          media_urls: currentMedia,
          custom_content: currentCustomContent,
          platforms: [selectedPlatform],
          error_log: null,
        },
        action
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Threads Character Count limit (500)
  const threadsLength = currentText.length;
  const isThreadsOverLimit = threadsLength > 500;
  const isThreadsSelected = selectedPlatform === 'threads';

  return (
    <div className="bg-[#0d1117] flex flex-col h-full overflow-hidden text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08] px-4 pt-4 shrink-0">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Send className="w-3.5 h-3.5 text-emerald-400" />
            {initialPost ? 'Poszt Módosítása' : 'Tartalom Készítő & Időzítő'}
          </h2>
          <p className="text-[11px] text-slate-400">
            Egy poszt = Egy platform • Méretre és formátumra szabott tartalom
          </p>
        </div>

        {initialPost && onCancelEdit && (
          <button
            onClick={onCancelEdit}
            className="text-[11px] px-2.5 py-1 rounded-md bg-[#121620] hover:bg-[#181d2a] text-slate-300 border border-white/[0.06] transition-colors"
          >
            Mégse / Új
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {/* 1. Single Platform Selector (One post = One platform policy) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-mono font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Célplatform (Egy poszt = Egy platform)
            </label>
            <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
              Külön képarány & megjelenés
            </span>
          </div>

          {/* Rule banner explaining why 1 post = 1 platform */}
          <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-[11px] text-emerald-300/90 flex items-start gap-2">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Minden platform eltérő képméretet és formátumot igényel</strong> (pl. Instagram Story/Reel 9:16, YouTube 16:9, Facebook Feed 1:1 / 1.91:1). Ezért egy bejegyzés egy adott felülethez készül a tökéletes, torzításmentes megjelenésért.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['instagram', 'facebook', 'youtube', 'threads'] as Platform[]).map((plat) => {
              const isSelected = selectedPlatform === plat;
              const config = PLATFORM_CONFIGS[plat];

              return (
                <button
                  key={plat}
                  type="button"
                  onClick={() => handleSelectPlatform(plat)}
                  className={`p-2.5 rounded-xl border flex flex-col gap-1 transition-all text-left relative ${
                    isSelected
                      ? 'bg-[#181d2a] border-emerald-500 text-white shadow-md ring-2 ring-emerald-500/30'
                      : 'bg-[#121620] text-slate-400 border-white/[0.06] hover:border-white/[0.15] hover:text-slate-200'
                  }`}
                  id={`select-platform-${plat}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-1.5">
                      <PlatformIcon platform={plat} size="sm" />
                      <span className="text-xs font-bold capitalize">{plat}</span>
                    </div>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {plat === 'instagram' && '1:1, 4:5 v. 9:16'}
                    {plat === 'facebook' && '1.91:1 v. 9:16'}
                    {plat === 'youtube' && '16:9 v. 9:16 Shorts'}
                    {plat === 'threads' && '1:1 / 500 kar.'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Main Text Area with Emoji Bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
              Központi Szöveg
            </label>
            <div className="flex items-center gap-2">
              {/* Emoji quick toggle */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/[0.06] transition-colors"
              >
                <Smile className="w-3.5 h-3.5 text-amber-400" />
                <span>Emojik</span>
              </button>

              {/* Threads counter badge if threads selected */}
              {isThreadsSelected && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isThreadsOverLimit
                      ? 'bg-rose-950 text-rose-300 border border-rose-800 font-bold animate-pulse'
                      : threadsLength > 400
                        ? 'bg-amber-950 text-amber-300'
                        : 'text-slate-500'
                  }`}
                  title="Threads 500 karakteres korlát"
                >
                  {threadsLength}/500 kar.
                </span>
              )}
            </div>
          </div>

          {/* Quick emoji drawer */}
          {showEmojiPicker && (
            <div className="p-2 mb-2 rounded-lg bg-[#121620] border border-white/[0.08] flex flex-wrap gap-1.5">
              {SAMPLE_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleInsertEmoji(emoji)}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/[0.08] text-sm hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <div className="relative">
            <textarea
              rows={4}
              value={currentText}
              onChange={(e) => setCurrentText(e.target.value)}
              placeholder="Írd ide a posztod szövegét... Használj figyelemfelkeltő felhívást és emojikat! 🚀"
              className="w-full bg-[#121620] border border-white/[0.08] rounded-lg p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 transition-colors resize-y leading-relaxed font-sans"
              id="post-base-textarea"
            />
          </div>

          {isThreadsSelected && isThreadsOverLimit && (
            <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              A szöveg túllépte a Threads 500 karakteres korlátját!
            </p>
          )}
        </div>

        {/* 3. Media Manager (Supabase Storage: social-media-assets) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
              Média Kezelő (Supabase Storage: social-media-assets)
            </label>
            <span className="text-[10px] text-zinc-500 font-mono">
              {currentMedia.length} csatolt média
            </span>
          </div>

          {/* Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFileUpload(e.dataTransfer.files);
            }}
            className="border-2 border-dashed border-zinc-800 hover:border-indigo-500/60 rounded-xl p-3.5 flex flex-col items-center justify-center gap-2 cursor-pointer bg-zinc-950/40 hover:bg-zinc-950/80 transition-all text-center group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileUpload(e.target.files)}
              accept="image/*,video/*"
              className="hidden"
            />

            <div className="w-8 h-8 rounded-full bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              {isUploading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
              ) : (
                <UploadCloud className="w-4 h-4" />
              )}
            </div>

            <div>
              <p className="text-xs text-zinc-300 font-medium">
                {isUploading ? 'Feltöltés folyamatban...' : 'Húzd ide a fájlt vagy kattints a tallózáshoz'}
              </p>
              <p className="text-[10px] text-zinc-500">
                Képek (JPG, PNG, WebP) és Videók (MP4) feltöltése a Supabase Storage tárhelyre
              </p>
            </div>
          </div>

          {/* Dynamic Platform & Format Aspect Ratio Guide */}
          <div className="px-3 py-2 rounded-lg bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between text-[11px] text-slate-300">
            <div className="flex items-center gap-1.5">
              <PlatformIcon platform={selectedPlatform} size="sm" />
              <span className="font-mono text-emerald-300 font-medium">
                {selectedPlatform === 'instagram' && (
                  (currentCustomContent.instagram?.format === 'story' || currentCustomContent.instagram?.format === 'reel')
                    ? '9:16 Vertikális (1080×1920 px) • Reels/Story'
                    : '1:1 Négyzet (1080×1080) v. 4:5 Álló (1080×1350) • Feed'
                )}
                {selectedPlatform === 'facebook' && (
                  (currentCustomContent.facebook?.format === 'story' || currentCustomContent.facebook?.format === 'reel')
                    ? '9:16 Vertikális (1080×1920 px) • Reels/Story'
                    : '1.91:1 Fekvő (1200×630) v. 1:1 Négyzet • Hírfolyam'
                )}
                {selectedPlatform === 'youtube' && (
                  currentCustomContent.youtube?.format === 'shorts'
                    ? '9:16 Vertikális (1080×1920 px, max 60s) • Shorts'
                    : '16:9 Fekvő FHD (1920×1080 px) • Videó & Indexkép'
                )}
                {selectedPlatform === 'threads' && '1:1 Négyzet (1080×1080 px) • Threads Média'}
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono font-semibold uppercase">
              Optimális Képméret
            </span>
          </div>

          {/* Upload Progress bar */}
          {isUploading && (
            <div className="space-y-1">
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-indigo-400 text-right">{uploadProgress}%</p>
            </div>
          )}

          {uploadMessage && (
            <p className="text-[11px] text-zinc-300 bg-zinc-800/80 px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-zinc-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              {uploadMessage}
            </p>
          )}

          {/* Media Thumbnails List with Delete Button */}
          {currentMedia.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
              {currentMedia.map((url, idx) => (
                <div
                  key={idx}
                  className="relative group rounded-lg overflow-hidden border border-zinc-800 bg-black aspect-video"
                >
                  <img
                    src={url}
                    alt={`Attachment ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveMedia(idx);
                    }}
                    className="absolute top-1 right-1 p-1 rounded-md bg-black/80 hover:bg-rose-600 text-white transition-colors"
                    title="Média eltávolítása"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Sample images quick-insert for convenient testing */}
          <div className="pt-1">
            <p className="text-[10px] text-zinc-500 mb-1.5">Vagy válassz egy minta képet a teszteléshez:</p>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_IMAGES.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleInsertSampleImage(sample.url)}
                  className="text-[10px] px-2 py-1 rounded bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>{sample.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Platform-Specific Formátum & Képméret Beállítások */}
        <div className="space-y-3 pt-2 border-t border-white/[0.08]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
              <PlatformIcon platform={selectedPlatform} size="sm" />
              <span>{PLATFORM_CONFIGS[selectedPlatform].name} Formátum & Képméret</span>
            </label>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              1 poszt = 1 platform
            </span>
          </div>

          {/* Instagram Specific */}
          {selectedPlatform === 'instagram' && (
            <div className="p-3.5 bg-[#121620] rounded-xl border border-white/[0.08] space-y-3.5 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <span className="text-xs font-semibold text-pink-400 flex items-center gap-1.5">
                  <PlatformIcon platform="instagram" size="sm" />
                  Instagram Tartalom Típusa & Beállítások
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-300 border border-pink-500/20 uppercase">
                  {currentCustomContent.instagram?.format || (currentCustomContent.instagram?.isReel ? 'reel' : 'post')}
                </span>
              </div>

              {/* Format Selector: Post vs Reel vs Story */}
              <div>
                <label className="block text-[11px] font-mono font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                  Instagram Formátum
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'post', label: 'Feed Poszt', desc: '1:1 / 4:5 Kép/Videó', icon: ImageIcon },
                    { id: 'reel', label: 'Reels', desc: '9:16 Vertikális videó', icon: Film },
                    { id: 'story', label: 'Story', desc: '24h 9:16 Eltűnő tartalom', icon: Clapperboard },
                  ].map(({ id, label, desc, icon: Icon }) => {
                    const currentFmt = currentCustomContent.instagram?.format || (currentCustomContent.instagram?.isReel ? 'reel' : 'post');
                    const isSelected = currentFmt === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() =>
                          setCurrentCustomContent({
                            ...currentCustomContent,
                            instagram: {
                              ...currentCustomContent.instagram,
                              format: id as MediaFormat,
                              isReel: id === 'reel',
                            },
                          })
                        }
                        className={`p-2 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                          isSelected
                            ? 'bg-gradient-to-br from-pink-950/40 to-purple-950/30 border-pink-500/60 text-white ring-1 ring-pink-500/30'
                            : 'bg-[#0d1117] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:border-white/[0.12]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-pink-400' : 'text-slate-500'}`} />
                          <span className="text-xs font-semibold">{label}</span>
                        </div>
                        <span className="text-[9px] text-slate-500 line-clamp-1">{desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Instagram Aspect Ratio Guide */}
              <div className="px-2.5 py-1.5 rounded-lg bg-pink-950/20 border border-pink-500/20 flex items-center justify-between text-[11px] text-pink-300">
                <span className="font-mono">
                  {currentCustomContent.instagram?.format === 'story'
                    ? '📐 Story: 1080×1920 px (9:16 vertikális, max 15 mp)'
                    : currentCustomContent.instagram?.format === 'reel'
                      ? '📐 Reels: 1080×1920 px (9:16 vertikális videó, max 90 mp)'
                      : '📐 Feed: 1080×1080 px (1:1 négyzet) vagy 1080×1350 px (4:5 álló)'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400">
                  Optimális Méret
                </span>
              </div>

              {/* Story Specific Controls */}
              {(currentCustomContent.instagram?.format === 'story') && (
                <div className="p-2.5 rounded-lg bg-pink-950/20 border border-pink-500/20 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-pink-300 text-xs font-medium">
                    <Clapperboard className="w-3.5 h-3.5" />
                    <span>Instagram Story Funkciók</span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1">
                      Link Matrica URL (Húzd fel / Kattints a matricára)
                    </label>
                    <div className="relative">
                      <Link2 className="w-3 h-3 text-slate-500 absolute left-2.5 top-2.5" />
                      <input
                        type="url"
                        value={currentCustomContent.instagram?.storyLink || ''}
                        onChange={(e) =>
                          setCurrentCustomContent({
                            ...currentCustomContent,
                            instagram: {
                              ...currentCustomContent.instagram,
                              storyLink: e.target.value,
                            },
                          })
                        }
                        placeholder="https://pelda.hu/akcio"
                        className="w-full bg-[#0d1117] border border-white/[0.08] rounded-md pl-7 pr-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-pink-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1">
                      Matrica Egyedi Felirata (Opcionális CTA)
                    </label>
                    <input
                      type="text"
                      value={currentCustomContent.instagram?.storyStickerText || ''}
                      onChange={(e) =>
                        setCurrentCustomContent({
                          ...currentCustomContent,
                          instagram: {
                            ...currentCustomContent.instagram,
                            storyStickerText: e.target.value,
                          },
                        })
                      }
                      placeholder="Pl. VÁSÁRLÁS MOST 🛍️ vagy TUDJ MEG TÖBBET"
                      className="w-full bg-[#0d1117] border border-white/[0.08] rounded-md px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>
              )}

              {/* Reels Specific Controls */}
              {(currentCustomContent.instagram?.format === 'reel' || currentCustomContent.instagram?.isReel) && (
                <div className="p-2.5 rounded-lg bg-purple-950/20 border border-purple-500/20 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-purple-300 text-xs font-medium">
                    <Film className="w-3.5 h-3.5" />
                    <span>Instagram Reels Zene & Audio</span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1">
                      Zenei sáv / Eredeti hang neve
                    </label>
                    <div className="relative">
                      <Music className="w-3 h-3 text-slate-500 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={currentCustomContent.instagram?.audioTrackName || ''}
                        onChange={(e) =>
                          setCurrentCustomContent({
                            ...currentCustomContent,
                            instagram: {
                              ...currentCustomContent.instagram,
                              audioTrackName: e.target.value,
                            },
                          })
                        }
                        placeholder="Pl. Trending Audio • Synthwave Beats (Original Audio)"
                        className="w-full bg-[#0d1117] border border-white/[0.08] rounded-md pl-7 pr-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Hashtags Input */}
              <div>
                <label className="block text-[11px] font-mono font-medium text-slate-400 mb-1">
                  Hashtagek (Reels és Feed posztokhoz)
                </label>
                <input
                  type="text"
                  value={currentCustomContent.instagram?.hashtags || ''}
                  onChange={(e) =>
                    setCurrentCustomContent({
                      ...currentCustomContent,
                      instagram: {
                        ...currentCustomContent.instagram,
                        hashtags: e.target.value,
                      },
                    })
                  }
                  placeholder="#marketing #socialmedia #growth #budapest #startup"
                  className="w-full bg-[#0d1117] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* First comment (not applicable for stories) */}
              {currentCustomContent.instagram?.format !== 'story' && (
                <div>
                  <label className="block text-[11px] font-mono font-medium text-slate-400 mb-1">
                    Első komment (First Comment engagement booster)
                  </label>
                  <input
                    type="text"
                    value={currentCustomContent.instagram?.firstComment || ''}
                    onChange={(e) =>
                      setCurrentCustomContent({
                        ...currentCustomContent,
                        instagram: {
                          ...currentCustomContent.instagram,
                          firstComment: e.target.value,
                        },
                      })
                    }
                    placeholder="Kattints a linkre a bióban az exkluzív kuponért! 🎁"
                    className="w-full bg-[#0d1117] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-pink-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* YouTube Specific Settings */}
          {selectedPlatform === 'youtube' && (
            <div className="p-3.5 bg-[#121620] rounded-xl border border-white/[0.08] space-y-3.5 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <span className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
                  <PlatformIcon platform="youtube" size="sm" />
                  YouTube Tartalom Típusa & Beállítások
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-300 border border-red-500/20 uppercase">
                  {currentCustomContent.youtube?.format || 'video'}
                </span>
              </div>

              {/* YouTube Format Selector: Video vs Shorts */}
              <div>
                <label className="block text-[11px] font-mono font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                  YouTube Formátum
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'video', label: 'Videó (16:9)', desc: '1920×1080 FHD fekvő videó & indexkép', icon: Play },
                    { id: 'shorts', label: 'YouTube Shorts (9:16)', desc: '1080×1920 álló videó (max 60 mp)', icon: Film },
                  ].map(({ id, label, desc, icon: Icon }) => {
                    const currentFmt = currentCustomContent.youtube?.format || 'video';
                    const isSelected = currentFmt === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() =>
                          setCurrentCustomContent({
                            ...currentCustomContent,
                            youtube: {
                              ...currentCustomContent.youtube,
                              format: id as 'video' | 'shorts',
                            },
                          })
                        }
                        className={`p-2 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                          isSelected
                            ? 'bg-[#181d2a] border-red-500/60 text-white ring-1 ring-red-500/30'
                            : 'bg-[#0d1117] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:border-white/[0.12]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-red-400' : 'text-slate-500'}`} />
                          <span className="text-xs font-semibold">{label}</span>
                        </div>
                        <span className="text-[9px] text-slate-500 line-clamp-1">{desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* YouTube Aspect Ratio Guide */}
              <div className="px-2.5 py-1.5 rounded-lg bg-red-950/20 border border-red-500/20 flex items-center justify-between text-[11px] text-red-300">
                <span className="font-mono">
                  {currentCustomContent.youtube?.format === 'shorts'
                    ? '📐 Shorts: 1080×1920 px (9:16 vertikális videó, max 60 mp)'
                    : '📐 Standard videó: 1920×1080 px (16:9 fekvő) • Bélyegkép: 1280×720 px'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                  Optimális Méret
                </span>
              </div>

              {/* Video Title */}
              <div>
                <label className="block text-[11px] font-mono font-medium text-slate-400 mb-1">
                  Videó Címe (kötelező YouTube-on)
                </label>
                <input
                  type="text"
                  value={currentCustomContent.youtube?.title || ''}
                  onChange={(e) =>
                    setCurrentCustomContent({
                      ...currentCustomContent,
                      youtube: {
                        ...currentCustomContent.youtube,
                        title: e.target.value,
                      },
                    })
                  }
                  placeholder="Hogyan készíts hatékony közösségi média stratégiát 2026-ban?"
                  className="w-full bg-[#0d1117] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-mono font-medium text-slate-400 mb-1">
                  Részletes Leírás & Időbélyegek
                </label>
                <textarea
                  rows={3}
                  value={currentCustomContent.youtube?.description || ''}
                  onChange={(e) =>
                    setCurrentCustomContent({
                      ...currentCustomContent,
                      youtube: {
                        ...currentCustomContent.youtube,
                        description: e.target.value,
                      },
                    })
                  }
                  placeholder="Részletes leírás, linkek, időbélyegek (00:00 - Intro)..."
                  className="w-full bg-[#0d1117] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

              {/* Visibility Select */}
              <div>
                <label className="block text-[11px] font-mono font-medium text-slate-400 mb-1">
                  Láthatóság (Visibility)
                </label>
                <div className="flex items-center gap-2">
                  {[
                    { id: 'public', label: 'Nyilvános', icon: Globe },
                    { id: 'unlisted', label: 'Nem listázott', icon: Compass },
                    { id: 'private', label: 'Privát', icon: Lock },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() =>
                        setCurrentCustomContent({
                          ...currentCustomContent,
                          youtube: {
                            ...currentCustomContent.youtube,
                            visibility: id as 'public' | 'unlisted' | 'private',
                          },
                        })
                      }
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                        (currentCustomContent.youtube?.visibility || 'public') === id
                          ? 'bg-red-950/40 text-red-300 border-red-800/80 ring-1 ring-red-500/20'
                          : 'bg-[#0d1117] text-slate-400 border-white/[0.08] hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Threads Specific Settings */}
          {selectedPlatform === 'threads' && (
            <div className="p-3.5 bg-[#121620] rounded-xl border border-white/[0.08] space-y-3.5 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <PlatformIcon platform="threads" size="sm" />
                  Threads Szál & Karakter Figyelő
                </span>
                <span
                  className={`text-xs font-mono font-semibold ${
                    isThreadsOverLimit ? 'text-rose-400' : 'text-slate-400'
                  }`}
                >
                  {threadsLength} / 500
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#0d1117] h-1.5 rounded-full overflow-hidden border border-white/[0.04]">
                <div
                  className={`h-full transition-all ${
                    isThreadsOverLimit
                      ? 'bg-rose-500'
                      : threadsLength > 400
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (threadsLength / 500) * 100)}%` }}
                />
              </div>

              {/* Threads Aspect Ratio Guide */}
              <div className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-between text-[11px] text-slate-300">
                <span className="font-mono">
                  📐 Threads média: 1080×1080 px (1:1 négyzet) • Max szöveg: 500 karakter
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Optimális Méret
                </span>
              </div>

              {/* Thread continuation */}
              <div>
                <label className="block text-[11px] font-mono font-medium text-slate-400 mb-1">
                  Szál Folytatása (Automatikus 1. válasz szálként)
                </label>
                <input
                  type="text"
                  value={currentCustomContent.threads?.threadReplies?.[0] || ''}
                  onChange={(e) =>
                    setCurrentCustomContent({
                      ...currentCustomContent,
                      threads: {
                        ...currentCustomContent.threads,
                        threadReplies: [e.target.value],
                      },
                    })
                  }
                  placeholder="Kiegészítő gondolat vagy kérdés a közösségnek..."
                  className="w-full bg-[#0d1117] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-slate-500"
                />
              </div>
            </div>
          )}

          {/* Facebook Specific Settings */}
          {selectedPlatform === 'facebook' && (
            <div className="p-3.5 bg-[#121620] rounded-xl border border-white/[0.08] space-y-3.5 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <span className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                  <PlatformIcon platform="facebook" size="sm" />
                  Facebook Fiók Célpont & Tartalom Típus
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/25">
                    {currentCustomContent.facebook?.targetType === 'profile'
                      ? '👤 Saját Profil'
                      : currentCustomContent.facebook?.targetType === 'both'
                      ? '👥 Oldal + Profil'
                      : '🏢 Üzleti Oldal'}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 uppercase">
                    {currentCustomContent.facebook?.format || 'post'}
                  </span>
                </div>
              </div>

              {/* 1. Facebook Target Selector: Page vs Profile vs Both */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-mono font-medium text-slate-400 uppercase tracking-wider">
                    Facebook Célfiók Típusa
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    API: "facebook_target" vagy "targetType"
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    {
                      id: 'page',
                      label: 'Üzleti Oldal',
                      badge: 'Facebook Page',
                      desc: 'Hivatalos márka/cég oldal (Meta Graph API)',
                      icon: Building2,
                    },
                    {
                      id: 'profile',
                      label: 'Saját Profil',
                      badge: 'Személyes fiók',
                      desc: 'Saját személyes profil (Ismerősök elérése)',
                      icon: User,
                    },
                    {
                      id: 'both',
                      label: 'Mindkettő',
                      badge: 'Oldal & Profil',
                      desc: 'Egyszerre publikálva oldalra és saját fiókra',
                      icon: Users,
                    },
                  ].map(({ id, label, badge, desc, icon: Icon }) => {
                    const currentTarget = currentCustomContent.facebook?.targetType || 'page';
                    const isSelected = currentTarget === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() =>
                          setCurrentCustomContent({
                            ...currentCustomContent,
                            facebook: {
                              ...currentCustomContent.facebook,
                              targetType: id as FacebookTargetType,
                            },
                          })
                        }
                        className={`p-2 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                          isSelected
                            ? 'bg-gradient-to-br from-blue-950/60 to-indigo-950/40 border-blue-500/60 text-white ring-1 ring-blue-500/30 shadow-xs'
                            : 'bg-[#0d1117] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:border-white/[0.12]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                            <span className="text-xs font-semibold">{label}</span>
                          </div>
                        </div>
                        <span className="text-[9px] text-slate-500 line-clamp-1">{desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Custom Target Name (e.g. Page Name or Profile Handle) */}
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Oldal vagy Profil Megnevezése (Opcionális)
                </label>
                <input
                  type="text"
                  value={currentCustomContent.facebook?.targetName || ''}
                  onChange={(e) =>
                    setCurrentCustomContent({
                      ...currentCustomContent,
                      facebook: {
                        ...currentCustomContent.facebook,
                        targetName: e.target.value,
                      },
                    })
                  }
                  placeholder={
                    currentCustomContent.facebook?.targetType === 'profile'
                      ? 'pl. Kovács János (Saját profil)'
                      : currentCustomContent.facebook?.targetType === 'both'
                      ? 'pl. Cégünk Hivatalos Oldala + Személyes megosztás'
                      : 'pl. Cégünk Hivatalos Oldala (Page)'
                  }
                  className="w-full bg-[#0d1117] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {/* Format Selector: Post vs Reel vs Story */}
              <div>
                <label className="block text-[11px] font-mono font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                  Facebook Formátum
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'post', label: 'Hírfolyam Poszt', desc: 'Standard bejegyzés linkkel/képpel', icon: ImageIcon },
                    { id: 'reel', label: 'Facebook Reels', desc: '9:16 Rövid videó ajánlásokban', icon: Film },
                    { id: 'story', label: 'Facebook Story', desc: '24 órás történet a profil tetején', icon: Clapperboard },
                  ].map(({ id, label, desc, icon: Icon }) => {
                    const currentFmt = currentCustomContent.facebook?.format || 'post';
                    const isSelected = currentFmt === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() =>
                          setCurrentCustomContent({
                            ...currentCustomContent,
                            facebook: {
                              ...currentCustomContent.facebook,
                              format: id as MediaFormat,
                            },
                          })
                        }
                        className={`p-2 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                          isSelected
                            ? 'bg-gradient-to-br from-blue-950/40 to-cyan-950/30 border-blue-500/60 text-white ring-1 ring-blue-500/30'
                            : 'bg-[#0d1117] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:border-white/[0.12]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                          <span className="text-xs font-semibold">{label}</span>
                        </div>
                        <span className="text-[9px] text-slate-500 line-clamp-1">{desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Facebook Aspect Ratio Guide */}
              <div className="px-2.5 py-1.5 rounded-lg bg-blue-950/20 border border-blue-500/20 flex items-center justify-between text-[11px] text-blue-300">
                <span className="font-mono">
                  {currentCustomContent.facebook?.format === 'story'
                    ? '📐 Story: 1080×1920 px (9:16 vertikális)'
                    : currentCustomContent.facebook?.format === 'reel'
                      ? '📐 Reels: 1080×1920 px (9:16 vertikális videó)'
                      : '📐 Hírfolyam: 1200×630 px (1.91:1) vagy 1080×1080 px (1:1 négyzet)'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                  Optimális Méret
                </span>
              </div>

              {/* Story Specific Controls */}
              {currentCustomContent.facebook?.format === 'story' && (
                <div className="p-2.5 rounded-lg bg-blue-950/20 border border-blue-500/20 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-blue-300 text-xs font-medium">
                    <Clapperboard className="w-3.5 h-3.5" />
                    <span>Facebook Story Link & Gomb</span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1">
                      Story Hivatkozás (Húzd fel link)
                    </label>
                    <div className="relative">
                      <Link2 className="w-3 h-3 text-slate-500 absolute left-2.5 top-2.5" />
                      <input
                        type="url"
                        value={currentCustomContent.facebook?.storyLink || ''}
                        onChange={(e) =>
                          setCurrentCustomContent({
                            ...currentCustomContent,
                            facebook: {
                              ...currentCustomContent.facebook,
                              storyLink: e.target.value,
                            },
                          })
                        }
                        placeholder="https://pelda.hu/termek"
                        className="w-full bg-[#0d1117] border border-white/[0.08] rounded-md pl-7 pr-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1">
                      Story Cselekvésre ösztönző gomb (CTA)
                    </label>
                    <select
                      value={currentCustomContent.facebook?.callToAction || 'NONE'}
                      onChange={(e) =>
                        setCurrentCustomContent({
                          ...currentCustomContent,
                          facebook: {
                            ...currentCustomContent.facebook,
                            callToAction: e.target.value as FacebookCustomContent['callToAction'],
                          },
                        })
                      }
                      className="w-full bg-[#0d1117] border border-white/[0.08] rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="NONE">Nincs gomb</option>
                      <option value="LEARN_MORE">További információk (Learn More)</option>
                      <option value="SHOP_NOW">Vásárlás most (Shop Now)</option>
                      <option value="SIGN_UP">Regisztráció (Sign Up)</option>
                      <option value="CONTACT_US">Kapcsolatfelvétel (Contact Us)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Reels Specific Controls */}
              {currentCustomContent.facebook?.format === 'reel' && (
                <div className="p-2.5 rounded-lg bg-blue-950/20 border border-blue-500/20 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-blue-300 text-xs font-medium">
                    <Film className="w-3.5 h-3.5" />
                    <span>Facebook Reels Beállítások</span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1">
                      Cselekvésre ösztönzés gomb a videó alatt
                    </label>
                    <select
                      value={currentCustomContent.facebook?.callToAction || 'LEARN_MORE'}
                      onChange={(e) =>
                        setCurrentCustomContent({
                          ...currentCustomContent,
                          facebook: {
                            ...currentCustomContent.facebook,
                            callToAction: e.target.value as FacebookCustomContent['callToAction'],
                          },
                        })
                      }
                      className="w-full bg-[#0d1117] border border-white/[0.08] rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="LEARN_MORE">További információk</option>
                      <option value="SHOP_NOW">Vásárlás most</option>
                      <option value="SIGN_UP">Iratkozz fel</option>
                      <option value="NONE">Nincs külön gomb</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Hashtags Input for Facebook */}
              <div>
                <label className="block text-[11px] font-mono font-medium text-slate-400 mb-1">
                  Facebook Hashtagek (Hírfolyam és Reels bejegyzésekhez)
                </label>
                <input
                  type="text"
                  value={currentCustomContent.facebook?.hashtags || ''}
                  onChange={(e) =>
                    setCurrentCustomContent({
                      ...currentCustomContent,
                      facebook: {
                        ...currentCustomContent.facebook,
                        hashtags: e.target.value,
                      },
                    })
                  }
                  placeholder="#facebook #marketing #vallalkozas #uzlet"
                  className="w-full bg-[#0d1117] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Link Preview Title (for standard feed posts) */}
              {(currentCustomContent.facebook?.format === 'post' || !currentCustomContent.facebook?.format) && (
                <div>
                  <label className="block text-[11px] font-mono font-medium text-slate-400 mb-1">
                    Egyedi Link Előnézet Cím (Opcionális)
                  </label>
                  <input
                    type="text"
                    value={currentCustomContent.facebook?.linkPreviewTitle || ''}
                    onChange={(e) =>
                      setCurrentCustomContent({
                        ...currentCustomContent,
                        facebook: {
                          ...currentCustomContent.facebook,
                          linkPreviewTitle: e.target.value,
                        },
                      })
                    }
                    placeholder="Pl. Kattints a weboldalunkra és töltsd le az e-bookot!"
                    className="w-full bg-[#0d1117] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {/* Facebook First Comment (for feed and reels) */}
              {currentCustomContent.facebook?.format !== 'story' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-mono font-medium text-slate-400 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                      <span>Facebook Első Komment (First Comment)</span>
                    </label>
                    <span className="text-[10px] text-blue-400 font-mono">
                      Külső linkek & elérés optimalizálás
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={currentCustomContent.facebook?.firstComment || ''}
                    onChange={(e) =>
                      setCurrentCustomContent({
                        ...currentCustomContent,
                        facebook: {
                          ...currentCustomContent.facebook,
                          firstComment: e.target.value,
                        },
                      })
                    }
                    placeholder="Pl. 🔗 A cikkben említett linket és a letöltést itt találod: https://pelda.hu/letoltes"
                    className="w-full bg-[#0d1117] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 resize-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1 flex items-start gap-1">
                    <span>💡</span>
                    <span><strong>Algoritmus tipp:</strong> A Facebook bünteti a külső linket tartalmazó posztszövegeket. Ha a linket az első kommentbe teszed, a bejegyzés elérése és kattintási aránya magasabb marad!</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 5. Date & Time Scheduler & Presets */}
        <div className="space-y-3 pt-2 border-t border-zinc-800">
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            Ütemezési Időpont & Dátum
          </label>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="datetime-local"
              value={currentScheduledAt}
              onChange={(e) => setCurrentScheduledAt(e.target.value)}
              className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors flex-1"
              id="scheduled-at-input"
            />
          </div>

          {/* Quick presets */}
          <div>
            <p className="text-[10px] text-zinc-500 mb-1.5">Gyors időpont választók:</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickDatePreset('now')}
                className="text-[10px] px-2 py-1 rounded bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
              >
                ⚡ Most azonnal
              </button>
              <button
                type="button"
                onClick={() => handleQuickDatePreset('plus1h')}
                className="text-[10px] px-2 py-1 rounded bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
              >
                +1 óra múlva
              </button>
              <button
                type="button"
                onClick={() => handleQuickDatePreset('today18')}
                className="text-[10px] px-2 py-1 rounded bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
              >
                Ma 18:00 (Csúcsidő)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDatePreset('tomorrow09')}
                className="text-[10px] px-2 py-1 rounded bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
              >
                Holnap 09:00
              </button>
              <button
                type="button"
                onClick={() => handleQuickDatePreset('tomorrow18')}
                className="text-[10px] font-mono px-2 py-1 rounded bg-[#121620] hover:bg-[#181d2a] text-slate-300 border border-white/[0.06] transition-colors"
              >
                Holnap 18:00
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Action Buttons Bar */}
      <div className="p-4 border-t border-white/[0.08] bg-[#0d1117] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit('draft')}
            className="px-3 py-2 rounded-lg bg-[#121620] hover:bg-[#181d2a] text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-white/[0.08] disabled:opacity-50"
            id="btn-save-draft"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Vázlat</span>
          </button>

          {initialPost && onDelete && canDeletePost(initialPost).allowed && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => onDelete(initialPost)}
              className="px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-rose-500/30"
              title={
                initialPost.status === 'draft'
                  ? 'Piszkozat törlése'
                  : 'Jövőbeli időzítés visszavonása és törlése'
              }
              id="btn-delete-composer-post"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>{initialPost.status === 'draft' ? 'Vázlat törlése' : 'Időzítés törlése'}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isSubmitting || isThreadsOverLimit}
            onClick={() => handleSubmit('schedule')}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/[0.1] transition-all disabled:opacity-50 shadow-xs"
            id="btn-schedule-post"
          >
            {isSubmitting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>Időzítés</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting || isThreadsOverLimit}
            onClick={() => handleSubmit('publish')}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 shadow-xs active:scale-[0.98]"
            id="btn-publish-now"
          >
            {isSubmitting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5 stroke-[2.2]" />
            )}
            <span>Közzététel</span>
          </button>
        </div>
      </div>
    </div>
  );
};
