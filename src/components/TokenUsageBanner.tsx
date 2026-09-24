import { fill } from '../i18n/fill';
import { useI18n } from '../i18n/I18nProvider';
import type { TokenUsageNotice } from '../types';

interface TokenUsageBannerProps {
  usage: TokenUsageNotice;
}

export function TokenUsageBanner({ usage }: TokenUsageBannerProps) {
  const { m } = useI18n();
  const copy = m.upload;
  const text = usage.limitReached
    ? fill(copy.tokenLimitReached, { used: usage.tokensUsed, limit: usage.tokensLimit })
    : fill(usage.warning ? copy.tokenUsageWarning : copy.tokenUsage, {
        used: usage.tokensUsed,
        limit: usage.tokensLimit,
      });
  const tone = usage.limitReached
    ? 'bg-[#fff1f2] border-[#fecdd3] text-[#9f1239]'
    : usage.warning
      ? 'bg-[#fffbeb] border-[#fde68a] text-[#92400e]'
      : 'bg-[#f8fafc] border-[#e2e8f0] text-[#3f4850]';

  return (
    <div className={`p-4 rounded-xl border text-xs font-['Inter'] ${tone}`}>
      {text}
    </div>
  );
}
