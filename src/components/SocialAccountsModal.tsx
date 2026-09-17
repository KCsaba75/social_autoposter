import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Key,
  Lock,
  User,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Eye,
  EyeOff,
  Globe,
  Radio,
  Unlink,
  Link2,
  Sparkles,
  HelpCircle,
  Building2,
  Users,
} from 'lucide-react';
import { Platform, SocialAccountCredential, SocialAuthMode } from '../types';
import { PlatformIcon } from './PlatformIcon';
import { PLATFORM_CONFIGS } from '../lib/constants';
import {
  getStoredSocialAccounts,
  saveSocialAccounts,
  testPlatformConnection,
} from '../lib/socialAccounts';

interface SocialAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountsUpdated?: () => void;
}

const PLATFORM_DOCS: Record<Platform, { title: string; url: string; tokenGuide: string }> = {
  facebook: {
    title: 'Meta for Developers - Facebook Graph API',
    url: 'https://developers.facebook.com/docs/pages/publishing',
    tokenGuide:
      'Hozz létre egy Meta App-ot, menj a Graph API Explorerbe, és generálj Page Access Tokent a pages_manage_posts és pages_read_engagement jogosultságokkal.',
  },
  instagram: {
    title: 'Instagram Graph API for Professionals',
    url: 'https://developers.facebook.com/docs/instagram-api',
    tokenGuide:
      'Kapcsold össze az Instagram Business/Creator fiókodat a Facebook Oldaladdal. A tokenhez instagram_basic és instagram_content_publish jogosultság szükséges.',
  },
  youtube: {
    title: 'Google Cloud Console - YouTube Data API v3',
    url: 'https://console.cloud.google.com/apis/library/youtube.googleapis.com',
    tokenGuide:
      'Engedélyezd a YouTube Data API v3-at a Google Cloud Console-ban, majd generálj API kulcsot vagy OAuth 2.0 Client ID-t a videók és Shorts-ok ütemezéséhez.',
  },
  threads: {
    title: 'Threads API Publishing',
    url: 'https://developers.facebook.com/docs/threads',
    tokenGuide:
      'A Meta Threads API lehetővé teszi a bejegyzések és válaszszálak közzétételét a threads_basic és threads_content_publish engedélyekkel.',
  },
};

