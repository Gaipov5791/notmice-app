import React, { useState } from 'react';
import { TabType } from '../types';
import { Shield, Terminal, Menu, X, Cpu, KeyRound } from 'lucide-react';
import logo from '../assets/images/logo.jpg';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenTerminal: () => void;
  onOpenSeedPhrase: () => void;
  accountAddress: string;
  isAuthenticated: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenTerminal,
  onOpenSeedPhrase,
  accountAddress,
  isAuthenticated,
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
                className="w-12 h-12 rounded-full object-cover ring-2 ring-[#006194]/20 group-hover:ring-[#006194]/50 transition-all"
                src={logo}
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
            title={isAuthenticated ? 'Account recovery phrase' : 'Sign in or create an account'}
            className="hidden md:flex items-center gap-2 bg-[#eff4ff] hover:bg-[#e5eeff] px-2.5 py-1.5 rounded border border-[#dce9ff] transition-colors cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-[#00855b] animate-pulse"></span>
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#0b1c30] font-medium">
              {accountAddress}
            </span>
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#006947] font-semibold hidden lg:inline bg-[#4edea3]/20 px-1.5 py-0.5 rounded">
              {isAuthenticated ? 'Signed in' : 'Guest'}
            </span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5 bg-[#eff4ff] text-[#3f4850] px-2.5 py-1.5 rounded font-['JetBrains_Mono'] text-[11px] border border-[#dce9ff]">
            <Shield className="w-3.5 h-3.5 text-[#006947]" />
            <span className="font-medium">No raw files</span>
          </div>

          {/* Key generation modal toggle */}
          <button
            onClick={onOpenSeedPhrase}
            aria-label="Account recovery phrase"
            title="Account recovery phrase"
            className="flex items-center gap-1 text-[#3f4850] hover:text-[#0b1c30] bg-[#eff4ff] hover:bg-[#e5eeff] p-2 rounded transition-colors border border-[#dce9ff] cursor-pointer"
          >
            <KeyRound className="w-4 h-4 text-[#006194]" />
          </button>

          {/* Terminal button */}
          <button
            onClick={onOpenTerminal}
            aria-label="Session log"
            title="Session log"
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
                {isAuthenticated ? 'Signed in' : 'Guest'}
              </span>
              <span className="font-mono">{accountAddress}</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
