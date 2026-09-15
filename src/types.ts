export type Platform = 'facebook' | 'instagram' | 'threads' | 'youtube';

export type PostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';

export type MediaFormat = 'post' | 'reel' | 'story';

export interface InstagramCustomContent {
  hashtags?: string;
  firstComment?: string;
  isReel?: boolean; // backwards compatible
  format?: MediaFormat; // 'post' | 'reel' | 'story'
  storyLink?: string;
  storyStickerText?: string;
  audioTrackName?: string;
}

export interface FacebookCustomContent {
  linkPreviewTitle?: string;
  format?: MediaFormat; // 'post' | 'reel' | 'story'
  storyLink?: string;
  callToAction?: 'LEARN_MORE' | 'SHOP_NOW' | 'SIGN_UP' | 'CONTACT_US' | 'NONE';
}

export interface YouTubeCustomContent {
  title?: string;
  description?: string;
  visibility?: 'public' | 'unlisted' | 'private';
}

export interface ThreadsCustomContent {
  threadReplies?: string[];
}

export interface CustomContent {
  instagram?: InstagramCustomContent;
  youtube?: YouTubeCustomContent;
  threads?: ThreadsCustomContent;
  facebook?: FacebookCustomContent;
  [key: string]: unknown;
}

export interface Post {
  id: string;
  created_at: string;
  scheduled_at: string;
  status: PostStatus;
  base_text: string;
  media_urls: string[];
  custom_content: CustomContent;
  platforms: Platform[];
  error_log?: string | null;
}

export interface PlatformConfig {
  id: Platform;
  name: string;
  handle: string;
  color: string;
  bgColor: string;
  borderColor: string;
  activeBadgeClass: string;
  maxCharacters?: number;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}
