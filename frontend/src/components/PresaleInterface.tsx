'use client';

import { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { Rocket, Clock, TrendingUp, Shield, Gift, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import {
  usePresaleList,
  usePresaleInfo,
  usePresaleUserPosition,
  usePresaleActions,
  formatEther,
} from '@/hooks/useContracts';
import type { PresaleMeta } from '@/hooks/useContracts';

function Countdown({ seconds }: { seconds: number }) {
  if (seconds <= 0) return <span className="text-danger font-mono text-xs">Ended</span>;
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return (
    <span className="font-mono text-xs">
      {d > 0 ? `${d}d ` : ''}{h}h {m}m
    </span>
  );
}

export default function PresaleInterface() {
  const [activeTab, setActiveTab] = useState<'active' | 'ended'>('active');
  const { data: presales, isLoading } = usePresaleList(0, 50);

  const list = (presales as PresaleMeta[] | undefined) ?? [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Presales', value: String(list.length), icon: Rocket },
          { label: 'Network', value: 'OPN', icon: TrendingUp },
          { label: 'TGE Release', value: '50%', icon: Gift },
          { label: 'Vesting', value: '30 days', icon: Shield },
        ].map((stat, i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-4">
            <stat.icon size={14} className="text-primary mb-2" />
            <p className="text-xs text-text-muted mb-1">{stat.label}</p>
            <p className="font-bold font-mono text-sm">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 border-b border-border">
        {(['active', 'ended'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'pb-3 px-1 text-sm font-medium capitalize transition-all relative',
              activeTab === tab ? 'text-primary tab-active' : 'text-text-muted hover:text-white'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-text-muted flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin" /> Loading presales...
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          <Rocket size={40} className="mx-auto mb-3 opacity-30" />
          <p>No presales yet. Create one from the Launch page.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((meta, i) => (
            <PresaleCard key={`${meta.presale}-${i}`} meta={meta} filter={activeTab} />
          ))}
        </div>
      )}
    </div>
  );
}

function PresaleCard({ meta, filter }: { meta: PresaleMeta; filter: 'active' | 'ended' }) {
  const { address, isConnected } = useAccount();
  const [buyAmount, setBuyAmount] = useState('');
  const [expanded, setExpanded] = useState(false);

  const { data: info } = usePresaleInfo(meta.presale);
  const { data: position } = usePresaleUserPosition(meta.presale, address);
  const { buyTokens, claimTokens, refund, isPending } = usePresaleActions();

  const parsed = useMemo(() => {
    if (!info) return null;
    const [token, creator, rate, hardCap, softCap, minPurchase, maxPurchase, startTime, endTime, totalRaised, isFinalized, isCancelled] =
      info as [string, string, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, boolean, boolean];
    const now = Math.floor(Date.now() / 1000);
    const ended = isFinalized || isCancelled || now > Number(endTime);
    const progress = hardCap > 0n ? Number((totalRaised * 10000n) / hardCap) / 100 : 0;
    return {
      token, creator, rate, hardCap, softCap, minPurchase, maxPurchase,
      startTime: Number(startTime), endTime: Number(endTime), totalRaised, isFinalized, isCancelled,
      ended, progress, secondsLeft: Number(endTime) - now,
    };
  }, [info]);

  if (!parsed) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6 flex items-center justify-center">
        <Loader2 size={16} className="animate-spin text-text-muted" />
      </div>
    );
  }

  // Filter by tab.
  const isActive = !parsed.ended;
  if (filter === 'active' && !isActive) return null;
  if (filter === 'ended' && isActive) return null;

  const rateNum = Number(parsed.rate);
  const estTokens = buyAmount ? (parseFloat(buyAmount) * rateNum).toLocaleString() : '0';
  const contributed = position ? (position as [bigint, bigint, bigint])[0] : 0n;

  const handleBuy = () => {
    if (!isConnected) { toast.error('Connect wallet'); return; }
    if (!buyAmount || parseFloat(buyAmount) <= 0) return;
    try {
      buyTokens(meta.presale, buyAmount);
      toast.success('Purchase submitted!');
      setBuyAmount('');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Buy failed');
    }
  };

  const handleClaim = () => {
    try {
      claimTokens(meta.presale);
      toast.success('Claim submitted!');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Claim failed');
    }
  };

  const handleRefund = () => {
    try {
      refund(meta.presale);
      toast.success('Refund submitted!');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Refund failed');
    }
  };

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden card-hover">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold">
              {meta.symbol.slice(0, 2)}
            </div>
            <div>
              <h3 className="font-semibold text-sm">{meta.name}</h3>
              <p className="text-xs text-text-muted">{meta.symbol}</p>
            </div>
          </div>
          <div className={clsx(
            'px-2 py-1 rounded-full text-xs font-medium',
            parsed.isCancelled ? 'bg-danger/20 text-danger'
              : isActive ? 'bg-accent/20 text-accent' : 'bg-surface-light text-text-muted'
          )}>
            {parsed.isCancelled ? 'Cancelled' : isActive ? 'Active' : 'Ended'}
          </div>
        </div>
        <p className="text-xs text-text-muted line-clamp-2">{meta.description}</p>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs text-text-muted mb-1">
            <span>Progress</span>
            <span>{parseFloat(formatEther(parsed.totalRaised)).toFixed(2)} / {parseFloat(formatEther(parsed.hardCap)).toFixed(2)} OPN</span>
          </div>
          <div className="h-2 bg-surface-light rounded-full overflow-hidden">
            <div
              className="h-full progress-bar rounded-full transition-all duration-500"
              style={{ width: `${Math.min(parsed.progress, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-text-muted mt-1">
            <span>{parsed.progress.toFixed(1)}% filled</span>
            <div className="flex items-center gap-1">
              <Clock size={10} />
              <Countdown seconds={parsed.secondsLeft} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-surface-light rounded-lg p-2">
            <p className="text-text-muted">Rate</p>
            <p className="font-mono font-semibold">{rateNum.toLocaleString()} / OPN</p>
          </div>
          <div className="bg-surface-light rounded-lg p-2">
            <p className="text-text-muted">Soft Cap</p>
            <p className="font-mono font-semibold">{parseFloat(formatEther(parsed.softCap)).toFixed(2)} OPN</p>
          </div>
        </div>

        {contributed > 0n && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-2 text-xs">
            <p className="text-text-muted">Your contribution</p>
            <p className="font-mono font-semibold text-primary">{parseFloat(formatEther(contributed)).toFixed(4)} OPN</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-1 py-2 rounded-lg bg-surface-light border border-border text-sm font-medium hover:border-primary/50 transition-all"
          >
            {expanded ? 'Close' : 'Details'}
          </button>
          {isActive && (
            <button
              onClick={() => setExpanded(true)}
              className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-medium btn-glow"
            >
              Buy
            </button>
          )}
          {parsed.isFinalized && contributed > 0n && (
            <button
              onClick={handleClaim}
              disabled={isPending}
              className="flex-1 py-2 rounded-lg bg-accent text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {isPending && <Loader2 size={12} className="animate-spin" />} Claim
            </button>
          )}
          {parsed.isCancelled && contributed > 0n && (
            <button
              onClick={handleRefund}
              disabled={isPending}
              className="flex-1 py-2 rounded-lg bg-warning text-black text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {isPending && <Loader2 size={12} className="animate-spin" />} Refund
            </button>
          )}
        </div>
      </div>

      {expanded && isActive && (
        <div className="p-4 border-t border-border bg-surface-light/30">
          <div className="flex items-center gap-2 mb-3">
            <Gift size={12} className="text-accent" />
            <span className="text-xs text-text-muted">Buy tokens with OPN</span>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={buyAmount}
              onChange={e => setBuyAmount(e.target.value)}
              placeholder="0.0 OPN"
              className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 font-mono text-sm outline-none focus:border-primary"
            />
            <button
              onClick={handleBuy}
              disabled={isPending || !buyAmount || parseFloat(buyAmount) <= 0 || !isConnected}
              className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/80 disabled:opacity-50 flex items-center gap-1"
            >
              {isPending && <Loader2 size={12} className="animate-spin" />} Buy
            </button>
          </div>
          <div className="mt-2 text-xs text-text-muted">
            You will receive: <span className="text-accent font-mono">{estTokens}</span> {meta.symbol}
          </div>
          <div className="mt-1 text-xs text-text-muted">
            Min {parseFloat(formatEther(parsed.minPurchase)).toFixed(2)} / Max {parseFloat(formatEther(parsed.maxPurchase)).toFixed(2)} OPN
          </div>
        </div>
      )}
    </div>
  );
}
