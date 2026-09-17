import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Calendar,
  Layers,
  Send,
  Loader2,
  CheckCircle,
  Clock,
  Image as ImageIcon,
  MessageSquare,
  Wand2,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { Platform, Post } from '../types';
import { PLATFORM_CONFIGS } from '../lib/constants';
import { apiGenerateAiCampaign } from '../lib/supabase';

interface AiCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostsGeneratedAndSaved: (newPosts: Post[]) => void;
  targetDate?: string | null;
}

const TONE_OPTIONS = [
  { id: 'professzionális, meggyerő', label: 'Professzionális', desc: 'Szakértői, hiteles és informatív' },
  { id: 'laza, közvetlen, barátságos', label: 'Laza & Barátságos', desc: 'Közvetlen, emberi és könnyed' },
  { id: 'értékesítő, figyelemfelkeltő, CTA-központú', label: 'Értékesítő & Sürgető', desc: 'Erős cselekvésre ösztönzéssel' },
  { id: 'inspiráló, elgondolkodtató', label: 'Inspiráló', desc: 'Motiváló gondolatok és sztorik' },
  { id: 'vicces, kreatív, trendi', label: 'Trendi & Fiatalos', desc: 'Humor és aktuális szlengek' },
];

const PRESET_TOPICS = [
  'Heti 3 tipp a hatékonyabb közösségi média kezeléshez',
  'Új termék / szolgáltatás bejelentése kedvezményes előrendeléssel',
  'Kulisszák mögötti sztori a csapat mindennapjairól és értékeinkről',
  'Ügyfél sikertörténet és tanulságok bemutatása',
  'Hétvégi figyelemfelkeltő kérdés a követők bevonására',
];

