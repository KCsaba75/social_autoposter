import { Platform, PostStatus, PlatformConfig } from '../types';

export const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  facebook: {
    id: 'facebook',
    name: 'Facebook Oldal',
    handle: '@brand_official_page',
    color: '#1877F2',
    bgColor: 'bg-blue-600/10 text-blue-400 border-blue-500/30',
    borderColor: 'border-blue-500/40',
    activeBadgeClass: 'bg-blue-600 text-white',
    maxCharacters: 63206,
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram Feed & Reel',
    handle: '@brandofficial',
    color: '#E1306C',
    bgColor: 'bg-pink-600/10 text-pink-400 border-pink-500/30',
    borderColor: 'border-pink-500/40',
    activeBadgeClass: 'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white',
    maxCharacters: 2200,
  },
  threads: {
    id: 'threads',
    name: 'Threads Szál',
    handle: '@brandofficial',
    color: '#FFFFFF',
    bgColor: 'bg-zinc-800/60 text-zinc-200 border-zinc-700',
    borderColor: 'border-zinc-550',
    activeBadgeClass: 'bg-zinc-100 text-zinc-950 font-semibold',
    maxCharacters: 500,
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube Shorts / Videó',
    handle: 'Brand Official Tech',
    color: '#FF0000',
    bgColor: 'bg-red-600/10 text-red-400 border-red-500/30',
    borderColor: 'border-red-500/40',
    activeBadgeClass: 'bg-red-600 text-white',
    maxCharacters: 5000,
  },
};

export const STATUS_CONFIG: Record<
  PostStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  draft: {
    label: 'Piszkozat',
    bg: 'bg-zinc-800/70',
    text: 'text-zinc-300',
    border: 'border-zinc-700',
    dot: 'bg-zinc-400',
  },
  scheduled: {
    label: 'Időzítve',
    bg: 'bg-emerald-950/40',
    text: 'text-emerald-400',
    border: 'border-emerald-800/40',
    dot: 'bg-emerald-400',
  },
  publishing: {
    label: 'Közzététel...',
    bg: 'bg-amber-950/40',
    text: 'text-amber-400',
    border: 'border-amber-800/40',
    dot: 'bg-amber-400 animate-pulse',
  },
  published: {
    label: 'Közzétéve',
    bg: 'bg-blue-950/40',
    text: 'text-blue-400',
    border: 'border-blue-800/40',
    dot: 'bg-blue-400',
  },
  failed: {
    label: 'Hiba',
    bg: 'bg-rose-950/40',
    text: 'text-rose-400',
    border: 'border-rose-800/40',
    dot: 'bg-rose-500',
  },
  partial: {
    label: 'Részleges',
    bg: 'bg-amber-950/40',
    text: 'text-amber-400',
    border: 'border-amber-800/40',
    dot: 'bg-amber-400',
  },
};

export const SAMPLE_EMOJIS = ['🚀', '✨', '💡', '🔥', '🎉', '📌', '📈', '💬', '❤️', '🎬', '🌟', '👇', '🎯', '⚡'];

export const SAMPLE_IMAGES = [
  {
    title: 'Technológiai iroda & csapat',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=80',
  },
  {
    title: 'Modern termék bemutató',
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80',
  },
  {
    title: 'Kreatív design munka',
    url: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=1000&q=80',
  },
  {
    title: 'Közösségi találkozó',
    url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1000&q=80',
  },
];
