import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limit for media base64 / large JSONs
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Supabase Server Client (if configured in env or synced from client)
let serverSupabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
let serverSupabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY || '';

let serverSupabase =
  serverSupabaseUrl && serverSupabaseKey && !serverSupabaseUrl.includes('xyzcompany')
    ? createClient(serverSupabaseUrl, serverSupabaseKey)
    : null;

// Dynamic resolver: checks per-request headers (sent by client) or server-wide instance
function getServerSupabase(req?: express.Request) {
  const headerUrl = (req?.headers['x-supabase-url'] as string)?.trim();
  const headerKey = ((req?.headers['x-supabase-key'] || req?.headers['x-supabase-anon-key']) as string)?.trim();

  if (headerUrl && headerKey && !headerUrl.includes('xyzcompany')) {
    try {
      return createClient(headerUrl, headerKey);
    } catch (e) {
      console.warn('Failed creating Supabase client from request headers:', e);
    }
  }
  return serverSupabase;
}

// In-memory server fallback store (syncs with API clients when Supabase is not yet configured)
interface ServerPost {
  id: string;
  created_at: string;
  scheduled_at: string;
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
  base_text: string;
  media_urls: string[];
  custom_content: Record<string, any>;
  platforms: string[];
  error_log?: string | null;
}

const inMemoryPosts: ServerPost[] = [];

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// ==========================================
// API ROUTES
// ==========================================

// 1. Health check
app.get('/api/health', (req, res) => {
  const activeSupabase = getServerSupabase(req);
  res.json({
    status: 'ok',
    supabaseConnected: !!activeSupabase,
    geminiAvailable: !!process.env.GEMINI_API_KEY,
    inMemoryPostCount: inMemoryPosts.length,
    serverTime: new Date().toISOString(),
  });
});

// 1b. Supabase config synchronization endpoint
app.post('/api/config/supabase', (req, res) => {
  const { url, anonKey, serviceRoleKey } = req.body || {};
  const cleanUrl = url?.trim();
  const cleanKey = (serviceRoleKey || anonKey)?.trim();

  if (cleanUrl && cleanKey && !cleanUrl.includes('xyzcompany')) {
    try {
      serverSupabaseUrl = cleanUrl;
      serverSupabaseKey = cleanKey;
      serverSupabase = createClient(cleanUrl, cleanKey);
      console.log('✅ Server Supabase client connected successfully:', cleanUrl);
      return res.json({ success: true, connected: true, url: cleanUrl });
    } catch (e: any) {
      console.error('❌ Failed to connect Supabase on server:', e);
      return res.status(400).json({ success: false, error: e.message });
    }
  } else if (!cleanUrl) {
    serverSupabase = null;
    serverSupabaseUrl = '';
    serverSupabaseKey = '';
    return res.json({ success: true, connected: false });
  }
  return res.status(400).json({ error: 'Érvénytelen URL vagy anon kulcs.' });
});

// 2. Fetch posts (from Supabase relational tables, legacy table, or memory store)
app.get('/api/posts', async (req, res) => {
  try {
    const activeSupabase = getServerSupabase(req);
    if (activeSupabase) {
      // 1. Try relational scheduled_posts table first
      const { data: schedData, error: schedError } = await activeSupabase
        .from('scheduled_posts')
        .select(`
          id,
          created_at,
          scheduled_at,
          status,
          title,
          campaign_name,
          notes,
          error_log,
          facebook_posts (*),
          instagram_posts (*),
          youtube_posts (*),
          threads_posts (*)
        `)
        .order('scheduled_at', { ascending: true });

      if (!schedError && schedData) {
        const mapped = schedData.map((sp: any) => {
          const fb = sp.facebook_posts?.[0];
          const ig = sp.instagram_posts?.[0];
          const yt = sp.youtube_posts?.[0];
          const th = sp.threads_posts?.[0];
          const platforms: string[] = [];
          if (sp.facebook_posts?.length) platforms.push('facebook');
          if (sp.instagram_posts?.length) platforms.push('instagram');
          if (sp.youtube_posts?.length) platforms.push('youtube');
          if (sp.threads_posts?.length) platforms.push('threads');

          return {
            id: sp.id,
            created_at: sp.created_at,
            scheduled_at: sp.scheduled_at,
            status: sp.status,
            base_text: fb?.message || ig?.caption || yt?.description || th?.text || sp.title || '',
            media_urls: fb?.media_urls || ig?.media_urls || th?.media_urls || [],
            custom_content: {
              ...(fb ? { facebook: { format: fb.format, targetType: fb.target_type, firstComment: fb.first_comment, hashtags: fb.hashtags, callToAction: fb.call_to_action } } : {}),
              ...(ig ? { instagram: { format: ig.format, isReel: ig.is_reel, firstComment: ig.first_comment, hashtags: ig.hashtags } } : {}),
              ...(yt ? { youtube: { title: yt.video_title, description: yt.description, format: yt.format, visibility: yt.privacy_status } } : {}),
            },
            platforms: platforms.length > 0 ? platforms : ['facebook', 'instagram'],
            error_log: sp.error_log,
          };
        });
        return res.json({ posts: mapped, source: 'supabase_relational' });
      }

      // 2. Fallback to legacy posts table
      const { data, error } = await activeSupabase
        .from('posts')
        .select('*')
        .order('scheduled_at', { ascending: true });

      if (!error && data) {
        return res.json({ posts: data, source: 'supabase' });
      } else if (error) {
        console.warn('Supabase fetch error in GET /api/posts:', error.message);
      }
    }
    return res.json({ posts: inMemoryPosts, source: 'in_memory' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message, posts: inMemoryPosts });
  }
});

// Helpers to parse format, hashtags, and first comments from various API payload styles
function parseFormatString(val: any): 'post' | 'reel' | 'story' | undefined {
  if (!val) return undefined;
  const str = String(val).toLowerCase().trim();
  if (str === 'reel' || str === 'reels' || str === 'short' || str === 'shorts' || str.includes('reel')) return 'reel';
  if (str === 'story' || str === 'stories') return 'story';
  if (str === 'feed' || str === 'hirfolyam' || str === 'hírfolyam' || str === 'post' || str === 'timeline') return 'post';
  return undefined;
}

