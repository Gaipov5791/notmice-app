import React, { useState } from 'react';
import { X, KeyRound, Copy, Check, RefreshCw, Trash2, ShieldAlert } from 'lucide-react';

interface SeedPhraseModalProps {
  isOpen: boolean;
  onClose: () => void;
  seedPhrase: string[];
  accountAddress: string;
  onRegenerateKeys: () => void;
  onPurgeMemory: () => void;
}

export const SeedPhraseModal: React.FC<SeedPhraseModalProps> = ({
  isOpen,
  onClose,
  seedPhrase,
  accountAddress,
  onRegenerateKeys,
  onPurgeMemory,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(seedPhrase.join(' '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1c30]/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#ffffff] rounded-xl border border-[#cbd5e1] shadow-2xl max-w-xl w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between bg-[#eff4ff]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#cce5ff] flex items-center justify-center text-[#006194]">
              <KeyRound className="w-5 h-5 text-[#006194]" />
            </div>
            <div>
              <h3 className="font-['Inter'] text-base font-bold text-[#0b1c30]">
                Cryptographic Keypair & Vault
              </h3>
              <p className="font-['JetBrains_Mono'] text-xs text-[#565e74]">
                Address: {accountAddress}
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

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-[#eff4ff] border border-[#dce9ff] p-3 rounded text-xs text-[#3f4850] flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-[#006194] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#0b1c30] block">
                Zero-Cloud Sovereign Security
              </span>
              Your health telemetry is encrypted with this client-side 12-word recovery mnemonic.
              It exists only in browser RAM and is never sent to any database.
            </div>
          </div>

          <div>
            <label className="font-['Inter'] text-xs font-semibold text-[#0b1c30] uppercase tracking-wider block mb-2">
              12-Word BIP-39 Seed Mnemonic
            </label>
            <div className="grid grid-cols-3 gap-2 bg-[#f8f9ff] p-3.5 rounded-lg border border-[#e2e8f0]">
              {seedPhrase.map((word, index) => (
                <div
                  key={index}
                  className="bg-[#ffffff] px-2.5 py-1.5 rounded border border-[#e2e8f0] flex items-center gap-2 font-['JetBrains_Mono'] text-xs"
                >
                  <span className="text-[#94a3b8] select-none text-[10px]">{index + 1}.</span>
                  <span className="font-medium text-[#0b1c30]">{word}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-[#eff4ff] hover:bg-[#e5eeff] text-[#006194] border border-[#dce9ff] transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-[#006947]" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied Mnemonic' : 'Copy 12 Words'}</span>
            </button>

            <button
              onClick={onRegenerateKeys}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold text-[#3f4850] hover:bg-[#eff4ff] border border-[#cbd5e1] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Regenerate Keypair</span>
            </button>
          </div>

          {/* Purge action */}
          <div className="pt-3 border-t border-[#e2e8f0] flex items-center justify-between">
            <span className="text-xs text-[#565e74]">
              Done with your session? Instantly wipe RAM state.
            </span>
            <button
              onClick={() => {
                onPurgeMemory();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-[#fff1f2] hover:bg-[#ffe4e6] text-[#ba1a1a] border border-[#fecdd3] transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Purge Memory</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#e2e8f0] bg-[#f8f9ff] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded font-['Inter'] text-sm font-semibold bg-[#006194] text-[#ffffff] hover:bg-[#007bb9] transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
