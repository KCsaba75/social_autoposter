import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, Clock, FileText, CheckCircle2 } from 'lucide-react';
import { Post } from '../types';
import { PlatformIcon } from './PlatformIcon';
import { PLATFORM_CONFIGS } from '../lib/constants';
import { formatFutureTimeRemaining } from '../lib/postPermissions';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  postsToDelete: Post[];
  onConfirm: (ids: string[]) => Promise<void>;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  postsToDelete,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || postsToDelete.length === 0) return null;

  const isMultiple = postsToDelete.length > 1;
  const singlePost = postsToDelete[0];

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(postsToDelete.map((p) => p.id));
      onClose();
    } catch (err) {
      console.error('Delete error', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const isDraft = singlePost?.status === 'draft';
  const isFuture =
    singlePost?.status === 'scheduled' &&
    new Date(singlePost.scheduled_at).getTime() > Date.now();

  const formattedDate = singlePost
    ? new Date(singlePost.scheduled_at).toLocaleString('hu-HU', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const timeRemaining = singlePost?.scheduled_at
    ? formatFutureTimeRemaining(singlePost.scheduled_at)
    : '';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-[#0e131d] border border-rose-500/30 rounded-xl shadow-2xl overflow-hidden ring-1 ring-rose-500/20">
        {/* Header */}
        <div className="p-4 border-b border-white/[0.08] bg-rose-500/[0.04] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isMultiple
                  ? `${postsToDelete.length} poszt törlése`
                  : isDraft
                    ? 'Piszkozat törlése'
                    : 'Jövőbeli időzítés visszavonása és törlése'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isMultiple
                  ? 'A kiválasztott jövőbeli posztok és vázlatok eltávolítása'
                  : 'Aktuális időhöz képest jövőbeli vagy vázlat állapotú'}
              </p>
            </div>
          </div>
          <button
            disabled={isDeleting}
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-4 space-y-3">
          {!isMultiple ? (
            <div className="p-3 rounded-lg bg-[#121622] border border-white/[0.06] space-y-2.5">
              {/* Meta row: Platform + Status + Scheduled Time */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  {singlePost.platforms.map((plat) => (
                    <div
                      key={plat}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[11px] text-slate-200"
                    >
                      <PlatformIcon platform={plat} size="sm" />
                      <span className="capitalize">{PLATFORM_CONFIGS[plat].name}</span>
                    </div>
                  ))}
                </div>

                {isDraft ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    <span>Piszkozat</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Jövőbeli időzítés ({timeRemaining})</span>
                  </span>
                )}
              </div>

              {/* Time display */}
              {!isDraft && (
                <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ütemezett időpont: <strong className="text-slate-200">{formattedDate}</strong></span>
                </div>
              )}

              {/* Text Snippet & Media */}
              <div className="flex items-start gap-2.5 pt-1">
                {singlePost.media_urls && singlePost.media_urls.length > 0 && (
                  <img
                    src={singlePost.media_urls[0]}
                    alt="Thumbnail"
                    className="w-12 h-12 rounded object-cover border border-white/[0.08] shrink-0 bg-black/50"
                  />
                )}
                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed break-words">
                  {singlePost.base_text ||
                    singlePost.custom_content?.youtube?.title ||
                    '(Üres szöveges tartalom)'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-[#121622] border border-white/[0.06] space-y-2">
              <p className="text-xs text-slate-300">
                A következő <strong>{postsToDelete.length} db</strong> poszt/vázlat kerül törlésre:
              </p>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {postsToDelete.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-2 p-1.5 rounded bg-black/30 text-[11px] text-slate-300"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {p.platforms.map((plat) => (
                        <PlatformIcon key={plat} platform={plat} size="sm" />
                      ))}
                      <span className="truncate">
                        {p.base_text || p.custom_content?.youtube?.title || 'Poszt'}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 shrink-0">
                      {p.status === 'draft' ? 'Vázlat' : new Date(p.scheduled_at).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warning box */}
          <div className="p-2.5 rounded-lg bg-rose-500/[0.07] border border-rose-500/20 flex items-start gap-2 text-[11px] text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>
              A törlés visszavonhatatlan. A poszt nem kerül közzétételre a közösségi platformokon és véglegesen törlődik az adatbázisból.
            </span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-3.5 border-t border-white/[0.08] bg-[#0c1017] flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 text-xs font-medium transition-colors"
          >
            Mégse
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleConfirm}
            className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs shadow-rose-900/40 disabled:opacity-50"
            id="confirm-delete-post-btn"
          >
            {isDeleting ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            <span>{isMultiple ? 'Kijelöltek törlése' : 'Poszt végleges törlése'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
