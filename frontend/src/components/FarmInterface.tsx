'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Coins, Lock, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import {
  usePoolLength,
  usePoolInfo,
  useUserInfo,
  usePendingReward,
  useStakeFarm,
  useTokenBalance,
  formatEther,
} from '@/hooks/useContracts';
import { usePoolStats } from '@/hooks/usePoolStats';

export default function FarmInterface() {
  const { address, isConnected } = useAccount();
  const [activePool, setActivePool] = useState<number | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const { deposit, depositNative, withdraw, harvest, isPending } = useStakeFarm();

  const { data: poolLength } = usePoolLength();
  const numPools = Number(poolLength ?? 0);

  const pools = Array.from({ length: Math.min(numPools, 10) }, (_, i) => i);

  // Aggregate stats for the header (the deployment has pool 0 native + pool 1 LP).
  const stats0 = usePoolStats(0, false);
  const stats1 = usePoolStats(1, true);
  const totalTvl = stats0.tvlOPN + stats1.tvlOPN;
  const bestApy = Math.max(stats0.apy, stats1.apy);

  const handleStake = async (pid: number, isNative: boolean) => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0 || !address) return;
    try {
      if (isNative) {
        depositNative(pid, stakeAmount);
      } else {
        deposit(pid, stakeAmount);
      }
      toast.success('Stake submitted!');
      setStakeAmount('');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Stake failed');
    }
  };

  const handleHarvest = async (pid: number) => {
    try {
      harvest(pid);
      toast.success('Harvest submitted!');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Harvest failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Active Farms', value: `${numPools} Pools`, icon: Coins },
          { label: 'Total Value Locked', value: totalTvl > 0 ? `${totalTvl.toFixed(2)} OPN` : '--', icon: Lock },
          { label: 'Reward / Block', value: '10 MEMEDEX', icon: Coins },
          { label: 'Best APY', value: bestApy > 0 ? `${bestApy.toFixed(1)}%` : '--', icon: Coins },
        ].map((stat, i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-4">
            <stat.icon size={14} className="text-primary mb-2" />
            <p className="text-xs text-text-muted mb-1">{stat.label}</p>
            <p className="font-bold font-mono text-sm">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Farming Pools</h2>

        {numPools === 0 && (
          <div className="bg-surface border border-border rounded-2xl p-8 text-center">
            <Coins size={40} className="mx-auto mb-3 text-text-muted opacity-30" />
            <p className="text-text-secondary mb-2">No farms available yet.</p>
            <p className="text-xs text-text-muted">Farm pools will appear here after LP pairs are created.</p>
          </div>
        )}

        {pools.map(pid => (
          <FarmPoolCard
            key={pid}
            pid={pid}
            address={address}
            isConnected={isConnected}
            activePool={activePool}
            setActivePool={setActivePool}
            stakeAmount={stakeAmount}
            setStakeAmount={setStakeAmount}
            onStake={handleStake}
            onHarvest={handleHarvest}
            isPending={isPending}
          />
        ))}
      </div>
    </div>
  );
}

function FarmPoolCard({
  pid,
  address,
  isConnected,
  activePool,
  setActivePool,
  stakeAmount,
  setStakeAmount,
  onStake,
  onHarvest,
  isPending,
}: {
  pid: number;
  address: string | undefined;
  isConnected: boolean;
  activePool: number | null;
  setActivePool: (id: number | null) => void;
  stakeAmount: string;
  setStakeAmount: (v: string) => void;
  onStake: (pid: number, isNative: boolean) => void;
  onHarvest: (pid: number) => void;
  isPending: boolean;
}) {
  const { data: poolInfo } = usePoolInfo(pid);
  const { data: pendingData } = usePendingReward(pid, address);
  const { data: userInfo } = useUserInfo(pid, address);

  const [lpToken, allocPoint, , , isNative] = (poolInfo as [string, bigint, bigint, bigint, boolean, bigint] | undefined) ?? [undefined, 0n, 0n, 0n, false, 0n];
  const pending = (pendingData as bigint | undefined) ?? 0n;
  const stakedAmount = userInfo ? (userInfo as [bigint, bigint, bigint])[0] : 0n;
  const stats = usePoolStats(pid, !isNative);

  const colors = [
    'from-primary to-accent',
    'from-accent to-warning',
    'from-warning to-danger',
    'from-danger to-moon-purple',
    'from-moon-purple to-wojak-pink',
  ];

  const color = colors[pid % colors.length];
  const apyLabel = stats.isLoading ? '...' : stats.apy > 0 ? `${stats.apy.toFixed(1)}%` : '--';

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden card-hover">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={clsx('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm', color)}>
              {isNative ? 'OPN' : `LP${pid}`}
            </div>
            <div>
              <h3 className="font-semibold">{isNative ? 'OPN Staking' : `LP Pool #${pid}`}</h3>
              <p className="text-xs text-text-muted">
                {lpToken && !isNative ? `${lpToken.slice(0, 8)}...` : 'Native OPN'} &middot; {Number(allocPoint)} pts
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-accent">{apyLabel} APY</p>
            <p className="text-xs text-text-muted">
              TVL {stats.tvlOPN > 0 ? `${stats.tvlOPN.toFixed(2)} OPN` : '--'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 gap-3 border-b border-border text-xs">
        <div className="bg-surface-light rounded-lg p-2">
          <p className="text-text-muted">Your Stake</p>
          <p className="font-mono font-semibold">{parseFloat(formatEther(stakedAmount)).toFixed(4)}</p>
        </div>
        <div className="bg-surface-light rounded-lg p-2">
          <p className="text-text-muted">Pending</p>
          <p className="font-mono font-semibold text-accent">{parseFloat(formatEther(pending)).toFixed(2)} MEMEDEX</p>
        </div>
      </div>

      <div className="p-4 flex items-end justify-end gap-2 border-b border-border">
        {pending > 0n && (
          <button
            onClick={() => onHarvest(pid)}
            disabled={isPending}
            className="px-4 py-2 rounded-lg bg-accent/20 text-accent text-sm font-medium hover:bg-accent/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            {isPending && <Loader2 size={12} className="animate-spin" />}
            Harvest
          </button>
        )}
        <button
          onClick={() => setActivePool(activePool === pid ? null : pid)}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium btn-glow"
        >
          {activePool === pid ? 'Close' : 'Stake LP'}
        </button>
      </div>

      {activePool === pid && (
        <div className="p-4 bg-surface-light/30">
          <div className="flex items-center gap-2 mb-3">
            <Coins size={12} className="text-accent" />
            <span className="text-xs text-text-muted">Stake LP tokens to earn MEMEDEX rewards</span>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={stakeAmount}
              onChange={e => setStakeAmount(e.target.value)}
              placeholder="0.0 LP"
              className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 font-mono text-sm outline-none focus:border-primary transition-all"
            />
            <button
              onClick={() => onStake(pid, isNative)}
              disabled={isPending || !stakeAmount || parseFloat(stakeAmount) <= 0 || !isConnected}
              className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {isPending ? <Loader2 size={12} className="animate-spin" /> : null}
              Stake
            </button>
          </div>
          {!isConnected && (
            <p className="text-xs text-danger mt-2">Connect wallet to stake</p>
          )}
        </div>
      )}
    </div>
  );
}
