import React, { useState } from 'react';
import { X, KeyRound, Copy, Check, LogOut, ShieldAlert, LoaderCircle } from 'lucide-react';

interface SeedPhraseModalProps {
  isOpen: boolean;
  onClose: () => void;
  publicId: string | null;
  revealedMnemonic: string[] | null;
  isAuthenticated: boolean;
  isBusy: boolean;
  error: string | null;
  onCreateAccount: () => void;
  onLogin: (mnemonic: string) => void;
  onLogout: () => void;
  onConfirmPhraseSaved: () => void;
}

export const SeedPhraseModal: React.FC<SeedPhraseModalProps> = ({
  isOpen,
  onClose,
  publicId,
  revealedMnemonic,
  isAuthenticated,
  isBusy,
  error,
  onCreateAccount,
  onLogin,
  onLogout,
  onConfirmPhraseSaved,
}) => {
  const [copied, setCopied] = useState(false);
  const [savedChecked, setSavedChecked] = useState(false);
  const [restorePhrase, setRestorePhrase] = useState('');

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!revealedMnemonic) return;
    navigator.clipboard.writeText(revealedMnemonic.join(' '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    setRestorePhrase('');
    setSavedChecked(false);
    setCopied(false);
    onLogout();
  };

  const handleLogin = () => {
    onLogin(restorePhrase);
  };

  const showingReveal = Boolean(revealedMnemonic && revealedMnemonic.length === 12);
  const showingSignedIn = isAuthenticated && !showingReveal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1c30]/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#ffffff] rounded-xl border border-[#cbd5e1] shadow-2xl max-w-xl w-full overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between bg-[#eff4ff]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#cce5ff] flex items-center justify-center text-[#006194]">
              <KeyRound className="w-5 h-5 text-[#006194]" />
            </div>
            <div>
              <h3 className="font-['Inter'] text-base font-bold text-[#0b1c30]">
                Pseudonymous Account
              </h3>
              <p className="font-['JetBrains_Mono'] text-xs text-[#565e74]">
                {publicId ? `ID: ${publicId}` : 'Sign in with a 12-word recovery phrase'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#565e74] hover:bg-[#e2e8f0] hover:text-[#0b1c30] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-[#fff1f2] border border-[#fecdd3] p-3 rounded text-xs text-[#ba1a1a]">
              {error}
            </div>
          )}

          {showingReveal && revealedMnemonic && (
            <>
              <div className="bg-[#eff4ff] border border-[#dce9ff] p-3 rounded text-xs text-[#3f4850] flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-[#006194] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-[#0b1c30] block">Shown once</span>
                  Write these 12 BIP-39 words down now. The server stores only an argon2id hash, not
                  the phrase. It will not be returned on later visits.
                </div>
              </div>

              <div>
                <label className="font-['Inter'] text-xs font-semibold text-[#0b1c30] uppercase tracking-wider block mb-2">
                  12-Word BIP-39 Recovery Phrase
                </label>
                <div className="grid grid-cols-3 gap-2 bg-[#f8f9ff] p-3.5 rounded-lg border border-[#e2e8f0]">
                  {revealedMnemonic.map((word, index) => (
                    <div
                      key={`${word}-${index}`}
                      className="bg-[#ffffff] px-2.5 py-1.5 rounded border border-[#e2e8f0] flex items-center gap-2 font-['JetBrains_Mono'] text-xs"
                    >
                      <span className="text-[#94a3b8] select-none text-[10px]">{index + 1}.</span>
                      <span className="font-medium text-[#0b1c30]">{word}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-[#eff4ff] hover:bg-[#e5eeff] text-[#006194] border border-[#dce9ff] transition-colors cursor-pointer"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-[#006947]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span>{copied ? 'Copied Phrase' : 'Copy 12 Words'}</span>
                </button>
              </div>

              <label className="flex items-start gap-2.5 text-xs text-[#3f4850] cursor-pointer">
                <input
                  type="checkbox"
                  checked={savedChecked}
                  onChange={(e) => setSavedChecked(e.target.checked)}
                  className="mt-0.5"
                />
                <span>I have stored this recovery phrase. I understand it will not be shown again.</span>
              </label>
            </>
          )}

          {showingSignedIn && (
            <>
              <div className="bg-[#eff4ff] border border-[#dce9ff] p-3 rounded text-xs text-[#3f4850] flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-[#006194] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-[#0b1c30] block">Signed in</span>
                  This is a login phrase, not a crypto wallet. The words were shown once at account
                  creation and are not stored in the browser or the database.
                </div>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-[#f8f9ff] rounded border border-[#e2e8f0] font-['JetBrains_Mono'] text-xs text-[#565e74]">
                <span>Public ID: {publicId}</span>
                <span className="text-[#006947] font-semibold">Authenticated</span>
              </div>
            </>
          )}

          {!isAuthenticated && !showingReveal && (
            <>
              <div className="bg-[#eff4ff] border border-[#dce9ff] p-3 rounded text-xs text-[#3f4850] flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-[#006194] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-[#0b1c30] block">No email or phone</span>
                  Create a pseudonymous account or restore one with the 12-word BIP-39 phrase issued
                  at registration. The placeholder words from the demo are no longer accepted.
                </div>
              </div>

              <button
                onClick={onCreateAccount}
                disabled={isBusy}
                className="w-full px-4 py-2.5 rounded font-['Inter'] text-sm font-semibold bg-[#006194] text-[#ffffff] hover:bg-[#007bb9] disabled:opacity-60 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {isBusy ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                <span>Create account</span>
              </button>

              <div className="pt-1">
                <label className="font-['Inter'] text-xs font-semibold text-[#0b1c30] uppercase tracking-wider block mb-2">
                  Restore with recovery phrase
                </label>
                <textarea
                  value={restorePhrase}
                  onChange={(e) => setRestorePhrase(e.target.value)}
                  rows={3}
                  placeholder="Paste your 12 words here"
                  className="w-full rounded-lg border border-[#e2e8f0] bg-[#f8f9ff] p-3 font-['JetBrains_Mono'] text-xs text-[#0b1c30] focus:outline-none focus:border-[#006194]"
                />
                <button
                  onClick={handleLogin}
                  disabled={isBusy || restorePhrase.trim().length === 0}
                  className="mt-2 w-full px-4 py-2 rounded font-['Inter'] text-sm font-semibold text-[#0b1c30] bg-[#eff4ff] hover:bg-[#e5eeff] border border-[#dce9ff] disabled:opacity-60 transition-colors cursor-pointer"
                >
                  Sign in
                </button>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-3.5 border-t border-[#e2e8f0] bg-[#f8f9ff] flex justify-between">
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              disabled={isBusy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-[#fff1f2] hover:bg-[#ffe4e6] text-[#ba1a1a] border border-[#fecdd3] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          ) : (
            <span />
          )}
          {showingReveal ? (
            <button
              onClick={() => {
                if (!savedChecked) return;
                setSavedChecked(false);
                setCopied(false);
                onConfirmPhraseSaved();
                onClose();
              }}
              disabled={!savedChecked}
              className="px-4 py-1.5 rounded font-['Inter'] text-sm font-semibold bg-[#006194] text-[#ffffff] hover:bg-[#007bb9] disabled:opacity-50 transition-colors cursor-pointer"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded font-['Inter'] text-sm font-semibold bg-[#006194] text-[#ffffff] hover:bg-[#007bb9] transition-colors cursor-pointer"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
