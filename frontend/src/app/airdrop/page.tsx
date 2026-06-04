'use client';

import { PageHeader } from '@/components/PageHeader';
import AirdropInterface from '@/components/AirdropInterface';

export default function AirdropPage() {
  return (
    <div>
      <PageHeader
        title="AIRDROP"
        emoji="🪂"
        subtitle="Top 20 traders earn MEMEDEX every week. Trade more, earn more."
        ribbon="WEEKLY"
      >
        <div className="inline-flex gap-2 mt-3">
          <span className="sticker sticker-fire">🔥 30% TO #1</span>
          <span className="sticker">🪂 WEEKLY DROPS</span>
        </div>
      </PageHeader>

      <div className="max-w-5xl mx-auto px-4 pb-16">
        <AirdropInterface />
      </div>
    </div>
  );
}
