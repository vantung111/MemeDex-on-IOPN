'use client';

import { PageHeader } from '@/components/PageHeader';
import LaunchInterface from '@/components/LaunchInterface';

export default function LaunchPage() {
  return (
    <div>
      <PageHeader
        title="LAUNCH"
        emoji="🚀"
        subtitle="Create your own meme token in one click"
        ribbon="2 OPN"
      >
        <div className="inline-flex gap-2 mt-3">
          <span className="sticker">🚀 1-CLICK LAUNCH</span>
          <span className="sticker sticker-cool">🎯 1B SUPPLY</span>
        </div>
      </PageHeader>

      <div className="px-4 pb-16">
        <LaunchInterface />
      </div>
    </div>
  );
}
