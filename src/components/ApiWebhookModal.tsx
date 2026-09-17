import React, { useState, useMemo } from 'react';
import {
  Code,
  X,
  Copy,
  Check,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  Terminal,
  Layers,
  FileJson,
  Globe,
  Play,
  RefreshCw,
  Clock,
  Share2,
} from 'lucide-react';
import { Post } from '../types';
import { apiExecuteCustomEndpoint, ApiEndpointTestResult } from '../lib/supabase';

interface ApiWebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostIngested: (newPosts: Post[]) => void;
}

export type EndpointCategory = 'all' | 'unified' | 'facebook' | 'instagram' | 'youtube' | 'accounts';

export interface EndpointPreset {
  label: string;
  payload: any;
}

export interface EndpointDefinition {
  id: string;
  name: string;
  category: 'unified' | 'facebook' | 'instagram' | 'youtube' | 'accounts';
  method: 'POST' | 'GET';
  path: string;
  badge: string;
  badgeColor: string;
  description: string;
  defaultPayload?: any;
  presets?: EndpointPreset[];
}

const getIsoDaysAhead = (daysAhead: number, hour = 14) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

const ENDPOINTS: EndpointDefinition[] = [
  // 1. KÖZPONTI INGESTION API
  {
    id: 'unified-post',
    name: 'POST /api/posts',
    category: 'unified',
    method: 'POST',
    path: '/api/posts',
    badge: 'Központi Ingestion',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    description:
      'Univerzális beérkező végpont. Automatikusan Draftként menti a posztot a moduláris Supabase táblákba (scheduled_posts + facebook_posts / instagram_posts / youtube_posts).',
    defaultPayload: {
      base_text: '🚀 Nagy örömmel jelentjük be az új funkciónkat! Hatékonyabb munkafolyamat és automatizáció egy helyen. Próbáld ki még ma! 👇',
      scheduled_at: getIsoDaysAhead(2),
      platforms: ['facebook', 'instagram'],
      format: 'feed',
      hashtags: '#automation #productivity #socialmedia #growth',
      first_comment: '🔗 Kérdésed van az új funkcióval kapcsolatban? Írd meg kommentben, vagy kattints a linkre: https://postpulse.app/uj-funkcio',
      media_urls: [
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
      ],
      status: 'draft',
    },
    presets: [
      {
        label: '📰 1. Normál Hírfolyam Poszt (FB + IG)',
        payload: {
          base_text: '🚀 Nagy örömmel jelentjük be az új funkciónkat! Hatékonyabb munkafolyamat és automatizáció egy helyen. Próbáld ki még ma! 👇',
          scheduled_at: getIsoDaysAhead(1),
          platforms: ['facebook', 'instagram'],
          format: 'feed',
          hashtags: '#automation #productivity #socialmedia',
          first_comment: '🔗 Részletek és kipróbálás: https://postpulse.app/uj-funkcio',
          media_urls: [
            'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
          ],
        },
      },
      {
        label: '🎬 2. Reels Videó (FB Reels + IG Reels)',
        payload: {
          base_text: '🔥 3 bevált trükk, amivel azonnal megduplázhatod a közösségi média eléréseidet! Mentsd el későbbre! 📌',
          scheduled_at: getIsoDaysAhead(2),
          platforms: ['facebook', 'instagram'],
          format: 'reel',
          hashtags: '#reels #instagramreels #facebookreels #growth',
          first_comment: 'Te melyik tippet teszteled először a héten? Írd meg alább kommentben! 👇',
          media_urls: [
            'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80',
          ],
        },
      },
      {
        label: '⏱️ 3. 24 órás Story Poszt',
        payload: {
          base_text: 'Élő Q&A kérdezz-felelek ma este 19:00-kor! Csatlakozz te is a közvetítéshez!',
          scheduled_at: getIsoDaysAhead(1),
          platforms: ['facebook', 'instagram'],
          format: 'story',
          media_urls: [
            'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
          ],
        },
      },
      {
        label: '⚡ 4. Kétféle FB egy hívással (Split: Oldal + Profil)',
        payload: {
          base_text: 'Kétféle Facebook célzás egyetlen hívással!',
          scheduled_at: getIsoDaysAhead(3),
          split_facebook: true,
          facebook_page: {
            base_text: '🏢 [Üzleti Oldal]: Új vállalati programunk elindult! Kérjen díjmentes konzultációt.',
            format: 'feed',
            targetName: 'Hivatalos Üzleti Oldal',
            callToAction: 'SIGN_UP',
            callToActionUrl: 'https://postpulse.app/partner',
            hashtags: '#partnerprogram #vallalkozas #uzlet',
          },
          facebook_profile: {
            base_text: '👤 [Saját Profil]: Nagyon büszke vagyok a csapatra, elindítottuk a legújabb fejlesztésünket! 🎉',
            format: 'feed',
            targetName: 'Saját Profil (Alapító)',
            hashtags: '#startuplife #buszke',
          },
          media_urls: [
            'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
          ],
        },
      },
    ],
  },
  {
    id: 'unified-get',
    name: 'GET /api/posts',
    category: 'unified',
    method: 'GET',
    path: '/api/posts',
    badge: 'Központi Lekérés',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    description:
      'Lekéri az összes időzített bejegyzést a Supabase relációs táblákból (vagy memóriából).',
  },

  // 2. FACEBOOK DEDIKÁLT VÉGPONTOK
  {
    id: 'fb-post',
    name: 'POST /api/facebook/posts',
    category: 'facebook',
    method: 'POST',
    path: '/api/facebook/posts',
    badge: 'Facebook Egyedi API',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    description:
      'Közvetlenül a Supabase facebook_posts és scheduled_posts relációs táblákba hoz létre Facebook bejegyzést (Üzleti oldal vagy Személyes profil célzással).',
    defaultPayload: {
      message: '📢 Hivatalos bejelentés vállalkozásunk Facebook Üzleti Oldalán! Új B2B megoldások és funkciók érhetők el a héttől.',
      scheduled_at: getIsoDaysAhead(1),
      target_type: 'page', // 'page' (Üzleti Oldal) vagy 'profile' (Saját Profil)
      format: 'post', // 'post' | 'reel' | 'story'
      media_urls: [
        'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80',
      ],
      call_to_action: 'LEARN_MORE',
      link_url: 'https://postpulse.app/b2b',
      hashtags: '#facebookmarketing #vallalkozas #uzlet #b2b',
      first_comment: '🔗 Kérj díjmentes bemutatót honlapunkon!',
    },
    presets: [
      {
        label: '🏢 1. Üzleti Oldal Hírfolyam Poszt',
        payload: {
          message: '📢 Üzleti hírfolyam bejegyzés! Céges hírek és szakmai tapasztalatok megosztása.',
          scheduled_at: getIsoDaysAhead(1),
          target_type: 'page',
          format: 'post',
          media_urls: [
            'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80',
          ],
          hashtags: '#vallalkozas #uzlet #hirek',
          first_comment: 'Írd meg véleményed alább kommentben! 👇',
        },
      },
      {
        label: '👤 2. Saját Személyes Profil Poszt',
        payload: {
          message: 'Személyes gondolatok a heti fejlesztésekről és a kulisszák mögötti kihívásokról... ☕ Ti hogyan kezelitek a pörgős napokat, ismerősök?',
          scheduled_at: getIsoDaysAhead(2),
          target_type: 'profile',
          format: 'post',
          media_urls: [
            'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
          ],
          first_comment: 'Írjátok meg bátran, kíváncsi vagyok a tapasztalataitokra!',
        },
      },
      {
        label: '🎬 3. Facebook Reel Videó (Oldalra)',
        payload: {
          message: '3 gyors technikai trükk a jobb hatékonyságért! Nézd meg a videót! 🎬',
          scheduled_at: getIsoDaysAhead(1),
          target_type: 'page',
          format: 'reel',
          media_urls: [
            'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80',
          ],
          hashtags: '#fbreels #facebookreel #tippek',
        },
      },
      {
        label: '🔗 4. Poszt Call-To-Action gombbal és Linkkel',
        payload: {
          message: 'Töltsd le az új ingyenes útmutatónkat a hatékonyabb közösségi média jelenléthez!',
          scheduled_at: getIsoDaysAhead(2),
          target_type: 'page',
          format: 'post',
          link_url: 'https://postpulse.app/utmutato',
          call_to_action: 'DOWNLOAD',
          hashtags: '#ingyenes #utmutato #marketing',
          first_comment: '🔗 Közvetlen letöltés linkje a kommentben is elérhető: https://postpulse.app/utmutato',
        },
      },
    ],
  },
  {
    id: 'fb-get',
    name: 'GET /api/facebook/posts',
    category: 'facebook',
    method: 'GET',
    path: '/api/facebook/posts',
    badge: 'Facebook Lekérés',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    description: 'Lekéri az összes Facebook bejegyzést a facebook_posts táblából és a kapcsolt időzítési adatokat.',
  },

  // 3. INSTAGRAM DEDIKÁLT VÉGPONTOK
  {
    id: 'ig-post',
    name: 'POST /api/instagram/posts',
    category: 'instagram',
    method: 'POST',
    path: '/api/instagram/posts',
    badge: 'Instagram Egyedi API',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    description:
      'Közvetlenül az instagram_posts és scheduled_posts táblába hoz létre Instagram bejegyzést (Hírfolyam kép, Reels 9:16 videó, vagy Story formátumban).',
    defaultPayload: {
      caption: '✨ Új inspiráció a mai napra! A következetes munka mindig meghozza a gyümölcsét. Te ma mivel léptél közelebb a céljaidhoz? 🎯',
      scheduled_at: getIsoDaysAhead(1),
      format: 'post', // 'post' | 'reel' | 'story'
      media_urls: [
        'https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=1200&q=80',
      ],
      hashtags: '#instagram #mindset #motivacio #vallalkozas #instadaily',
      first_comment: '📌 Mentsd el a posztot későbbre, és oszd meg egy barátoddal, akinek jól jön ez a motiváció!',
    },
    presets: [
      {
        label: '📸 1. Képes Hírfolyam Poszt',
        payload: {
          caption: '✨ Új inspiráció a mai napra! A következetes munka mindig meghozza a gyümölcsét.',
          scheduled_at: getIsoDaysAhead(1),
          format: 'post',
          media_urls: [
            'https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=1200&q=80',
          ],
          hashtags: '#instagram #mindset #vallalkozas',
          first_comment: '📌 Mentsd el a posztot későbbre!',
        },
      },
      {
        label: '🎬 2. Instagram Reel (9:16 Videó)',
        payload: {
          caption: 'A 3 leggyakoribb hiba, amit látok az időzítés során... Ne kövesd el őket te is! ❌',
          scheduled_at: getIsoDaysAhead(2),
          format: 'reel',
          is_reel: true,
          audio_track_name: 'Trending Creator Audio 2026',
          media_urls: [
            'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80',
          ],
          hashtags: '#reels #instagramreels #viralvideo #contentcreator',
          first_comment: 'Te melyik hibát vetted észre legutóbb a profilodon? Írd meg!',
        },
      },
      {
        label: '⏱️ 3. Instagram Story (24h)',
        payload: {
          caption: 'Élő bejelentkezés ma este 19:00-kor! Csatlakozz!',
          scheduled_at: getIsoDaysAhead(1),
          format: 'story',
          media_urls: [
            'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
          ],
        },
      },
    ],
  },
  {
    id: 'ig-get',
    name: 'GET /api/instagram/posts',
    category: 'instagram',
    method: 'GET',
    path: '/api/instagram/posts',
    badge: 'Instagram Lekérés',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    description: 'Lekéri az instagram_posts táblában rögzített bejegyzéseket és az időzített státuszukat.',
  },

  // 4. YOUTUBE DEDIKÁLT VÉGPONTOK
  {
    id: 'yt-post',
    name: 'POST /api/youtube/videos',
    category: 'youtube',
    method: 'POST',
    path: '/api/youtube/videos',
    badge: 'YouTube Egyedi API',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    description:
      'Közvetlenül a youtube_posts és scheduled_posts táblába rögzít normál YouTube videót vagy YouTube Shorts-ot címmel, leírással, címkékkel.',
    defaultPayload: {
      title: 'Hogyan építs automatizált közösségi média stratégiát 2026-ban?',
      description: 'Ebben a videóban lépésről lépésre megmutatjuk a legújabb stratégiákat a növekedéshez.\n\nIdőbélyegek:\n0:00 Bevezetés\n01:45 Stratégia kialakítása\n05:20 Automatizáció beállítása\n\nIratkozz fel a csatornára a heti új videókért!',
      scheduled_at: getIsoDaysAhead(3),
      format: 'video', // 'video' (hosszú) vagy 'shorts' (függőleges)
      video_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnail_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      privacy_status: 'public', // 'public' | 'unlisted' | 'private'
      tags: ['automatizacio', 'marketing', 'youtube', 'socialmedia', 'vallalkozas'],
      category_id: '28', // Tudomány & Technológia
    },
    presets: [
      {
        label: '📹 1. Hosszú YouTube Videó (Normál 16:9)',
        payload: {
          title: 'Hogyan építs automatizált közösségi média stratégiát 2026-ban?',
          description: 'Lépésről lépésre útmutató a heti tartalomgyártáshoz és közzétételhez.',
          scheduled_at: getIsoDaysAhead(3),
          format: 'video',
          privacy_status: 'public',
          video_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          tags: ['marketing', 'tippek', 'youtube'],
        },
      },
      {
        label: '⚡ 2. YouTube Shorts (Függőleges 9:16)',
        payload: {
          title: 'Ezt a 3 trükköt minden tartalomkészítőnek ismernie kell! ⚡ #shorts',
          description: 'Gyors, 60 másodperces összefoglaló a leghasznosabb trükkökről.',
          scheduled_at: getIsoDaysAhead(1),
          format: 'shorts',
          privacy_status: 'public',
          video_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
          tags: ['shorts', 'tippek', 'rovidvideok'],
        },
      },
    ],
  },
  {
    id: 'yt-get',
    name: 'GET /api/youtube/posts',
    category: 'youtube',
    method: 'GET',
    path: '/api/youtube/posts',
    badge: 'YouTube Lekérés',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    description: 'Lekéri a youtube_posts táblában rögzített videókat és Shorts-okat.',
  },

  // 5. SOCIAL ACCOUNTS (FIÓKOK ÉS OLDALAK KEZELÉSE)
  {
    id: 'accounts-get',
    name: 'GET /api/accounts',
    category: 'accounts',
    method: 'GET',
    path: '/api/accounts',
    badge: 'Fiókok Lekérése',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    description: 'Lekéri a social_accounts táblában regisztrált összes platformot, Facebook oldalt és YouTube csatornát.',
  },
  {
    id: 'accounts-post',
    name: 'POST /api/accounts',
    category: 'accounts',
    method: 'POST',
    path: '/api/accounts',
    badge: 'Fiók Regisztrálása',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    description: 'Új csatlakoztatott Facebook oldalt, személyes profilt vagy YouTube csatornát ment a social_accounts táblába.',
    defaultPayload: {
      platform: 'facebook_page',
      base_platform: 'facebook',
      name: 'Innováció és Technológia Magazin',
      handle: '@innovacio_tech',
      platform_native_id: '109283741829182',
      is_active: true,
      avatar_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80',
    },
    presets: [
      {
        label: '🏢 Új Facebook Oldal regisztrálása',
        payload: {
          platform: 'facebook_page',
          base_platform: 'facebook',
          name: 'Tech Kft. Hivatalos Oldal',
          handle: '@techkft',
          platform_native_id: '109823487192',
          is_active: true,
        },
      },
      {
        label: '🎥 Új YouTube Csatorna regisztrálása',
        payload: {
          platform: 'youtube',
          base_platform: 'youtube',
          name: 'Tech & AI Podcast Csatorna',
          handle: '@tech_ai_podcast',
          platform_native_id: 'UC_sample_channel_id_123',
          is_active: true,
        },
      },
    ],
  },
];