function parseFacebookTarget(val: any): 'page' | 'profile' | 'both' | undefined {
  if (!val) return undefined;
  const str = String(val).toLowerCase().trim();
  if (
    str === 'profile' ||
    str === 'profil' ||
    str === 'sajat' ||
    str === 'saját' ||
    str === 'szemelyes' ||
    str === 'személyes' ||
    str === 'personal' ||
    str === 'user' ||
    str === 'facebook_profile' ||
    str === 'fb_profile'
  ) {
    return 'profile';
  }
  if (
    str === 'page' ||
    str === 'oldal' ||
    str === 'uzleti' ||
    str === 'üzleti' ||
    str === 'business' ||
    str === 'business_page' ||
    str === 'fanpage' ||
    str === 'facebook_page' ||
    str === 'fb_page'
  ) {
    return 'page';
  }
  if (
    str === 'both' ||
    str === 'mindketto' ||
    str === 'mindkettő' ||
    str === 'all' ||
    str === 'egyutt' ||
    str === 'együtt'
  ) {
    return 'both';
  }
  return undefined;
}

function normalizeHashtags(val: any): string | undefined {
  if (!val) return undefined;
  if (Array.isArray(val)) {
    return val
      .map((tag) => {
        const t = String(tag).trim();
        return t.startsWith('#') ? t : `#${t}`;
      })
      .filter(Boolean)
      .join(' ');
  }
  if (typeof val === 'string') {
    return val.trim();
  }
  return undefined;
}

// Helper to normalize and prepare post payload
function normalizeDraftPost(input: any): ServerPost {
  const now = new Date();
  const defaultFutureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // tomorrow same time
  defaultFutureDate.setMinutes(0, 0, 0);

  let scheduledAt = input.scheduled_at || input.scheduledAt || input.date || defaultFutureDate.toISOString();
  // Ensure valid date
  if (isNaN(new Date(scheduledAt).getTime())) {
    scheduledAt = defaultFutureDate.toISOString();
  }

  let rawPlatforms: string[] = ['facebook', 'instagram'];
  if (Array.isArray(input.platforms) && input.platforms.length > 0) {
    rawPlatforms = input.platforms.map((p: any) => String(p).toLowerCase().trim());
  } else if (typeof input.platform === 'string') {
    rawPlatforms = [input.platform.toLowerCase().trim()];
  }

  // Detect specific facebook_page and facebook_profile in platforms array
  const hasFbPage = rawPlatforms.some((p) => p === 'facebook_page' || p === 'facebook:page' || p === 'fb_page');
  const hasFbProfile = rawPlatforms.some((p) => p === 'facebook_profile' || p === 'facebook:profile' || p === 'fb_profile');

  let fbTargetFromPlatforms: 'page' | 'profile' | 'both' | undefined = undefined;
  if (hasFbPage && hasFbProfile) {
    fbTargetFromPlatforms = 'both';
  } else if (hasFbPage) {
    fbTargetFromPlatforms = 'page';
  } else if (hasFbProfile) {
    fbTargetFromPlatforms = 'profile';
  }

  // Map platform strings to valid Platform types ('facebook' | 'instagram' | 'threads' | 'youtube')
  const platformsSet = new Set<string>();
  for (const p of rawPlatforms) {
    if (p.startsWith('facebook') || p.startsWith('fb')) {
      platformsSet.add('facebook');
    } else if (p.startsWith('insta') || p === 'ig') {
      platformsSet.add('instagram');
    } else if (p === 'threads') {
      platformsSet.add('threads');
    } else if (p.startsWith('you') || p === 'yt') {
      platformsSet.add('youtube');
    } else {
      platformsSet.add(p);
    }
  }
  const platforms = Array.from(platformsSet);

  // Handle media URLs
  let mediaUrls: string[] = [];
  if (Array.isArray(input.media_urls)) {
    mediaUrls = input.media_urls;
  } else if (Array.isArray(input.mediaUrls)) {
    mediaUrls = input.mediaUrls;
  } else if (input.media_url) {
    mediaUrls = [input.media_url];
  } else if (input.imageUrl || input.image_url) {
    mediaUrls = [input.imageUrl || input.image_url];
  } else if (input.videoUrl || input.video_url) {
    mediaUrls = [input.videoUrl || input.video_url];
  }

  const baseText = input.base_text || input.baseText || input.text || input.content || input.caption || '';

  // Extract base custom_content or create new
  const customContent = JSON.parse(JSON.stringify(input.custom_content || input.customContent || {}));

  // Direct platform objects (e.g. { facebook: { ... }, instagram: { ... } })
  const inputFb = input.facebook || customContent.facebook || input.facebook_page || input.facebook_profile || {};
  const inputIg = input.instagram || customContent.instagram || {};

  // Resolve FACEBOOK TARGET TYPE (page: Üzleti oldal, profile: Saját fiók/profil, both: Mindkettő)
  const fbTarget =
    parseFacebookTarget(inputFb.targetType) ||
    parseFacebookTarget(inputFb.target) ||
    parseFacebookTarget(inputFb.target_type) ||
    parseFacebookTarget(inputFb.type) ||
    parseFacebookTarget(input.facebook_target) ||
    parseFacebookTarget(input.facebookTarget) ||
    parseFacebookTarget(input.target_facebook) ||
    parseFacebookTarget(input.facebook_celpont) ||
    parseFacebookTarget(input.facebook_account_type) ||
    parseFacebookTarget(input.target) ||
    fbTargetFromPlatforms ||
    'page';

  const fbTargetName =
    inputFb.targetName ||
    inputFb.target_name ||
    input.facebook_target_name ||
    input.facebook_page_name ||
    input.facebook_profile_name ||
    (fbTarget === 'page'
      ? 'Facebook Üzleti Oldal'
      : fbTarget === 'profile'
      ? 'Facebook Saját Profil'
      : 'Facebook Oldal & Saját Profil');

  // 1. Resolve FORMAT (feed/post, reel/reels, story/stories)
  const globalFormat =
    parseFormatString(input.format) ||
    parseFormatString(input.content_type) ||
    parseFormatString(input.contentType) ||
    parseFormatString(input.placement) ||
    parseFormatString(input.type) ||
    (input.is_reel || input.isReel || input.reels === true ? 'reel' : undefined) ||
    (input.is_story || input.isStory || input.story === true ? 'story' : undefined);

  const fbFormat =
    parseFormatString(inputFb.format) ||
    parseFormatString(input.facebook_format) ||
    parseFormatString(input.fb_format) ||
    parseFormatString(input.facebookFormat) ||
    globalFormat ||
    'post';

  const igFormat =
    parseFormatString(inputIg.format) ||
    parseFormatString(input.instagram_format) ||
    parseFormatString(input.ig_format) ||
    parseFormatString(input.instagramFormat) ||
    (inputIg.isReel ? 'reel' : undefined) ||
    globalFormat ||
    'post';

  // 2. Resolve HASHTAGS
  const globalHashtags = normalizeHashtags(input.hashtags || input.tags || input.hashtag_list);
  const fbHashtags =
    normalizeHashtags(inputFb.hashtags) ||
    normalizeHashtags(input.facebook_hashtags) ||
    normalizeHashtags(input.fb_hashtags) ||
    normalizeHashtags(input.facebookHashtags) ||
    globalHashtags;

  const igHashtags =
    normalizeHashtags(inputIg.hashtags) ||
    normalizeHashtags(input.instagram_hashtags) ||
    normalizeHashtags(input.ig_hashtags) ||
    normalizeHashtags(input.instagramHashtags) ||
    globalHashtags;

  // 3. Resolve FIRST COMMENT
  const globalFirstComment =
    (typeof input.first_comment === 'string' && input.first_comment.trim()) ||
    (typeof input.firstComment === 'string' && input.firstComment.trim()) ||
    (typeof input.elso_komment === 'string' && input.elso_komment.trim()) ||
    (typeof input.first_comments === 'string' && input.first_comments.trim()) ||
    undefined;

  const fbFirstComment =
    (typeof inputFb.firstComment === 'string' && inputFb.firstComment.trim()) ||
    (typeof inputFb.first_comment === 'string' && inputFb.first_comment.trim()) ||
    (typeof input.facebook_first_comment === 'string' && input.facebook_first_comment.trim()) ||
    (typeof input.fb_first_comment === 'string' && input.fb_first_comment.trim()) ||
    (typeof input.facebookFirstComment === 'string' && input.facebookFirstComment.trim()) ||
    (typeof input.first_comments === 'object' && typeof input.first_comments?.facebook === 'string' && input.first_comments.facebook.trim()) ||
    globalFirstComment;

  const igFirstComment =
    (typeof inputIg.firstComment === 'string' && inputIg.firstComment.trim()) ||
    (typeof inputIg.first_comment === 'string' && inputIg.first_comment.trim()) ||
    (typeof input.instagram_first_comment === 'string' && input.instagram_first_comment.trim()) ||
    (typeof input.ig_first_comment === 'string' && input.ig_first_comment.trim()) ||
    (typeof input.instagramFirstComment === 'string' && input.instagramFirstComment.trim()) ||
    (typeof input.first_comments === 'object' && typeof input.first_comments?.instagram === 'string' && input.first_comments.instagram.trim()) ||
    globalFirstComment;

  // Assemble Facebook custom content
  customContent.facebook = {
    ...inputFb,
    targetType: fbTarget,
    targetName: fbTargetName,
    format: fbFormat,
    ...(fbHashtags ? { hashtags: fbHashtags } : {}),
    ...(fbFirstComment ? { firstComment: fbFirstComment } : {}),
  };

  // Assemble Instagram custom content
  customContent.instagram = {
    ...inputIg,
    format: igFormat,
    isReel: igFormat === 'reel',
    ...(igHashtags ? { hashtags: igHashtags } : {}),
    ...(igFirstComment ? { firstComment: igFirstComment } : {}),
  };

  return {
    id: input.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `api-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`),
    created_at: input.created_at || now.toISOString(),
    scheduled_at: scheduledAt,
    status: 'draft', // ALWAYS draft as requested, so the user can review before scheduling or publishing
    base_text: baseText,
    media_urls: mediaUrls,
    custom_content: customContent,
    platforms,
    error_log: null,
  };
}

