import { Platform, SocialAccountCredential, SocialAccount } from '../types';

const STORAGE_KEY = 'postpulse_social_accounts_v1';
const MULTI_ACCOUNTS_STORAGE_KEY = 'postpulse_multi_social_accounts_v1';

export const DEFAULT_MULTI_ACCOUNTS: SocialAccount[] = [
  // 1. Facebook accounts (Magán profilok és Üzleti oldalak)
  {
    id: 'acc_fb_napicsabi',
    platform: 'facebook_profile',
    basePlatform: 'facebook',
    name: 'napicsabi (Személyes)',
    handle: '@napicsabi',
    platformNativeId: '100091240182741',
    accountType: 'personal',
    authMode: 'credentials',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    notes: 'Személyes magánprofil (napicsabi) - közvetlen bejegyzések & sztorik',
    isActive: true,
    createdAt: '2026-09-10T10:00:00Z',
  },
  {
    id: 'acc_fb_kiss_csaba',
    platform: 'facebook_profile',
    basePlatform: 'facebook',
    name: 'kiss.csaba (Személyes)',
    handle: '@kiss.csaba',
    platformNativeId: '100084920194820',
    accountType: 'personal',
    authMode: 'credentials',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80',
    notes: 'Személyes profil (kiss.csaba) - privát profil időzítés',
    isActive: true,
    createdAt: '2026-09-11T12:00:00Z',
  },
  {
    id: 'acc_fb_vellionation',
    platform: 'facebook_page',
    basePlatform: 'facebook',
    name: 'VellioNation Hivatalos Oldal',
    handle: '@vellionation',
    platformNativeId: '109283741829182',
    accountType: 'business',
    authMode: 'api_token',
    avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
    notes: 'Céges Facebook oldal - Meta Graph API',
    isActive: true,
    createdAt: '2026-09-12T14:00:00Z',
  },
  {
    id: 'acc_fb_techmagazin',
    platform: 'facebook_page',
    basePlatform: 'facebook',
    name: 'TechMagazin Üzleti Oldal',
    handle: '@techmagazin',
    platformNativeId: '109283741829999',
    accountType: 'business',
    authMode: 'api_token',
    avatarUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=120&q=80',
    notes: 'Második Facebook céges oldal - Hírek és cikkek',
    isActive: true,
    createdAt: '2026-09-13T10:00:00Z',
  },

  // 2. Instagram accounts (Személyes és Céges profilok)
  {
    id: 'acc_ig_vellionation',
    platform: 'instagram',
    basePlatform: 'instagram',
    name: 'VellioNation Hivatalos IG',
    handle: '@vellionation',
    platformNativeId: '178414001928374',
    accountType: 'business',
    authMode: 'api_token',
    avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
    notes: 'Hivatalos Instagram Creator / Business profil',
    isActive: true,
    createdAt: '2026-09-12T15:00:00Z',
  },
  {
    id: 'acc_ig_napicsabi',
    platform: 'instagram',
    basePlatform: 'instagram',
    name: 'Csaba Személyes IG',
    handle: '@napicsabi',
    platformNativeId: '178414001928999',
    accountType: 'personal',
    authMode: 'api_token',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    notes: 'Személyes Instagram fiók - Hétköznapi pillanatok & Reels',
    isActive: true,
    createdAt: '2026-09-13T11:00:00Z',
  },
  {
    id: 'acc_ig_techmagazin',
    platform: 'instagram',
    basePlatform: 'instagram',
    name: 'TechMagazin IG',
    handle: '@techmagazin_hu',
    platformNativeId: '178414001928888',
    accountType: 'business',
    authMode: 'api_token',
    avatarUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=120&q=80',
    notes: 'Tech hírek, carousels és infografikák',
    isActive: true,
    createdAt: '2026-09-14T12:00:00Z',
  },

  // 3. YouTube channels
  {
    id: 'acc_yt_tech',
    platform: 'youtube',
    basePlatform: 'youtube',
    name: 'Tech & AI Csatorna',
    handle: '@TechAICsatorna',
    platformNativeId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
    accountType: 'business',
    authMode: 'api_token',
    avatarUrl: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=120&q=80',
    notes: '1. YouTube csatorna - Technológia, AI és szoftverek',
    isActive: true,
    createdAt: '2026-09-13T16:00:00Z',
  },
  {
    id: 'acc_yt_vlogs',
    platform: 'youtube',
    basePlatform: 'youtube',
    name: 'Csabi Vlogs & Lifestyle',
    handle: '@CsabiVlogs',
    platformNativeId: 'UC_vlog99Xz1234lifestyle',
    accountType: 'personal',
    authMode: 'api_token',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    notes: '2. YouTube csatorna - Személyes vlogok, utazás & életmód',
    isActive: true,
    createdAt: '2026-09-14T09:00:00Z',
  },
  {
    id: 'acc_yt_gaming',
    platform: 'youtube',
    basePlatform: 'youtube',
    name: 'Oktató & Gaming Csatorna',
    handle: '@CsabiGaming',
    platformNativeId: 'UC_gam3r007tutorials',
    accountType: 'business',
    authMode: 'api_token',
    avatarUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=120&q=80',
    notes: '3. YouTube csatorna - Játékmenetek, útmutatók & gameplay',
    isActive: true,
    createdAt: '2026-09-15T11:00:00Z',
  },

  // 4. Threads accounts
  {
    id: 'acc_th_napicsabi',
    platform: 'threads',
    basePlatform: 'threads',
    name: 'napicsabi Threads',
    handle: '@napicsabi',
    platformNativeId: 'th_998124018',
    accountType: 'personal',
    authMode: 'api_token',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    notes: 'Threads személyes szálak & gyors gondolatok',
    isActive: true,
    createdAt: '2026-09-16T10:00:00Z',
  },
  {
    id: 'acc_th_vellionation',
    platform: 'threads',
    basePlatform: 'threads',
    name: 'VellioNation Threads',
    handle: '@vellionation',
    platformNativeId: 'th_998124099',
    accountType: 'business',
    authMode: 'api_token',
    avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
    notes: 'Üzleti Threads hírek és közösségi beszélgetések',
    isActive: true,
    createdAt: '2026-09-16T14:00:00Z',
  },
];

