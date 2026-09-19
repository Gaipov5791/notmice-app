import React, { useState } from 'react';
import { TabType } from '../types';
import { Shield, Terminal, Menu, X, Cpu, KeyRound } from 'lucide-react';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenTerminal: () => void;
  onOpenSeedPhrase: () => void;
  accountAddress: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenTerminal,
  onOpenSeedPhrase,
  accountAddress,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: TabType; label: string }[] = [
    { id: 'overview-landing', label: 'Overview / Landing' },
    { id: 'upload-lab', label: 'Upload Lab' },
    { id: 'review-extraction', label: 'Review & Extraction' },
    { id: 'phenoage-engine', label: 'PhenoAge™ Engine' },
    { id: 'biomarker-history', label: 'Biomarker History' },
    { id: 'data-sovereignty-public-sharing', label: 'Data Sovereignty & Public Sharing' },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#ffffff]/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-[#e2e8f0]">
      <div className="w-full max-w-[1440px] mx-auto px-4 lg:px-6 h-20 flex items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-6 shrink-0">
          <button
            onClick={() => setActiveTab('overview-landing')}
            className="flex items-center gap-3 text-left focus:outline-none group cursor-pointer"
            id="brand-logo-btn"
          >
            <div className="relative">
              <img
                alt="NotMice Research Protocol"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-[#006194]/20 group-hover:ring-[#006194]/50 transition-all"
                src="https://lh3.googleusercontent.com/aida/AEtjO1WjhhiY5OJnWJ6GKB5XdTf0_4k-aMzMw4vleFit1BARxh5Y894ENmrKtb1bX1pM2IpF6MXccBv90qd5SUjX-u2Wfm0HbCGdw1ue2bTj_Qq3a9DMY-H_a2D16BAYpHB4TK81wRFE89ZlqiJCPuoY2QNRZL9Ey58WSJP6ieZEKS6dopki1jAcmzIk25NOnua_TWtIclMLHt4b7UlEbw_-4LMgKQXabLHR5l4-Ci4JOLXBIm5sTf02yq5LujEz36-P_xu9qvoBIPNz"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#00855b] border-2 border-white rounded-full"></span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-['Inter'] text-[18px] text-[#0b1c30] tracking-tight font-bold">
                  NotMice
                </span>
                <span className="bg-[#e5eeff] text-[#3f4850] font-['JetBrains_Mono'] text-[11px] px-1.5 py-0.5 rounded font-medium">
                  v1.4
                </span>
              </div>
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#565e74] hidden sm:inline-block">
                Research Protocol
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-1" id="desktop-nav">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  data-path={item.id}
                  className={`font-['Inter'] text-[13px] font-medium px-3 py-1.5 rounded transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#007bb9] text-[#ffffff] shadow-sm font-semibold'
                      : 'text-[#3f4850] hover:bg-[#e5eeff] hover:text-[#0b1c30]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Status Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Ephemeral in-memory key */}
          <button
            onClick={onOpenSeedPhrase}
            title="Click to view ephemeral seed phrase"
            className="hidden md:flex items-center gap-2 bg-[#eff4ff] hover:bg-[#e5eeff] px-2.5 py-1.5 rounded border border-[#dce9ff] transition-colors cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-[#00855b] animate-pulse"></span>
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#0b1c30] font-medium">
              {accountAddress}
            </span>
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#006947] font-semibold hidden lg:inline bg-[#4edea3]/20 px-1.5 py-0.5 rounded">
              In-Memory Only
            </span>
          </button>

          {/* Zero Knowledge badge */}
          <div className="hidden sm:flex items-center gap-1.5 bg-[#eff4ff] text-[#3f4850] px-2.5 py-1.5 rounded font-['JetBrains_Mono'] text-[11px] border border-[#dce9ff]">
            <Shield className="w-3.5 h-3.5 text-[#006947]" />
            <span className="font-medium">Zero-Knowledge</span>
          </div>

          {/* Key generation modal toggle */}
          <button
            onClick={onOpenSeedPhrase}
            aria-label="Seed Phrase and Vault"
            title="Seed Phrase and Vault"
            className="flex items-center gap-1 text-[#3f4850] hover:text-[#0b1c30] bg-[#eff4ff] hover:bg-[#e5eeff] p-2 rounded transition-colors border border-[#dce9ff] cursor-pointer"
          >
            <KeyRound className="w-4 h-4 text-[#006194]" />
          </button>

          {/* Terminal button */}
          <button
            onClick={onOpenTerminal}
            aria-label="Account and Node Settings"
            title="WASM Isolation & Terminal Logs"
            className="flex items-center gap-1 text-[#3f4850] hover:text-[#0b1c30] bg-[#eff4ff] hover:bg-[#e5eeff] p-2 rounded transition-colors border border-[#dce9ff] cursor-pointer"
          >
            <Terminal className="w-4 h-4 text-[#3f4850]" />
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 rounded text-[#3f4850] hover:bg-[#eff4ff] cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#ffffff] border-b border-[#e2e8f0] px-4 py-3 shadow-lg">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left px-3 py-2 rounded text-[14px] font-medium ${
                    isActive
                      ? 'bg-[#007bb9] text-[#ffffff]'
                      : 'text-[#3f4850] hover:bg-[#eff4ff]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            <div className="pt-2 mt-2 border-t border-[#e2e8f0] flex items-center justify-between text-xs text-[#565e74]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00855b]"></span>
                In-Memory WebWorker Isolate
              </span>
              <span className="font-mono">{accountAddress}</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
