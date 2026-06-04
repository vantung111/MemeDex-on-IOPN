'use client';

import { PageHeader } from '@/components/PageHeader';
import FarmInterface from '@/components/FarmInterface';

export default function FarmPage() {
  return (
    <div>
      <PageHeader
        title="FARM"
        emoji="🌾"
        subtitle="Provide LP liquidity and harvest MEMEDEX yield"
      >
        <div className="inline-flex gap-2 mt-3">
          <span className="sticker sticker-fire">🌾 LP REWARDS</span>
          <span className="sticker sticker-cool">💎 AUTO-COMPOUND READY</span>
        </div>
      </PageHeader>

      <div className="max-w-5xl mx-auto px-4 pb-16">
        <FarmInterface />
      </div>
    </div>
  );
}
