import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Post, SupabaseConfig, SocialAccount, Platform, CustomContent } from '../types';
import { initialMockPosts } from '../data/mockPosts';

const STORAGE_BUCKET = 'social-media-assets';
const LOCAL_STORAGE_POSTS_KEY = 'postpulse_local_posts_v3';
const LOCAL_STORAGE_SUPABASE_KEY = 'postpulse_supabase_config';

export const SQL_SCHEMA_STRING = `-- ====================================================================
-- POSTPULSE MODULÁRIS, MULTI-PLATFORM & MULTI-ACCOUNT ADATBÁZIS SÉMA
-- ====================================================================

-- 1. CSATLAKOZTATOTT FIÓKOK TÁBLÁJA (social_accounts)
-- Korlátlan számú Facebook Oldal, Profil, Instagram fiók, YouTube csatorna kezelésére
create table if not exists public.social_accounts (
    id text primary key, -- pl. 'acc_fb_page_techflow', 'acc_fb_profile_janos', 'acc_ig_main'
    platform text not null check (platform in ('facebook_page', 'facebook_profile', 'instagram', 'youtube', 'threads')),
    base_platform text not null check (base_platform in ('facebook', 'instagram', 'youtube', 'threads')),
    name text not null,
    handle text,
    platform_native_id text, -- Facebook Page ID, YouTube Channel ID, Instagram ID
    avatar_url text,
    access_token text,
    is_active boolean default true,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. KÖZPONTI IDŐZÍTÉSEK ÉS KAMPÁNYOK TÁBLÁJA (scheduled_posts)
create table if not exists public.scheduled_posts (
    id uuid primary key default gen_random_uuid(),
    scheduled_at timestamptz not null,
    status text not null default 'draft' check (status in ('draft', 'scheduled', 'publishing', 'published', 'failed')),
    title text default '',
    campaign_name text,
    notes text,
    error_log text,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 3. FACEBOOK POSZTOK TÁBLÁJA (facebook_posts)
create table if not exists public.facebook_posts (
    id uuid primary key default gen_random_uuid(),
    post_id uuid not null references public.scheduled_posts(id) on delete cascade,
    account_id text references public.social_accounts(id) on delete set null,
    target_type text not null default 'page' check (target_type in ('page', 'profile')),
    message text not null default '',
    format text not null default 'post' check (format in ('post', 'reel', 'story')),
    media_urls text[] default array[]::text[],
    link_url text,
    call_to_action text,
    hashtags text,
    first_comment text,
    status text not null default 'draft' check (status in ('draft', 'scheduled', 'publishing', 'published', 'failed')),
    published_post_id text,
    error_log text,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 4. INSTAGRAM POSZTOK TÁBLÁJA (instagram_posts)
create table if not exists public.instagram_posts (
    id uuid primary key default gen_random_uuid(),
    post_id uuid not null references public.scheduled_posts(id) on delete cascade,
    account_id text references public.social_accounts(id) on delete set null,
    caption text not null default '',
    format text not null default 'post' check (format in ('post', 'reel', 'story')),
    media_urls text[] default array[]::text[],
    is_reel boolean default false,
    hashtags text,
    first_comment text,
    audio_track_name text,
    collaborators text[] default array[]::text[],
    status text not null default 'draft' check (status in ('draft', 'scheduled', 'publishing', 'published', 'failed')),
    published_post_id text,
    error_log text,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 5. YOUTUBE VIDEÓK ÉS SHORTS TÁBLÁJA (youtube_posts)
create table if not exists public.youtube_posts (
    id uuid primary key default gen_random_uuid(),
    post_id uuid not null references public.scheduled_posts(id) on delete cascade,
    account_id text references public.social_accounts(id) on delete set null,
    video_title text not null default '',
    description text not null default '',
    format text not null default 'video' check (format in ('video', 'shorts')),
    video_url text,
    thumbnail_url text,
    tags text[] default array[]::text[],
    privacy_status text not null default 'public' check (privacy_status in ('public', 'unlisted', 'private')),
    category_id text default '22',
    status text not null default 'draft' check (status in ('draft', 'scheduled', 'publishing', 'published', 'failed')),
    published_video_id text,
    error_log text,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 6. THREADS POSZTOK TÁBLÁJA (threads_posts)
create table if not exists public.threads_posts (
    id uuid primary key default gen_random_uuid(),
    post_id uuid not null references public.scheduled_posts(id) on delete cascade,
    account_id text references public.social_accounts(id) on delete set null,
    text text not null default '',
    media_urls text[] default array[]::text[],
    status text not null default 'draft' check (status in ('draft', 'scheduled', 'publishing', 'published', 'failed')),
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 7. VISSZAMENŐLEGES KOMPATIBILITÁS ÉS EGYSÉGES NÉZET (v_unified_posts)
create or replace view public.v_unified_posts 
with (security_invoker = true) as
select 
    sp.id,
    sp.created_at,
    sp.scheduled_at,
    sp.status,
    coalesce(fb.message, ig.caption, yt.video_title, th.text, sp.title, '') as base_text,
    coalesce(fb.media_urls, ig.media_urls, th.media_urls, array[]::text[]) as media_urls,
    sp.error_log
from public.scheduled_posts sp
left join public.facebook_posts fb on fb.post_id = sp.id
left join public.instagram_posts ig on ig.post_id = sp.id
left join public.youtube_posts yt on yt.post_id = sp.id
left join public.threads_posts th on th.post_id = sp.id;

-- 8. ALAPÉRTELMEZETT FIÓKOK BESZÚRÁSA (KEZDŐ KÉSZLET)
insert into public.social_accounts (id, platform, base_platform, name, handle, platform_native_id, avatar_url, is_active)
values 
    ('acc_fb_page_main', 'facebook_page', 'facebook', 'Hivatalos Üzleti Oldal', '@postpulse_page', '109283741829182', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80', true),
    ('acc_fb_profile_main', 'facebook_profile', 'facebook', 'Saját Profil (Alapító)', 'fb.com/alapito', '100084920194820', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80', true),
    ('acc_ig_main', 'instagram', 'instagram', 'Instagram Fő Profil', '@postpulse_hq', '178414001928374', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80', true),
    ('acc_yt_main', 'youtube', 'youtube', 'YouTube Csatorna', 'PostPulse Studio', 'UC_x5XG1OV2P6uZZ5FSM9Ttw', 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=120&q=80', true)
on conflict (id) do nothing;

-- 9. ROW LEVEL SECURITY (RLS) BEKAPCSOLÁSA ÉS ENGEDÉLYEZÉSE
alter table public.social_accounts enable row level security;
alter table public.scheduled_posts enable row level security;
alter table public.facebook_posts enable row level security;
alter table public.instagram_posts enable row level security;
alter table public.youtube_posts enable row level security;
alter table public.threads_posts enable row level security;

-- Biztonságos szabály (Policy) frissítés (DROP POLICY IF EXISTS)
drop policy if exists "Allow all social_accounts" on public.social_accounts;
create policy "Allow all social_accounts" on public.social_accounts for all using (true) with check (true);

drop policy if exists "Allow all scheduled_posts" on public.scheduled_posts;
create policy "Allow all scheduled_posts" on public.scheduled_posts for all using (true) with check (true);

drop policy if exists "Allow all facebook_posts" on public.facebook_posts;
create policy "Allow all facebook_posts" on public.facebook_posts for all using (true) with check (true);

drop policy if exists "Allow all instagram_posts" on public.instagram_posts;
create policy "Allow all instagram_posts" on public.instagram_posts for all using (true) with check (true);

drop policy if exists "Allow all youtube_posts" on public.youtube_posts;
create policy "Allow all youtube_posts" on public.youtube_posts for all using (true) with check (true);

drop policy if exists "Allow all threads_posts" on public.threads_posts;
create policy "Allow all threads_posts" on public.threads_posts for all using (true) with check (true);

-- 10. MÉDIA TÁROLÓ BUCKET (storage.buckets)
insert into storage.buckets (id, name, public)
values ('social-media-assets', 'social-media-assets', true)
on conflict (id) do nothing;

-- Storage Policy létrehozása vagy újralétrehozása hiba nélkül
drop policy if exists "Public Access to social-media-assets" on storage.objects;
create policy "Public Access to social-media-assets"
on storage.objects for all
using (bucket_id = 'social-media-assets')
with check (bucket_id = 'social-media-assets');`;