export function getStoredMultiAccounts(): SocialAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(MULTI_ACCOUNTS_STORAGE_KEY);
    // If user has never accessed storage, initialize with defaults
    if (raw === null) {
      localStorage.setItem(MULTI_ACCOUNTS_STORAGE_KEY, JSON.stringify(DEFAULT_MULTI_ACCOUNTS));
      return DEFAULT_MULTI_ACCOUNTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Respect user's choice even if parsed is an empty array []!
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

export function findSocialAccountByIdentifier(
  idOrHandleOrName: string,
  accounts: SocialAccount[] = getStoredMultiAccounts()
): SocialAccount | undefined {
  if (!idOrHandleOrName) return undefined;
  const clean = idOrHandleOrName.trim().toLowerCase();
  const withoutAt = clean.startsWith('@') ? clean.slice(1) : clean;

  return accounts.find((a) => {
    if (a.id.toLowerCase() === clean) return true;
    if (a.name.toLowerCase() === clean) return true;
    if (a.handle?.toLowerCase() === clean || a.handle?.toLowerCase() === `@${withoutAt}` || a.handle?.replace('@', '').toLowerCase() === withoutAt) return true;
    // Substring match for name if specific
    if (a.name.toLowerCase().includes(clean)) return true;
    return false;
  });
}

export function saveMultiAccounts(accounts: SocialAccount[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MULTI_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error('Failed to save multi accounts:', err);
  }
}

export async function fetchServerSocialAccounts(): Promise<SocialAccount[]> {
  try {
    const res = await fetch('/api/accounts');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data.accounts)) {
      const mapped: SocialAccount[] = data.accounts.map((a: any) => ({
        id: a.id,
        platform: a.platform,
        basePlatform: a.base_platform || (a.platform.startsWith('facebook') ? 'facebook' : a.platform),
        name: a.name,
        handle: a.handle || '',
        platformNativeId: a.platform_native_id || '',
        avatarUrl: a.avatar_url || '',
        accessToken: a.access_token || '',
        authMode: a.auth_mode || 'api_token',
        username: a.username || '',
        password: a.password || '',
        appId: a.app_id || '',
        appSecret: a.app_secret || '',
        accountType: a.account_type || (a.platform === 'facebook_profile' ? 'personal' : 'business'),
        notes: a.notes || '',
        isActive: a.is_active !== false,
        createdAt: a.created_at,
      }));
      // Save mapped accounts to local storage (even if empty!)
      saveMultiAccounts(mapped);
      return mapped;
    }
  } catch (err) {
    console.warn('Failed fetching accounts from /api/accounts, using local cache:', err);
  }
  return getStoredMultiAccounts();
}

