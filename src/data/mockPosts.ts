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
      threads: {
        threadReplies: ['Az első 100 megrendelő ajándék tokot kap!'],
      },
      facebook: {
        format: 'post',
        linkPreviewTitle: 'Őszi Kollekció 2026 - Előrendelés Nyitva',
      },
    },
    platforms: ['instagram', 'threads', 'facebook'],
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
      facebook: {
        format: 'story',
        storyLink: 'https://postpulse.app/vip-flash',
        callToAction: 'SHOP_NOW',
      },
    },
    platforms: ['instagram', 'facebook'],
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
      facebook: {
        format: 'reel',
        callToAction: 'LEARN_MORE',
      },
    },
    platforms: ['instagram', 'facebook'],
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
        title: 'Hogyan építs automatizált ügyfélszolgálatot 2026-ban? | Teljes útmutató',
        description: 'Ebben a videóban bemutatjuk a teljes technológiai stacket, az API architektúrát és a valós ROI megtérülést.\n\nIdőbélyegek:\n0:00 - Bevezetés\n02:15 - A rendszer alapjai\n07:40 - Élő demó\n12:10 - Konklúzió',
        visibility: 'public',
      },
      threads: {},
    },
    platforms: ['youtube', 'threads'],
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
        linkPreviewTitle: 'TechHub Meetup 2026 összefoglaló galéria',
      },
      instagram: {
        hashtags: '#techcommunity #meetup #networking #innovation #budapest',
      },
    },
    platforms: ['facebook', 'instagram'],
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
        threadReplies: ['Nektek melyik vált be a legjobban a fenti 5 közül?'],
      },
      instagram: {
        hashtags: '#socialmediamarketing #marketingtips #growthhacks #contentcreator',
        firstComment: 'Mentsd el ezt a posztot későbbre! 📌',
      },
    },
    platforms: ['threads', 'instagram', 'facebook'],
  },
  {
    id: 'post-5',
    created_at: getDateOffset(-4, 14, 0),
    scheduled_at: getDateOffset(4, 12, 0), // +4 days
    status: 'scheduled',
    base_text: 'Új podcast epizód érkezik pénteken! Vendégünk a hazai SaaS világ egyik meghatározó alakja. Beszélgetünk bootstrap vs. VC témákról és termékfejlesztésről.',
    media_urls: [
      'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1000&q=80',
    ],
    custom_content: {
      youtube: {
        title: 'SaaS Alapítók Műhelye Ep. 42 - A növekedés kulcsa',
        description: 'Iratkozz fel a csatornára és kapcsold be az értesítéseket!',
        visibility: 'unlisted',
      },
      facebook: {},
    },
    platforms: ['youtube', 'facebook'],
  },
  {
    id: 'post-6',
    created_at: getDateOffset(-2, 17, 0),
    scheduled_at: getDateOffset(-3, 19, 0),
    status: 'failed',
    base_text: 'Heti akció: Használd a FLASH30 kuponkódot és élvezd a 30% kedvezményt minden előfizetésre éjfélig!',
    media_urls: [],
    custom_content: {},
    platforms: ['facebook', 'instagram'],
    error_log: 'Instagram Graph API hiba: OAuth token expired. Kérjük frissítsd a jogosultságot.',
  },
];