// Helper to get active credentials
export function getStoredSupabaseConfig(): SupabaseConfig | null {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey && !envUrl.includes('xyzcompany') && !envKey.includes('eyJhbGciOi...')) {
    return { url: envUrl, anonKey: envKey };
  }

  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_SUPABASE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading saved supabase config', e);
  }

  return null;
}

export function saveSupabaseConfig(config: SupabaseConfig | null) {
  if (config) {
    localStorage.setItem(LOCAL_STORAGE_SUPABASE_KEY, JSON.stringify(config));
    // Synchronize credentials with Node backend server
    fetch('/api/config/supabase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    }).catch(() => {});
  } else {
    localStorage.removeItem(LOCAL_STORAGE_SUPABASE_KEY);
    fetch('/api/config/supabase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: '' }),
    }).catch(() => {});
  }
}

export function getSupabaseHeaders(): Record<string, string> {
  const config = getStoredSupabaseConfig();
  if (config?.url && config?.anonKey) {
    return {
      'x-supabase-url': config.url,
      'x-supabase-key': config.anonKey,
    };
  }
  return {};
}

let cachedClient: SupabaseClient | null = null;
let lastClientUrl = '';

export function getSupabase(): SupabaseClient | null {
  const config = getStoredSupabaseConfig();
  if (!config?.url || !config?.anonKey) {
    return null;
  }

  if (cachedClient && lastClientUrl === config.url) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey);
    lastClientUrl = config.url;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

