import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Post, SupabaseConfig } from '../types';
import { initialMockPosts } from '../data/mockPosts';

const STORAGE_BUCKET = 'social-media-assets';
const LOCAL_STORAGE_POSTS_KEY = 'postpulse_local_posts_v2';
const LOCAL_STORAGE_SUPABASE_KEY = 'postpulse_supabase_config';

export const SQL_SCHEMA_STRING = `-- 1. Tábla létrehozása posztok tárolásához
create table if not exists public.posts (
    id uuid primary key default gen_random_uuid(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    scheduled_at timestamp with time zone not null,
    status text not null default 'draft' check (status in ('draft', 'scheduled', 'publishing', 'published', 'failed')),
    base_text text not null default '',
    media_urls text[] default array[]::text[],
    custom_content jsonb default '{}'::jsonb,
    platforms text[] not null default array[]::text[],
    error_log text
);

-- 2. Row Level Security (RLS) beállítása (opcionális publikus hozzáféréshez demó célra)
alter table public.posts enable row level security;
create policy "Allow all operations for public demo" 
on public.posts for all 
using (true) 
with check (true);

-- 3. Storage bucket létrehozása a médiafájlokhoz
-- A Supabase felületén vagy SQL-ben hozd létre a 'social-media-assets' nevű publikus bucketet!
insert into storage.buckets (id, name, public) 
values ('social-media-assets', 'social-media-assets', true)
on conflict (id) do nothing;

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
  } else {
    localStorage.removeItem(LOCAL_STORAGE_SUPABASE_KEY);
  }
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
    return { posts: getLocalPosts(), isMock: true };
  }

  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.warn('Supabase query error, falling back to local state:', error.message);
      return { posts: getLocalPosts(), isMock: true, error: error.message };
    }

    return { posts: data as Post[], isMock: false };
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

  if (!supabase) {
    const local = getLocalPosts();
    const updated = local.map((p) => (p.id === id ? { ...p, ...updates } : p));
    saveLocalPosts(updated);
    return { success: true, isMock: true };
  }

  try {
    const { error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.warn('Supabase update failed, updating locally:', error);
      const local = getLocalPosts();
      saveLocalPosts(local.map((p) => (p.id === id ? { ...p, ...updates } : p)));
      return { success: true, isMock: true };
    }

    return { success: true, isMock: false };
  } catch {
    const local = getLocalPosts();
    saveLocalPosts(local.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    return { success: true, isMock: true };
  }
}

export async function apiDeletePost(id: string): Promise<{ success: boolean; isMock: boolean }> {
  const supabase = getSupabase();

  if (!supabase) {
    const local = getLocalPosts();
    const updated = local.filter((p) => p.id !== id);
    saveLocalPosts(updated);
    return { success: true, isMock: true };
  }

  try {
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) {
      console.warn('Supabase delete failed, deleting locally:', error);
      const local = getLocalPosts();
      saveLocalPosts(local.filter((p) => p.id !== id));
      return { success: true, isMock: true };
    }
    return { success: true, isMock: false };
  } catch {
    const local = getLocalPosts();
    saveLocalPosts(local.filter((p) => p.id !== id));
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
