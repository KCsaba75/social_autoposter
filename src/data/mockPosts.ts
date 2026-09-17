import { Post } from '../types';

const now = new Date();

function getDateOffset(days: number, hour: number, minute: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const initialMockPosts: Post[] = [
  {
    id: 'post-1',
    created_at: getDateOffset(-2, 10, 0),
    scheduled_at: getDateOffset(0, 14, 30), // Today at 14:30
    status: 'scheduled',
    base_text: '🚀 Nagy bejelentés! Jövő héten debütál az új őszi termékkollekciónk! 🍂 Limitált darabszám, exkluzív prémium anyagok és környezettudatos csomagolás. Ki izgatott már?',
    media_urls: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80',
    ],
    custom_content: {
      instagram: {
        format: 'post',
        hashtags: '#fashion #autumn #limitededition #newcollection #design #premium',
        firstComment: 'Kattints a linkre a bióban az előzetes VIP feliratkozáshoz! 🎁',
      },
    },
    platforms: ['instagram'],
  },
  {
    id: 'post-story-ig',
    created_at: getDateOffset(-1, 9, 0),
    scheduled_at: getDateOffset(0, 18, 0), // Today evening
    status: 'scheduled',
    base_text: '🔥 Csak ma éjfélig: 24 órás villámakció a VIP tagoknak! Húzd fel a linket a részletekért!',
    media_urls: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80',
    ],
    custom_content: {
      instagram: {
        format: 'story',
        storyLink: 'https://postpulse.app/vip-flash',
        storyStickerText: 'VÁSÁRLÁS MOST 🛍️',
      },
    },
    platforms: ['instagram'],
  },
  {
    id: 'post-reel-viral',
    created_at: getDateOffset(-2, 11, 0),
    scheduled_at: getDateOffset(1, 16, 0), // Tomorrow 16:00
    status: 'scheduled',
    base_text: '✨ Kulisszák mögött: Így készül az új 2026-os termékcsaládunk csomagolása! Hanggal az igazi! 🎧🔥',
    media_urls: [
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1000&q=80',
    ],
    custom_content: {
      instagram: {
        format: 'reel',
        isReel: true,
        audioTrackName: 'Trending Audio • Synthwave Beats (Original)',
        hashtags: '#reels #behindthescenes #aesthetic #branding #design #reelsviral',
      },
    },
    platforms: ['instagram'],
  },
  {
    id: 'post-fb-reel',
    created_at: getDateOffset(-1, 14, 0),
    scheduled_at: getDateOffset(1, 20, 0), // Tomorrow 20:00
    status: 'scheduled',
    base_text: '💡 3 gyors beállítás a telefonodon, amitől azonnal jobb minőségű videókat készíthetsz! Nézd meg a Reel videót! 📱✨',
    media_urls: [
      'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1000&q=80',
    ],
    custom_content: {
      facebook: {
        format: 'reel',
        callToAction: 'LEARN_MORE',
      },
    },
    platforms: ['facebook'],
  },
  {
    id: 'post-2',
    created_at: getDateOffset(-3, 8, 0),
    scheduled_at: getDateOffset(1, 10, 0), // Tomorrow at 10:00
    status: 'scheduled',
    base_text: '🎬 Hogyan skáláztuk fel az ügyfélszolgálatunkat 10x-re az AI segítségével? Részletes esettanulmány a legújabb videónkban!',
    media_urls: [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80',
    ],
    custom_content: {
      youtube: {
        format: 'video',
        title: 'Hogyan építs automatizált ügyfélszolgálatot 2026-ban? | Teljes útmutató',
        description: 'Ebben a videóban bemutatjuk a teljes technológiai stacket, az API architektúrát és a valós ROI megtérülést.\n\nIdőbélyegek:\n0:00 - Bevezetés\n02:15 - A rendszer alapjai\n07:40 - Élő demó\n12:10 - Konklúzió',
        visibility: 'public',
      },
    },
    platforms: ['youtube'],
  },
  {
    id: 'post-yt-shorts',
    created_at: getDateOffset(-2, 13, 0),
    scheduled_at: getDateOffset(2, 12, 15), // Day after tomorrow 12:15
    status: 'scheduled',
    base_text: '⚡ 30 másodperces produktivitási trükk a Notionben, amit minden alkotónak ismernie kell! ⏱️ #Shorts #Productivity',
    media_urls: [
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1000&q=80',
    ],
    custom_content: {
      youtube: {
        format: 'shorts',
        title: '30 másodperces Notion tipp alkotóknak #shorts',
        description: 'Iratkozz fel a csatornánkra a heti gyors produktivitási trükkökért! Link a bióban.',
        visibility: 'public',
      },
    },
    platforms: ['youtube'],
  },
  {
    id: 'post-3',
    created_at: getDateOffset(-5, 9, 15),
    scheduled_at: getDateOffset(-1, 18, 0), // Yesterday (published)
    status: 'published',
    base_text: 'Köszönjük mindenkinek a tegnapi teltházas meetupot a TechHubban! Fantasztikus volt veletek beszélgetni a legújabb technológiai trendekről. 💡 Találkozunk a következőn!',
    media_urls: [
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=80',
    ],
    custom_content: {
      facebook: {
        format: 'post',
        linkPreviewTitle: 'TechHub Meetup 2026 összefoglaló galéria',
        firstComment: '🔗 A teljes fotóalbumot és a prezentációk letölthető diáit itt találjátok: https://techhub.example/meetup-diak',
      },
    },
    platforms: ['facebook'],
  },
  {
    id: 'post-4',
    created_at: getDateOffset(-1, 11, 0),
    scheduled_at: getDateOffset(2, 16, 45), // Day after tomorrow
    status: 'draft',
    base_text: '5 tipp a jobb közösségi média engagement eléréséhez: 1. Legyél következetes 2. Használj videós tartalmat 3. Kérdezz a közönségedtől 4. Válaszolj az első 30 percben 5. Elemzés és iteráció.',
    media_urls: [
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=80',
    ],
    custom_content: {
      threads: {
        threadReplies: ['Nektek melyik vált be a legjobban a fenti 5 közül? Írjátok meg válaszban!'],
      },
    },
    platforms: ['threads'],
  },
  {
    id: 'post-fb-story',
    created_at: getDateOffset(-1, 8, 30),
    scheduled_at: getDateOffset(3, 11, 0), // +3 days
    status: 'scheduled',
    base_text: '📢 Ma délután 15:00-kor élő Kérdezz-Felelek a Facebook oldalunkon! Készítsd elő a kérdéseidet!',
    media_urls: [
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=80',
    ],
    custom_content: {
      facebook: {
        format: 'story',
        storyLink: 'https://postpulse.app/live-qa',
        callToAction: 'SIGN_UP',
      },
    },
    platforms: ['facebook'],
  },
  {
    id: 'post-6',
    created_at: getDateOffset(-2, 17, 0),
    scheduled_at: getDateOffset(-3, 19, 0),
    status: 'failed',
    base_text: 'Heti akció: Használd a FLASH30 kuponkódot és élvezd a 30% kedvezményt minden előfizetésre éjfélig!',
    media_urls: [],
    custom_content: {
      facebook: {
        format: 'post',
      },
    },
    platforms: ['facebook'],
    error_log: 'Facebook Graph API hiba: OAuth token expired. Kérjük frissítsd a jogosultságot.',
  },
];
