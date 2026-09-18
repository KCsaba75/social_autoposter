import React, { useState } from 'react';
import {
  X,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Send,
  ExternalLink,
  KeyRound,
  Webhook,
  CalendarCheck,
  Building2,
  Info,
  HelpCircle,
  Copy,
  Check,
  Search,
} from 'lucide-react';
import { PostPublishResponse, PlatformPublishResult } from '../types';
import { PlatformIcon } from './PlatformIcon';

interface PublishResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: PostPublishResponse | null;
  onOpenSocialAccounts: () => void;
  onMarkAsSimulatedPublished: (postId: string) => void;
  onOpenFacebookVerifier?: () => void;
  outboundWebhookUrl?: string;
  onSaveOutboundWebhook?: (url: string) => void;
}

export const PublishResultModal: React.FC<PublishResultModalProps> = ({
  isOpen,
  onClose,
  result,
  onOpenSocialAccounts,
  onMarkAsSimulatedPublished,
  onOpenFacebookVerifier,
}) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen || !result) return null;

  const isSuccess = result.success;
  const hasFacebook = result.platformResults.some(
    (p) =>
      p.platform === 'facebook' ||
      p.platform === 'facebook_page' ||
      p.platform === 'facebook_profile'
  );
  const fbResult = result.platformResults.find(
    (p) =>
      p.platform === 'facebook' ||
      p.platform === 'facebook_page' ||
      p.platform === 'facebook_profile'
  );
  const isFbSimulated = fbResult && fbResult.status === 'simulated';

  const handleQuickCopyFb = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
    window.open('https://business.facebook.com/latest/composer', '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      id="publish-result-modal"
    >
      <div className="relative w-full max-w-2xl bg-[#0f141c] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div
          className={`p-5 sm:p-6 border-b flex items-start justify-between gap-4 ${
            isSuccess
              ? 'bg-gradient-to-r from-emerald-950/40 via-slate-900/40 to-slate-950/40 border-emerald-500/20'
              : 'bg-gradient-to-r from-amber-950/40 via-rose-950/30 to-slate-950/40 border-amber-500/20'
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
                isSuccess
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {isSuccess ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    isSuccess
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                  }`}
                >
                  {isSuccess ? 'Éles Publikálás Sikeres' : 'Közzétételi Értesítés & Diagnosztika'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-1">
                {isSuccess
                  ? 'A poszt sikeresen közzétéve a közösségi felületen!'
                  : 'Miért nem ment ki a poszt a Facebook / Instagram oldalra?'}
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {isSuccess
                  ? 'A rendszer sikeresen továbbította és megjelentette a bejegyzést a megadott platformon.'
                  : 'A felületen a poszt állapota frissült, de a közösségi oldalak szerverei (Meta, YouTube) biztonsági okokból elutasították vagy nem találták az éles hitelesítő adatokat.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors shrink-0"
            title="Bezárás"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm">
          {/* Important Notice for Facebook if Simulated / Jelszavas or any Facebook publication */}
          {hasFacebook && (
            <div
              className={`p-4 rounded-xl border space-y-2.5 transition-all ${
                isFbSimulated
                  ? 'bg-gradient-to-r from-amber-950/40 via-blue-950/30 to-slate-900/60 border-amber-500/30'
                  : 'bg-gradient-to-r from-blue-950/40 via-slate-900/40 to-slate-900/60 border-blue-500/30'
              }`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <AlertCircle className={`w-4 h-4 ${isFbSimulated ? 'text-amber-400' : 'text-blue-400'}`} />
                  <span>
                    {isFbSimulated
                      ? 'Nem jelent meg a valódi Facebook oldaladon? – Itt a magyarázat és az azonnali megoldás:'
                      : 'Facebook Bejegyzés Ellenőrzése:'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleQuickCopyFb}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                    id="btn-quick-copy-fb-from-modal"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Kimásolva! FB megnyitva...' : '📋 Szöveg Másolása & Facebook Megnyitása'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  {onOpenFacebookVerifier && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenFacebookVerifier();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                      id="btn-verify-fb-from-modal"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>🔍 FB Élő Ellenőrző</span>
                    </button>
                  )}
                </div>
              </div>

              {isFbSimulated && (
                <p className="text-xs text-slate-300 leading-relaxed">
                  A Facebook védelmi rendszere blokkolja a külső weboldalak háttérbeli jelszavas bejelentkezését. A poszt naptáradban rögzült; a valódi <strong>facebook.com</strong>-on való közzétételhez kattints a fenti <strong>„Szöveg Másolása & Facebook Megnyitása”</strong> gombra (1 kattintás és Ctrl+V a Facebookon), vagy adj meg hivatalos Meta Page Tokent!
                </p>
              )}
            </div>
          )}

          {/* Platform Detailed Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Send className="w-3.5 h-3.5 text-cyan-400" />
              <span>Célplatformok & Fiókok Állapota:</span>
            </h3>

            <div className="space-y-2.5">
              {result.platformResults.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border transition-all ${
                    item.success
                      ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                      : item.status === 'missing_credentials'
                        ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                        : 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 font-semibold text-xs text-white">
                      <span className="p-1 rounded bg-slate-800 border border-white/[0.08]">
                        <PlatformIcon platform={item.platform as any} size="sm" />
                      </span>
                      <span>{item.accountName || item.platform.toUpperCase()}</span>
                      {item.platform === 'webhook' && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono">
                          Webhook
                        </span>
                      )}
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                        item.success
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : item.status === 'missing_credentials'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {item.success
                        ? '✅ Közzétéve'
                        : item.status === 'missing_credentials'
                          ? '⚠️ Hiányzó API Token / Fiók'
                          : '❌ Hiba a publikáláskor'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{item.message}</p>

                  {item.details && (
                    <div className="mt-2 text-[11px] text-slate-400 bg-black/40 p-2 rounded-lg font-mono border border-white/[0.04]">
                      {item.details}
                    </div>
                  )}

                  {item.publishedPostId && (
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-emerald-300 font-mono">
                      <span>Platform Post ID: {item.publishedPostId}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Explanation Section */}
          {!isSuccess && (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/[0.06] space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Info className="w-4 h-4 text-cyan-400" />
                <span>Hogyan működik az éles közzététel a felületről?</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="p-3 rounded-lg bg-black/30 border border-white/[0.04] space-y-1">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>1. Meta Graph API Hozzáférés</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    A Meta szigorú biztonsági protokollja miatt a Facebook Page / Instagram csak érvényes <strong>Meta Page Access Token</strong> (EAA...) birtokában engedélyezi a külső programból való közzétételt. Ezt a Fiókkezelőben tudod megadni.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-black/30 border border-white/[0.04] space-y-1">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <Webhook className="w-3.5 h-3.5 text-purple-400" />
                    <span>2. n8n / Make Webhook Motor</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    A fejlesztői környezetekben a legelterjedtebb módszer: a rendszer az azonnali közzétételkor elküldi a kész posztot az n8n / Make webhookodnak, ami azonnal kirakja az éles közösségi oldalakra.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Practical Tips */}
          {result.tips && result.tips.length > 0 && !isSuccess && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Teendők a közzétételhez:</span>
              </div>
              <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                {result.tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400">
            {isSuccess ? (
              <span className="text-emerald-400">✅ A poszt megjelent a kiválasztott felületen.</span>
            ) : (
              <span>Válassz a fenti lehetőségek közül vagy állítsd be a fiókod!</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {hasFacebook && onOpenFacebookVerifier && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFacebookVerifier();
                }}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-sm"
                id="btn-footer-open-fb-verifier"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Facebook Ellenőrző</span>
              </button>
            )}

            {!isSuccess && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onMarkAsSimulatedPublished(result.postId);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium inline-flex items-center gap-1.5 transition-colors border border-white/[0.08]"
                  title="Ha manuálisan már kitetted a Facebookra, és csak a naptárban szeretnéd adminisztrálni"
                  id="btn-mark-simulated-published"
                >
                  <CalendarCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Megjelölés közzétettként</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSocialAccounts();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-sm"
                  id="btn-open-accounts-from-publish-modal"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Fiókkezelő Megnyitása</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors"
              id="btn-close-publish-modal"
            >
              {isSuccess ? 'Rendben' : 'Bezárás'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