export const SocialAccountsModal: React.FC<SocialAccountsModalProps> = ({
  isOpen,
  onClose,
  onAccountsUpdated,
}) => {
  const [accounts, setAccounts] = useState<Record<Platform, SocialAccountCredential>>(() =>
    getStoredSocialAccounts()
  );
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('facebook');
  const [showPassword, setShowPassword] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(
    null
  );
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setAccounts(getStoredSocialAccounts());
      setTestResult(null);
      setSaveSuccessMessage(null);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentCred = accounts[selectedPlatform] || {
    platform: selectedPlatform,
    connected: false,
    accountName: PLATFORM_CONFIGS[selectedPlatform].name,
    handle: PLATFORM_CONFIGS[selectedPlatform].handle,
    authMode: 'credentials',
  };

  const handleFieldChange = (field: keyof SocialAccountCredential, val: unknown) => {
    setAccounts((prev) => ({
      ...prev,
      [selectedPlatform]: {
        ...prev[selectedPlatform],
        [field]: val,
      },
    }));
    setTestResult(null);
    setSaveSuccessMessage(null);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    setSaveSuccessMessage(null);

    try {
      const res = await testPlatformConnection(selectedPlatform, currentCred);
      setTestResult(res);
      if (res.success) {
        // Automatically update last connected timestamp
        const updated = {
          ...accounts,
          [selectedPlatform]: {
            ...currentCred,
            connected: true,
            lastConnectedAt: new Date().toISOString(),
          },
        };
        setAccounts(updated);
        saveSocialAccounts(updated);
        onAccountsUpdated?.();
      }
    } catch {
      setTestResult({
        success: false,
        message: 'Hálózati hiba a kapcsolat tesztelése során.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveAndConnect = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...accounts,
      [selectedPlatform]: {
        ...currentCred,
        connected: true,
        lastConnectedAt: new Date().toISOString(),
      },
    };
    setAccounts(updated);
    saveSocialAccounts(updated);
    onAccountsUpdated?.();
    setSaveSuccessMessage(
      `A ${PLATFORM_CONFIGS[selectedPlatform].name} fiók sikeresen csatlakoztatva és elmentve!`
    );
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  const handleDisconnect = () => {
    const updated = {
      ...accounts,
      [selectedPlatform]: {
        ...currentCred,
        connected: false,
      },
    };
    setAccounts(updated);
    saveSocialAccounts(updated);
    onAccountsUpdated?.();
    setTestResult(null);
    setSaveSuccessMessage(`A ${PLATFORM_CONFIGS[selectedPlatform].name} fiók kapcsolata bontva.`);
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  const connectedCount = (Object.values(accounts) as SocialAccountCredential[]).filter(
    (a) => a.connected
  ).length;
  const platformList: Platform[] = ['facebook', 'instagram', 'youtube', 'threads'];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#0d1117] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/[0.05]">
        {/* Modal Top Header */}
        <div className="h-16 px-6 bg-[#0e131d] border-b border-white/[0.08] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Social Platformok Csatlakoztatása</h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {connectedCount}/{platformList.length} Csatlakoztatva
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Kezeld a hivatalos fiókjaidat, bejelentkezési adataidat és API kulcsaidat
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            title="Bezárás (Esc)"
            id="close-social-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Left Platform Tabs + Right Connection Editor */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Column: Platform Switcher List */}
          <div className="w-full md:w-64 bg-[#0a0d13] border-b md:border-b-0 md:border-r border-white/[0.08] p-3 space-y-1.5 overflow-y-auto shrink-0">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-2 py-1">
              Elérhető Platformok
            </div>
            {platformList.map((plat) => {
              const cfg = PLATFORM_CONFIGS[plat];
              const acc = accounts[plat];
              const isSelected = selectedPlatform === plat;

              return (
                <button
                  key={plat}
                  onClick={() => {
                    setSelectedPlatform(plat);
                    setTestResult(null);
                    setSaveSuccessMessage(null);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all border ${
                    isSelected
                      ? 'bg-white/[0.08] border-white/[0.18] shadow-sm'
                      : 'bg-transparent border-transparent hover:bg-white/[0.04] text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <PlatformIcon platform={plat} size="md" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-200 truncate flex items-center gap-1.5">
                        <span className="capitalize">{plat}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {acc?.handle || cfg.handle}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 ml-2">
                    {acc?.connected ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 block shadow-xs shadow-emerald-400/50" title="Csatlakoztatva" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-600 block" title="Nincs csatlakoztatva" />
                    )}
                  </div>
                </button>
              );
            })}

            {/* Quick Helper Banner */}
            <div className="p-3 mt-4 rounded-xl bg-blue-500/5 border border-blue-500/15 text-[11px] text-slate-400 space-y-1.5">
              <div className="flex items-center gap-1.5 text-blue-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Biztonságos tárolás</span>
              </div>
              <p className="leading-relaxed text-[10px]">
                A bejelentkezési adatok és privát tokenek lokálisan, közvetlenül a böngésződben vannak elmentve.
              </p>
            </div>
          </div>

          {/* Right Column: Platform Configuration & Credentials Form */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0d1117]">
            {/* Platform Header Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#121620] border border-white/[0.08] mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.08]">
                  <PlatformIcon platform={selectedPlatform} size="lg" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      {PLATFORM_CONFIGS[selectedPlatform].name}
                    </h3>
                    {currentCred.connected ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Csatlakoztatva</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>Nincs csatlakoztatva</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Aktivált profil: <span className="text-slate-200">{currentCred.handle}</span>
                  </p>
                </div>
              </div>

              {/* External Developer Docs Link */}
              <a
                href={PLATFORM_DOCS[selectedPlatform].url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-mono underline"
              >
                <span>Fejlesztői dokumentáció</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Auth Mode Switcher */}
            <div className="mb-5">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                Csatlakozási Módszer
              </label>
              <div className="grid grid-cols-2 gap-2 bg-[#121620] p-1 rounded-xl border border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => handleFieldChange('authMode', 'credentials')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    currentCred.authMode === 'credentials'
                      ? 'bg-white/[0.12] text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span>Fiók & Bejelentkezési Adatok</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFieldChange('authMode', 'api_token')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    currentCred.authMode === 'api_token'
                      ? 'bg-white/[0.12] text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Key className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Hivatalos API Kulcs / Token</span>
                </button>
              </div>
            </div>

            {/* Form Fields Container */}
            <form onSubmit={handleSaveAndConnect} className="space-y-4">
              {/* Common Fields: Display Name & Handle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    Megjelenített Név (Account Name)
                  </label>
                  <input
                    type="text"
                    value={currentCred.accountName || ''}
                    onChange={(e) => handleFieldChange('accountName', e.target.value)}
                    placeholder="pl. Cégünk Hivatalos Oldala"
                    className="w-full bg-[#121620] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    Profil Handle / Felhasználónév
                  </label>
                  <input
                    type="text"
                    value={currentCred.handle || ''}
                    onChange={(e) => handleFieldChange('handle', e.target.value)}
                    placeholder="pl. @vallalkozasunk"
                    className="w-full bg-[#121620] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Mode A: Credentials */}
              {currentCred.authMode === 'credentials' && (
                <div className="space-y-3.5 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">
                      Bejelentkezési Email / Felhasználónév
                    </label>
                    <input
                      type="text"
                      value={currentCred.username || ''}
                      onChange={(e) => handleFieldChange('username', e.target.value)}
                      placeholder="pl. social@vallalkozas.hu vagy felhasznalonev"
                      className="w-full bg-[#121620] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">
                      Jelszó vagy Alkalmazás-Jelszó (App Password)
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={currentCred.password || ''}
                        onChange={(e) => handleFieldChange('password', e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-[#121620] border border-white/[0.1] rounded-lg pl-3 pr-10 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">
                      Közösségi Profil / Csatorna URL (Opcionális)
                    </label>
                    <input
                      type="url"
                      value={currentCred.profileUrl || ''}
                      onChange={(e) => handleFieldChange('profileUrl', e.target.value)}
                      placeholder={`pl. https://${selectedPlatform}.com/fiókod`}
                      className="w-full bg-[#121620] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Mode B: API Tokens & Keys */}
              {currentCred.authMode === 'api_token' && (
                <div className="space-y-3.5 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-mono text-slate-300">
                        {selectedPlatform === 'youtube'
                          ? 'Google Cloud API Kulcs / OAuth Token'
                          : 'Hivatalos Graph API Access Token'}
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="text-[10px] text-blue-400 hover:underline flex items-center gap-1 font-mono"
                      >
                        {showToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showToken ? 'Elrejtés' : 'Megjelenítés'}</span>
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={currentCred.accessToken || ''}
                      onChange={(e) => handleFieldChange('accessToken', e.target.value)}
                      placeholder={
                        selectedPlatform === 'youtube'
                          ? 'AIzaSyDw49Pz... vagy OAuth 2.0 Access Token'
                          : 'EAABwzLixnjYBAOd8q2kP98zXkL...'
                      }
                      className="w-full bg-[#121620] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono text-slate-300 mb-1">
                        {selectedPlatform === 'facebook'
                          ? 'Facebook Page ID'
                          : selectedPlatform === 'instagram'
                          ? 'Instagram Business Account ID'
                          : selectedPlatform === 'youtube'
                          ? 'YouTube Channel ID'
                          : 'Threads User ID'}
                      </label>
                      <input
                        type="text"
                        value={currentCred.accountId || ''}
                        onChange={(e) => handleFieldChange('accountId', e.target.value)}
                        placeholder="pl. 109283741829182 vagy UC_x5XG1..."
                        className="w-full bg-[#121620] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-slate-300 mb-1">
                        App ID / Client ID (Opcionális)
                      </label>
                      <input
                        type="text"
                        value={currentCred.appId || ''}
                        onChange={(e) => handleFieldChange('appId', e.target.value)}
                        placeholder="pl. 849201948201"
                        className="w-full bg-[#121620] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Facebook Specific: Dual Target Configuration (Business Page & Personal Profile) */}
              {selectedPlatform === 'facebook' && (
                <div className="space-y-3.5 p-4 rounded-xl bg-gradient-to-br from-blue-950/20 to-indigo-950/20 border border-blue-500/25">
                  <div className="flex items-center justify-between pb-2 border-b border-blue-500/15">
                    <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                      <PlatformIcon platform="facebook" size="sm" />
                      Kétfajta Facebook Célpont (Üzleti Oldal és Saját Profil)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                      Page & Profile Kezelés
                    </span>
                  </div>

                  {/* Default Target Choice */}
                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 mb-1.5 uppercase tracking-wider">
                      Alapértelmezett Célpont Új Posztok Létrehozásakor
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'page', label: 'Üzleti Oldal', desc: 'Hivatalos Page', icon: Building2 },
                        { id: 'profile', label: 'Saját Profil', desc: 'Személyes fiók', icon: User },
                        { id: 'both', label: 'Mindkettő', desc: 'Oldal + Profil', icon: Users },
                      ].map(({ id, label, desc, icon: Icon }) => {
                        const isSelected = (currentCred.fbDefaultTarget || 'page') === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => handleFieldChange('fbDefaultTarget', id)}
                            className={`p-2 rounded-lg border text-left flex flex-col gap-0.5 transition-all ${
                              isSelected
                                ? 'bg-blue-600/30 border-blue-500 text-white ring-1 ring-blue-500/30'
                                : 'bg-[#121620] border-white/[0.08] text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <Icon className="w-3.5 h-3.5 text-blue-400" />
                              <span className="text-xs font-semibold">{label}</span>
                            </div>
                            <span className="text-[9px] text-slate-500 line-clamp-1">{desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section A: Üzleti Oldal (Facebook Business Page) */}
                  <div className="p-3 rounded-lg bg-black/20 border border-blue-500/20 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-300">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>1. Facebook Üzleti Oldal (Page)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-mono text-slate-400 mb-0.5">
                          Oldal Neve (Page Name)
                        </label>
                        <input
                          type="text"
                          value={currentCred.pageName || ''}
                          onChange={(e) => handleFieldChange('pageName', e.target.value)}
                          placeholder="pl. TechFlow Hivatalos Oldal"
                          className="w-full bg-[#121620] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-slate-400 mb-0.5">
                          Facebook Page ID
                        </label>
                        <input
                          type="text"
                          value={currentCred.pageId || ''}
                          onChange={(e) => handleFieldChange('pageId', e.target.value)}
                          placeholder="pl. 109283741829182"
                          className="w-full bg-[#121620] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section B: Saját Személyes Profil (Personal Profile) */}
                  <div className="p-3 rounded-lg bg-black/20 border border-purple-500/20 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300">
                      <User className="w-3.5 h-3.5" />
                      <span>2. Facebook Saját Profil / Személyes Fiók</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-mono text-slate-400 mb-0.5">
                          Saját Profil Neve / Megjelenítés
                        </label>
                        <input
                          type="text"
                          value={currentCred.profileName || ''}
                          onChange={(e) => handleFieldChange('profileName', e.target.value)}
                          placeholder="pl. Kovács János (Saját fiók)"
                          className="w-full bg-[#121620] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-slate-400 mb-0.5">
                          Profil / Felhasználó ID (Opcionális)
                        </label>
                        <input
                          type="text"
                          value={currentCred.profileId || ''}
                          onChange={(e) => handleFieldChange('profileId', e.target.value)}
                          placeholder="pl. 100084920194820"
                          className="w-full bg-[#121620] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Developer Hint Guide */}
              <div className="p-3 bg-[#121620] rounded-xl border border-white/[0.06] text-xs text-slate-300 flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-emerald-300 mb-0.5">
                    Hogyan működik a csatlakozás?
                  </div>
                  <div className="text-slate-400 text-[11px] leading-relaxed">
                    {PLATFORM_DOCS[selectedPlatform].tokenGuide}
                  </div>
                </div>
              </div>

              {/* Status Message Banners */}
              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-fadeIn ${
                    testResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold">
                      {testResult.success ? 'Sikeres kapcsolat!' : 'Csatlakozási hiba!'}
                    </div>
                    <div className="text-[11px] mt-0.5 opacity-90">{testResult.message}</div>
                  </div>
                </div>
              )}

              {saveSuccessMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{saveSuccessMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.08]">
                <div>
                  {currentCred.connected && (
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      className="px-3 py-1.5 rounded-lg border border-rose-500/30 hover:bg-rose-500/10 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      <span>Kapcsolat Bontása</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTest}
                    disabled={testing}
                    className="px-3.5 py-1.5 rounded-lg border border-white/[0.12] bg-[#121620] hover:bg-white/[0.06] text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin text-blue-400' : ''}`} />
                    <span>{testing ? 'Tesztelés...' : 'Kapcsolat Tesztelése'}</span>
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98]"
                    id="save-social-account-btn"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Mentés & Csatlakoztatás</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
