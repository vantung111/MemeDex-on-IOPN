'use client';

import { PageHeader } from '@/components/PageHeader';
import ReferralInterface from '@/components/ReferralInterface';

export default function ReferralPage() {
  return (
    <div>
      <PageHeader
        title="REFERRAL"
        emoji="🤝"
        subtitle="Invite frens and earn 5% of their MEMEDEX rewards"
      >
        <div className="inline-flex gap-2 mt-3">
          <span className="sticker">🤝 5% REWARDS</span>
          <span className="sticker sticker-cool">♾️ LIFETIME</span>
        </div>
      </PageHeader>

      <div className="max-w-3xl mx-auto px-4 pb-16">
        <ReferralInterface />
      </div>
    </div>
  );
}
