import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Languages } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';

interface LanguageSwitcherProps {
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className }) => {
  const { locale, setLocale, locales, m } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = locales.find((item) => item.id === locale) ?? locales[0];

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className ?? ''}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={m.nav.languageMenu}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1 text-[#3f4850] hover:text-[#0b1c30] bg-[#eff4ff] hover:bg-[#e5eeff] px-2.5 py-1.5 rounded transition-colors border border-[#dce9ff] cursor-pointer font-['JetBrains_Mono'] text-[11px] font-semibold"
      >
        <Languages className="w-3.5 h-3.5 text-[#006194]" />
        {current.code}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 min-w-[160px] rounded-lg border border-[#e2e8f0] bg-[#ffffff] py-1 shadow-lg z-50"
        >
          {locales.map((item) => {
            const selected = item.id === locale;
            return (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  setLocale(item.id);
                  setOpen(false);
                }}
                className={`block w-full text-left px-3 py-2 text-[13px] font-medium cursor-pointer ${
                  selected
                    ? 'bg-[#007bb9] text-[#ffffff]'
                    : 'text-[#3f4850] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