// Fallback Local Storage handler for mock mode
function getLocalPosts(): Post[] {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_POSTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading local posts:', e);
  }
  // Initialize with rich mock posts
  localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify(initialMockPosts));
  return initialMockPosts;
}

function saveLocalPosts(posts: Post[]) {
  localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify(posts));
}

// CRUD Operations
export async function apiFetchPosts(): Promise<{ posts: Post[]; isMock: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    const local = getLocalPosts();
    try {
      // Also check server /api/posts in case posts were ingested via webhook/API or generated by server AI
      const resp = await fetch('/api/posts', {
        headers: getSupabaseHeaders(),
      });
      if (resp.ok) {
        const json = await resp.json();
        if (Array.isArray(json.posts) && json.posts.length > 0) {
          const localIds = new Set(local.map((p) => p.id));
          const newFromServer = json.posts.filter((p: Post) => !localIds.has(p.id));
          if (newFromServer.length > 0) {
            const merged = [...newFromServer, ...local];
            saveLocalPosts(merged);
            return { posts: merged, isMock: true };
          }
        }
      }
    } catch {
      // Ignore network failures for local fallback
    }
    return { posts: local, isMock: true };
  }

  try {
    // 1. Try modern relational model: scheduled_posts joined with platform tables
    const { data: schedData, error: schedError } = await supabase
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
      const mappedPosts: Post[] = schedData.map((sp: any) => {
        const fbList = sp.facebook_posts || [];
        const igList = sp.instagram_posts || [];
        const ytList = sp.youtube_posts || [];
        const thList = sp.threads_posts || [];

        const platforms: Platform[] = [];
        if (fbList.length > 0) platforms.push('facebook');
        if (igList.length > 0) platforms.push('instagram');
        if (ytList.length > 0) platforms.push('youtube');
        if (thList.length > 0) platforms.push('threads');

        const fb = fbList[0];
        const ig = igList[0];
        const yt = ytList[0];
        const th = thList[0];

        const baseText = fb?.message || ig?.caption || yt?.description || th?.text || sp.title || '';
        const mediaUrls = fb?.media_urls?.length ? fb.media_urls : ig?.media_urls?.length ? ig.media_urls : th?.media_urls || [];

        const customContent: CustomContent = {};
        if (fb) {
          customContent.facebook = {
            format: fb.format,
            targetType: fb.target_type,
            firstComment: fb.first_comment,
            hashtags: fb.hashtags,
            linkPreviewTitle: fb.link_url,
            callToAction: fb.call_to_action,
          };
        }
        if (ig) {
          customContent.instagram = {
            format: ig.format,
            isReel: ig.is_reel,
            firstComment: ig.first_comment,
            hashtags: ig.hashtags,
            audioTrackName: ig.audio_track_name,
          };
        }
        if (yt) {
          customContent.youtube = {
            title: yt.video_title,
            description: yt.description,
            format: yt.format,
            visibility: yt.privacy_status,
          };
        }

        return {
          id: sp.id,
          created_at: sp.created_at,
          scheduled_at: sp.scheduled_at,
          status: sp.status,
          base_text: baseText,
          media_urls: mediaUrls,
          custom_content: customContent,
          platforms: platforms.length > 0 ? platforms : ['facebook', 'instagram'],
          error_log: sp.error_log,
        };
      });

      saveLocalPosts(mappedPosts);
      return { posts: mappedPosts, isMock: false };
    }

    // 2. Fallback: try legacy posts table if scheduled_posts table is not migrated yet
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.warn('Supabase query error, falling back to local state:', error.message);
      return { posts: getLocalPosts(), isMock: true, error: error.message };
    }

    const allPosts = (data || []) as Post[];
    saveLocalPosts(allPosts);
    return { posts: allPosts, isMock: false };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { posts: getLocalPosts(), isMock: true, error: message };
  }
}