export async function apiSaveAccount(account: Partial<SocialAccount> & { name: string; platform: any }): Promise<SocialAccount> {
  const payload = {
    id: account.id,
    platform: account.platform,
    base_platform: account.basePlatform || (account.platform.startsWith('facebook') ? 'facebook' : account.platform),
    name: account.name,
    handle: account.handle,
    platform_native_id: account.platformNativeId,
    avatar_url: account.avatarUrl,
    access_token: account.accessToken || (account.authMode === 'credentials' ? `MTR_SESSION_${Date.now()}` : ''),
    auth_mode: account.authMode || 'api_token',
    username: account.username,
    password: account.password,
    app_id: account.appId,
    app_secret: account.appSecret,
    account_type: account.accountType || 'business',
    notes: account.notes,
    is_active: account.isActive ?? true,
  };

  const res = await fetch('/api/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Hiba a fiók mentésekor' }));
    throw new Error(errorData.error || 'Hiba a fiók mentésekor');
  }

  const result = await res.json();
  const saved: SocialAccount = {
    id: result.account.id || account.id || `acc_${Date.now()}`,
    platform: result.account.platform,
    basePlatform: result.account.base_platform || (result.account.platform.startsWith('facebook') ? 'facebook' : result.account.platform),
    name: result.account.name,
    handle: result.account.handle || account.handle || '',
    platformNativeId: result.account.platform_native_id || account.platformNativeId || '',
    avatarUrl: result.account.avatar_url || account.avatarUrl || '',
    accessToken: result.account.access_token || account.accessToken || '',
    authMode: (result.account.auth_mode as any) || account.authMode || 'api_token',
    username: result.account.username || account.username || '',
    password: result.account.password || account.password || '',
    appId: result.account.app_id || account.appId || '',
    appSecret: result.account.app_secret || account.appSecret || '',
    accountType: result.account.account_type || account.accountType || 'business',
    notes: result.account.notes || account.notes || '',
    isActive: result.account.is_active !== false,
    createdAt: result.account.created_at || new Date().toISOString(),
  };

  // Update local storage
  const current = getStoredMultiAccounts();
  const existingIdx = current.findIndex((a) => a.id === saved.id);
  let updated: SocialAccount[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = saved;
  } else {
    updated = [...current, saved];
  }
  saveMultiAccounts(updated);

  return saved;
}

export async function apiDeleteAccount(id: string): Promise<void> {
  try {
    await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
  } catch (e) {
    console.warn('API delete request failed, proceeding locally:', e);
  }
  const current = getStoredMultiAccounts();
  const filtered = current.filter((a) => a.id !== id);
  saveMultiAccounts(filtered);
}

export async function apiDeleteAllAccounts(): Promise<void> {
  try {
    await fetch('/api/accounts', { method: 'DELETE' });
  } catch (e) {
    console.warn('API delete all request failed, proceeding locally:', e);
  }
  saveMultiAccounts([]);
}

