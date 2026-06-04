'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Gift, Trophy, TrendingUp, Award, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import {
  useSnapshotCount,
  useClaimableReward,
  useTradingRewardsClaim,
  useReferralEarnings,
  formatEther,
} from '@/hooks/useContracts';

export default function AirdropInterface() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  const { data: snapshotCount } = useSnapshotCount();
  const count = Number(snapshotCount ?? 0);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-primary/20 via-surface to-accent/10 border border-border rounded-2xl p-6 text-center">
        <Gift size={40} className="mx-auto mb-3 text-primary" />
        <h2 className="text-xl font-bold mb-1">Trading Rewards</h2>
        <p className="text-text-secondary text-sm max-w-md mx-auto">
          Top 20 traders every week earn MEMEDEX airdrops. The more you trade, the more you earn.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Snapshots', value: `${count}`, icon: Trophy, color: 'text-warning' },
          { label: 'Your Rank', value: '--', icon: TrendingUp, color: 'text-primary' },
          { label: 'Your Volume', value: '--', icon: TrendingUp, color: 'text-primary' },
          { label: 'Total Distributed', value: '--', icon: Award, color: 'text-accent' },
        ].map((stat, i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-4">
            <stat.icon size={14} className={clsx(stat.color, 'mb-2')} />
            <p className="text-xs text-text-muted mb-1">{stat.label}</p>
            <p className={clsx('font-bold font-mono text-sm', stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4">
        <h3 className="font-semibold mb-3">Top 20 Reward Distribution</h3>
        <div className="grid grid-cols-4 gap-2">
          {[
            { ranks: '1st', pct: '30%', color: 'bg-warning/20 text-warning' },
            { ranks: '2-5th', pct: '15% ea', color: 'bg-gray-500/20 text-gray-300' },
            { ranks: '6-10th', pct: '5% ea', color: 'bg-orange-400/20 text-orange-400' },
            { ranks: '11-20th', pct: '2% ea', color: 'bg-surface-light text-text-muted' },
          ].map((tier, i) => (
            <div key={i} className={clsx('rounded-lg p-2 text-center', tier.color)}>
              <p className="text-xs font-semibold">{tier.ranks}</p>
              <p className="text-xs mt-0.5">{tier.pct}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-border">
        {(['active', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'pb-3 px-1 text-sm font-medium capitalize transition-all relative flex items-center gap-1',
              activeTab === tab ? 'text-primary tab-active' : 'text-text-muted hover:text-white'
            )}
          >
            {tab === 'active' && <Clock size={12} />}
            {tab === 'history' && <Trophy size={12} />}
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'active' && (
        <ClaimCard address={address} isConnected={isConnected} snapshotId={count > 0 ? count - 1 : 0} />
      )}

      {activeTab === 'history' && (
        <div className="space-y-3">
          {Array.from({ length: Math.max(0, count - 1) }, (_, i) => (
            <HistoryCard key={i} address={address} isConnected={isConnected} snapshotId={i} />
          ))}
          {count <= 1 && (
            <div className="text-center py-8 text-text-muted">
              <Trophy size={32} className="mx-auto mb-2 opacity-30" />
              <p>No past snapshots yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ClaimCard({ address, isConnected, snapshotId }: { address: string | undefined; isConnected: boolean; snapshotId: number }) {
  const { data: claimable, isLoading } = useClaimableReward(address, snapshotId);
  const { claimRewards, isPending } = useTradingRewardsClaim();

  const handleClaim = () => {
    if (!isConnected) { toast.error('Connect wallet'); return; }
    try {
      claimRewards(snapshotId);
      toast.success('Claim submitted!');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Claim failed');
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6 text-center">
        <p className="text-text-secondary">Connect wallet to check your airdrop eligibility</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6 text-center flex items-center justify-center gap-2">
        <Loader2 size={16} className="animate-spin text-primary" /> Loading...
      </div>
    );
  }

  const amount = claimable ?? 0n;
  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Current Snapshot</h3>
          <p className="text-xs text-text-muted">Snapshot #{snapshotId}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold font-mono text-accent">
            {amount > 0 ? `${parseFloat(formatEther(amount)).toFixed(2)} MEMEDEX` : '0 MEMEDEX'}
          </p>
          <p className="text-xs text-text-muted">Claimable</p>
        </div>
      </div>
      <button
        onClick={handleClaim}
        disabled={amount === 0n || isPending}
        className="w-full py-3 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isPending && <Loader2 size={14} className="animate-spin" />}
        {amount > 0n ? 'Claim Rewards' : 'No Rewards Yet — Start Trading!'}
      </button>
    </div>
  );
}

function HistoryCard({ address, isConnected, snapshotId }: { address: string | undefined; isConnected: boolean; snapshotId: number }) {
  const { data: claimable, isLoading } = useClaimableReward(address, snapshotId);
  const amount = (claimable ?? 0n);

  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex items-center justify-between">
      <div>
        <p className="font-medium text-sm">Snapshot #{snapshotId}</p>
        <p className="text-xs text-text-muted">Past distribution</p>
      </div>
      <div className="text-right">
        {isLoading ? (
          <Loader2 size={12} className="animate-spin text-text-muted" />
        ) : (
          <p className={clsx('font-mono text-sm font-semibold', amount > 0n ? 'text-accent' : 'text-text-muted')}>
            {amount > 0n ? `${parseFloat(formatEther(amount)).toFixed(2)} MEMEDEX` : '--'}
          </p>
        )}
        <p className="text-xs text-text-muted">{amount > 0n ? 'Claimable' : 'No reward'}</p>
      </div>
    </div>
  );
}
