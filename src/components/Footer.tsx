import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#ffffff] border-t border-[#e2e8f0] shadow-[0_1px_8px_rgba(0,0,0,0.04)] py-4 mt-auto">
      <div className="w-full max-w-[1440px] mx-auto px-4 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-2 text-[#565e74] font-['JetBrains_Mono'] text-xs">
          <span className="font-semibold text-[#0b1c30]">NotMice Research Platform</span>
          <span className="hidden sm:inline">•</span>
          <span>Non-diagnostic exploratory research tool only</span>
          <span className="hidden sm:inline">•</span>
          <span>Citations: Levine et al. PhenoAge Algorithm</span>
        </div>
        <div className="flex items-center gap-4 font-['JetBrains_Mono'] text-xs text-[#565e74]">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00855b]"></span>
            SHA-256 Engine: Verified
          </span>
          <span>LOINC Protocol Sync: 2024.2</span>
        </div>
      </div>
    </footer>
  );
};
