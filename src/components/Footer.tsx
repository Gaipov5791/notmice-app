import React from 'react';
import { useI18n } from '../i18n/I18nProvider';

export const Footer: React.FC = () => {
  const { m } = useI18n();
  return (
    <footer className="w-full bg-[#ffffff] border-t border-[#e2e8f0] shadow-[0_1px_8px_rgba(0,0,0,0.04)] py-4 mt-auto">
      <div className="w-full max-w-[1440px] mx-auto px-4 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-2 text-[#565e74] font-['JetBrains_Mono'] text-xs">
          <span className="font-semibold text-[#0b1c30]">{m.shell.footerBrand}</span>
          <span className="hidden sm:inline">•</span>
          <span>{m.shell.footerNonDiagnostic}</span>
          <span className="hidden sm:inline">•</span>
          <span>{m.shell.footerCitation}</span>
        </div>
        <div className="flex items-center gap-4 font-['JetBrains_Mono'] text-xs text-[#565e74]">
          <span>{m.shell.footerNoRawFiles}</span>
          <span>{m.shell.footerLoinc}</span>
        </div>
      </div>
    </footer>
  );
};