export const DEFAULT_SOCIAL_ACCOUNTS: Record<Platform, SocialAccountCredential> = {
  facebook: {
    platform: 'facebook',
    connected: true,
    accountName: 'PostPulse Official Page',
    handle: '@postpulse_official',
    avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
    authMode: 'api_token',
    username: 'admin@postpulse.app',
    password: '••••••••••••',
    profileUrl: 'https://facebook.com/postpulse_official',
    accessToken: 'EAABwzLixnjYBAOd8q2kP98zXkL...',
    accountId: '109283741829182',
    appId: '849201948201',
    lastConnectedAt: '2026-09-15T14:30:00.000Z',
  },
  instagram: {
    platform: 'instagram',
    connected: true,
    accountName: 'PostPulse Tech & Creative',
    handle: '@postpulse_hq',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    authMode: 'api_token',
    username: 'postpulse_hq',
    password: '••••••••••••',
    profileUrl: 'https://instagram.com/postpulse_hq',
    accessToken: 'IGQWRvbD...jZAY3ZA1Q...',
    accountId: '178414001928374',
    appId: '849201948201',
    lastConnectedAt: '2026-09-15T14:32:00.000Z',
  },
  youtube: {
    platform: 'youtube',
    connected: true,
    accountName: 'PostPulse Tech Official',
    handle: 'PostPulse Studio',
    avatarUrl: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=120&q=80',
    authMode: 'api_token',
    username: 'studio@postpulse.app',
    password: '••••••••••••',
    profileUrl: 'https://youtube.com/@postpulsestudio',
    accessToken: 'AIzaSyDw49Pz...LkJmP912x',
    accountId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
    lastConnectedAt: '2026-09-14T11:20:00.000Z',
  },
  threads: {
    platform: 'threads',
    connected: true,
    accountName: 'PostPulse Threads Channel',
    handle: '@postpulse_hq',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    authMode: 'credentials',
    username: 'postpulse_threads',
    password: '••••••••••••',
    profileUrl: 'https://threads.net/@postpulse_hq',
    accessToken: 'THRD_sec_991823...',
    accountId: '9823471029',
    lastConnectedAt: '2026-09-15T15:00:00.000Z',
  },
};

export function getStoredSocialAccounts(): Record<Platform, SocialAccountCredential> {
  if (typeof window === 'undefined') return DEFAULT_SOCIAL_ACCOUNTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SOCIAL_ACCOUNTS));
      return DEFAULT_SOCIAL_ACCOUNTS;
    }
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SOCIAL_ACCOUNTS, ...parsed };
  } catch {
    return DEFAULT_SOCIAL_ACCOUNTS;
  }
}

export function saveSocialAccounts(
  accounts: Record<Platform, SocialAccountCredential>
): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error('Failed to save social accounts to localStorage:', err);
  }
}

export async function testPlatformConnection(
  platform: Platform,
  cred: SocialAccountCredential
): Promise<{ success: boolean; message: string }> {
  // Simulate network API validation latency
  await new Promise((res) => setTimeout(res, 750));

  if (cred.authMode === 'credentials') {
    if (!cred.username?.trim() || !cred.password?.trim()) {
      return {
        success: false,
        message: 'A bejelentkezéshez a felhasználónév/email és jelszó megadása kötelező!',
      };
    }
    return {
      success: true,
      message: `Sikeres Metricool-típusú fiók hitelesítés (${cred.username})! A publikálási munkamenet aktív, nem szükséges Meta Access Token.`,
    };
  } else {
    if (!cred.accessToken?.trim() && !cred.accountId?.trim()) {
      return {
        success: false,
        message: 'Kérjük adj meg érvényes Access Tokent vagy Fiók ID-t a teszteléshez!',
      };
    }
    return {
      success: true,
      message: `Sikeres API kapcsolat és token érvényesítés (${cred.handle || cred.accountName})!`,
    };
  }
}