// 3. POST /api/posts - Ingest single post or batch posts as DRAFT
// Compatible with n8n, Make, Zapier, Python, curl, and custom AI agents
app.post(['/api/posts', '/api/inbox', '/api/posts/draft', '/api/webhook', '/api/webhook/posts'], async (req, res) => {
  try {
    const body = req.body;
    let itemsToProcess: any[] = [];

    if (Array.isArray(body)) {
      itemsToProcess = body;
    } else if (body && Array.isArray(body.posts)) {
      itemsToProcess = body.posts;
    } else if (body && Array.isArray(body.items)) {
      itemsToProcess = body.items;
    } else if (body && typeof body === 'object') {
      itemsToProcess = [body];
    } else {
      return res.status(400).json({
        error: 'Érvénytelen formátum. Küldj egy poszt JSON objektumot vagy egy tömböt.',
      });
    }

    if (itemsToProcess.length === 0) {
      return res.status(400).json({ error: 'Üres poszt lista érkezett.' });
    }

    // Expand items if explicit dual Facebook objects or split_facebook is requested
    const expandedItems: any[] = [];
    for (const item of itemsToProcess) {
      const hasExplicitDualObjects = Boolean(item.facebook_page && item.facebook_profile);
      const wantsSplit = item.split_facebook === true || item.separate_facebook === true || item.separate_posts === true || hasExplicitDualObjects;

      if (wantsSplit && !item._isSplit) {
        // Post A: Facebook Page (Üzleti Oldal)
        const pageItem = {
          ...item,
          _isSplit: true,
          platforms: ['facebook_page', ...(Array.isArray(item.platforms) ? item.platforms.filter((p: any) => !String(p).toLowerCase().includes('facebook') && !String(p).toLowerCase().includes('fb')) : [])],
          facebook: item.facebook_page || item.facebook || {},
          base_text: item.facebook_page?.base_text || item.facebook_page?.text || item.facebook_page?.content || item.base_text,
          facebook_target: 'page',
        };
        // Post B: Facebook Profile (Saját Profil / Fiók)
        const profileItem = {
          ...item,
          _isSplit: true,
          platforms: ['facebook_profile'],
          facebook: item.facebook_profile || item.facebook || {},
          base_text: item.facebook_profile?.base_text || item.facebook_profile?.text || item.facebook_profile?.content || item.base_text,
          facebook_target: 'profile',
        };
        expandedItems.push(pageItem, profileItem);
      } else {
        expandedItems.push(item);
      }
    }
    itemsToProcess = expandedItems;

    const normalizedPosts: ServerPost[] = itemsToProcess.map(normalizeDraftPost);

    // If Supabase is connected, insert using relational architecture (scheduled_posts + platform tables)
    const activeSupabase = getServerSupabase(req);
    if (activeSupabase) {
      let relationalInserted: ServerPost[] = [];
      let usedRelational = false;

      // Try relational insert for each post
      try {
        for (const p of normalizedPosts) {
          const { data: schedData, error: schedError } = await activeSupabase
            .from('scheduled_posts')
            .insert({
              scheduled_at: p.scheduled_at,
              status: 'draft',
              title: p.base_text.slice(0, 100),
              notes: 'Via POST /api/posts API',
            })
            .select()
            .single();

          if (!schedError && schedData) {
            usedRelational = true;
            const parentId = schedData.id;

            if (p.platforms.includes('facebook')) {
              const fb = p.custom_content?.facebook || {};
              await activeSupabase.from('facebook_posts').insert({
                post_id: parentId,
                target_type: fb.targetType === 'profile' ? 'profile' : 'page',
                message: p.base_text,
                format: fb.format || 'post',
                media_urls: p.media_urls || [],
                call_to_action: fb.callToAction,
                hashtags: fb.hashtags,
                first_comment: fb.firstComment,
                status: 'draft',
              });
            }

            if (p.platforms.includes('instagram')) {
              const ig = p.custom_content?.instagram || {};
              await activeSupabase.from('instagram_posts').insert({
                post_id: parentId,
                caption: p.base_text,
                format: ig.format || (ig.isReel ? 'reel' : 'post'),
                is_reel: ig.isReel || ig.format === 'reel',
                media_urls: p.media_urls || [],
                hashtags: ig.hashtags,
                first_comment: ig.firstComment,
                status: 'draft',
              });
            }

            if (p.platforms.includes('youtube')) {
              const yt = p.custom_content?.youtube || {};
              await activeSupabase.from('youtube_posts').insert({
                post_id: parentId,
                video_title: yt.title || p.base_text.slice(0, 70),
                description: yt.description || p.base_text,
                format: yt.format || 'video',
                video_url: p.media_urls?.[0] || null,
                privacy_status: yt.visibility || 'public',
                status: 'draft',
              });
            }

            if (p.platforms.includes('threads')) {
              await activeSupabase.from('threads_posts').insert({
                post_id: parentId,
                text: p.base_text,
                media_urls: p.media_urls || [],
                status: 'draft',
              });
            }

            relationalInserted.push({ ...p, id: parentId });
          }
        }
      } catch (rErr) {
        console.warn('Relational insert failed, checking fallback:', rErr);
      }

      if (usedRelational && relationalInserted.length > 0) {
        inMemoryPosts.unshift(...relationalInserted);
        return res.status(201).json({
          success: true,
          message: `${relationalInserted.length} poszt mentve a Supabase moduláris relációs adatbázisába (scheduled_posts + platform táblák)!`,
          count: relationalInserted.length,
          savedTo: 'supabase_relational',
          posts: relationalInserted,
        });
      }

      // Fallback to legacy single posts table
      const insertPayload = normalizedPosts.map((p) => {
        const item: any = {
          scheduled_at: p.scheduled_at,
          status: 'draft',
          base_text: p.base_text,
          media_urls: p.media_urls || [],
          custom_content: p.custom_content || {},
          platforms: p.platforms,
          created_at: p.created_at || new Date().toISOString(),
        };
        if (p.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(p.id)) {
          item.id = p.id;
        }
        return item;
      });

      const { data, error } = await activeSupabase
        .from('posts')
        .insert(insertPayload)
        .select();

      if (error) {
        console.warn('Supabase legacy insert warning in API endpoint:', error.message);
        inMemoryPosts.unshift(...normalizedPosts);
        return res.status(201).json({
          success: true,
          message: `${normalizedPosts.length} poszt piszkozatként mentve (helyi pufferbe, Supabase hiba: ${error.message}).`,
          count: normalizedPosts.length,
          savedTo: 'fallback_store',
          supabaseError: error.message,
          posts: normalizedPosts,
        });
      }

      const savedList = (data as ServerPost[]) || normalizedPosts;
      inMemoryPosts.unshift(...savedList);

      return res.status(201).json({
        success: true,
        message: `${savedList.length} poszt piszkozatként (draft) mentve a Supabase adatbázisba!`,
        count: savedList.length,
        savedTo: 'supabase',
        posts: savedList,
      });
    }

    // Otherwise save to in-memory fallback
    inMemoryPosts.unshift(...normalizedPosts);

    return res.status(201).json({
      success: true,
      message: `${normalizedPosts.length} poszt piszkozatként (draft) mentve! (Átnézhető a naptárban).`,
      count: normalizedPosts.length,
      savedTo: 'memory',
      posts: normalizedPosts,
    });
  } catch (err: any) {
    console.error('Error in /api/posts ingestion:', err);
    return res.status(500).json({ error: err.message || 'Hiba a poszt feldolgozása közben.' });
  }
});

