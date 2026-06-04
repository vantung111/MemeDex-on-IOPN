'use client';

import { PageHeader } from '@/components/PageHeader';
import PresaleInterface from '@/components/PresaleInterface';

export default function PresalePage() {
  return (
    <div>
      <PageHeader
        title="PRESALE"
        emoji="🎯"
        subtitle="Join meme presales with TGE + 30-day vesting"
      >
        <div className="inline-flex gap-2 mt-3">
          <span className="sticker">💎 50% TGE</span>
          <span className="sticker sticker-cool">⏳ 30-DAY VEST</span>
        </div>
      </PageHeader>

      <div className="max-w-5xl mx-auto px-4 pb-16">
        <PresaleInterface />
      </div>
    </div>
  );
}