export async function apiCreatePost(postData: Omit<Post, 'id' | 'created_at'>): Promise<{ post: Post; isMock: boolean }> {
  const supabase = getSupabase();
  const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `post-${Date.now()}`;
  const now = new Date().toISOString();

  const newPost: Post = {
    ...postData,
    id: newId,
    created_at: now,
  };

  if (!supabase) {
    const local = getLocalPosts();
    const updated = [newPost, ...local];
    saveLocalPosts(updated);
    return { post: newPost, isMock: true };
  }

  try {
    // 1. Try relational scheduled_posts table first
    const { data: schedData, error: schedError } = await supabase
      .from('scheduled_posts')
      .insert([
        {
          scheduled_at: postData.scheduled_at,
          status: postData.status,
          title: postData.base_text.slice(0, 100),
          notes: 'PostPulse Campaign Post',
          error_log: postData.error_log || null,
        },
      ])
      .select()
      .single();

    if (!schedError && schedData) {
      const parentId = schedData.id;

      // Insert child rows for each active platform
      if (postData.platforms.includes('facebook')) {
        const fbCustom = postData.custom_content?.facebook || {};
        await supabase.from('facebook_posts').insert({
          post_id: parentId,
          target_type: fbCustom.targetType === 'profile' ? 'profile' : 'page',
          message: postData.base_text,
          format: fbCustom.format || 'post',
          media_urls: postData.media_urls,
          call_to_action: fbCustom.callToAction,
          hashtags: fbCustom.hashtags,
          first_comment: fbCustom.firstComment,
          status: postData.status,
        });
      }

      if (postData.platforms.includes('instagram')) {
        const igCustom = postData.custom_content?.instagram || {};
        await supabase.from('instagram_posts').insert({
          post_id: parentId,
          caption: postData.base_text,
          format: igCustom.format || (igCustom.isReel ? 'reel' : 'post'),
          is_reel: igCustom.isReel || igCustom.format === 'reel',
          media_urls: postData.media_urls,
          hashtags: igCustom.hashtags,
          first_comment: igCustom.firstComment,
          status: postData.status,
        });
      }

      if (postData.platforms.includes('youtube')) {
        const ytCustom = postData.custom_content?.youtube || {};
        await supabase.from('youtube_posts').insert({
          post_id: parentId,
          video_title: ytCustom.title || postData.base_text.slice(0, 70),
          description: ytCustom.description || postData.base_text,
          format: ytCustom.format || 'video',
          video_url: postData.media_urls[0] || null,
          privacy_status: ytCustom.visibility || 'public',
          status: postData.status,
        });
      }

      if (postData.platforms.includes('threads')) {
        await supabase.from('threads_posts').insert({
          post_id: parentId,
          text: postData.base_text,
          media_urls: postData.media_urls,
          status: postData.status,
        });
      }

      const createdObj = { ...newPost, id: parentId };
      const local = getLocalPosts();
      saveLocalPosts([createdObj, ...local]);
      return { post: createdObj, isMock: false };
    }

    // 2. Fallback: try legacy posts table if scheduled_posts wasn't present
    const { data, error } = await supabase
      .from('posts')
      .insert([
        {
          scheduled_at: postData.scheduled_at,
          status: postData.status,
          base_text: postData.base_text,
          media_urls: postData.media_urls,
          custom_content: postData.custom_content,
          platforms: postData.platforms,
          error_log: postData.error_log || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.warn('Supabase insert failed, saving locally:', error);
      const local = getLocalPosts();
      saveLocalPosts([newPost, ...local]);
      return { post: newPost, isMock: true };
    }

    return { post: data as Post, isMock: false };
  } catch {
    const local = getLocalPosts();
    saveLocalPosts([newPost, ...local]);
    return { post: newPost, isMock: true };
  }
}

export async function apiUpdatePost(id: string, updates: Partial<Post>): Promise<{ success: boolean; isMock: boolean }> {
  const supabase = getSupabase();
  const local = getLocalPosts();
  const updated = local.map((p) => (p.id === id ? { ...p, ...updates } : p));
  saveLocalPosts(updated);

  if (!supabase) {
    return { success: true, isMock: true };
  }

  try {
    // 1. Try relational scheduled_posts update
    if (updates.scheduled_at || updates.status || updates.base_text) {
      await supabase
        .from('scheduled_posts')
        .update({
          ...(updates.scheduled_at ? { scheduled_at: updates.scheduled_at } : {}),
          ...(updates.status ? { status: updates.status } : {}),
          ...(updates.base_text ? { title: updates.base_text.slice(0, 100) } : {}),
        })
        .eq('id', id);

      if (updates.base_text) {
        await supabase.from('facebook_posts').update({ message: updates.base_text }).eq('post_id', id);
        await supabase.from('instagram_posts').update({ caption: updates.base_text }).eq('post_id', id);
        await supabase.from('youtube_posts').update({ description: updates.base_text }).eq('post_id', id);
        await supabase.from('threads_posts').update({ text: updates.base_text }).eq('post_id', id);
      }
    }

    // 2. Also try legacy posts table
    await supabase.from('posts').update(updates).eq('id', id);
    return { success: true, isMock: false };
  } catch {
    return { success: true, isMock: true };
  }
}

export async function apiDeletePost(id: string): Promise<{ success: boolean; isMock: boolean }> {
  const supabase = getSupabase();
  const local = getLocalPosts();
  saveLocalPosts(local.filter((p) => p.id !== id));

  if (!supabase) {
    return { success: true, isMock: true };
  }

  try {
    // Delete from scheduled_posts (cascades to all platform tables!)
    const { error: schedErr } = await supabase.from('scheduled_posts').delete().eq('id', id);
    if (!schedErr) {
      return { success: true, isMock: false };
    }
    // Also try legacy posts table
    await supabase.from('posts').delete().eq('id', id);
    return { success: true, isMock: false };
  } catch {
    return { success: true, isMock: true };
  }
}

// Media Upload to Supabase Storage Bucket 'social-media-assets'
export async function apiUploadMedia(
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ url: string; isMock: boolean }> {
  const supabase = getSupabase();

  // Progress simulation for UI feedback
  if (onProgress) {
    onProgress(15);
    setTimeout(() => onProgress(60), 200);
    setTimeout(() => onProgress(90), 400);
  }

  if (!supabase) {
    // Return a local Object URL or Data URL for testing
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (onProgress) onProgress(100);
        resolve({
          url: (e.target?.result as string) || URL.createObjectURL(file),
          isMock: true,
        });
      };
      reader.onerror = () => {
        if (onProgress) onProgress(100);
        resolve({
          url: URL.createObjectURL(file),
          isMock: true,
        });
      };
      reader.readAsDataURL(file);
    });
  }

  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.warn('Supabase storage upload error:', uploadError);
      // Fallback to client blob URL
      if (onProgress) onProgress(100);
      return {
        url: URL.createObjectURL(file),
        isMock: true,
      };
    }

    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    if (onProgress) onProgress(100);
    return {
      url: publicUrlData.publicUrl,
      isMock: false,
    };
  } catch (err) {
    console.error('Upload exception:', err);
    if (onProgress) onProgress(100);
    return {
      url: URL.createObjectURL(file),
      isMock: true,
    };
  }
}