// ====================================================================
// SPECIFIC PLATFORM ENDPOINTS (PLATFORM-SPECIFIC APIS & TABLES)
// ====================================================================

// 1. Social Accounts List & Create/Update
app.get('/api/accounts', async (req, res) => {
  try {
    const supabase = getServerSupabase(req);
    if (supabase) {
      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .order('created_at', { ascending: true });
      if (!error && data) {
        return res.json({ accounts: data, count: data.length, source: 'supabase' });
      }
    }
    return res.json({
      accounts: [
        {
          id: 'acc_fb_page_main',
          platform: 'facebook_page',
          base_platform: 'facebook',
          name: 'Hivatalos Üzleti Oldal',
          handle: '@postpulse_page',
          is_active: true,
        },
        {
          id: 'acc_fb_profile_main',
          platform: 'facebook_profile',
          base_platform: 'facebook',
          name: 'Saját Profil (Alapító)',
          handle: 'fb.com/alapito',
          is_active: true,
        },
        {
          id: 'acc_ig_main',
          platform: 'instagram',
          base_platform: 'instagram',
          name: 'Instagram Fő Profil',
          handle: '@postpulse_hq',
          is_active: true,
        },
        {
          id: 'acc_yt_main',
          platform: 'youtube',
          base_platform: 'youtube',
          name: 'YouTube Csatorna',
          handle: 'PostPulse Studio',
          is_active: true,
        },
      ],
      source: 'default',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/accounts', async (req, res) => {
  try {
    const { id, platform, base_platform, name, handle, platform_native_id, avatar_url, access_token, is_active = true } = req.body;
    if (!name || !platform) {
      return res.status(400).json({ error: 'Fiók név és platform megadása kötelező.' });
    }
    const accId = id || `acc_${platform}_${Date.now()}`;
    const basePlat = base_platform || (platform.startsWith('facebook') ? 'facebook' : platform);

    const supabase = getServerSupabase(req);
    if (supabase) {
      const { data, error } = await supabase.from('social_accounts').upsert({
        id: accId,
        platform,
        base_platform: basePlat,
        name,
        handle: handle || null,
        platform_native_id: platform_native_id || null,
        avatar_url: avatar_url || null,
        access_token: access_token || null,
        is_active,
      }).select().single();

      if (!error) {
        return res.status(201).json({ success: true, account: data, savedTo: 'supabase' });
      }
    }
    return res.status(201).json({
      success: true,
      account: { id: accId, platform, base_platform: basePlat, name, handle, is_active },
      savedTo: 'memory',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. FACEBOOK DEDICATED API: POST /api/facebook/posts
app.get('/api/facebook/posts', async (req, res) => {
  try {
    const supabase = getServerSupabase(req);
    if (supabase) {
      const { data, error } = await supabase
        .from('facebook_posts')
        .select(`*, scheduled_posts(scheduled_at, status, title)`)
        .order('created_at', { ascending: false });
      if (!error && data) return res.json({ posts: data, count: data.length });
    }
    const fbPosts = inMemoryPosts.filter((p) => p.platforms.includes('facebook'));
    return res.json({ posts: fbPosts, count: fbPosts.length, source: 'memory' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/facebook/posts', async (req, res) => {
  try {
    const {
      message,
      text,
      scheduled_at,
      date,
      time,
      target_type = 'page',
      format = 'post',
      media_urls = [],
      link_url,
      call_to_action,
      hashtags,
      first_comment,
      account_id,
    } = req.body;

    const postMessage = message || text || '';
    if (!postMessage.trim() && (!media_urls || media_urls.length === 0)) {
      return res.status(400).json({ error: 'A Facebook posztnak szöveget vagy médiafájlt kell tartalmaznia.' });
    }

    let schedIso = new Date(Date.now() + 3600000).toISOString();
    if (scheduled_at) schedIso = new Date(scheduled_at).toISOString();
    else if (date && time) schedIso = new Date(`${date}T${time}`).toISOString();
    else if (date) schedIso = new Date(`${date}T10:00:00`).toISOString();

    const mediaList = Array.isArray(media_urls) ? media_urls : [media_urls].filter(Boolean);
    const supabase = getServerSupabase(req);

    if (supabase) {
      // 1. Master scheduled_post
      const { data: master, error: masterErr } = await supabase
        .from('scheduled_posts')
        .insert({
          scheduled_at: schedIso,
          status: 'draft',
          title: postMessage.slice(0, 100) || `Facebook ${target_type.toUpperCase()} Poszt`,
          notes: `Facebook API Ingestion`,
        })
        .select()
        .single();

      if (!masterErr && master) {
        const { data: fbPost, error: fbErr } = await supabase
          .from('facebook_posts')
          .insert({
            post_id: master.id,
            account_id: account_id || null,
            target_type: target_type === 'profile' ? 'profile' : 'page',
            message: postMessage,
            format,
            media_urls: mediaList,
            link_url: link_url || null,
            call_to_action: call_to_action || null,
            hashtags: hashtags || null,
            first_comment: first_comment || null,
            status: 'draft',
          })
          .select()
          .single();

        if (!fbErr && fbPost) {
          const calendarPost: ServerPost = {
            id: master.id,
            scheduled_at: schedIso,
            status: 'draft',
            base_text: postMessage,
            media_urls: mediaList,
            custom_content: {
              facebook: {
                format,
                targetType: target_type === 'profile' ? 'profile' : 'page',
                firstComment: first_comment,
                hashtags,
                callToAction: call_to_action,
              },
            },
            platforms: ['facebook'],
            created_at: master.created_at || new Date().toISOString(),
          };
          inMemoryPosts.unshift(calendarPost);

          return res.status(201).json({
            success: true,
            message: `Facebook poszt sikeresen mentve a facebook_posts táblába!`,
            post: fbPost,
            posts: [calendarPost],
            master_id: master.id,
            savedTo: 'supabase_facebook_posts',
          });
        }
      }
    }

    // Fallback to memory
    const memoryPost: ServerPost = {
      id: `fb-${Date.now()}`,
      scheduled_at: schedIso,
      status: 'draft',
      base_text: postMessage,
      media_urls: mediaList,
      custom_content: {
        facebook: {
          format,
          targetType: target_type === 'profile' ? 'profile' : 'page',
          firstComment: first_comment,
          hashtags,
          callToAction: call_to_action,
        },
      },
      platforms: ['facebook'],
      created_at: new Date().toISOString(),
    };
    inMemoryPosts.unshift(memoryPost);

    return res.status(201).json({
      success: true,
      message: 'Facebook poszt mentve (memóriába).',
      post: memoryPost,
      posts: [memoryPost],
      savedTo: 'memory',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. INSTAGRAM DEDICATED API: POST /api/instagram/posts
app.get('/api/instagram/posts', async (req, res) => {
  try {
    const supabase = getServerSupabase(req);
    if (supabase) {
      const { data, error } = await supabase
        .from('instagram_posts')
        .select(`*, scheduled_posts(scheduled_at, status, title)`)
        .order('created_at', { ascending: false });
      if (!error && data) return res.json({ posts: data, count: data.length });
    }
    const igPosts = inMemoryPosts.filter((p) => p.platforms.includes('instagram'));
    return res.json({ posts: igPosts, count: igPosts.length, source: 'memory' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/instagram/posts', async (req, res) => {
  try {
    const {
      caption,
      text,
      scheduled_at,
      date,
      time,
      format = 'post',
      is_reel = false,
      media_urls = [],
      hashtags,
      first_comment,
      audio_track_name,
      account_id,
    } = req.body;

    const postCaption = caption || text || '';
    let schedIso = new Date(Date.now() + 3600000).toISOString();
    if (scheduled_at) schedIso = new Date(scheduled_at).toISOString();
    else if (date && time) schedIso = new Date(`${date}T${time}`).toISOString();
    else if (date) schedIso = new Date(`${date}T10:00:00`).toISOString();

    const mediaList = Array.isArray(media_urls) ? media_urls : [media_urls].filter(Boolean);
    const resolvedFormat = format === 'reel' || is_reel ? 'reel' : format === 'story' ? 'story' : 'post';
    const supabase = getServerSupabase(req);

    if (supabase) {
      const { data: master, error: masterErr } = await supabase
        .from('scheduled_posts')
        .insert({
          scheduled_at: schedIso,
          status: 'draft',
          title: postCaption.slice(0, 100) || `Instagram ${resolvedFormat.toUpperCase()} Poszt`,
          notes: `Instagram API Ingestion`,
        })
        .select()
        .single();

      if (!masterErr && master) {
        const { data: igPost, error: igErr } = await supabase
          .from('instagram_posts')
          .insert({
            post_id: master.id,
            account_id: account_id || null,
            caption: postCaption,
            format: resolvedFormat,
            is_reel: resolvedFormat === 'reel',
            media_urls: mediaList,
            hashtags: hashtags || null,
            first_comment: first_comment || null,
            audio_track_name: audio_track_name || null,
            status: 'draft',
          })
          .select()
          .single();

        if (!igErr && igPost) {
          const calendarPost: ServerPost = {
            id: master.id,
            scheduled_at: schedIso,
            status: 'draft',
            base_text: postCaption,
            media_urls: mediaList,
            custom_content: {
              instagram: {
                format: resolvedFormat,
                isReel: resolvedFormat === 'reel',
                firstComment: first_comment,
                hashtags,
                audioTrackName: audio_track_name,
              },
            },
            platforms: ['instagram'],
            created_at: master.created_at || new Date().toISOString(),
          };
          inMemoryPosts.unshift(calendarPost);

          return res.status(201).json({
            success: true,
            message: `Instagram poszt sikeresen mentve az instagram_posts táblába!`,
            post: igPost,
            posts: [calendarPost],
            master_id: master.id,
            savedTo: 'supabase_instagram_posts',
          });
        }
      }
    }

    const memoryPost: ServerPost = {
      id: `ig-${Date.now()}`,
      scheduled_at: schedIso,
      status: 'draft',
      base_text: postCaption,
      media_urls: mediaList,
      custom_content: {
        instagram: {
          format: resolvedFormat,
          isReel: resolvedFormat === 'reel',
          firstComment: first_comment,
          hashtags,
          audioTrackName: audio_track_name,
        },
      },
      platforms: ['instagram'],
      created_at: new Date().toISOString(),
    };
    inMemoryPosts.unshift(memoryPost);

    return res.status(201).json({
      success: true,
      message: 'Instagram poszt mentve (memóriába).',
      post: memoryPost,
      posts: [memoryPost],
      savedTo: 'memory',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. YOUTUBE DEDICATED API: POST /api/youtube/videos OR /api/youtube/posts
app.get(['/api/youtube/posts', '/api/youtube/videos'], async (req, res) => {
  try {
    const supabase = getServerSupabase(req);
    if (supabase) {
      const { data, error } = await supabase
        .from('youtube_posts')
        .select(`*, scheduled_posts(scheduled_at, status, title)`)
        .order('created_at', { ascending: false });
      if (!error && data) return res.json({ posts: data, count: data.length });
    }
    const ytPosts = inMemoryPosts.filter((p) => p.platforms.includes('youtube'));
    return res.json({ posts: ytPosts, count: ytPosts.length, source: 'memory' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post(['/api/youtube/videos', '/api/youtube/posts'], async (req, res) => {
  try {
    const {
      title,
      description = '',
      video_title,
      scheduled_at,
      date,
      time,
      format = 'video',
      video_url,
      thumbnail_url,
      tags = [],
      privacy_status = 'public',
      category_id = '22',
      account_id,
    } = req.body;

    const vidTitle = title || video_title || '';
    if (!vidTitle.trim()) {
      return res.status(400).json({ error: 'A YouTube videónak címet (title) kell adni.' });
    }

    let schedIso = new Date(Date.now() + 3600000).toISOString();
    if (scheduled_at) schedIso = new Date(scheduled_at).toISOString();
    else if (date && time) schedIso = new Date(`${date}T${time}`).toISOString();
    else if (date) schedIso = new Date(`${date}T10:00:00`).toISOString();

    const tagList = Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t: string) => t.trim()) : [];
    const supabase = getServerSupabase(req);

    if (supabase) {
      const { data: master, error: masterErr } = await supabase
        .from('scheduled_posts')
        .insert({
          scheduled_at: schedIso,
          status: 'draft',
          title: vidTitle,
          notes: `YouTube ${format.toUpperCase()} API Ingestion`,
        })
        .select()
        .single();

      if (!masterErr && master) {
        const { data: ytPost, error: ytErr } = await supabase
          .from('youtube_posts')
          .insert({
            post_id: master.id,
            account_id: account_id || null,
            video_title: vidTitle,
            description,
            format: format === 'shorts' ? 'shorts' : 'video',
            video_url: video_url || null,
            thumbnail_url: thumbnail_url || null,
            tags: tagList,
            privacy_status,
            category_id,
            status: 'draft',
          })
          .select()
          .single();

        if (!ytErr && ytPost) {
          const calendarPost: ServerPost = {
            id: master.id,
            scheduled_at: schedIso,
            status: 'draft',
            base_text: vidTitle + (description ? `\n\n${description}` : ''),
            media_urls: video_url ? [video_url] : [],
            custom_content: {
              youtube: {
                title: vidTitle,
                description,
                format: format === 'shorts' ? 'shorts' : 'video',
                visibility: privacy_status,
              },
            },
            platforms: ['youtube'],
            created_at: master.created_at || new Date().toISOString(),
          };
          inMemoryPosts.unshift(calendarPost);

          return res.status(201).json({
            success: true,
            message: `YouTube videó sikeresen mentve a youtube_posts táblába!`,
            post: ytPost,
            posts: [calendarPost],
            master_id: master.id,
            savedTo: 'supabase_youtube_posts',
          });
        }
      }
    }

    const memoryPost: ServerPost = {
      id: `yt-${Date.now()}`,
      scheduled_at: schedIso,
      status: 'draft',
      base_text: vidTitle + (description ? `\n\n${description}` : ''),
      media_urls: video_url ? [video_url] : [],
      custom_content: {
        youtube: {
          title: vidTitle,
          description,
          format: format === 'shorts' ? 'shorts' : 'video',
          visibility: privacy_status,
        },
      },
      platforms: ['youtube'],
      created_at: new Date().toISOString(),
    };
    inMemoryPosts.unshift(memoryPost);

    return res.status(201).json({
      success: true,
      message: 'YouTube videó poszt mentve (memóriába).',
      post: memoryPost,
      posts: [memoryPost],
      savedTo: 'memory',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. POST /api/ai/generate-campaign - Generates posts with Gemini and optionally saves as drafts
app.post('/api/ai/generate-campaign', async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({
        error:
          'GEMINI_API_KEY nincs beállítva a szerveren! Ellenőrizd a környezeti változókat az AI Studio beállításaiban.',
      });
    }

    const {
      topic = 'Új termékbevezetés és szakmai tippek',
      count = 3,
      platforms = ['facebook', 'instagram'],
      tone = 'professzionális, megnyerő',
      startDate = new Date().toISOString(),
      autoSaveDrafts = true,
      includeMediaSuggestions = true,
    } = req.body;

    const requestedCount = Math.min(Math.max(Number(count) || 3, 1), 7);
    const startDateTime = new Date(startDate);
    const validStartDate = isNaN(startDateTime.getTime()) ? new Date() : startDateTime;

    const systemInstruction = `Te egy profi közösségi média stratéga és copywriter vagy.
Feladatod: Készíts ${requestedCount} db magas minőségű, figyelemfelkeltő közösségi média posztot magyar nyelven a megadott témában.
Minden poszt tartalmazzon:
1. base_text: Erős hook (figyelemfelkeltő nyitómondat), értékadó törzsszöveg, releváns emojik, és egyértelmű CTA (cselekvésre ösztönzés).
2. scheduled_at: Reális jövőbeli időpont ISO formátumban. Az első poszt induljon a kezdődátumtól (${validStartDate.toISOString()}), és a posztok legyenek elosztva 1-2 napos különbségekkel az optimális elérési órákban (pl. 08:30, 12:45, 17:30, 19:15).
3. platforms: A kért platformok listája (${platforms.join(', ')}).
4. custom_content:
   - Ha instagram van a platformok közt: releváns hashtagek és első komment (#marketing #tipp stb.), valamint ha illik, reel vagy story jelleg.
   - Ha facebook van: linkPreviewTitle vagy firstComment.
   - Ha youtube van: videó / Shorts cím (max 70 karakter) és részletes leírás.
   - Ha threads van: opcionális válasz szál (threadReplies).
5. media_description: Javaslat a poszthoz illő vizuális anyagra (fénykép vagy rövid videó leírása).

A válaszod KIZÁRÓLAG érvényes JSON legyen az alábbi séma szerint, magyarázatok nélkül.`;

    const prompt = `Téma / Kampány cél: "${topic}"
Kért posztok száma: ${requestedCount} db
Célplatformok: ${platforms.join(', ')}
Hangnem: ${tone}
Kezdő dátum: ${validStartDate.toISOString()}

Generálj pontosan ${requestedCount} db kidolgozott posztot!`;

    let parsedPosts: any[] = [];

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            description: 'A generált posztok listája',
            items: {
              type: Type.OBJECT,
              properties: {
                base_text: { type: Type.STRING, description: 'A poszt teljes szövege emojikkal és CTA-val' },
                scheduled_at: { type: Type.STRING, description: 'ISO 8601 formátumú időpont, pl: 2026-09-20T10:30:00Z' },
                platforms: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Célplatformok (facebook, instagram, threads, youtube)',
                },
                media_description: { type: Type.STRING, description: 'Javaslat a vizuális tartalomra' },
                suggested_media_type: { type: Type.STRING, description: 'image | video' },
                custom_content: {
                  type: Type.OBJECT,
                  properties: {
                    instagram: {
                      type: Type.OBJECT,
                      properties: {
                        hashtags: { type: Type.STRING },
                        firstComment: { type: Type.STRING },
                        format: { type: Type.STRING, description: 'post | reel | story' },
                      },
                    },
                    facebook: {
                      type: Type.OBJECT,
                      properties: {
                        linkPreviewTitle: { type: Type.STRING },
                        firstComment: { type: Type.STRING },
                      },
                    },
                    youtube: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        format: { type: Type.STRING, description: 'shorts | video' },
                      },
                    },
                  },
                },
              },
              required: ['base_text', 'scheduled_at', 'platforms'],
            },
          },
        },
      });

      const jsonText = response.text || '[]';
      parsedPosts = JSON.parse(jsonText);
    } catch (genError: any) {
      console.warn('Gemini API call warning, using intelligent local strategist fallback:', genError.message);
      
      // Intelligent fallback generator in case API key is restricted or network is unreachable
      const fallbackHours = [9, 12, 16, 18, 20];
      for (let i = 0; i < requestedCount; i++) {
        const postDate = new Date(validStartDate);
        postDate.setDate(postDate.getDate() + Math.floor(i * 1.5));
        postDate.setHours(fallbackHours[i % fallbackHours.length], Math.floor(Math.random() * 4) * 15, 0, 0);

        parsedPosts.push({
          base_text: `✨ ${topic} - ${i === 0 ? 'Bejelentés & Újdonságok' : i === 1 ? 'Tipp & Értékes Tanács' : 'Kérdés & Közösség'}\n\n` +
            `Szeretnénk bemutatni a legfrissebb gondolatainkat: ${topic}. ` +
            `Nálunk mindig a minőség és a megbízhatóság az első!\n\n` +
            `👇 Írd meg kommentben a véleményed, és látogass el a profilunkban található linkre! #marketing #növekedés #közösség`,
          scheduled_at: postDate.toISOString(),
          platforms: platforms,
          media_description: `Professzionális, modern fotó a következő témában: ${topic}`,
          suggested_media_type: 'image',
          custom_content: {
            instagram: {
              hashtags: '#socialmedia #stratégia #marketing #siker #vállalkozás',
              firstComment: 'Kérdésed van ezzel kapcsolatban? Írd meg bátran kommentben!',
            },
            facebook: {
              linkPreviewTitle: `${topic} - Részletek a bejegyzésben`,
            },
          },
        });
      }
    }

    if (!Array.isArray(parsedPosts) || parsedPosts.length === 0) {
      return res.status(500).json({ error: 'Nem sikerült posztokat generálni a témához.' });
    }

    // Default sample media images to pair if user wants visual suggestions
    const sampleCuratedImages = [
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80',
    ];

    // Normalize each post into standard ServerPost with status: 'draft'
    const fallbackHours = [9, 12, 16, 18, 20];
    const finalDraftPosts: ServerPost[] = parsedPosts.map((p, idx) => {
      const mediaList: string[] = [];
      if (includeMediaSuggestions) {
        mediaList.push(sampleCuratedImages[idx % sampleCuratedImages.length]);
      }

      // Ensure valid scheduled_at timestamp strictly aligned relative to validStartDate
      let postDate = new Date(p.scheduled_at);
      if (isNaN(postDate.getTime()) || postDate.getFullYear() < 2026) {
        postDate = new Date(validStartDate);
        postDate.setDate(postDate.getDate() + Math.floor(idx * 1.5));
        postDate.setHours(fallbackHours[idx % fallbackHours.length], (idx * 20) % 60, 0, 0);
      }

      return {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ai-${Date.now()}-${idx}`,
        created_at: new Date().toISOString(),
        scheduled_at: postDate.toISOString(),
        status: 'draft', // Always draft for user verification
        base_text: p.base_text,
        media_urls: mediaList,
        custom_content: {
          ...(p.custom_content || {}),
          ai_meta: {
            prompt: topic,
            media_description: p.media_description,
            suggested_media_type: p.suggested_media_type || 'image',
          },
        },
        platforms: p.platforms && p.platforms.length > 0 ? p.platforms : platforms,
        error_log: null,
      };
    });

    // Auto-save to Supabase or in-memory if requested
    let savedTo = 'none';
    let supabaseErrorMsg: string | null = null;
    let savedPostsResult = finalDraftPosts;

    const activeSupabase = getServerSupabase(req);

    if (autoSaveDrafts) {
      if (activeSupabase) {
        const insertPayload = finalDraftPosts.map((p) => {
          const item: any = {
            scheduled_at: p.scheduled_at,
            status: 'draft',
            base_text: p.base_text,
            media_urls: p.media_urls || [],
            custom_content: p.custom_content || {},
            platforms: p.platforms,
            created_at: p.created_at,
          };
          if (p.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(p.id)) {
            item.id = p.id;
          }
          return item;
        });

        const { data, error } = await activeSupabase
          .from('posts')
          .insert(insertPayload)
          .select();

        if (!error && data) {
          savedTo = 'supabase';
          savedPostsResult = data as ServerPost[];
          inMemoryPosts.unshift(...(data as ServerPost[]));
        } else {
          console.warn('Supabase batch insert error for AI posts:', error?.message);
          savedTo = 'in_memory_fallback';
          supabaseErrorMsg = error?.message || 'Ismeretlen Supabase hiba';
          inMemoryPosts.unshift(...finalDraftPosts);
        }
      } else {
        savedTo = 'in_memory';
        inMemoryPosts.unshift(...finalDraftPosts);
      }
    }

    return res.json({
      success: true,
      count: savedPostsResult.length,
      savedTo,
      savedAsDraft: autoSaveDrafts,
      supabaseError: supabaseErrorMsg,
      posts: savedPostsResult,
      message:
        savedTo === 'supabase'
          ? `${savedPostsResult.length} db AI poszt piszkozatként mentve a Supabase adatbázisba!`
          : `${savedPostsResult.length} db AI poszt piszkozatként sikeresen elkészült és betöltve!`,
    });
  } catch (err: any) {
    console.error('Error generating AI campaign:', err);
    return res.status(500).json({
      error: err.message || 'Ismeretlen hiba az AI poszt generálásakor.',
    });
  }
});

// ==========================================
// VITE MIDDLEWARE & STATIC SERVING
// ==========================================

async function startServer() {
  // Serve public assets (favicon.svg, etc.)
  app.use(express.static(path.join(process.cwd(), 'public')));

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // In Express v4, wildcard is '*'
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 PostPulse Server running on http://0.0.0.0:${PORT}`);
    console.log(`📡 Ingestion API ready at: POST http://0.0.0.0:${PORT}/api/posts`);
    console.log(`🤖 AI Campaign API ready at: POST http://0.0.0.0:${PORT}/api/ai/generate-campaign`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
