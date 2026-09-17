import React, { useState } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Send,
  Globe,
  ThumbsUp,
  MessageSquare,
  Repeat,
  Play,
  Eye,
  CheckCircle2,
  Lock,
  Compass,
  Film,
  Clapperboard,
  Music,
  Link2,
  ExternalLink,
  ImageIcon,
  Building2,
  User,
  Users,
} from 'lucide-react';
import { Platform, CustomContent } from '../types';
import { PLATFORM_CONFIGS } from '../lib/constants';
import { PlatformIcon } from './PlatformIcon';

interface LivePreviewProps {
  platforms: Platform[];
  baseText: string;
  mediaUrls: string[];
  customContent: CustomContent;
  scheduledAt: string;
}

export const LivePreview: React.FC<LivePreviewProps> = ({
  platforms,
  baseText,
  mediaUrls,
  customContent,
  scheduledAt,
}) => {
  // Select active preview platform among selected platforms (or default to first available)
  const availablePlatforms = platforms.length > 0 ? platforms : (['facebook', 'instagram', 'threads', 'youtube'] as Platform[]);
  const [activePreview, setActivePreview] = useState<Platform>(availablePlatforms[0] || 'facebook');

  // Keep activePreview valid if platforms change
  const currentTab = availablePlatforms.includes(activePreview) ? activePreview : availablePlatforms[0];

  const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80';

  const scheduledDateStr = scheduledAt
    ? new Date(scheduledAt).toLocaleString('hu-HU', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Most';

  return (
    <div className="bg-[#0d1117] flex flex-col h-full overflow-hidden text-slate-200">
      {/* Header & Platform Tabs */}
      <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08] px-4 pt-4 shrink-0">
        <div className="flex items-center gap-2">
          <Eye className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-200">Élő Szimuláció</span>
        </div>

        {/* Platform selection tabs */}
        <div className="flex items-center gap-1 bg-[#121620] p-1 rounded-lg border border-white/[0.06]">
          {(['facebook', 'instagram', 'threads', 'youtube'] as Platform[]).map((plat) => {
            const isSelectedForPost = platforms.includes(plat);
            const isActive = currentTab === plat;

            return (
              <button
                key={plat}
                onClick={() => setActivePreview(plat)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white/[0.12] text-white shadow-xs'
                    : isSelectedForPost
                      ? 'text-slate-300 hover:bg-white/[0.06]'
                      : 'text-slate-500 hover:text-slate-300'
                }`}
                title={PLATFORM_CONFIGS[plat].name}
              >
                <PlatformIcon platform={plat} size="sm" />
                <span className="hidden sm:inline capitalize">{plat}</span>
                {isSelectedForPost && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview Simulator Container */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center p-2">
        {/* FACEBOOK PREVIEW */}
        {currentTab === 'facebook' && (
          <div className="w-full flex flex-col items-center">
            {/* Target & Format Indicator Banner */}
            <div className="w-full max-w-[420px] mb-2 px-3 py-2 rounded-xl bg-[#121620] border border-white/[0.08] flex items-center justify-between text-[11px] text-blue-300 shadow-xs">
              <div className="flex items-center gap-2">
                {customContent.facebook?.targetType === 'profile' ? (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/25 font-semibold text-[10px]">
                    <User className="w-3 h-3 text-purple-400" />
                    <span>Saját Profil (Fiók)</span>
                  </span>
                ) : customContent.facebook?.targetType === 'both' ? (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 font-semibold text-[10px]">
                    <Users className="w-3 h-3 text-indigo-400" />
                    <span>Oldal + Profil</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/25 font-semibold text-[10px]">
                    <Building2 className="w-3 h-3 text-blue-400" />
                    <span>Üzleti Oldal (Page)</span>
                  </span>
                )}

                <div className="flex items-center gap-1 font-mono text-[10px] text-slate-300">
                  {customContent.facebook?.format === 'reel' ? (
                    <>
                      <Film className="w-3 h-3 text-blue-400" />
                      <span>Reels</span>
                    </>
                  ) : customContent.facebook?.format === 'story' ? (
                    <>
                      <Clapperboard className="w-3 h-3 text-cyan-400" />
                      <span>Story</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-3 h-3 text-blue-400" />
                      <span>Hírfolyam</span>
                    </>
                  )}
                </div>
              </div>

              <span className="font-mono text-[10px] text-slate-400 truncate max-w-[120px]">
                {customContent.facebook?.targetName || (customContent.facebook?.targetType === 'profile' ? 'Személyes fiók' : 'Facebook Page')}
              </span>
            </div>

            {/* FACEBOOK STORY SIMULATOR (9:16 Phone-style) */}
            {customContent.facebook?.format === 'story' ? (
              <div className="w-full max-w-[340px] aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl relative border border-white/10 flex flex-col justify-between text-white">
                {/* Background Image / Video */}
                {mediaUrls.length > 0 ? (
                  <img
                    src={mediaUrls[0]}
                    alt="Facebook Story media"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-900 via-indigo-950 to-black flex items-center justify-center p-6 text-center text-slate-400 text-xs">
                    <div>
                      <Clapperboard className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                      <span>Csatolj fotót vagy videót a teljes képernyős sztorihoz!</span>
                    </div>
                  </div>
                )}

                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

                {/* Story Top Bar */}
                <div className="relative z-10 p-3 pt-3.5 space-y-2">
                  {/* Progress Line */}
                  <div className="w-full bg-white/30 h-1 rounded-full overflow-hidden">
                    <div className="bg-white h-full w-2/3" />
                  </div>
                  {/* Author Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={defaultAvatar}
                        alt="Profile"
                        className="w-7 h-7 rounded-full border border-white/40 object-cover"
                      />
                      <div>
                        <div className="text-xs font-bold leading-tight drop-shadow-sm flex items-center gap-1">
                          <span>PostPulse Brand</span>
                          <span className="text-[10px] text-blue-400">●</span>
                        </div>
                        <span className="text-[10px] text-white/70">{scheduledDateStr}</span>
                      </div>
                    </div>
                    <MoreHorizontal className="w-4 h-4 text-white/80" />
                  </div>
                </div>

                {/* Story Center Text Overlay (if short text) */}
                <div className="relative z-10 px-4 py-2">
                  {baseText && (
                    <div className="bg-black/50 backdrop-blur-md p-3 rounded-xl border border-white/10 text-white text-xs leading-relaxed max-h-40 overflow-y-auto">
                      {baseText}
                    </div>
                  )}
                </div>

                {/* Story Bottom Interactive Bar & Link */}
                <div className="relative z-10 p-4 space-y-2.5">
                  {/* Link / CTA Sticker */}
                  {customContent.facebook?.storyLink && (
                    <div className="w-full bg-blue-600/90 hover:bg-blue-600 backdrop-blur-md rounded-xl py-2 px-3 flex items-center justify-center gap-1.5 shadow-lg border border-blue-400/40 text-xs font-semibold">
                      <Link2 className="w-3.5 h-3.5" />
                      <span>
                        {customContent.facebook.callToAction === 'SHOP_NOW'
                          ? 'VÁSÁRLÁS MOST'
                          : customContent.facebook.callToAction === 'SIGN_UP'
                            ? 'REGISZTRÁCIÓ'
                            : 'MEGTEKINTÉS'}
                      </span>
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white/20 backdrop-blur-md rounded-full px-3 py-1.5 text-[11px] text-white/80 border border-white/20">
                      Válasz küldése a történetre...
                    </div>
                    <button className="p-2 rounded-full bg-white/20 backdrop-blur-md text-white">
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-full bg-white/20 backdrop-blur-md text-white">
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : customContent.facebook?.format === 'reel' ? (
              /* FACEBOOK REEL SIMULATOR (9:16 Phone-style) */
              <div className="w-full max-w-[340px] aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl relative border border-white/10 flex flex-col justify-between text-white">
                {/* Background media */}
                {mediaUrls.length > 0 ? (
                  <img
                    src={mediaUrls[0]}
                    alt="Facebook Reel media"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-950 via-slate-900 to-black flex items-center justify-center p-6 text-center text-slate-400 text-xs">
                    <div>
                      <Film className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                      <span>Csatolj videót a Facebook Reels megjelenítéshez!</span>
                    </div>
                  </div>
                )}

                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/85 pointer-events-none" />

                {/* Reel Top Bar */}
                <div className="relative z-10 p-3 pt-3.5 flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wide flex items-center gap-1.5 text-white/90">
                    <Film className="w-4 h-4 text-blue-400" />
                    Reels
                  </span>
                  <span className="text-[10px] font-mono bg-blue-500/30 px-2 py-0.5 rounded-full border border-blue-400/40">
                    Facebook
                  </span>
                </div>

                {/* Reel Floating Right Actions */}
                <div className="absolute right-3 bottom-16 z-20 flex flex-col items-center gap-4 text-white">
                  <div className="flex flex-col items-center gap-1 cursor-pointer">
                    <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                      <ThumbsUp className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-[10px] font-mono">1.2k</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 cursor-pointer">
                    <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono">84</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 cursor-pointer">
                    <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono">Megosztás</span>
                  </div>
                </div>

                {/* Reel Bottom Caption & Author */}
                <div className="relative z-10 p-3.5 space-y-2 pr-16">
                  <div className="flex items-center gap-2">
                    <img
                      src={defaultAvatar}
                      alt="Profile"
                      className="w-7 h-7 rounded-full border border-white/40 object-cover"
                    />
                    <span className="text-xs font-bold">PostPulse Brand</span>
                    <button className="text-[10px] font-semibold bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-md border border-white/20">
                      Követés
                    </button>
                  </div>

                  <p className="text-xs text-white/90 line-clamp-3 leading-snug">
                    {baseText || 'Írd be a Reel videód leírását...'}
                  </p>

                  {customContent.facebook?.hashtags && (
                    <p className="text-[11px] text-blue-300 line-clamp-1 font-normal">
                      {customContent.facebook.hashtags}
                    </p>
                  )}

                  {customContent.facebook?.firstComment && (
                    <div className="flex items-center gap-1.5 text-[10px] text-blue-200 bg-blue-950/60 border border-blue-400/30 px-2 py-1 rounded-md">
                      <MessageSquare className="w-3 h-3 text-blue-400 shrink-0" />
                      <span className="truncate">Első komment: {customContent.facebook.firstComment}</span>
                    </div>
                  )}

                  {/* Facebook Reel CTA Button */}
                  {customContent.facebook?.callToAction && customContent.facebook.callToAction !== 'NONE' && (
                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg text-[11px] font-semibold">
                      <span>
                        {customContent.facebook.callToAction === 'SHOP_NOW'
                          ? 'Vásárlás most'
                          : customContent.facebook.callToAction === 'SIGN_UP'
                            ? 'Regisztráció'
                            : 'További információk'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* STANDARD FACEBOOK FEED POST */
              <div className="w-full max-w-[420px] bg-zinc-900 border border-zinc-750 rounded-xl overflow-hidden shadow-2xl text-zinc-100 text-xs">
                {/* FB Header */}
                <div className="p-3 flex items-center justify-between border-b border-zinc-800/60">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={defaultAvatar}
                      alt="Profile"
                      className="w-9 h-9 rounded-full object-cover border border-zinc-700"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-zinc-100 text-xs hover:underline cursor-pointer">
                          {customContent.facebook?.targetName ||
                            (customContent.facebook?.targetType === 'profile'
                              ? 'Saját Profil (Kovács János)'
                              : customContent.facebook?.targetType === 'both'
                              ? 'Üzleti Oldal & Saját Profil'
                              : 'PostPulse Brand Official')}
                        </span>
                        {customContent.facebook?.targetType === 'profile' ? (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 font-medium">
                            Személyes
                          </span>
                        ) : customContent.facebook?.targetType === 'both' ? (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-medium">
                            Oldal + Profil
                          </span>
                        ) : (
                          <span className="text-[10px] text-blue-400 font-semibold">• Követés</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                        <span>{scheduledDateStr}</span>
                        <span>•</span>
                        {customContent.facebook?.targetType === 'profile' ? (
                          <span className="flex items-center gap-0.5 text-zinc-400" title="Ismerősök láthatják">
                            <User className="w-3 h-3 text-zinc-400" />
                            <span>Ismerősök</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 text-zinc-400" title="Nyilvános">
                            <Globe className="w-3 h-3 text-zinc-500" />
                            <span>Nyilvános</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <MoreHorizontal className="w-4 h-4 text-zinc-400" />
                </div>

                {/* FB Post Text */}
                <div className="p-3 whitespace-pre-line text-zinc-200 text-xs leading-relaxed space-y-1">
                  <div>{baseText || 'Írd be a posztod szövegét a bal oldali szerkesztőbe...'}</div>
                  {customContent.facebook?.hashtags && (
                    <p className="text-blue-400 font-normal text-[11px] break-words">
                      {customContent.facebook.hashtags}
                    </p>
                  )}
                </div>

                {/* FB Media */}
                {mediaUrls.length > 0 ? (
                  <div className="relative bg-black max-h-[300px] overflow-hidden flex items-center justify-center">
                    <img
                      src={mediaUrls[0]}
                      alt="Facebook post media"
                      className="w-full h-auto max-h-[300px] object-cover"
                    />
                    {mediaUrls.length > 1 && (
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 backdrop-blur-sm text-white text-[10px] rounded-md font-medium">
                        +{mediaUrls.length - 1} fotó
                      </span>
                    )}
                  </div>
                ) : customContent.facebook?.linkPreviewTitle ? (
                  <div className="p-3 bg-zinc-950 border-t border-b border-zinc-800 text-[11px]">
                    <p className="text-zinc-500 uppercase text-[9px] font-semibold">LINK ELŐNÉZET</p>
                    <p className="font-semibold text-zinc-200 mt-0.5">
                      {customContent.facebook.linkPreviewTitle}
                    </p>
                  </div>
                ) : null}

                {/* FB Reaction Stats Bar */}
                <div className="px-3 py-2 flex items-center justify-between text-[11px] text-zinc-400 border-b border-zinc-800/60">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-[9px] text-white">
                      👍
                    </div>
                    <div className="w-4 h-4 rounded-full bg-rose-600 flex items-center justify-center text-[9px] text-white -ml-2">
                      ❤️
                    </div>
                    <span className="ml-1 text-[10px]">142 kedvelés</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span>28 hozzászólás</span>
                    <span>•</span>
                    <span>9 megosztás</span>
                  </div>
                </div>

                {/* FB Actions Bar */}
                <div className="px-2 py-1 flex items-center justify-around text-zinc-400">
                  <button className="flex-1 py-1.5 flex items-center justify-center gap-1.5 hover:bg-zinc-800/80 rounded-md transition-colors text-xs font-medium">
                    <ThumbsUp className="w-3.5 h-3.5 text-blue-400" />
                    <span>Tetszik</span>
                  </button>
                  <button className="flex-1 py-1.5 flex items-center justify-center gap-1.5 hover:bg-zinc-800/80 rounded-md transition-colors text-xs font-medium">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Hozzászólás</span>
                  </button>
                  <button className="flex-1 py-1.5 flex items-center justify-center gap-1.5 hover:bg-zinc-800/80 rounded-md transition-colors text-xs font-medium">
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Megosztás</span>
                  </button>
                </div>

                {/* FB First Comment Simulator */}
                {customContent.facebook?.firstComment && (
                  <div className="p-3 pt-2.5 bg-zinc-950/70 border-t border-zinc-800/80 space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium">
                      <span className="font-mono">Legrelevánsabb hozzászólás</span>
                      <span className="text-blue-400 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        Ütemezett első komment
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <img
                        src={defaultAvatar}
                        alt="Profile"
                        className="w-7 h-7 rounded-full object-cover border border-zinc-700 mt-0.5"
                      />
                      <div className="flex-1 bg-zinc-800/80 rounded-2xl px-3 py-2 text-xs border border-white/[0.04]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-zinc-100 text-xs">PostPulse Brand Official</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                            Szerző
                          </span>
                        </div>
                        <p className="text-zinc-200 mt-1 whitespace-pre-line leading-relaxed text-[11px]">
                          {customContent.facebook.firstComment}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* INSTAGRAM PREVIEW */}
        {currentTab === 'instagram' && (
          <div className="w-full flex flex-col items-center">
            {/* Format Indicator Banner */}
            <div className="w-full max-w-[390px] mb-2 px-3 py-1.5 rounded-lg bg-pink-950/30 border border-pink-500/20 flex items-center justify-between text-[11px] text-pink-300">
              <div className="flex items-center gap-1.5 font-mono">
                {customContent.instagram?.format === 'story' ? (
                  <>
                    <Clapperboard className="w-3.5 h-3.5 text-pink-400" />
                    <span>Instagram Story (9:16 Eltűnő)</span>
                  </>
                ) : customContent.instagram?.format === 'reel' || customContent.instagram?.isReel ? (
                  <>
                    <Film className="w-3.5 h-3.5 text-purple-400" />
                    <span>Instagram Reels (9:16 Függőleges)</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                    <span>Instagram Feed Poszt (1:1 Négyzet)</span>
                  </>
                )}
              </div>
              <span className="font-mono text-[10px] text-slate-400">
                {customContent.instagram?.format === 'story' ? '24h' : '@brandofficial'}
              </span>
            </div>

            {/* INSTAGRAM STORY SIMULATOR (9:16 Phone-style) */}
            {customContent.instagram?.format === 'story' ? (
              <div className="w-full max-w-[340px] aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl relative border border-white/10 flex flex-col justify-between text-white">
                {/* Background media */}
                {mediaUrls.length > 0 ? (
                  <img
                    src={mediaUrls[0]}
                    alt="Instagram Story media"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-tr from-amber-600 via-pink-600 to-purple-800 flex items-center justify-center p-6 text-center text-white/80 text-xs">
                    <div>
                      <Clapperboard className="w-8 h-8 mx-auto mb-2 text-white" />
                      <span>Csatolj képet az Instagram Storyhoz!</span>
                    </div>
                  </div>
                )}

                {/* Story Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

                {/* Top Story Header */}
                <div className="relative z-10 p-3 pt-3.5 space-y-2">
                  <div className="w-full bg-white/30 h-1 rounded-full overflow-hidden">
                    <div className="bg-white h-full w-4/5" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-0.5 rounded-full bg-gradient-to-tr from-amber-400 to-pink-500">
                        <img
                          src={defaultAvatar}
                          alt="Profile"
                          className="w-6 h-6 rounded-full border border-black object-cover"
                        />
                      </div>
                      <span className="text-xs font-bold leading-tight drop-shadow-sm">
                        brandofficial
                      </span>
                      <span className="text-[10px] text-white/70 font-mono">1h</span>
                    </div>
                    <MoreHorizontal className="w-4 h-4 text-white/80" />
                  </div>
                </div>

                {/* Story Center Text or Sticker */}
                <div className="relative z-10 px-4 py-2 flex flex-col items-center gap-3">
                  {baseText && (
                    <div className="bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/15 text-white text-xs font-medium text-center shadow-lg max-h-36 overflow-y-auto">
                      {baseText}
                    </div>
                  )}

                  {/* Story Interactive Link Sticker */}
                  {customContent.instagram?.storyLink && (
                    <div className="bg-white text-slate-900 rounded-full px-4 py-1.5 flex items-center gap-1.5 shadow-xl font-bold text-xs hover:scale-105 transition-transform cursor-pointer border border-white">
                      <Link2 className="w-3.5 h-3.5 text-pink-600" />
                      <span>{customContent.instagram.storyStickerText || 'HIVATKOZÁS MEGNYITÁSA'}</span>
                    </div>
                  )}
                </div>

                {/* Story Bottom Reply bar */}
                <div className="relative z-10 p-4 flex items-center gap-2.5">
                  <div className="flex-1 bg-white/20 backdrop-blur-md rounded-full px-3.5 py-2 text-xs text-white/80 border border-white/20 flex items-center justify-between">
                    <span>Üzenet küldése...</span>
                  </div>
                  <Heart className="w-6 h-6 text-white cursor-pointer hover:text-pink-500 transition-colors" />
                  <Send className="w-5 h-5 text-white -rotate-45 cursor-pointer" />
                </div>
              </div>
            ) : (customContent.instagram?.format === 'reel' || customContent.instagram?.isReel) ? (
              /* INSTAGRAM REELS SIMULATOR (9:16 Phone-style) */
              <div className="w-full max-w-[340px] aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl relative border border-white/10 flex flex-col justify-between text-white">
                {/* Background media */}
                {mediaUrls.length > 0 ? (
                  <img
                    src={mediaUrls[0]}
                    alt="Instagram Reel media"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-b from-purple-950 via-slate-950 to-black flex items-center justify-center p-6 text-center text-slate-400 text-xs">
                    <div>
                      <Film className="w-8 h-8 mx-auto mb-2 text-pink-400" />
                      <span>Csatolj vertikális videót az Instagram Reelhez!</span>
                    </div>
                  </div>
                )}

                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/85 pointer-events-none" />

                {/* Reels Header */}
                <div className="relative z-10 p-3 pt-3.5 flex items-center justify-between">
                  <span className="text-sm font-bold tracking-wide flex items-center gap-1.5 text-white">
                    <Film className="w-4 h-4 text-pink-400" />
                    Reels
                  </span>
                  <div className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/30 text-pink-200">
                    Instagram
                  </div>
                </div>

                {/* Floating Right Actions for Reels */}
                <div className="absolute right-3 bottom-16 z-20 flex flex-col items-center gap-4 text-white">
                  <div className="flex flex-col items-center gap-1 cursor-pointer">
                    <div className="p-2 rounded-full bg-black/40 backdrop-blur-md">
                      <Heart className="w-6 h-6 hover:text-pink-500 transition-colors" />
                    </div>
                    <span className="text-[10px] font-mono">24.5k</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 cursor-pointer">
                    <div className="p-2 rounded-full bg-black/40 backdrop-blur-md">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono">418</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 cursor-pointer">
                    <div className="p-2 rounded-full bg-black/40 backdrop-blur-md">
                      <Send className="w-5 h-5 -rotate-45" />
                    </div>
                    <span className="text-[10px] font-mono">Megosztás</span>
                  </div>
                  <Bookmark className="w-5 h-5 cursor-pointer opacity-80" />
                </div>

                {/* Reel Bottom Details & Audio */}
                <div className="relative z-10 p-3.5 space-y-2 pr-16">
                  <div className="flex items-center gap-2">
                    <img
                      src={defaultAvatar}
                      alt="Profile"
                      className="w-7 h-7 rounded-full border border-white/40 object-cover"
                    />
                    <span className="text-xs font-bold">brandofficial</span>
                    <button className="text-[10px] font-semibold bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-md border border-white/20">
                      Követés
                    </button>
                  </div>

                  <p className="text-xs text-white/95 line-clamp-2 leading-snug">
                    {baseText || 'Írd be a Reel videód leírását...'}
                  </p>

                  {customContent.instagram?.hashtags && (
                    <p className="text-[11px] text-blue-300 line-clamp-1">
                      {customContent.instagram.hashtags}
                    </p>
                  )}

                  {/* Audio ticker */}
                  <div className="flex items-center gap-1.5 text-[10px] text-white/80 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full w-fit">
                    <Music className="w-3 h-3 text-pink-400 animate-pulse" />
                    <span className="truncate max-w-[180px]">
                      {customContent.instagram?.audioTrackName || 'Eredeti hang • brandofficial'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* STANDARD INSTAGRAM FEED POST */
              <div className="w-full max-w-[390px] bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl text-zinc-100 text-xs">
                {/* IG Header */}
                <div className="p-3 flex items-center justify-between border-b border-zinc-850">
                  <div className="flex items-center gap-2.5">
                    <div className="p-0.5 rounded-full bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600">
                      <img
                        src={defaultAvatar}
                        alt="Instagram profile"
                        className="w-7 h-7 rounded-full object-cover border-2 border-zinc-950"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-zinc-100 text-xs">
                          brandofficial
                        </span>
                        <span className="w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center text-[7px] text-white">
                          ✓
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400">
                        Budapest, Magyarország
                      </span>
                    </div>
                  </div>
                  <MoreHorizontal className="w-4 h-4 text-zinc-400" />
                </div>

                {/* IG Photo/Video Box */}
                <div className="relative bg-zinc-900 aspect-square w-full flex items-center justify-center overflow-hidden">
                  {mediaUrls.length > 0 ? (
                    <img
                      src={mediaUrls[0]}
                      alt="Instagram post media"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 p-6 text-zinc-500 text-center">
                      <span className="text-3xl">📷</span>
                      <span className="text-xs">Csatolj képet az Instagram előnézethez</span>
                    </div>
                  )}
                  {mediaUrls.length > 1 && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px]">
                      1/{mediaUrls.length}
                    </div>
                  )}
                </div>

                {/* IG Actions Bar */}
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-zinc-200">
                      <Heart className="w-5 h-5 hover:text-red-500 cursor-pointer transition-colors" />
                      <MessageCircle className="w-5 h-5 cursor-pointer" />
                      <Send className="w-5 h-5 -rotate-45 cursor-pointer" />
                    </div>
                    <Bookmark className="w-5 h-5 cursor-pointer" />
                  </div>

                  <p className="font-semibold text-xs text-zinc-200">
                    1 482 kedvelés
                  </p>

                  {/* Caption */}
                  <div className="text-xs text-zinc-300 leading-snug">
                    <span className="font-semibold text-white mr-1.5">brandofficial</span>
                    <span className="whitespace-pre-line">{baseText || 'Poszt szöveg helye...'}</span>
                    {customContent.instagram?.hashtags && (
                      <p className="text-blue-400 mt-1 text-[11px] font-normal break-words">
                        {customContent.instagram.hashtags}
                      </p>
                    )}
                  </div>

                  {/* Simulated First Comment */}
                  {customContent.instagram?.firstComment && (
                    <div className="mt-2 pt-2 border-t border-zinc-900 text-xs flex items-start gap-1.5 bg-zinc-900/40 p-2 rounded-lg">
                      <span className="font-semibold text-white">brandofficial:</span>
                      <span className="text-zinc-300">{customContent.instagram.firstComment}</span>
                    </div>
                  )}

                  <p className="text-[10px] text-zinc-500 uppercase tracking-wide pt-1">
                    {scheduledDateStr}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* THREADS PREVIEW */}
        {currentTab === 'threads' && (
          <div className="w-full max-w-[400px] bg-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-2xl text-zinc-100 text-xs">
            <div className="flex items-start gap-3">
              {/* Left Column: Avatar & Continuous Thread Line */}
              <div className="flex flex-col items-center">
                <img
                  src={defaultAvatar}
                  alt="Threads avatar"
                  className="w-9 h-9 rounded-full object-cover border border-zinc-800"
                />
                <div className="w-0.5 flex-1 bg-zinc-800 my-2 min-h-[30px]" />
                <div className="w-4 h-4 rounded-full bg-zinc-800 flex items-center justify-center text-[9px] text-zinc-400">
                  +
                </div>
              </div>

              {/* Right Column: User info, Text, Media, Actions */}
              <div className="flex-1 space-y-2 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-zinc-100 text-xs">
                      brandofficial
                    </span>
                    <span className="w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center text-[7px] text-white">
                      ✓
                    </span>
                    <span className="text-zinc-500 text-[11px]">2ó</span>
                  </div>
                  <MoreHorizontal className="w-4 h-4 text-zinc-500" />
                </div>

                <div className="text-zinc-200 text-xs whitespace-pre-line leading-relaxed">
                  {baseText || 'Oszd meg a gondolataidat a Threads-en...'}
                </div>

                {mediaUrls.length > 0 && (
                  <div className="rounded-xl overflow-hidden border border-zinc-800 max-h-56">
                    <img
                      src={mediaUrls[0]}
                      alt="Threads media"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}

                {/* Simulated Thread Reply */}
                {customContent.threads?.threadReplies &&
                  customContent.threads.threadReplies.length > 0 &&
                  customContent.threads.threadReplies[0] && (
                    <div className="mt-3 pt-3 border-t border-zinc-850 text-xs text-zinc-300">
                      <div className="flex items-center gap-1 text-[11px] text-zinc-400 mb-1">
                        <span className="font-semibold text-zinc-200">brandofficial</span>
                        <span>• További szál</span>
                      </div>
                      <p>{customContent.threads.threadReplies[0]}</p>
                    </div>
                  )}

                {/* Interaction Icons */}
                <div className="flex items-center gap-4 text-zinc-400 pt-2">
                  <button className="flex items-center gap-1 hover:text-red-400 transition-colors">
                    <Heart className="w-4 h-4" />
                    <span className="text-[11px]">86</span>
                  </button>
                  <button className="flex items-center gap-1 hover:text-blue-400 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-[11px]">19</span>
                  </button>
                  <button className="flex items-center gap-1 hover:text-emerald-400 transition-colors">
                    <Repeat className="w-4 h-4" />
                    <span className="text-[11px]">7</span>
                  </button>
                  <button className="hover:text-zinc-200 transition-colors">
                    <Send className="w-4 h-4 -rotate-45" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* YOUTUBE PREVIEW */}
        {currentTab === 'youtube' && (
          <div className="w-full max-w-[420px] bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl text-zinc-100 text-xs">
            {/* Video Thumbnail Frame */}
            <div className="relative aspect-video w-full bg-zinc-900 flex items-center justify-center overflow-hidden group cursor-pointer">
              {mediaUrls.length > 0 ? (
                <img
                  src={mediaUrls[0]}
                  alt="YouTube thumbnail"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center text-zinc-500">
                  <Play className="w-10 h-10 text-red-500 mb-1" />
                  <span className="text-xs">Videó bélyegkép helye</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 fill-white ml-0.5" />
                </div>
              </div>
              <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono font-bold text-white">
                03:45
              </span>
              {/* Visibility Badge */}
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-[10px] text-zinc-300 flex items-center gap-1 border border-zinc-700">
                {customContent.youtube?.visibility === 'private' ? (
                  <>
                    <Lock className="w-3 h-3 text-amber-400" /> Privát
                  </>
                ) : customContent.youtube?.visibility === 'unlisted' ? (
                  <>
                    <Compass className="w-3 h-3 text-cyan-400" /> Nem listázott
                  </>
                ) : (
                  <>
                    <Globe className="w-3 h-3 text-emerald-400" /> Nyilvános
                  </>
                )}
              </span>
            </div>

            {/* Video Info Section */}
            <div className="p-3 space-y-2.5">
              <div className="flex items-start gap-3">
                <img
                  src={defaultAvatar}
                  alt="Channel"
                  className="w-9 h-9 rounded-full object-cover border border-zinc-700 shrink-0 mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-sm text-zinc-100 line-clamp-2 leading-snug">
                    {customContent.youtube?.title || baseText.split('\n')[0] || 'Videó címe megadva YouTube beállításokban'}
                  </h4>
                  <div className="flex items-center gap-1 text-[11px] text-zinc-400 mt-1">
                    <span>Brand Official Studio</span>
                    <span>•</span>
                    <span>1.2K megtekintés</span>
                    <span>•</span>
                    <span>{scheduledDateStr}</span>
                  </div>
                </div>
              </div>

              {/* YouTube Description Snippet */}
              <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-[11px] text-zinc-300">
                <p className="line-clamp-2">
                  {customContent.youtube?.description || baseText || 'Leírás nem lett külön megadva.'}
                </p>
              </div>

              {/* Subscribe button */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-colors">
                    Feliratkozás
                  </button>
                  <button className="px-2.5 py-1.5 rounded-full bg-zinc-800 text-zinc-200 text-xs hover:bg-zinc-700 transition-colors flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3" />
                    <span>324</span>
                  </button>
                </div>
                <button className="px-2.5 py-1.5 rounded-full bg-zinc-800 text-zinc-200 text-xs hover:bg-zinc-700 transition-colors flex items-center gap-1">
                  <Share2 className="w-3 h-3" />
                  <span>Megosztás</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
