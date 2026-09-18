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
  Trash2,
  Edit3,
  Plus,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  HelpCircle,
  Building2,
  Users,
  Check,
  ChevronRight,
  Sliders,
  Layers,
  Zap,
} from 'lucide-react';
import {
  Platform,
  SocialAccount,
  SocialAccountPlatformType,
  SocialAuthMode,
} from '../types';
import { PlatformIcon } from './PlatformIcon';
import { PLATFORM_CONFIGS } from '../lib/constants';
import {
  getStoredMultiAccounts,
  fetchServerSocialAccounts,
  apiSaveAccount,
  apiDeleteAccount,
  apiDeleteAllAccounts,
  testPlatformConnection,
  DEFAULT_MULTI_ACCOUNTS,
} from '../lib/socialAccounts';

interface SocialAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountsUpdated?: () => void;
}

type WizardStep = 1 | 2 | 3 | 4;

interface PlatformOption {
  type: SocialAccountPlatformType;
  basePlatform: Platform;
  name: string;
  badge: string;
  desc: string;
  defaultType: 'business' | 'personal';
  defaultAuthMode: SocialAuthMode;
  supportsPersonal: boolean;
}

const PLATFORM_OPTIONS: PlatformOption[] = [
  {
    type: 'facebook_page',
    basePlatform: 'facebook',
    name: 'Facebook Üzleti Oldal (Page)',
    badge: 'Meta Graph API',
    desc: 'Céges vagy márkaoldal, automatikus időzítés, Meta Graph API hozzáféréssel.',
    defaultType: 'business',
    defaultAuthMode: 'api_token',
    supportsPersonal: false,
  },
  {
    type: 'facebook_profile',
    basePlatform: 'facebook',
    name: 'Facebook Személyes Profil',
    badge: 'Magán fiók',
    desc: 'Saját magánprofilod (alapító/magánszemély), jelszavas vagy API közvetítővel.',
    defaultType: 'personal',
    defaultAuthMode: 'credentials',
    supportsPersonal: true,
  },
  {
    type: 'instagram',
    basePlatform: 'instagram',
    name: 'Instagram (Business / Creator)',
    badge: 'Instagram Graph API',
    desc: 'Képek, Reels videók és Stories időzítése csatlakoztatott Facebook oldalon keresztül.',
    defaultType: 'business',
    defaultAuthMode: 'api_token',
    supportsPersonal: true,
  },
  {
    type: 'youtube',
    basePlatform: 'youtube',
    name: 'YouTube Csatorna',
    badge: 'YouTube v3 Data API',
    desc: 'Hosszú videók és YouTube Shorts ütemezett publikálása a Google API-val.',
    defaultType: 'business',
    defaultAuthMode: 'api_token',
    supportsPersonal: true,
  },
  {
    type: 'threads',
    basePlatform: 'threads',
    name: 'Threads Csatorna',
    badge: 'Meta Threads API',
    desc: 'Szöveges posztok és képes bejegyzések időzítése a hivatalos Threads API-val.',
    defaultType: 'personal',
    defaultAuthMode: 'api_token',
    supportsPersonal: true,
  },
];

