'use client';

import { PageHeader } from '@/components/PageHeader';
import StakeInterface from '@/components/StakeInterface';

export default function StakePage() {
  return (
    <div>
      <PageHeader
        title="STAKE"
        emoji="💎"
        subtitle="Stake your tokens, earn passive MEMEDEX rewards. Diamond hands only."
      >
        <div className="inline-flex gap-2 mt-3">
          <span className="sticker sticker-fire">🔥 EARN MEMEDEX</span>
          <span className="sticker">💰 NATIVE + LP POOLS</span>
        </div>
      </PageHeader>

      <div className="max-w-5xl mx-auto px-4 pb-16">
        <StakeInterface />
      </div>
    </div>
  );
}