// AI Campaign Generation Client helper
export interface AiCampaignParams {
  topic: string;
  count: number;
  platforms: string[];
  tone: string;
  startDate?: string;
  autoSaveDrafts?: boolean;
}

export async function apiGenerateAiCampaign(params: AiCampaignParams): Promise<{
  success: boolean;
  posts: Post[];
  message: string;
  count: number;
  savedTo: string;
  supabaseError?: string;
}> {
  const resp = await fetch('/api/ai/generate-campaign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getSupabaseHeaders(),
    },
    body: JSON.stringify({
      topic: params.topic,
      count: params.count,
      platforms: params.platforms,
      tone: params.tone,
      startDate: params.startDate || new Date().toISOString(),
      autoSaveDrafts: params.autoSaveDrafts ?? true,
    }),
  });

  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    throw new Error(errData.error || `Szerver hiba (${resp.status}): Nem sikerült az AI posztokat generálni.`);
  }

  const data = await resp.json();

  // If Supabase is active in browser and server didn't already save to Supabase, perform direct insert
  const supabase = getSupabase();
  if (supabase && data.posts && Array.isArray(data.posts) && data.posts.length > 0 && data.savedTo !== 'supabase') {
    try {
      const insertPayload = data.posts.map((p: any) => ({
        scheduled_at: p.scheduled_at,
        status: 'draft',
        base_text: p.base_text || '',
        media_urls: p.media_urls || [],
        custom_content: p.custom_content || {},
        platforms: p.platforms || ['facebook', 'instagram'],
      }));
      const { data: inserted, error: insertErr } = await supabase
        .from('posts')
        .insert(insertPayload)
        .select();

      if (!insertErr && inserted) {
        data.posts = inserted as Post[];
        data.savedTo = 'supabase';
      } else if (insertErr) {
        console.warn('Client-side Supabase insert error for AI posts:', insertErr.message);
        data.supabaseError = insertErr.message;
      }
    } catch (e: any) {
      console.warn('Client-side Supabase insert exception for AI posts:', e);
    }
  }

  // Always sync into local storage as well
  if (data.posts && Array.isArray(data.posts)) {
    const local = getLocalPosts();
    const localIds = new Set(local.map((p) => p.id));
    const newItems = data.posts.filter((p: Post) => !localIds.has(p.id));
    if (newItems.length > 0) {
      saveLocalPosts([...newItems, ...local]);
    }
  }

  return data;
}

