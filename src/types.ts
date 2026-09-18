export type Platform = 'facebook' | 'instagram' | 'threads' | 'youtube';

export type PostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'partial';

export type MediaFormat = 'post' | 'reel' | 'story';

// ===================================================
// RELATIONAL DATABASE TYPES (SUPABASE MULTI-ACCOUNT & MULTI-PLATFORM)
// ===================================================

export type SocialAccountPlatformType =
  | 'facebook_page'
  | 'facebook_profile'
  | 'instagram'
  | 'youtube'
  | 'threads';

export interface SocialAccount {
  id: string;
  platform: SocialAccountPlatformType;
  basePlatform: Platform;
  name: string;
  handle?: string;
  platformNativeId?: string; // e.g. Facebook Page ID, YouTube Channel ID
  avatarUrl?: string;
  accessToken?: string;
  authMode?: SocialAuthMode;
  username?: string;
  password?: string;
  appId?: string;
  appSecret?: string;
  accountType?: 'business' | 'personal';
  notes?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface FacebookPostRecord {
  id?: string;
  post_id?: string;
  account_id?: string;
  target_type: 'page' | 'profile';
  message: string;
  format: MediaFormat;
  media_urls?: string[];
  link_url?: string;
  call_to_action?: string;
  hashtags?: string;
  first_comment?: string;
  status: PostStatus;
  published_post_id?: string;
  error_log?: string | null;
  created_at?: string;
}

export interface InstagramPostRecord {
  id?: string;
  post_id?: string;
  account_id?: string;
  caption: string;
  format: MediaFormat;
  media_urls?: string[];
  is_reel?: boolean;
  hashtags?: string;
  first_comment?: string;
  audio_track_name?: string;
  collaborators?: string[];
  status: PostStatus;
  published_post_id?: string;
  error_log?: string | null;
  created_at?: string;
}

export interface YouTubePostRecord {
  id?: string;
  post_id?: string;
  account_id?: string;
  video_title: string;
  description: string;
  format: 'video' | 'shorts';
  video_url?: string;
  thumbnail_url?: string;
  tags?: string[];
  privacy_status: 'public' | 'unlisted' | 'private';
  category_id?: string;
  status: PostStatus;
  published_video_id?: string;
  error_log?: string | null;
  created_at?: string;
}

export interface ThreadsPostRecord {
  id?: string;
  post_id?: string;
  account_id?: string;
  text: string;
  media_urls?: string[];
  status: PostStatus;
  created_at?: string;
}

export interface ScheduledMasterPost {
  id: string;
  scheduled_at: string;
  status: PostStatus;
  title?: string;
  campaign_name?: string;
  notes?: string;
  created_at: string;
  error_log?: string | null;
  // Relational sub-posts
  facebook_posts?: FacebookPostRecord[];
  instagram_posts?: InstagramPostRecord[];
  youtube_posts?: YouTubePostRecord[];
  threads_posts?: ThreadsPostRecord[];
}

export interface InstagramCustomContent {
  hashtags?: string;
  firstComment?: string;
  isReel?: boolean; // backwards compatible
  format?: MediaFormat; // 'post' | 'reel' | 'story'
  storyLink?: string;
  storyStickerText?: string;
  audioTrackName?: string;
}

export type FacebookTargetType = 'page' | 'profile' | 'both';

export interface FacebookCustomContent {
  linkPreviewTitle?: string;
  format?: MediaFormat; // 'post' | 'reel' | 'story'
  targetType?: FacebookTargetType; // 'page' (Üzleti oldal) | 'profile' (Saját profil / fiók) | 'both' (Mindkettő)
  targetName?: string; // pl. "TechFlow Kft. Oldal" vagy "Kovács János (Saját profil)"
  storyLink?: string;
  callToAction?: 'LEARN_MORE' | 'SHOP_NOW' | 'SIGN_UP' | 'CONTACT_US' | 'NONE';
  firstComment?: string;
  hashtags?: string;
}

export interface YouTubeCustomContent {
  title?: string;
  description?: string;
  visibility?: 'public' | 'unlisted' | 'private';
  format?: 'video' | 'shorts';
  channelName?: string;
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
  // Multi-account references
  account_ids?: string[];
  target_accounts?: {
    id: string;
    name: string;
    platform: SocialAccountPlatformType;
    basePlatform: Platform;
    handle?: string;
    avatarUrl?: string;
    accountType?: 'business' | 'personal';
  }[];
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

export type SocialAuthMode = 'credentials' | 'api_token';

export interface SocialAccountCredential {
  platform: Platform;
  connected: boolean;
  accountName: string;
  handle: string;
  avatarUrl?: string;
  authMode: SocialAuthMode;
  // Login credentials mode:
  username?: string;
  password?: string;
  profileUrl?: string;
  // API Token mode:
  accessToken?: string;
  accountId?: string; // Page ID, Instagram Business ID, or YouTube Channel ID
  appId?: string;
  appSecret?: string;
  lastConnectedAt?: string;
  // Facebook specific dual account support:
  facebookPageName?: string;
  facebookPageId?: string;
  facebookProfileName?: string;
  facebookProfileHandle?: string;
  fbDefaultTarget?: FacebookTargetType;
  pageName?: string;
  pageId?: string;
  profileName?: string;
  profileId?: string;
}

export interface PlatformPublishResult {
  platform: Platform | SocialAccountPlatformType | string;
  accountName?: string;
  success: boolean;
  status: 'published' | 'failed' | 'simulated' | 'missing_credentials';
  message: string;
  publishedPostId?: string;
  error?: string;
  details?: string;
}

export interface PostPublishResponse {
  success: boolean;
  overallStatus: PostStatus;
  postId: string;
  message: string;
  platformResults: PlatformPublishResult[];
  tips?: string[];
  webhookDispatched?: boolean;
  outboundWebhookUrl?: string;
}