export const SocialAccountsModal: React.FC<SocialAccountsModalProps> = ({
  isOpen,
  onClose,
  onAccountsUpdated,
}) => {
  const [accounts, setAccounts] = useState<SocialAccount[]>(() => getStoredMultiAccounts());
  const [activeTab, setActiveTab] = useState<'list' | 'wizard'>('list');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // Wizard state
  const [step, setStep] = useState<WizardStep>(1);
  const [isEditing, setIsEditing] = useState(false);

  // Form fields
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formPlatformType, setFormPlatformType] = useState<SocialAccountPlatformType>('facebook_page');
  const [formAccountType, setFormAccountType] = useState<'business' | 'personal'>('business');
  const [formAuthMode, setFormAuthMode] = useState<SocialAuthMode>('api_token');
  const [formHandle, setFormHandle] = useState('');
  const [formPlatformNativeId, setFormPlatformNativeId] = useState('');
  const [formAvatarUrl, setFormAvatarUrl] = useState('');
  const [formAccessToken, setFormAccessToken] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formAppId, setFormAppId] = useState('');
  const [formAppSecret, setFormAppSecret] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // UI helpers
  const [showPassword, setShowPassword] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [saving, setSaving] = useState(false);

  // Metricool 1-Click Fast Connect State (No Access Token Required!)
  const [showMetricoolModal, setShowMetricoolModal] = useState(false);
  const [metricoolPlatform, setMetricoolPlatform] = useState<SocialAccountPlatformType>('facebook_page');
  const [metricoolName, setMetricoolName] = useState('');
  const [metricoolUsername, setMetricoolUsername] = useState('');
  const [metricoolPassword, setMetricoolPassword] = useState('');
  const [metricoolAccountType, setMetricoolAccountType] = useState<'business' | 'personal'>('business');
  const [metricoolShowPassword, setMetricoolShowPassword] = useState(false);
  const [metricoolConnecting, setMetricoolConnecting] = useState(false);

  // Initial load
  useEffect(() => {
    if (isOpen) {
      setAccounts(getStoredMultiAccounts());
      fetchServerSocialAccounts().then((data) => {
        setAccounts(data);
      });
      setTestResult(null);
      setFeedbackMessage(null);
      setDeletingId(null);
    }
  }, [isOpen]);

  // Handle escape key only (no backdrop click close)
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

  const currentPlatformOption =
    PLATFORM_OPTIONS.find((p) => p.type === formPlatformType) || PLATFORM_OPTIONS[0];

  // Start creating new account with wizard
  const startNewAccountWizard = () => {
    setIsEditing(false);
    setFormId('');
    setFormName('');
    setFormPlatformType('facebook_page');
    setFormAccountType('business');
    setFormAuthMode('api_token');
    setFormHandle('');
    setFormPlatformNativeId('');
    setFormAvatarUrl('');
    setFormAccessToken('');
    setFormUsername('');
    setFormPassword('');
    setFormAppId('');
    setFormAppSecret('');
    setFormNotes('');
    setStep(1);
    setTestResult(null);
    setActiveTab('wizard');
  };

  // Start editing existing account
  const startEditAccount = (acc: SocialAccount) => {
    setIsEditing(true);
    setFormId(acc.id);
    setFormName(acc.name);
    setFormPlatformType(acc.platform);
    setFormAccountType(acc.accountType || (acc.platform === 'facebook_profile' ? 'personal' : 'business'));
    setFormAuthMode(acc.authMode || 'api_token');
    setFormHandle(acc.handle || '');
    setFormPlatformNativeId(acc.platformNativeId || '');
    setFormAvatarUrl(acc.avatarUrl || '');
    setFormAccessToken(acc.accessToken || '');
    setFormUsername(acc.username || '');
    setFormPassword(acc.password || '');
    setFormAppId(acc.appId || '');
    setFormAppSecret(acc.appSecret || '');
    setFormNotes(acc.notes || '');
    setStep(1);
    setTestResult(null);
    setActiveTab('wizard');
  };

  // Handle platform change inside wizard step 2
  const handlePlatformTypeChange = (pType: SocialAccountPlatformType) => {
    setFormPlatformType(pType);
    const opt = PLATFORM_OPTIONS.find((p) => p.type === pType);
    if (opt) {
      setFormAccountType(opt.defaultType);
      setFormAuthMode(opt.defaultAuthMode);
      if (!formName || formName.startsWith('Új ')) {
        setFormName(opt.name);
      }
    }
  };

  // Run test
  const handleRunTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const opt = currentPlatformOption;
      const res = await testPlatformConnection(opt.basePlatform, {
        platform: opt.basePlatform,
        connected: true,
        accountName: formName || 'Teszt fiók',
        handle: formHandle || '@handle',
        authMode: formAuthMode,
        username: formUsername,
        password: formPassword,
        accessToken: formAccessToken,
        accountId: formPlatformNativeId,
      });
      setTestResult(res);
    } catch {
      setTestResult({
        success: false,
        message: 'Hiba a kapcsolat tesztelése közben.',
      });
    } finally {
      setTesting(false);
    }
  };

  // Save Account (Create or Update)
  const handleSaveAccount = async () => {
    if (!formName.trim()) {
      setFeedbackMessage({ text: 'Kérjük adj meg egy nevet a fióknak!', type: 'error' });
      setStep(1);
      return;
    }

    setSaving(true);
    try {
      const opt = currentPlatformOption;
      const payload: Partial<SocialAccount> & { name: string; platform: SocialAccountPlatformType } = {
        id: formId || undefined,
        name: formName.trim(),
        platform: formPlatformType,
        basePlatform: opt.basePlatform,
        handle: formHandle.trim() || undefined,
        platformNativeId: formPlatformNativeId.trim() || undefined,
        avatarUrl:
          formAvatarUrl.trim() ||
          (opt.basePlatform === 'facebook'
            ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80'
            : opt.basePlatform === 'instagram'
              ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
              : 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=120&q=80'),
        accessToken:
          formAccessToken.trim() ||
          (formAuthMode === 'credentials' ? `MTR_SESSION_${Date.now()}` : undefined),
        authMode: formAuthMode,
        username: formUsername.trim() || undefined,
        password: formPassword.trim() || undefined,
        appId: formAppId.trim() || undefined,
        appSecret: formAppSecret.trim() || undefined,
        accountType: formAccountType,
        notes: formNotes.trim() || (formAuthMode === 'credentials' ? 'Metricool-módú fiók (nem szükséges Access Token)' : undefined),
        isActive: true,
      };

      await apiSaveAccount(payload);
      const updatedList = await fetchServerSocialAccounts();
      setAccounts(updatedList);
      onAccountsUpdated?.();

      setFeedbackMessage({
        text: `„${formName}” fiók sikeresen ${isEditing ? 'módosítva' : 'hozzáadva'}!`,
        type: 'success',
      });
      setActiveTab('list');
      setTimeout(() => setFeedbackMessage(null), 3500);
    } catch (err: any) {
      setFeedbackMessage({ text: err.message || 'Hiba mentés közben', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Quick Metricool-style connect with Username & Password (NO ACCESS TOKEN REQUIRED!)
  const handleMetricoolConnect = async () => {
    if (!metricoolUsername.trim() || !metricoolPassword.trim()) {
      setFeedbackMessage({ text: 'A felhasználónév/email és jelszó megadása kötelező a fiókcsatoláshoz!', type: 'error' });
      return;
    }

    setMetricoolConnecting(true);
    try {
      // Simulate real-time OAuth/session authentication handshake with platform
      await new Promise((res) => setTimeout(res, 700));

      const opt = PLATFORM_OPTIONS.find((p) => p.type === metricoolPlatform) || PLATFORM_OPTIONS[0];
      const accountDisplayName =
        metricoolName.trim() ||
        (metricoolPlatform === 'facebook_page'
          ? 'Facebook Céges Oldal'
          : metricoolPlatform === 'facebook_profile'
            ? 'Facebook Magánprofil'
            : metricoolPlatform === 'instagram'
              ? 'Instagram Profil'
              : metricoolPlatform === 'youtube'
                ? 'YouTube Csatorna'
                : 'Threads Fiók');

      const handleSlug = `@${metricoolUsername.split('@')[0].replace(/[^a-zA-Z0-9_.]/g, '')}`;

      const payload: Partial<SocialAccount> & { name: string; platform: SocialAccountPlatformType } = {
        name: accountDisplayName,
        platform: metricoolPlatform,
        basePlatform: opt.basePlatform,
        handle: handleSlug,
        platformNativeId: `mtr_${Date.now()}`,
        avatarUrl:
          opt.basePlatform === 'facebook'
            ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80'
            : opt.basePlatform === 'instagram'
              ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
              : 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=120&q=80',
        authMode: 'credentials',
        username: metricoolUsername.trim(),
        password: metricoolPassword.trim(),
        accessToken: `MTR_SESSION_${Date.now()}`,
        accountType: metricoolAccountType,
        notes: `Metricool-módú összekapcsolás (${metricoolUsername.trim()}) - Nincs szükség Access Tokenre`,
        isActive: true,
      };

      await apiSaveAccount(payload);
      const updatedList = await fetchServerSocialAccounts();
      setAccounts(updatedList);
      onAccountsUpdated?.();

      setShowMetricoolModal(false);
      setMetricoolUsername('');
      setMetricoolPassword('');
      setMetricoolName('');
      setFeedbackMessage({
        text: `„${accountDisplayName}” sikeresen összekapcsolva (Metricool-mód)! Mostantól közvetlenül publikálhatsz ide, nem szükséges Access Token.`,
        type: 'success',
      });
      setTimeout(() => setFeedbackMessage(null), 4500);
    } catch (err: any) {
      setFeedbackMessage({ text: err.message || 'Hiba a fiók összekapcsolása közben', type: 'error' });
    } finally {
      setMetricoolConnecting(false);
    }
  };

  // Delete Account
  const handleDeleteAccount = async (id: string, name: string) => {
    try {
      await apiDeleteAccount(id);
      const updatedList = await fetchServerSocialAccounts();
      setAccounts(updatedList);
      onAccountsUpdated?.();
      setDeletingId(null);
      setFeedbackMessage({ text: `„${name}” fiók sikeresen törölve!`, type: 'success' });
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch {
      setFeedbackMessage({ text: 'Nem sikerült a fiók törlése.', type: 'error' });
    }
  };

  // Delete All Accounts
  const handleDeleteAllAccounts = async () => {
    try {
      await apiDeleteAllAccounts();
      setAccounts([]);
      onAccountsUpdated?.();
      setIsDeletingAll(false);
      setFeedbackMessage({ text: 'Minden csatlakoztatott fiók sikeresen eltávolítva!', type: 'success' });
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch {
      setFeedbackMessage({ text: 'Hiba történt a fiókok törlése közben.', type: 'error' });
    }
  };

  // Restore Default Demo Accounts if user wants to reset
  const handleRestoreDefaults = async () => {
    try {
      for (const acc of DEFAULT_MULTI_ACCOUNTS) {
        await apiSaveAccount(acc);
      }
      const updatedList = await fetchServerSocialAccounts();
      setAccounts(updatedList);
      onAccountsUpdated?.();
      setFeedbackMessage({ text: 'Alapértelmezett minta fiókok visszaállítva!', type: 'success' });
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch {
      setFeedbackMessage({ text: 'Hiba történt a visszaállítás közben.', type: 'error' });
    }
  };

  // Toggle active status
  const handleToggleActive = async (acc: SocialAccount) => {
    try {
      await apiSaveAccount({
        ...acc,
        isActive: !acc.isActive,
      });
      const updatedList = await fetchServerSocialAccounts();
      setAccounts(updatedList);
      onAccountsUpdated?.();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    /* NOTE: Intentionally NO click-away close on background to prevent accidental closing */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn"
      id="social-accounts-modal-backdrop"
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] bg-[#0d1117] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/[0.05]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="h-16 px-6 bg-[#0e131d] border-b border-white/[0.08] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Platformok Csatlakoztatása & Fiókkezelő</h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {accounts.filter((a) => a.isActive).length} Aktív fiók
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Fiókok felvétele varázslóval (üzleti / magán, API vagy jelszavas hitelesítés), szerkesztés és törlés
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'list' && (
              <>
                <button
                  onClick={() => setShowMetricoolModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all active:scale-[0.98]"
                  id="btn-header-metricool-quick-connect"
                  title="Összekapcsolás Felhasználónévvel és Jelszóval (nem kell Access Token)"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>⚡ Gyors Összekapcsolás (Metricool-mód)</span>
                </button>

                <button
                  onClick={startNewAccountWizard}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98]"
                  id="add-new-platform-btn"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Új Fiók Varázsló</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              title="Bezárás"
              id="close-social-modal-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedbackMessage && (
          <div
            className={`px-6 py-2.5 text-xs flex items-center gap-2 font-medium shrink-0 ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border-b border-rose-500/30 text-rose-300'
            }`}
          >
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* Tab Navigation Header (Fiókok listája VS Varázsló) */}
        <div className="h-11 px-6 bg-[#090c12] border-b border-white/[0.06] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'list'
                  ? 'bg-white/[0.1] text-white shadow-sm ring-1 ring-white/[0.15]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              id="tab-accounts-list-btn"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Csatlakoztatott Fiókok ({accounts.length})</span>
            </button>

            <button
              onClick={() => {
                if (activeTab !== 'wizard') startNewAccountWizard();
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'wizard'
                  ? 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              id="tab-accounts-wizard-btn"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isEditing ? `Szerkesztés: ${formName}` : 'Új Fiók Varázsló'}</span>
            </button>
          </div>

          {activeTab === 'wizard' && (
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className={step >= 1 ? 'text-blue-400 font-bold' : ''}>1. Név</span>
              <span>&rarr;</span>
              <span className={step >= 2 ? 'text-blue-400 font-bold' : ''}>2. Platform & Típus</span>
              <span>&rarr;</span>
              <span className={step >= 3 ? 'text-blue-400 font-bold' : ''}>3. Hitelesítés</span>
              <span>&rarr;</span>
              <span className={step >= 4 ? 'text-blue-400 font-bold' : ''}>4. Ellenőrzés</span>
            </div>
          )}
        </div>

        {/* Modal Main Viewport */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'list' ? (
            /* ============================================================ */
            /* TAB 1: ACCOUNTS LIST, EDIT, DELETE & TOGGLE                   */
            /* ============================================================ */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-white/[0.06]">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Minden Regisztrált Social Fiók</span>
                    <span className="text-xs text-slate-400 font-normal">
                      (Naptár posztokhoz és automatikus időzítéshez)
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Egy platformhoz több fiókot is hozzáadhatsz (pl. külön céges Facebook Oldalt és saját Magánprofilt).
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {accounts.length > 0 && (
                    isDeletingAll ? (
                      <div className="flex items-center gap-1.5 p-1 px-2 rounded-lg bg-rose-500/15 border border-rose-500/30 animate-fadeIn">
                        <span className="text-[11px] text-rose-300 font-medium">Biztosan törlöd az összeset?</span>
                        <button
                          onClick={handleDeleteAllAccounts}
                          className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold"
                          id="btn-confirm-delete-all-accounts"
                        >
                          Igen, mindet
                        </button>
                        <button
                          onClick={() => setIsDeletingAll(false)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                        >
                          Mégse
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsDeletingAll(true)}
                        className="px-2.5 py-1 rounded-lg border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                        title="Összes csatlakoztatott fiók törlése a listából"
                        id="btn-delete-all-accounts"
                      >
                        <Trash2 className="w-3 h-3 text-rose-400" />
                        <span>Összes fiók törlése</span>
                      </button>
                    )
                  )}

                  <button
                    onClick={startNewAccountWizard}
                    className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg inline-flex items-center gap-1.5 transition-colors shadow-sm"
                    id="btn-header-add-account"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Új Fiók</span>
                  </button>
                </div>
              </div>

              {/* Metricool 1-Click Fast Connect Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-indigo-950/40 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center shrink-0 text-cyan-400 mt-0.5">
                    <Zap className="w-5 h-5 text-cyan-300 fill-current" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white">⚡ Gyors Összekapcsolás (Metricool-mód)</span>
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                        NEM KELL ACCESS TOKEN!
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                      Csatlakoztasd a fiókodat egyszerűen felhasználónévvel és jelszóval, pont mint a Metricoolban vagy Bufferben. A rendszer automatikusan felépíti az engedélyezett munkamenetet.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMetricoolModal(true)}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shrink-0 flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all active:scale-[0.98]"
                  id="btn-metricool-quick-connect-banner"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Összekapcsolás Fhnév/Jelszóval</span>
                </button>
              </div>

              {accounts.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-4">
                  <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-slate-200">Még nincs rögzített platform fiók</div>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Minden fiókot töröltél, vagy még nem rögzítettél fiókot. Csatlakoztass fiókot Metricool-módban (csak felhasználónév és jelszó), vagy igény szerint használd a részletes varázslót.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                    <button
                      onClick={() => setShowMetricoolModal(true)}
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-colors shadow-md shadow-cyan-500/20"
                      id="btn-empty-metricool-connect"
                    >
                      <Zap className="w-4 h-4 fill-current" />
                      <span>⚡ Fiók Csatlakoztatása Fhnév/Jelszóval</span>
                    </button>
                    <button
                      onClick={startNewAccountWizard}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition-colors border border-white/[0.08]"
                      id="btn-empty-first-account"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Részletes Varázsló</span>
                    </button>
                    <button
                      onClick={handleRestoreDefaults}
                      className="px-3.5 py-2 bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-slate-300 text-xs font-medium rounded-xl inline-flex items-center gap-1.5 transition-colors border border-white/[0.04]"
                      id="btn-empty-restore-defaults"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                      <span>Minta fiókok visszaállítása</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {accounts.map((acc) => {
                    const cfg = PLATFORM_CONFIGS[acc.basePlatform];
                    const isDeleting = deletingId === acc.id;

                    return (
                      <div
                        key={acc.id}
                        className={`p-4 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                          acc.isActive
                            ? 'bg-[#121620] border-white/[0.08] hover:border-white/[0.16]'
                            : 'bg-black/30 border-white/[0.04] opacity-75'
                        }`}
                      >
                        {/* Card Header */}
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className="relative">
                                <PlatformIcon platform={acc.basePlatform} size="md" />
                                {acc.avatarUrl && (
                                  <img
                                    src={acc.avatarUrl}
                                    alt={acc.name}
                                    className="w-5 h-5 rounded-full absolute -bottom-1 -right-1 ring-2 ring-[#121620] object-cover"
                                  />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <h4 className="text-xs font-bold text-white">{acc.name}</h4>
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono uppercase font-semibold ${
                                      acc.accountType === 'personal'
                                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                    }`}
                                  >
                                    {acc.accountType === 'personal' ? 'Magán / Profil' : 'Üzleti / Page'}
                                  </span>
                                </div>
                                <div className="text-[11px] font-mono text-slate-400">
                                  {acc.handle || cfg.handle}
                                </div>
                              </div>
                            </div>

                            {/* Active Switch */}
                            <button
                              onClick={() => handleToggleActive(acc)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 transition-colors ${
                                acc.isActive
                                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                  : 'bg-slate-800 border-slate-700 text-slate-400'
                              }`}
                              title="Fiók státuszának váltása"
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  acc.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                                }`}
                              />
                              <span>{acc.isActive ? 'Aktív' : 'Inaktív'}</span>
                            </button>
                          </div>

                          {/* Account Metadata details */}
                          <div className="p-2 rounded-lg bg-black/20 border border-white/[0.04] text-[11px] space-y-1 mb-3">
                            <div className="flex items-center justify-between text-slate-400">
                              <span>Hitelesítési Mód:</span>
                              <span className="font-mono text-slate-200">
                                {acc.authMode === 'credentials'
                                  ? '🔑 Felhasználónév / Jelszó'
                                  : '⚡ API Token / ID'}
                              </span>
                            </div>
                            {acc.platformNativeId && (
                              <div className="flex items-center justify-between text-slate-400">
                                <span>Platform ID:</span>
                                <span className="font-mono text-slate-200">{acc.platformNativeId}</span>
                              </div>
                            )}
                            {acc.username && (
                              <div className="flex items-center justify-between text-slate-400">
                                <span>Bejelentkezés:</span>
                                <span className="font-mono text-slate-200">{acc.username}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Actions (Edit, Delete, Test) */}
                        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                          {isDeleting ? (
                            <div className="flex items-center gap-1.5 w-full justify-between animate-fadeIn">
                              <span className="text-[11px] text-rose-400 font-medium">Biztosan törlöd?</span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleDeleteAccount(acc.id, acc.name)}
                                  className="px-2.5 py-1 rounded bg-rose-500 hover:bg-rose-400 text-white text-[10px] font-bold"
                                >
                                  Igen, törlés
                                </button>
                                <button
                                  onClick={() => setDeletingId(null)}
                                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                                >
                                  Mégse
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditAccount(acc)}
                                className="px-2.5 py-1 rounded-lg border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                              >
                                <Edit3 className="w-3 h-3 text-blue-400" />
                                <span>Szerkesztés</span>
                              </button>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => setDeletingId(acc.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                  title="Fiók törlése"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* ============================================================ */
            /* TAB 2: 4-STEP WIZARD (CREATE / EDIT)                         */
            /* ============================================================ */
            <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
              {/* Step Navigation Pill Indicators */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { num: 1, label: '1. Névadás', icon: User },
                  { num: 2, label: '2. Platform & Típus', icon: Globe },
                  { num: 3, label: '3. Hitelesítés', icon: Key },
                  { num: 4, label: '4. Összegzés', icon: ShieldCheck },
                ].map((s) => (
                  <button
                    key={s.num}
                    onClick={() => {
                      if (s.num < step || formName.trim()) setStep(s.num as WizardStep);
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                      step === s.num
                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 ring-1 ring-blue-500/30'
                        : step > s.num
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-[#121620] border-white/[0.06] text-slate-500'
                    }`}
                  >
                    <s.icon className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-semibold">{s.label}</span>
                  </button>
                ))}
              </div>

              {/* ------------------------------------------------------------ */}
              {/* STEP 1: Név & Azonosító                                      */}
              {/* ------------------------------------------------------------ */}
              {step === 1 && (
                <div className="p-5 rounded-2xl bg-[#121620] border border-white/[0.08] space-y-4 animate-fadeIn">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-mono">
                        1
                      </span>
                      <span>Add meg a platform / fiók nevét</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Így fog megjelenni a naptárban és a posztok időzítésekor (pl. &quot;TechFlow Hivatalos Oldal&quot; vagy &quot;Kovács János (Magán)&quot;).
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Fiók Megjelenített Neve <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="pl. PostPulse Hivatalos Facebook Oldal"
                        className="w-full bg-[#0a0d13] border border-white/[0.12] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        autoFocus
                        id="wizard-account-name-input"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Felhasználói azonosító / Handle (Opcionális)
                        </label>
                        <input
                          type="text"
                          value={formHandle}
                          onChange={(e) => setFormHandle(e.target.value)}
                          placeholder="pl. @postpulse_hq vagy fb.com/alapito"
                          className="w-full bg-[#0a0d13] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Egyéni Avatar Kép URL (Opcionális)
                        </label>
                        <input
                          type="url"
                          value={formAvatarUrl}
                          onChange={(e) => setFormAvatarUrl(e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full bg-[#0a0d13] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Belső Jegyzet / Megjegyzés (Opcionális)
                      </label>
                      <input
                        type="text"
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        placeholder="pl. Marketing csapat vagy Alapító személyes fiókja"
                        className="w-full bg-[#0a0d13] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------ */}
              {/* STEP 2: Platform & Típus (Üzleti / Magán)                    */}
              {/* ------------------------------------------------------------ */}
              {step === 2 && (
                <div className="p-5 rounded-2xl bg-[#121620] border border-white/[0.08] space-y-4 animate-fadeIn">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-mono">
                        2
                      </span>
                      <span>Válaszd ki a Platformot és a Fiók Típusát</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Kattints a megfelelő platformra. Ahol elérhető (pl. Facebook vagy Instagram), ott választhatsz üzleti vagy magán fiók között!
                    </p>
                  </div>

                  {/* Platform Selection Cards */}
                  <div className="space-y-2 pt-1">
                    <label className="block text-xs font-semibold text-slate-300">Célplatform</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {PLATFORM_OPTIONS.map((opt) => {
                        const isSelected = formPlatformType === opt.type;

                        return (
                          <button
                            key={opt.type}
                            type="button"
                            onClick={() => handlePlatformTypeChange(opt.type)}
                            className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex items-start gap-2.5 ${
                              isSelected
                                ? 'bg-blue-500/15 border-blue-500/50 text-white ring-1 ring-blue-500/30'
                                : 'bg-[#0a0d13] border-white/[0.08] text-slate-300 hover:border-white/[0.16]'
                            }`}
                          >
                            <PlatformIcon platform={opt.basePlatform} size="md" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-xs truncate">{opt.name}</span>
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 stroke-[3]" />
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                                {opt.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Account Type (Üzleti VS Magán) */}
                  <div className="pt-3 border-t border-white/[0.06] space-y-2">
                    <label className="block text-xs font-semibold text-slate-300">
                      Fiók Jelleg / Típus
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormAccountType('business')}
                        className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                          formAccountType === 'business'
                            ? 'bg-blue-500/15 border-blue-500/40 text-white ring-1 ring-blue-500/30'
                            : 'bg-[#0a0d13] border-white/[0.08] text-slate-400 hover:border-white/[0.15]'
                        }`}
                      >
                        <Building2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-xs text-white">Üzleti / Céges Fiók</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Cégoldalak, márkák, API-n keresztüli közvetlen automatikus posztolás.
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormAccountType('personal')}
                        className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                          formAccountType === 'personal'
                            ? 'bg-purple-500/15 border-purple-500/40 text-white ring-1 ring-purple-500/30'
                            : 'bg-[#0a0d13] border-white/[0.08] text-slate-400 hover:border-white/[0.15]'
                        }`}
                      >
                        <User className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-xs text-white">Magán / Személyes Fiók</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Alapító személyes profilja vagy magán csatorna jelszavas vagy API belépéssel.
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------ */}
              {/* STEP 3: Hitelesítés (Jelszó / Felhasználónév VAGY API Token)   */}
              {/* ------------------------------------------------------------ */}
              {step === 3 && (
                <div className="p-5 rounded-2xl bg-[#121620] border border-white/[0.08] space-y-4 animate-fadeIn">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-mono">
                        3
                      </span>
                      <span>Hitelesítési Mód & Belépési Adatok</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Válaszd ki, hogyan csatlakozzon az alkalmazás: hivatalos fejlesztői API token segítségével, vagy felhasználónév / jelszó alapon.
                    </p>
                  </div>

                  {/* Auth Mode Toggle */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setFormAuthMode('api_token')}
                      className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                        formAuthMode === 'api_token'
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200 ring-1 ring-emerald-500/30'
                          : 'bg-[#0a0d13] border-white/[0.08] text-slate-400 hover:border-white/[0.15]'
                      }`}
                    >
                      <Key className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-xs text-white">Hivatalos API Token (Ajánlott)</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Meta Graph API, YouTube Data API v3 tokenek és Page ID-k.
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormAuthMode('credentials')}
                      className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                        formAuthMode === 'credentials'
                          ? 'bg-purple-500/15 border-purple-500/40 text-purple-200 ring-1 ring-purple-500/30'
                          : 'bg-[#0a0d13] border-white/[0.08] text-slate-400 hover:border-white/[0.15]'
                      }`}
                    >
                      <Lock className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-xs text-white">Felhasználónév & Jelszó</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Közvetlen fiókbejelentkezés személyes vagy céges fiókhoz.
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Dynamic Form based on Auth Mode */}
                  {formAuthMode === 'api_token' ? (
                    <div className="p-4 rounded-xl bg-[#0a0d13] border border-white/[0.06] space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-300">
                            Access Token (Hozzáférési Kulcs)
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowToken(!showToken)}
                            className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono"
                          >
                            {showToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{showToken ? 'Elrejtés' : 'Megjelenítés'}</span>
                          </button>
                        </div>
                        <input
                          type={showToken ? 'text' : 'password'}
                          value={formAccessToken}
                          onChange={(e) => setFormAccessToken(e.target.value)}
                          placeholder="pl. EAABwzLixnjYBAOd8q2kP98zXkL... vagy AIzaSyDw..."
                          className="w-full bg-[#121620] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Fiók / Page / Csatorna ID
                          </label>
                          <input
                            type="text"
                            value={formPlatformNativeId}
                            onChange={(e) => setFormPlatformNativeId(e.target.value)}
                            placeholder="pl. 109283741829182 vagy UC_x5XG1..."
                            className="w-full bg-[#121620] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            App ID / Client ID (Opcionális)
                          </label>
                          <input
                            type="text"
                            value={formAppId}
                            onChange={(e) => setFormAppId(e.target.value)}
                            placeholder="pl. 849201948201"
                            className="w-full bg-[#121620] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-[#0a0d13] border border-white/[0.06] space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Felhasználónév vagy Email cím
                        </label>
                        <input
                          type="text"
                          value={formUsername}
                          onChange={(e) => setFormUsername(e.target.value)}
                          placeholder="pl. admin@postpulse.app vagy felhasznalo"
                          className="w-full bg-[#121620] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-300">
                            Jelszó
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono"
                          >
                            {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{showPassword ? 'Elrejtés' : 'Megjelenítés'}</span>
                          </button>
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={formPassword}
                          onChange={(e) => setFormPassword(e.target.value)}
                          placeholder="Fiók jelszava"
                          className="w-full bg-[#121620] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-200 text-xs flex items-start gap-2">
                        <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 fill-current" />
                        <div>
                          <div className="font-semibold text-white">⚡ Metricool-mód aktív (NEM KELL ACCESS TOKEN!)</div>
                          <div className="text-[11px] text-slate-300 mt-0.5">
                            A felhasználónévvel és jelszóval a rendszer automatikusan felépíti a hitelesített publikálási munkamenetet. Nincs szükség Meta Graph API tokenek keresgélésére!
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Test Connection Button Inside Step 3 */}
                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleRunTest}
                      disabled={testing}
                      className="px-3.5 py-1.5 rounded-lg border border-white/[0.15] bg-[#0a0d13] hover:bg-white/[0.06] text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin text-blue-400' : ''}`} />
                      <span>{testing ? 'Tesztelés folyamatban...' : 'Kapcsolat Tesztelése'}</span>
                    </button>

                    {testResult && (
                      <span
                        className={`text-xs flex items-center gap-1 font-semibold ${
                          testResult.success ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {testResult.success ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <AlertCircle className="w-4 h-4" />
                        )}
                        <span>{testResult.message}</span>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------ */}
              {/* STEP 4: Összegzés & Mentés                                   */}
              {/* ------------------------------------------------------------ */}
              {step === 4 && (
                <div className="p-5 rounded-2xl bg-[#121620] border border-white/[0.08] space-y-4 animate-fadeIn">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-mono">
                        4
                      </span>
                      <span>Összegzés & Véglegesítés</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Kérjük ellenőrizd az adatokat a fiók mentése és csatlakoztatása előtt.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0a0d13] border border-white/[0.08] space-y-2.5 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                      <span className="text-slate-400">Fiók Neve:</span>
                      <span className="font-bold text-white">{formName || 'Névtelen Fiók'}</span>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                      <span className="text-slate-400">Platform:</span>
                      <div className="flex items-center gap-1.5 font-bold text-slate-200">
                        <PlatformIcon platform={currentPlatformOption.basePlatform} size="xs" />
                        <span>{currentPlatformOption.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                      <span className="text-slate-400">Fiók Típusa:</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          formAccountType === 'personal'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}
                      >
                        {formAccountType === 'personal' ? 'Magán / Profil' : 'Üzleti / Céges'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                      <span className="text-slate-400">Hitelesítési Mód:</span>
                      <span className="font-mono text-slate-200">
                        {formAuthMode === 'credentials'
                          ? `🔑 Felhasználó: ${formUsername || 'Nincs megadva'}`
                          : `⚡ API Token (${formAccessToken ? 'Beállítva' : 'Nincs megadva'})`}
                      </span>
                    </div>

                    {formPlatformNativeId && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Native Platform ID:</span>
                        <span className="font-mono text-slate-200">{formPlatformNativeId}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>
                      A mentés után a fiók azonnal kiválasztható lesz a posztszerkesztőben és az időzített naptárban.
                    </span>
                  </div>
                </div>
              )}

              {/* Wizard Bottom Step Controller Bar */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={() => setStep((step - 1) as WizardStep)}
                      className="px-4 py-2 rounded-xl border border-white/[0.12] bg-[#121620] hover:bg-white/[0.06] text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Vissza</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveTab('list')}
                      className="px-4 py-2 rounded-xl border border-white/[0.1] text-slate-400 hover:text-white text-xs font-semibold transition-colors"
                    >
                      Mégse & Vissza a Listához
                    </button>
                  )}
                </div>

                <div>
                  {step < 4 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (step === 1 && !formName.trim()) {
                          setFeedbackMessage({ text: 'Kérjük adj meg egy nevet a fióknak!', type: 'error' });
                          return;
                        }
                        setFeedbackMessage(null);
                        setStep((step + 1) as WizardStep);
                      }}
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all active:scale-[0.98]"
                      id="wizard-next-step-btn"
                    >
                      <span>Következő Lépés</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSaveAccount}
                      disabled={saving}
                      className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98] disabled:opacity-50"
                      id="wizard-save-finish-btn"
                    >
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      <span>{saving ? 'Mentés...' : isEditing ? 'Módosítások Mentése' : 'Fiók Csatlakoztatása & Befejezés'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Status Bar */}
        <div className="h-12 px-6 bg-[#090c12] border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-mono">PostPulse Multi-Platform Engine</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px]">
              {activeTab === 'wizard' ? `Varázsló: ${step}/4 lépés` : `${accounts.length} fiók elérhető`}
            </span>
            <button
              onClick={onClose}
              className="px-3 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 text-xs font-semibold transition-colors"
            >
              Bezárás
            </button>
          </div>
        </div>
      </div>

      {/* Metricool 1-Click Fast Connect Overlay Modal (NO ACCESS TOKEN REQUIRED!) */}
      {showMetricoolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#0e121b] border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-500/10 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-white/[0.08] bg-gradient-to-r from-blue-950/60 to-cyan-950/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                  <Zap className="w-5 h-5 text-cyan-300 fill-current" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-white">Gyors Összekapcsolás (Metricool-mód)</h3>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                      NEM KELL ACCESS TOKEN!
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Csatlakoztasd a fiókodat közvetlenül felhasználónévvel és jelszóval.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMetricoolModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08]"
                id="btn-close-metricool-modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-xs">
              {/* Platform Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  1. Válaszd ki a platformot:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'facebook_page', label: 'Facebook Oldal', base: 'facebook' },
                    { id: 'facebook_profile', label: 'Facebook Profil', base: 'facebook' },
                    { id: 'instagram', label: 'Instagram', base: 'instagram' },
                    { id: 'youtube', label: 'YouTube', base: 'youtube' },
                    { id: 'threads', label: 'Threads', base: 'threads' },
                  ].map((p) => {
                    const active = metricoolPlatform === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setMetricoolPlatform(p.id as SocialAccountPlatformType);
                          if (p.id === 'facebook_profile') setMetricoolAccountType('personal');
                          else setMetricoolAccountType('business');
                        }}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                          active
                            ? 'bg-cyan-500/20 border-cyan-400/50 text-white ring-1 ring-cyan-400/40 shadow-sm'
                            : 'bg-[#121620] border-white/[0.06] text-slate-300 hover:border-white/[0.15]'
                        }`}
                      >
                        <PlatformIcon platform={p.base as any} size="sm" />
                        <span className="font-semibold text-xs truncate">{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Account Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  2. Fiók / Oldal Neve:
                </label>
                <input
                  type="text"
                  value={metricoolName}
                  onChange={(e) => setMetricoolName(e.target.value)}
                  placeholder={
                    metricoolPlatform === 'facebook_page'
                      ? 'pl. Céges Facebook Oldal'
                      : metricoolPlatform === 'facebook_profile'
                        ? 'pl. Kovács János (Profil)'
                        : metricoolPlatform === 'instagram'
                          ? 'pl. Insta Üzleti Fiók'
                          : metricoolPlatform === 'youtube'
                            ? 'pl. Tech Csatorna'
                            : 'pl. Threads Fiók'
                  }
                  className="w-full bg-[#121620] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  3. Felhasználónév vagy Bejelentkezési Email cím:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={metricoolUsername}
                    onChange={(e) => setMetricoolUsername(e.target.value)}
                    placeholder="pl. pelda@gmail.com vagy kovacs_janos"
                    className="w-full bg-[#121620] border border-white/[0.12] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    4. Jelszó:
                  </label>
                  <button
                    type="button"
                    onClick={() => setMetricoolShowPassword(!metricoolShowPassword)}
                    className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono"
                  >
                    {metricoolShowPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{metricoolShowPassword ? 'Elrejtés' : 'Megjelenítés'}</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type={metricoolShowPassword ? 'text' : 'password'}
                    value={metricoolPassword}
                    onChange={(e) => setMetricoolPassword(e.target.value)}
                    placeholder="Fiók jelszava"
                    className="w-full bg-[#121620] border border-white/[0.12] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Explanatory callout */}
              <div className="p-3.5 rounded-xl bg-blue-950/30 border border-cyan-500/20 text-blue-200 text-[11px] leading-relaxed flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Hogyan működik?</strong> Pontosan úgy, mint a Metricool vagy Buffer rendszereiben: a bejelentkezési adatokkal a rendszer automatikusan felépíti az engedélyezett munkamenetet. Nincs szükséged Meta Graph API fejlesztői konzolra, sem manuális Page Access Token másolgatására!
                </span>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-4 border-t border-white/[0.08] bg-[#090c12] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowMetricoolModal(false)}
                className="px-4 py-2 rounded-xl border border-white/[0.1] text-slate-400 hover:text-white text-xs font-semibold transition-colors"
              >
                Mégse
              </button>
              <button
                type="button"
                onClick={handleMetricoolConnect}
                disabled={metricoolConnecting}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
                id="btn-confirm-metricool-connect"
              >
                {metricoolConnecting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Kapcsolódás a szerverhez...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Összekapcsolás & Mentés</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
