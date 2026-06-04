'use client';

import { PageHeader } from '@/components/PageHeader';
import SwapInterface from '@/components/SwapInterface';

export default function SwapPage() {
  return (
    <div>
      <PageHeader
        title="SWAP"
        emoji="🔄"
        subtitle="Trade any meme token with deep liquidity and minimal slippage"
        ribbon="INSTANT"
      >
        <div className="inline-flex gap-2 mt-3">
          <span className="sticker">⚡ 0.25% FEE</span>
          <span className="sticker sticker-cool">🌊 DEEP LIQUIDITY</span>
        </div>
      </PageHeader>

      <div className="px-4 pb-16">
        <SwapInterface />
      </div>
    </div>
  );
}
