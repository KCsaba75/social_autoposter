import { Platform, SocialAccountCredential, SocialAccount } from '../types';

const STORAGE_KEY = 'postpulse_social_accounts_v1';
const MULTI_ACCOUNTS_STORAGE_KEY = 'postpulse_multi_social_accounts_v1';

export const DEFAULT_MULTI_ACCOUNTS: SocialAccount[] = [
  {
    id: 'acc_fb_page_main',
    platform: 'facebook_page',
    basePlatform: 'facebook',
    name: 'Hivatalos Üzleti Oldal',
    handle: '@postpulse_page',
    platformNativeId: '109283741829182',
    avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
    isActive: true,
  },
  {
    id: 'acc_fb_profile_main',
    platform: 'facebook_profile',
    basePlatform: 'facebook',
    name: 'Saját Személyes Profil',
    handle: 'fb.com/alapito_profil',
    platformNativeId: '100084920194820',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    isActive: true,
  },
  {
    id: 'acc_ig_main',
    platform: 'instagram',
    basePlatform: 'instagram',
    name: 'Instagram Fő Profil',
    handle: '@postpulse_hq',
    platformNativeId: '178414001928374',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    isActive: true,
  },
  {
    id: 'acc_yt_main',
    platform: 'youtube',
    basePlatform: 'youtube',
    name: 'YouTube Csatorna',
    handle: 'PostPulse Studio',
    platformNativeId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
    avatarUrl: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=120&q=80',
    isActive: true,
  },
];

export function getStoredMultiAccounts(): SocialAccount[] {
  if (typeof window === 'undefined') return DEFAULT_MULTI_ACCOUNTS;
  try {
    const raw = localStorage.getItem(MULTI_ACCOUNTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MULTI_ACCOUNTS_STORAGE_KEY, JSON.stringify(DEFAULT_MULTI_ACCOUNTS));
      return DEFAULT_MULTI_ACCOUNTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_MULTI_ACCOUNTS;
  } catch {
    return DEFAULT_MULTI_ACCOUNTS;
  }
}

export function saveMultiAccounts(accounts: SocialAccount[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MULTI_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error('Failed to save multi accounts:', err);
  }
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
      message: `Sikeres bejelentkezés és hitelesítés a ${platform.toUpperCase()} szerverein! (${cred.username})`,
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
