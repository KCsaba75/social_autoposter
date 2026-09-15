import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Database,
  Key,
  Globe,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  FolderArchive,
  RefreshCw,
} from 'lucide-react';
import {
  SQL_SCHEMA_STRING,
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  getSupabase,
} from '../lib/supabase';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionChanged: () => void;
  isMockMode: boolean;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({
  isOpen,
  onClose,
  onConnectionChanged,
  isMockMode,
}) => {
  const currentConfig = getStoredSupabaseConfig();
  const [url, setUrl] = useState(currentConfig?.url || '');
  const [anonKey, setAnonKey] = useState(currentConfig?.anonKey || '');
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleCopySchema = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_STRING);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);

    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    if (!cleanUrl || !cleanKey) {
      setTestResult({
        success: false,
        message: 'Kérjük, add meg mind a Supabase URL-t, mind az Anon kulcsot!',
      });
      setTesting(false);
      return;
    }

    try {
      saveSupabaseConfig({ url: cleanUrl, anonKey: cleanKey });
      const client = getSupabase();
      if (!client) {
        throw new Error('Nem sikerült inicializálni a Supabase klienst.');
      }

      // Test query
      const { error } = await client.from('posts').select('id').limit(1);

      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist yet
          setTestResult({
            success: true,
            message:
              'A Supabase kapcsolat sikeres! Ne felejtsd el futtatni a fenti SQL sémát a tábla létrehozásához.',
          });
        } else {
          setTestResult({
            success: false,
            message: `Supabase hiba: ${error.message} (${error.code || 'Ismeretlen'})`,
          });
        }
      } else {
        setTestResult({
          success: true,
          message: 'Sikeres kapcsolat! A posts tábla elérhető és megfelelően konfigurált.',
        });
      }

      onConnectionChanged();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kapcsolódási hiba';
      setTestResult({
        success: false,
        message: `Hiba: ${msg}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleResetToMock = () => {
    saveSupabaseConfig(null);
    setUrl('');
    setAnonKey('');
    setTestResult({
      success: true,
      message: 'Visszaállítva Mock / Demó módba (helyi tárolás aktív).',
    });
    onConnectionChanged();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        id="supabase-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                Supabase Adatbázis & Storage Beállítás
                {isMockMode ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Mock / Demó Mód
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Csatlakoztatva
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-400">
                Közvetlen PostgreSQL tábla és Storage bucket integráció a @supabase/supabase-js klienssel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-2 rounded-lg hover:bg-zinc-800 transition-colors"
            id="close-supabase-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-zinc-300">
          {/* Status banner */}
          {isMockMode && (
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-600/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-amber-200">
                  Jelenleg beépített Mock és Helyi Állapotban (Local State) fut az alkalmazás
                </p>
                <p className="text-xs text-amber-300/80">
                  Minden CRUD művelet (poszt létrehozás, naptár ütemezés, azonnali publikálás, törlés) 
                  tökéletesen működik helyi tárolással. Ha saját Supabase projekteddel szeretnéd használni, 
                  add meg az adataidat lentebb, vagy állítsd be az env változókat!
                </p>
              </div>
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleTestAndSave} className="space-y-4 bg-zinc-950/60 p-5 rounded-xl border border-zinc-800">
            <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-400" />
              1. Supabase Projekt Kapcsolati Adatok
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-zinc-500" />
                  Project URL (VITE_SUPABASE_URL)
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://xyzproject.supabase.co"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-zinc-500" />
                  Anon Public Key (VITE_SUPABASE_ANON_KEY)
                </label>
                <input
                  type="password"
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                />
              </div>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                  testResult.success
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                    : 'bg-rose-950/40 text-rose-300 border-rose-800/50'
                }`}
              >
                {testResult.success ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetToMock}
                className="text-xs text-zinc-400 hover:text-zinc-200 underline transition-colors"
              >
                Visszaállítás Mock / Helyi módba
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={testing}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-emerald-950/50"
                  id="save-supabase-config"
                >
                  {testing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  {testing ? 'Kapcsolódás...' : 'Mentés & Kapcsolat Tesztelése'}
                </button>
              </div>
            </div>
          </form>

          {/* SQL Schema Display */}
          <div className="space-y-3 bg-zinc-950/60 p-5 rounded-xl border border-zinc-800">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                2. SQL Migrációs Séma (PostgreSQL)
              </h3>
              <button
                onClick={handleCopySchema}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-lg flex items-center gap-1.5 transition-colors border border-zinc-700"
                id="copy-sql-schema-btn"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Másolva!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>SQL Másolása</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Másold ki az alábbi SQL kódot, és illeszd be a Supabase irányítópultodon a{' '}
              <strong className="text-zinc-300 font-mono">SQL Editor</strong> menüpontban:
            </p>

            <div className="relative">
              <pre className="p-3.5 bg-zinc-900/90 rounded-lg text-[11px] font-mono text-emerald-300/90 overflow-x-auto border border-zinc-800 leading-relaxed max-h-56 select-all">
                {SQL_SCHEMA_STRING}
              </pre>
            </div>
          </div>

          {/* Storage Bucket Info */}
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-start gap-3">
            <FolderArchive className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-medium text-zinc-200 text-xs">
                3. Supabase Storage Bucket: <code className="text-indigo-300 font-mono">social-media-assets</code>
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                A képek és videók közvetlenül a Supabase Storage <code className="text-indigo-300 font-mono">social-media-assets</code> nevű 
                publikus bucketjébe kerülnek feltöltésre (<code className="text-zinc-300 font-mono">supabase.storage.from('social-media-assets').upload(...)</code>).
                Ha a bucket még nem létezik, a fenti SQL szkript automatikusan létrehozza publikus olvasási jogosultsággal.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 transition-colors"
          >
            <span>Supabase Dashboard Megnyitása</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition-colors"
            id="close-modal-bottom-btn"
          >
            Bezárás
          </button>
        </div>
      </div>
    </div>
  );
};
