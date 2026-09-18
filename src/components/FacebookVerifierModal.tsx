import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Search,
  RefreshCw,
  Building2,
  KeyRound,
  Webhook,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Post, SocialAccount } from '../types';

interface FacebookVerifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  post?: Post | null;
  allPosts?: Post[];
  onOpenSocialAccounts?: () => void;
  onOpenApiWebhookModal?: () => void;
}

interface VerificationData {
  isLive: boolean;
  liveStatus: 'confirmed_live' | 'simulated_local' | 'not_found' | 'error';
  publishedPostId?: string;
  permalink?: string;
  pageId?: string;
  createdTime?: string;
  message: string;
  reason?: string;
  howToVerify: string[];
  facebookComposerUrl: string;
  metaBusinessSuiteUrl: string;
  facebookPageUrl?: string;
}

export const FacebookVerifierModal: React.FC<FacebookVerifierModalProps> = ({
  isOpen,
  onClose,
  post: initialPost,
  allPosts = [],
  onOpenSocialAccounts,
  onOpenApiWebhookModal,
}) => {
  const [selectedPost, setSelectedPost] = useState<Post | null>(initialPost || null);
  const [customPostId, setCustomPostId] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialPost) {
      setSelectedPost(initialPost);
    } else if (allPosts.length > 0 && !selectedPost) {
      const firstFb = allPosts.find((p) => p.platforms.includes('facebook')) || allPosts[0];
      setSelectedPost(firstFb);
    }
  }, [initialPost, allPosts]);

  const activePost = selectedPost || allPosts[0] || null;

  const handleVerify = async () => {
    setLoading(true);
    setVerificationResult(null);
    try {
      const res = await fetch('/api/facebook/verify-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: activePost?.id,
          publishedPostId: customPostId.trim() || activePost?.id,
          postText: activePost?.custom_content?.facebook?.text || activePost?.base_text,
        }),
      });
      const data = await res.json();
      setVerificationResult(data);
    } catch (err: any) {
      setVerificationResult({
        isLive: false,
        liveStatus: 'error',
        message: 'Nem sikerült elérni az ellenőrző szolgáltatást.',
        reason: err.message || 'Hálózati hiba',
        howToVerify: [
          'Nyisd meg közvetlenül a Meta Business Suite-ot a böngészőben.',
          'Ellenőrizd a Facebook oldalad közzétett bejegyzéseit.',
        ],
        facebookComposerUrl: 'https://business.facebook.com/latest/composer',
        metaBusinessSuiteUrl: 'https://business.facebook.com/latest/posts/published_posts',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      handleVerify();
    }
  }, [isOpen, selectedPost]);

  const handleCopyAndOpenFacebook = () => {
    if (!activePost) return;
    const textToCopy = [
      activePost.custom_content?.facebook?.text || activePost.base_text,
      activePost.custom_content?.facebook?.hashtags,
    ]
      .filter(Boolean)
      .join('\n\n');

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);

    // Open Facebook Page or Business Suite
    const targetUrl =
      verificationResult?.facebookPageUrl ||
      verificationResult?.facebookComposerUrl ||
      'https://business.facebook.com/latest/composer';
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      id="facebook-verifier-modal"
    >
      <div className="relative w-full max-w-3xl bg-[#0c1018] border border-blue-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.08] bg-gradient-to-r from-blue-950/60 via-slate-900/60 to-indigo-950/40 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Facebook Diagnosztika & Ellenőrző
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-1">
                Megjelent a posztod a Facebookon? – Élő Állapot & Ellenőrzés
              </h2>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Tudd meg másodpercek alatt, hogy a bejegyzés kint van-e a Facebook szerverein, vagy miért nem jelent még meg a valódi oldalon.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors shrink-0"
            title="Bezárás"
            id="btn-close-fb-verifier"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Post Selector Bar if multiple posts */}
          {allPosts.length > 1 && (
            <div className="p-3 rounded-xl bg-[#121622] border border-white/[0.06] flex items-center justify-between gap-3">
              <span className="font-semibold text-slate-300 text-xs shrink-0">
                Ellenőrizendő poszt kiválasztása:
              </span>
              <select
                value={activePost?.id || ''}
                onChange={(e) => {
                  const p = allPosts.find((item) => item.id === e.target.value);
                  if (p) setSelectedPost(p);
                }}
                className="bg-black/40 border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 max-w-sm truncate"
              >
                {allPosts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.status === 'published' ? '✅ [Kész] ' : '⏳ [Időzített] '}
                    {p.base_text.slice(0, 45)}...
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Diagnostic Result Banner */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              loading
                ? 'bg-slate-900/60 border-white/[0.08]'
                : verificationResult?.isLive
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                  : 'bg-amber-950/25 border-amber-500/30 text-amber-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    loading
                      ? 'bg-slate-800 text-slate-400 animate-spin'
                      : verificationResult?.isLive
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4" />
                  ) : verificationResult?.isLive ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-white">
                      {loading
                        ? 'Facebook szerver kapcsolat vizsgálata...'
                        : verificationResult?.isLive
                          ? '✅ A poszt igazoltan ÉLŐ a Facebookon!'
                          : '⚠️ A poszt még NEM jelent meg a valódi Facebook oldalon'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        verificationResult?.isLive
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {loading
                        ? 'Vizsgálat...'
                        : verificationResult?.isLive
                          ? 'Éles Meta Post'
                          : 'Helyi Naptár Piszkozat / Munkamenet'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    {verificationResult?.message ||
                      'A rendszer lekérdezi a Facebook Meta Graph API szervereit és a fiók hitelesítési státuszát.'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleVerify}
                disabled={loading}
                className="p-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white shrink-0 transition-colors"
                title="Újraellenőrzés"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Why did it not appear? Root Cause Explanation */}
            {!loading && !verificationResult?.isLive && (
              <div className="mt-4 p-3.5 rounded-xl bg-black/40 border border-white/[0.06] space-y-2 text-slate-300">
                <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  <span>Miért nem tud egy külső rendszer közvetlenül a jelszavaddal posztolni a Facebookra?</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  A <strong>Meta (Facebook)</strong> rendkívül szigorú biztonsági architektúrával védi a fiókokat: a kétlépcsős azonosítás (2FA), a captcha és a bot-védelem miatt <strong>egy külső felhőszerver sem tud bejelentkezni a jelszavaddal a háttérben</strong>.
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  A <strong>Metricool, Buffer vagy Hootsuite</strong> sem a jelszavadat gépeli be: ők hivatalos Meta Partnerek, akik egy felugró Facebook ablakban hitelesíttetnek veled, és a Meta ad nekik egy titkosított <strong>Page Access Tokent (EAA...)</strong>. Enélkül a Meta szerverei elutasítanak minden közvetlen felhős közzétételt.
                </p>
              </div>
            )}
          </div>

          {/* Solution 1: 1-Click Instant Copy & Open Facebook (Works 100% of the time right now!) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-[#131926] to-indigo-950/40 border border-blue-500/30 space-y-3 shadow-lg">
            <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    1
                  </span>
                  <h3 className="text-sm font-bold text-white">
                    Azonnali Megoldás (0 perc): Szöveg Másolása & Facebook Megnyitása
                  </h3>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Nem akarsz technikai API kulcsokkal bajlódni? Ezzel a gombbal a kész poszt azonnal a vágólapodra kerül, a böngésző pedig megnyitja a Facebook Oldalad bejegyzéskészítőjét. Csak nyomj egy <strong>Ctrl+V</strong>-t és a poszt már kint is van!
                </p>
              </div>

              <button
                onClick={handleCopyAndOpenFacebook}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shrink-0 flex items-center gap-2 shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98]"
                id="btn-copy-and-open-fb"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Kimásolva! Facebook megnyitva...' : '📋 Szöveg Másolása & Facebook'}</span>
                <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>

            {/* Post Preview Box */}
            {activePost && (
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] text-xs text-slate-300 font-mono line-clamp-3">
                {activePost.custom_content?.facebook?.text || activePost.base_text}
                {activePost.custom_content?.facebook?.hashtags && (
                  <div className="text-blue-400 mt-1">{activePost.custom_content?.facebook?.hashtags}</div>
                )}
              </div>
            )}
          </div>

          {/* Solution 2 & 3: Full Automated Publishing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Option A: Meta Page Access Token */}
            <div className="p-4 rounded-xl bg-[#121622] border border-white/[0.08] flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-white font-bold">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <KeyRound className="w-4 h-4 text-blue-400" />
                  <span>Automatikus: Meta Page Token</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Ha 100%-ban automatikus közzétételt szeretnél kattintás nélkül, a Meta ingyenes Graph API Exploreréből (2 perc) generálhatsz egy hivatalos Page Access Tokent (EAA...).
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <a
                  href="https://developers.facebook.com/tools/explorer/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] inline-flex items-center gap-1.5 transition-colors"
                >
                  <span>Graph API Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                {onOpenSocialAccounts && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSocialAccounts();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] inline-flex items-center gap-1.5 transition-colors border border-white/[0.08]"
                  >
                    <Building2 className="w-3 h-3" />
                    <span>Fiókkezelő</span>
                  </button>
                )}
              </div>
            </div>

            {/* Option B: Make / Zapier / n8n Webhook */}
            <div className="p-4 rounded-xl bg-[#121622] border border-white/[0.08] flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-white font-bold">
                  <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <Webhook className="w-4 h-4 text-purple-400" />
                  <span>No-Code: Make / n8n Webhook</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  A Make.com vagy n8n felületén 1 kattintással összekötheted a Facebookodat (mert ők bejegyzett Meta partnerek), az itteni webhook címre küldve pedig a poszt azonnal kimegy a Facebookra.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2">
                {onOpenApiWebhookModal && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenApiWebhookModal();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-[11px] inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Webhook className="w-3 h-3" />
                    <span>Kimenő Webhook Beállítása</span>
                  </button>
                )}
                <a
                  href="https://www.make.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] inline-flex items-center gap-1.5 transition-colors border border-white/[0.08]"
                >
                  <span>Make.com</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Direct Links */}
          <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-slate-400">
              Hivatalos Facebook ellenőrző felületek:
            </span>
            <div className="flex items-center gap-2.5 flex-wrap">
              <a
                href="https://business.facebook.com/latest/posts/published_posts"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
              >
                <span>Meta Business Suite (Közzétett bejegyzések)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-white/[0.2]">•</span>
              <a
                href="https://www.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
              >
                <span>Facebook.com</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-slate-950/80 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 hidden sm:block">
            PostPulse Élő Facebook Kapcsolati Ellenőrző
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleCopyAndOpenFacebook}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-sm"
              id="btn-footer-copy-fb"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Szöveg Másolása & Facebook</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors"
              id="btn-close-verifier-modal-footer"
            >
              Bezárás
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