export const ApiWebhookModal: React.FC<ApiWebhookModalProps> = ({
  isOpen,
  onClose,
  onPostIngested,
}) => {
  const [activeTab, setActiveTab] = useState<'tester' | 'curl' | 'schema'>('tester');
  const [selectedCategory, setSelectedCategory] = useState<EndpointCategory>('all');
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>('unified-post');
  const [jsonInput, setJsonInput] = useState<string>(() =>
    JSON.stringify(ENDPOINTS[0].defaultPayload, null, 2)
  );
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResult, setTestResult] = useState<ApiEndpointTestResult | null>(null);

  const selectedEndpoint = useMemo(() => {
    return ENDPOINTS.find((e) => e.id === selectedEndpointId) || ENDPOINTS[0];
  }, [selectedEndpointId]);

  const filteredEndpoints = useMemo(() => {
    if (selectedCategory === 'all') return ENDPOINTS;
    return ENDPOINTS.filter((e) => e.category === selectedCategory);
  }, [selectedCategory]);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const fullEndpointUrl = `${origin}${selectedEndpoint.path}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSelectEndpoint = (endpoint: EndpointDefinition) => {
    setSelectedEndpointId(endpoint.id);
    setTestResult(null);
    if (endpoint.method === 'POST' && endpoint.defaultPayload) {
      setJsonInput(JSON.stringify(endpoint.defaultPayload, null, 2));
    } else {
      setJsonInput('');
    }
  };

  const handleLoadPreset = (presetPayload: any) => {
    setJsonInput(JSON.stringify(presetPayload, null, 2));
    setTestResult(null);
  };

  const handleExecuteEndpoint = async () => {
    setIsSubmitting(true);
    setTestResult(null);

    try {
      let parsedPayload: any = undefined;
      if (selectedEndpoint.method === 'POST') {
        try {
          parsedPayload = JSON.parse(jsonInput || '{}');
        } catch (err: any) {
          throw new Error(`Érvénytelen JSON formátum: ${err.message}`);
        }
      }

      const res = await apiExecuteCustomEndpoint(
        selectedEndpoint.path,
        selectedEndpoint.method,
        parsedPayload
      );

      setTestResult(res);

      if (res.extractedPosts && res.extractedPosts.length > 0) {
        onPostIngested(res.extractedPosts);
      }
    } catch (err: any) {
      setTestResult({
        status: 500,
        statusText: 'Hiba történt',
        ok: false,
        timeMs: 0,
        data: null,
        extractedPosts: [],
        message: err.message || 'Nem sikerült az API hívás.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate dynamic curl example based on active endpoint and JSON
  const curlExample =
    selectedEndpoint.method === 'GET'
      ? `curl -X GET "${fullEndpointUrl}" \\
  -H "Accept: application/json"`
      : `curl -X POST "${fullEndpointUrl}" \\
  -H "Content-Type: application/json" \\
  -d '${jsonInput.replace(/'/g, "'\\''")}'`;

  // Generate dynamic python example
  const pythonExample =
    selectedEndpoint.method === 'GET'
      ? `import requests

url = "${fullEndpointUrl}"
response = requests.get(url)

print(response.status_code)
print(response.json())`
      : `import requests

url = "${fullEndpointUrl}"
payload = ${jsonInput || '{}'}

response = requests.post(url, json=payload)
print(response.status_code)
print(response.json())`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/95">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">Post Ingestion & Dedikált API-k</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Élő Végpontok
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Supabase Relációs Táblák
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Teszteld és automatizáld a bejegyzéseket: Központi posztolás, dedikált Facebook, Instagram és YouTube végpontok.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/60 px-6">
          <button
            onClick={() => setActiveTab('tester')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'tester'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileJson className="w-4 h-4" />
            <span>Interaktív Végpont Tesztelő</span>
          </button>
          <button
            onClick={() => setActiveTab('curl')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'curl'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>cURL & Python & n8n Kódminták</span>
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'schema'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Relációs Séma & Paraméterek</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* VÉGPONT KATEGÓRIA VÁLASZTÓ */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-semibold text-zinc-300">Válassz API kategóriát:</span>
              <span>{filteredEndpoints.length} elérhető végpont</span>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                🌐 Összes ({ENDPOINTS.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('unified')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedCategory === 'unified'
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                ⚡ Központi Ingestion (/api/posts)
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('facebook')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedCategory === 'facebook'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                🟦 Facebook API
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('instagram')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedCategory === 'instagram'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                🟪 Instagram API
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('youtube')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedCategory === 'youtube'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                🔴 YouTube API
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('accounts')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedCategory === 'accounts'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                👥 Fiókok API
              </button>
            </div>
          </div>

          {/* VÉGPONT KÁRTYÁK / SELECTOR */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {filteredEndpoints.map((ep) => {
              const isSelected = ep.id === selectedEndpoint.id;
              return (
                <button
                  key={ep.id}
                  type="button"
                  onClick={() => handleSelectEndpoint(ep)}
                  className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-zinc-800/90 border-cyan-500 ring-1 ring-cyan-500/50 shadow-md'
                      : 'bg-zinc-950/60 border-zinc-800 hover:bg-zinc-800/50 hover:border-zinc-700 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        ep.method === 'POST' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${ep.badgeColor}`}>
                      {ep.badge}
                    </span>
                  </div>
                  <div className="font-mono text-xs font-bold text-white truncate w-full mb-1">
                    {ep.path}
                  </div>
                  <div className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                    {ep.description}
                  </div>
                </button>
              );
            })}
          </div>

          {/* AKTÍV VÉGPONT RÉSZLETEI ÉS URL SÁV */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 overflow-hidden w-full sm:w-auto">
              <span
                className={`text-xs font-bold px-2 py-1 rounded shrink-0 ${
                  selectedEndpoint.method === 'POST' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
                }`}
              >
                {selectedEndpoint.method}
              </span>
              <code className="text-xs text-cyan-300 font-mono truncate">{fullEndpointUrl}</code>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => copyToClipboard(fullEndpointUrl)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs flex items-center gap-1.5 transition-colors shrink-0"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>URL másolása</span>
              </button>
            </div>
          </div>

          {/* TAB 1: INTERAKTÍV TESZTELŐ */}
          {activeTab === 'tester' && (
            <div className="space-y-4">
              {/* Presets if available for the active endpoint */}
              {selectedEndpoint.presets && selectedEndpoint.presets.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-300">
                      {selectedEndpoint.badge} minta adatsablonok:
                    </span>
                    <span className="text-[11px] font-mono text-cyan-400">
                      Kattints a sablon betöltéséhez
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedEndpoint.presets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleLoadPreset(preset.payload)}
                        className="text-[11px] px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/5 transition-colors flex items-center gap-1.5"
                      >
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area (Only for POST, or informational for GET) */}
              {selectedEndpoint.method === 'POST' ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Küldendő JSON Request Body:</span>
                    <span className="text-[11px] font-mono text-zinc-500">Content-Type: application/json</span>
                  </div>
                  <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    rows={11}
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl p-4 font-mono text-xs text-emerald-400 focus:outline-none focus:border-cyan-500 selection:bg-cyan-500/30"
                    spellCheck={false}
                  />
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                  <div className="font-bold text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <span>GET Kérés (Lekérdezés)</span>
                  </div>
                  <p className="text-zinc-400">
                    Ez egy olvasási végpont ({selectedEndpoint.path}), amelyhez nincs szükség JSON törzsre.
                    Kattints a lenti <strong>„Lekérdezés Futtatása (GET)”</strong> gombra az adatok azonnali beolvasásához!
                  </p>
                </div>
              )}

              {/* Action Button */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                <div className="text-xs text-zinc-400">
                  {selectedEndpoint.method === 'POST' ? (
                    <span>
                      A posztok azonnal <strong>draft (vázlat)</strong> státusszal jönnek létre és szinkronizálódnak a naptárba.
                    </span>
                  ) : (
                    <span>A lekérdezés a Supabase relációs táblákból vagy a szerver memóriájából olvas.</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleExecuteEndpoint}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 transition-all disabled:opacity-50 shrink-0"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Hívás folyamatban...</span>
                    </>
                  ) : (
                    <>
                      {selectedEndpoint.method === 'POST' ? (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Poszt Beküldése ({selectedEndpoint.path})</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 text-emerald-300" />
                          <span>Lekérdezés Futtatása (GET)</span>
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>

              {/* Result Panel */}
              {testResult && (
                <div
                  className={`p-4 rounded-xl border space-y-2.5 animate-in fade-in ${
                    testResult.ok
                      ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                      : 'bg-rose-950/30 border-rose-800/40 text-rose-300'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      {testResult.ok ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <span>Státusz: {testResult.statusText}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                        {testResult.timeMs} ms
                      </span>
                    </div>
                    {testResult.extractedPosts.length > 0 && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                        ✅ {testResult.extractedPosts.length} poszt hozzáadva a naptárhoz!
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-200">{testResult.message}</p>

                  {testResult.data && (
                    <div className="space-y-1">
                      <div className="text-[11px] text-zinc-400 font-mono">Válasz JSON adatok (Response):</div>
                      <pre className="text-[10px] bg-zinc-950/90 border border-zinc-800/80 p-3 rounded-lg overflow-x-auto text-zinc-300 font-mono max-h-60">
                        {JSON.stringify(testResult.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CURL & PYTHON & N8N */}
          {activeTab === 'curl' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200">
                    1. cURL parancs ({selectedEndpoint.name}):
                  </span>
                  <button
                    onClick={() => copyToClipboard(curlExample)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Másolás</span>
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 overflow-x-auto">
                  {curlExample}
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200">
                    2. Python kód ({selectedEndpoint.name}):
                  </span>
                  <button
                    onClick={() => copyToClipboard(pythonExample)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Másolás</span>
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 overflow-x-auto">
                  {pythonExample}
                </pre>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs text-zinc-300">
                <span className="font-bold text-white block">3. Integráció n8n / Make.com / Zapier rendszerekből:</span>
                <p className="text-zinc-400">
                  Állíts be egy <strong>HTTP Request</strong> modult:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                  <li>
                    <strong>Method:</strong> {selectedEndpoint.method}
                  </li>
                  <li>
                    <strong>URL:</strong> <code className="text-cyan-300">{fullEndpointUrl}</code>
                  </li>
                  {selectedEndpoint.method === 'POST' && (
                    <>
                      <li>
                        <strong>Headers:</strong> Content-Type: application/json
                      </li>
                      <li>
                        <strong>Body:</strong> Raw JSON
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: RELÁCIÓS SÉMA & PARAMÉTEREK */}
          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3 text-xs">
                <h3 className="font-bold text-sm text-white">Platform-Specifikus Relációs Sémák & Végpontok</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {/* Facebook */}
                  <div className="p-3.5 rounded-lg bg-zinc-900 border border-blue-500/30 space-y-2">
                    <div className="font-mono font-bold text-blue-400 flex items-center gap-1.5">
                      <span>POST /api/facebook/posts</span>
                    </div>
                    <div className="text-zinc-300 text-[11px] leading-relaxed">
                      Mezők: <code className="text-cyan-300">message</code>, <code className="text-cyan-300">target_type</code> ('page' | 'profile'), <code className="text-cyan-300">format</code> ('post' | 'reel' | 'story'), <code className="text-cyan-300">media_urls</code>, <code className="text-cyan-300">call_to_action</code>, <code className="text-cyan-300">link_url</code>, <code className="text-cyan-300">hashtags</code>, <code className="text-cyan-300">first_comment</code>.
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      Adatbázis táblák: <code className="text-emerald-400">scheduled_posts</code> + <code className="text-blue-400">facebook_posts</code>
                    </div>
                  </div>

                  {/* Instagram */}
                  <div className="p-3.5 rounded-lg bg-zinc-900 border border-purple-500/30 space-y-2">
                    <div className="font-mono font-bold text-purple-400 flex items-center gap-1.5">
                      <span>POST /api/instagram/posts</span>
                    </div>
                    <div className="text-zinc-300 text-[11px] leading-relaxed">
                      Mezők: <code className="text-cyan-300">caption</code>, <code className="text-cyan-300">format</code> ('post' | 'reel' | 'story'), <code className="text-cyan-300">is_reel</code>, <code className="text-cyan-300">media_urls</code>, <code className="text-cyan-300">hashtags</code>, <code className="text-cyan-300">first_comment</code>, <code className="text-cyan-300">audio_track_name</code>.
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      Adatbázis táblák: <code className="text-emerald-400">scheduled_posts</code> + <code className="text-purple-400">instagram_posts</code>
                    </div>
                  </div>

                  {/* YouTube */}
                  <div className="p-3.5 rounded-lg bg-zinc-900 border border-rose-500/30 space-y-2">
                    <div className="font-mono font-bold text-rose-400 flex items-center gap-1.5">
                      <span>POST /api/youtube/videos</span>
                    </div>
                    <div className="text-zinc-300 text-[11px] leading-relaxed">
                      Mezők: <code className="text-cyan-300">title</code>, <code className="text-cyan-300">description</code>, <code className="text-cyan-300">format</code> ('video' | 'shorts'), <code className="text-cyan-300">video_url</code>, <code className="text-cyan-300">thumbnail_url</code>, <code className="text-cyan-300">tags</code>, <code className="text-cyan-300">privacy_status</code> ('public' | 'unlisted' | 'private'), <code className="text-cyan-300">category_id</code>.
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      Adatbázis táblák: <code className="text-emerald-400">scheduled_posts</code> + <code className="text-rose-400">youtube_posts</code>
                    </div>
                  </div>

                  {/* Fiókok */}
                  <div className="p-3.5 rounded-lg bg-zinc-900 border border-emerald-500/30 space-y-2">
                    <div className="font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                      <span>POST & GET /api/accounts</span>
                    </div>
                    <div className="text-zinc-300 text-[11px] leading-relaxed">
                      Mezők: <code className="text-cyan-300">platform</code> ('facebook_page', 'facebook_profile', 'instagram', 'youtube'), <code className="text-cyan-300">name</code>, <code className="text-cyan-300">handle</code>, <code className="text-cyan-300">platform_native_id</code>, <code className="text-cyan-300">is_active</code>.
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      Adatbázis tábla: <code className="text-emerald-400">social_accounts</code>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 space-y-1">
                <span className="font-bold block text-purple-300">Hogyan szinkronizálódnak a naptárba a tesztek?</span>
                <p>
                  Amikor az Interaktív Tesztelőben meghívsz egy poszt-létrehozó végpontot (akár a központi <code className="text-cyan-300">/api/posts</code>, akár a dedikált <code className="text-blue-300">/api/facebook/posts</code>, <code className="text-purple-300">/api/instagram/posts</code> vagy <code className="text-rose-300">/api/youtube/videos</code> végpontot), a poszt automatikusan bekerül a naptárba <strong>Draft</strong> státusszal, így a tesztelés után a naptárban azonnal megtekintheted és módosíthatod!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-800 bg-zinc-900/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Minden végpont aktív és közvetlenül fogad kéréseket külső eszközökből (n8n, Python, curl).</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
          >
            Bezárás
          </button>
        </div>
      </div>
    </div>
  );
};