export const AiCampaignModal: React.FC<AiCampaignModalProps> = ({
  isOpen,
  onClose,
  onPostsGeneratedAndSaved,
  targetDate,
}) => {
  const [topic, setTopic] = useState('');
  const [postCount, setPostCount] = useState<number>(3);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['facebook', 'instagram']);
  const [selectedTone, setSelectedTone] = useState(TONE_OPTIONS[0].id);
  const [startDate, setStartDate] = useState(() => {
    if (targetDate) return targetDate;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  });
  const [includeCuratedImages, setIncludeCuratedImages] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPosts, setGeneratedPosts] = useState<Post[]>([]);
  const [generationStep, setGenerationStep] = useState('');
  const [saveStatus, setSaveStatus] = useState<{ savedTo: string; supabaseError?: string } | null>(null);

  if (!isOpen) return null;

  const togglePlatform = (p: Platform) => {
    if (selectedPlatforms.includes(p)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter((item) => item !== p));
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Kérlek adj meg egy témát vagy célt a kampányhoz!');
      return;
    }

    setError(null);
    setSaveStatus(null);
    setIsGenerating(true);
    setGenerationStep('AI ötletelés és tartalomstratégia kidolgozása...');

    try {
      const stepTimer1 = setTimeout(() => {
        setGenerationStep('Időzítések optimalizálása és poszt szövegek finomhangolása...');
      }, 1800);

      const stepTimer2 = setTimeout(() => {
        setGenerationStep('Platform-specifikus hashtagek és vázlatok mentése a naptárba...');
      }, 3500);

      const result = await apiGenerateAiCampaign({
        topic,
        count: postCount,
        platforms: selectedPlatforms,
        tone: selectedTone,
        startDate: new Date(startDate).toISOString(),
        autoSaveDrafts: true, // Directly save as drafts!
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      setGeneratedPosts(result.posts || []);
      setSaveStatus({
        savedTo: result.savedTo,
        supabaseError: result.supabaseError,
      });
      setIsGenerating(false);

      if (result.posts && result.posts.length > 0) {
        onPostsGeneratedAndSaved(result.posts);
      }
    } catch (err: any) {
      console.error('AI generation error:', err);
      setError(err.message || 'Hiba történt a generálás során. Ellenőrizd a szerver kapcsolatot és az API kulcsot.');
      setIsGenerating(false);
    }
  };

  const handleCompleteAndClose = () => {
    setGeneratedPosts([]);
    setTopic('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-lg shadow-purple-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">AI Poszt & Időzítés Generátor</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Gemini 3.8 Flash
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Draftként kerül a naptárba
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Generáltass kész posztokat időzítéssel, szöveggel és képekkel – azonnal piszkozatként (draft) mentve a Supabase-be!
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {generatedPosts.length === 0 ? (
            <>
              {/* Error Notice */}
              {error && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">Generálási Hiba</span>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {/* Topic Brief */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-200 flex items-center justify-between">
                  <span>1. Kampány témája, célja vagy felhívása:</span>
                  <span className="text-xs text-zinc-400 font-normal">Miről szóljanak a posztok?</span>
                </label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Pl.: Heti 3 poszt a tavaszi akciónkról, tippek a hatékonyabb használathoz, és egy hétvégi motivációs gondolat a közösségünknek..."
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
                />

                {/* Quick Presets */}
                <div className="pt-1">
                  <span className="text-xs text-zinc-400 mb-1.5 block">Gyors ötletek egy kattintással:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_TOPICS.map((pt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setTopic(pt)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60 transition-colors text-left"
                      >
                        + {pt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Target Platforms */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-200">
                  2. Célplatformok (az AI mindegyikhez elkészíti a testreszabást):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(Object.keys(PLATFORM_CONFIGS) as Platform[]).map((p) => {
                    const cfg = PLATFORM_CONFIGS[p];
                    const isSelected = selectedPlatforms.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePlatform(p)}
                        className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                          isSelected
                            ? `${cfg.bgColor} ${cfg.borderColor} ring-1 ring-white/20`
                            : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cfg.color }}
                        />
                        <span className="text-xs font-semibold">{cfg.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Count and Tone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Count */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-200 flex items-center justify-between">
                    <span>3. Generálandó posztok száma:</span>
                    <span className="text-xs font-bold text-purple-400">{postCount} db poszt</span>
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 5, 7].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setPostCount(num)}
                        className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                          postCount === num
                            ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-600/20'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                        }`}
                      >
                        {num} db
                      </button>
                    ))}
                  </div>
                </div>

                {/* Start Date */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-zinc-400" />
                    <span>4. Kampány kezdete:</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-purple-500"
                  />
                  <span className="text-xs text-zinc-500 block">
                    Az AI ettől a dátumtól kezdve intelligensen szétosztja a posztokat a legideálisabb órákban.
                  </span>
                </div>
              </div>

              {/* Tone selection */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-200">5. Hangnem (Tone of Voice):</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {TONE_OPTIONS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTone(t.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedTone === t.id
                          ? 'bg-purple-950/40 border-purple-500/60 text-purple-200 ring-1 ring-purple-500/30'
                          : 'bg-zinc-950 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="text-xs font-semibold text-zinc-200 mb-0.5">{t.label}</div>
                      <div className="text-[11px] text-zinc-400">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Media Toggle */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-zinc-200 block">
                      Képi javaslatok & kurált látványelemek csatolása
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Az AI képleírásokat készít és releváns fotókat társít a posztokhoz
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={includeCuratedImages}
                  onChange={(e) => setIncludeCuratedImages(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded bg-zinc-800 border-zinc-700 focus:ring-purple-500"
                />
              </div>

              {/* Info banner */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-xs text-amber-300">
                <CheckCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Teljes kontroll és biztonság:</span> A generált posztok{' '}
                  <strong>piszkozatként (draft)</strong> mentődnek a Supabase adatbázisba és naptáradba. Egyetlen poszt sem
                  kerül publikálásra a te felülvizsgálatod és a naptárban történő jóváhagyásod nélkül!
                </div>
              </div>
            </>
          ) : (
            /* Generated Results Screen */
            <div className="space-y-4 animate-in fade-in">
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  saveStatus?.supabaseError
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle className={`w-5 h-5 shrink-0 ${saveStatus?.supabaseError ? 'text-amber-400' : 'text-emerald-400'}`} />
                  <div>
                    <span className="font-bold text-sm block">
                      {generatedPosts.length} db poszt vázlat sikeresen előállítva és mentve!
                    </span>
                    <span className="text-xs opacity-90 block">
                      {saveStatus?.savedTo === 'supabase'
                        ? '✅ A posztok bekerültek a Supabase adatbázisba és a naptáradba DRAFT státusszal.'
                        : saveStatus?.supabaseError
                          ? `⚠️ Supabase hiba: ${saveStatus.supabaseError}. A posztok a helyi naptárba betöltve!`
                          : 'A posztok bekerültek a naptáradba DRAFT státusszal.'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {generatedPosts.map((p, index) => {
                  const dateObj = new Date(p.scheduled_at);
                  const formattedDate = !isNaN(dateObj.getTime())
                    ? dateObj.toLocaleString('hu-HU', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : p.scheduled_at;

                  return (
                    <div
                      key={p.id || index}
                      className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-colors space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                            Poszt #{index + 1}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-800/40">
                            <Clock className="w-3 h-3" />
                            {formattedDate} (Draft)
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {p.platforms.map((plat) => {
                            const cfg = PLATFORM_CONFIGS[plat as Platform];
                            return (
                              <span
                                key={plat}
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                  cfg?.bgColor || 'bg-zinc-800 text-zinc-300'
                                }`}
                              >
                                {cfg?.name || plat}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      <p className="text-xs text-zinc-200 whitespace-pre-line line-clamp-4 bg-zinc-900/60 p-3 rounded-lg border border-zinc-850">
                        {p.base_text}
                      </p>

                      {p.media_urls && p.media_urls.length > 0 && (
                        <div className="flex items-center gap-3 pt-1">
                          <img
                            src={p.media_urls[0]}
                            alt="Media preview"
                            className="w-16 h-12 rounded object-cover border border-zinc-800"
                          />
                          <span className="text-[11px] text-zinc-400">
                            Csatolt látványelem csatolva a piszkozathoz
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/90 flex items-center justify-between">
          {generatedPosts.length === 0 ? (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isGenerating}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                Mégse
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{generationStep || 'AI dolgozik...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generálás & Mentés Vázlatként ({postCount} db)</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-between">
              <span className="text-xs text-zinc-400">
                A posztok azonnal megjelentek a naptárban. Kattints a naptárban rájuk az átnézéshez!
              </span>
              <button
                type="button"
                onClick={handleCompleteAndClose}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
              >
                <span>Megtekintés a Naptárban</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