// Ingestion API helper for sending test posts
export async function apiIngestPostViaApi(payload: any): Promise<{
  success: boolean;
  message: string;
  count: number;
  posts: Post[];
  savedTo?: string;
  supabaseError?: string;
}> {
  const resp = await fetch('/api/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getSupabaseHeaders(),
    },
    body: typeof payload === 'string' ? payload : JSON.stringify(payload),
  });

  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP ${resp.status}: Hiba a poszt beküldésekor.`);
  }

  const data = await resp.json();

  const supabase = getSupabase();
  if (supabase && data.posts && Array.isArray(data.posts) && data.posts.length > 0 && data.savedTo !== 'supabase') {
    try {
      const insertPayload = data.posts.map((p: any) => ({
        scheduled_at: p.scheduled_at,
        status: 'draft',
        base_text: p.base_text || '',
        media_urls: p.media_urls || [],
        custom_content: p.custom_content || {},
        platforms: p.platforms || ['facebook', 'instagram'],
      }));
      const { data: inserted, error: insertErr } = await supabase
        .from('posts')
        .insert(insertPayload)
        .select();

      if (!insertErr && inserted) {
        data.posts = inserted as Post[];
        data.savedTo = 'supabase';
      } else if (insertErr) {
        console.warn('Client-side Supabase insert error for API post:', insertErr.message);
        data.supabaseError = insertErr.message;
      }
    } catch (e: any) {
      console.warn('Client-side Supabase insert exception for API post:', e);
    }
  }

  if (data.posts && Array.isArray(data.posts)) {
    const local = getLocalPosts();
    const localIds = new Set(local.map((p) => p.id));
    const newItems = data.posts.filter((p: Post) => !localIds.has(p.id));
    if (newItems.length > 0) {
      saveLocalPosts([...newItems, ...local]);
    }
  }

  return data;
}

// Social Accounts CRUD in Supabase
export async function apiFetchSocialAccounts(): Promise<SocialAccount[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('social_accounts')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && data) {
      return data.map((a: any) => ({
        id: a.id,
        platform: a.platform,
        basePlatform: a.base_platform,
        name: a.name,
        handle: a.handle,
        platformNativeId: a.platform_native_id,
        avatarUrl: a.avatar_url,
        accessToken: a.access_token,
        isActive: a.is_active,
        createdAt: a.created_at,
      }));
    }
  } catch (err) {
    console.warn('Could not fetch social_accounts from Supabase:', err);
  }
  return [];
}

export async function apiSaveSocialAccount(acc: SocialAccount): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('social_accounts').upsert({
      id: acc.id,
      platform: acc.platform,
      base_platform: acc.basePlatform,
      name: acc.name,
      handle: acc.handle,
      platform_native_id: acc.platformNativeId,
      avatar_url: acc.avatarUrl,
      access_token: acc.accessToken,
      is_active: acc.isActive,
    });
    return !error;
  } catch {
    return false;
  }
}

export interface ApiEndpointTestResult {
  status: number;
  statusText: string;
  ok: boolean;
  timeMs: number;
  data: any;
  extractedPosts: Post[];
  message: string;
}

// Universal API tester for all endpoints (POST/GET for /api/posts, /api/facebook/posts, /api/instagram/posts, /api/youtube/videos, /api/accounts)
export async function apiExecuteCustomEndpoint(
  endpointPath: string,
  method: 'POST' | 'GET' = 'POST',
  payload?: any
): Promise<ApiEndpointTestResult> {
  const startTime = Date.now();
  const cleanPath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;

  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...getSupabaseHeaders(),
    },
  };

  if (method === 'POST' && payload !== undefined) {
    fetchOptions.body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  }

  const resp = await fetch(cleanPath, fetchOptions);
  const timeMs = Date.now() - startTime;
  let data: any = null;
  try {
    data = await resp.json();
  } catch {
    const text = await resp.text().catch(() => '');
    data = { raw: text };
  }

  const extractedPosts: Post[] = [];
  if (data?.posts && Array.isArray(data.posts)) {
    extractedPosts.push(...data.posts);
  } else if (data?.post && typeof data.post === 'object') {
    extractedPosts.push(data.post);
  }

  // Sync to local calendar store
  if (extractedPosts.length > 0) {
    const local = getLocalPosts();
    const localIds = new Set(local.map((p) => p.id));
    const newItems = extractedPosts.filter((p) => !localIds.has(p.id));
    if (newItems.length > 0) {
      saveLocalPosts([...newItems, ...local]);
    }
  }

  return {
    status: resp.status,
    statusText: `${resp.status} ${resp.statusText || (resp.ok ? 'OK' : 'Error')}`,
    ok: resp.ok,
    timeMs,
    data,
    extractedPosts,
    message: data?.message || (resp.ok ? 'A kérés sikeresen lefutott.' : data?.error || 'Hiba történt a hívás során.'),
  };
}
