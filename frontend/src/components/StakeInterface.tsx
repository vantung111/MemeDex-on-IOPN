'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { TrendingUp, Lock, Award, ArrowDownRight, ArrowUpRight, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import {
  useMEMEDEXBalance,
  usePendingReward,
  useUserInfo,
  useStakeFarm,
  useNativeBalance,
  useTokenBalance,
  formatEther,
} from '@/hooks/useContracts';
import { usePoolStats } from '@/hooks/usePoolStats';
import { CONTRACTS } from '@/lib/config';

interface PoolConfig {
  id: number;
  name: string;
  symbol: string;
  color: string;
  isLp: boolean;
  // token used to fund stakes: 'native' for OPN, otherwise an ERC20 address
  stakeToken: 'native' | string;
}

const POOLS: PoolConfig[] = [
  { id: 0, name: 'OPN Staking', symbol: 'OPN', color: 'from-primary to-accent', isLp: false, stakeToken: 'native' },
  { id: 1, name: 'WOPN/MEMEDEX LP Farm', symbol: 'LP', color: 'from-accent to-warning', isLp: true, stakeToken: CONTRACTS.MEMEDEX_WOPN_LP },
];

export default function StakeInterface() {
  const { address } = useAccount();
  const { data: memedexBalance } = useMEMEDEXBalance(address);
  const { data: nativeBalance } = useNativeBalance(address);

  // Pool TVLs for the header (in OPN).
  const stats0 = usePoolStats(0, false);
  const stats1 = usePoolStats(1, true);
  const totalTvl = stats0.tvlOPN + stats1.tvlOPN;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Value Locked', value: totalTvl > 0 ? `${totalTvl.toFixed(2)} OPN` : '0 OPN', icon: Lock, color: 'text-primary' },
          { label: 'OPN Balance', value: nativeBalance ? `${parseFloat(formatEther(nativeBalance.value)).toFixed(4)} OPN` : '0 OPN', icon: Award, color: 'text-accent' },
          { label: 'MEMEDEX Balance', value: memedexBalance ? `${parseFloat(formatEther(memedexBalance)).toFixed(0)} MEMEDEX` : '0 MEMEDEX', icon: TrendingUp, color: 'text-warning' },
          { label: 'Pools', value: String(POOLS.length), icon: Award, color: 'text-accent' },
        ].map((stat, i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-4">
            <stat.icon size={14} className={clsx(stat.color, 'mb-2')} />
            <p className="text-xs text-text-muted mb-1">{stat.label}</p>
            <p className={clsx('font-bold font-mono text-sm', stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Staking Pools</h2>
        {POOLS.map(pool => (
          <StakePoolCard key={pool.id} pool={pool} address={address} />
        ))}
      </div>
    </div>
  );
}

function StakePoolCard({ pool, address }: { pool: PoolConfig; address: string | undefined }) {
  const { isConnected } = useAccount();
  const [open, setOpen] = useState(false);
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');

  const { deposit, depositNative, withdraw, harvest, isPending } = useStakeFarm();
  const { data: pending } = usePendingReward(pool.id, address);
  const { data: userInfo } = useUserInfo(pool.id, address);
  const stats = usePoolStats(pool.id, pool.isLp);

  const { data: nativeBalance } = useNativeBalance(address);
  const { data: lpBalance } = useTokenBalance(
    address,
    pool.stakeToken === 'native' ? '0x0' : pool.stakeToken
  );

  const pendingAmt = (pending as bigint | undefined) ?? 0n;
  const stakedAmt = userInfo ? (userInfo as [bigint, bigint, bigint])[0] : 0n;
  const walletBal = pool.stakeToken === 'native' ? (nativeBalance?.value ?? 0n) : ((lpBalance as bigint | undefined) ?? 0n);

  const handleStake = () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0 || !address) return;
    try {
      if (pool.stakeToken === 'native') {
        depositNative(pool.id, stakeAmount);
      } else {
        deposit(pool.id, stakeAmount);
      }
      toast.success('Stake submitted!');
      setStakeAmount('');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Stake failed');
    }
  };

  const handleUnstake = () => {
    if (!unstakeAmount || parseFloat(unstakeAmount) <= 0) return;
    try {
      withdraw(pool.id, unstakeAmount);
      toast.success('Unstake submitted!');
      setUnstakeAmount('');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Unstake failed');
    }
  };

  const handleHarvest = () => {
    try {
      harvest(pool.id);
      toast.success('Harvest submitted!');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Harvest failed');
    }
  };

  const apyLabel = stats.isLoading ? '...' : stats.apy > 0 ? `${stats.apy.toFixed(1)}%` : '--';

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden card-hover">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={clsx('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm', pool.color)}>
              {pool.symbol.slice(0, 2)}
            </div>
            <div>
              <h3 className="font-semibold">{pool.name}</h3>
              <p className="text-xs text-text-muted">
                Earn <span className="text-accent">MEMEDEX</span>
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
          <p className="font-mono font-semibold">{parseFloat(formatEther(stakedAmt)).toFixed(4)} {pool.symbol}</p>
        </div>
        <div className="bg-surface-light rounded-lg p-2">
          <p className="text-text-muted">Pending</p>
          <p className="font-mono font-semibold text-accent">{parseFloat(formatEther(pendingAmt)).toFixed(2)} MEMEDEX</p>
        </div>
      </div>

      <div className="p-4 flex items-end justify-end gap-2 border-b border-border">
        <button
          onClick={handleHarvest}
          disabled={pendingAmt === 0n || isPending}
          className="px-4 py-2 rounded-lg bg-accent/20 text-accent text-sm font-medium hover:bg-accent/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          {isPending && <Loader2 size={12} className="animate-spin" />}
          Harvest
        </button>
        <button
          onClick={() => setOpen(!open)}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium btn-glow"
        >
          {open ? 'Close' : 'Stake / Unstake'}
        </button>
      </div>

      {open && (
        <div className="p-4 bg-surface-light/30">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <ArrowDownRight size={12} className="text-accent" /> Stake
                </span>
                <button
                  onClick={() => setStakeAmount(formatEther(walletBal))}
                  className="text-xs text-primary hover:underline"
                >
                  Max
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={e => setStakeAmount(e.target.value)}
                  placeholder="0.0"
                  className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 font-mono text-sm outline-none focus:border-primary transition-all"
                />
                <button
                  onClick={handleStake}
                  disabled={isPending || !stakeAmount || parseFloat(stakeAmount) <= 0 || !isConnected}
                  className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {isPending ? <Loader2 size={12} className="animate-spin" /> : null}
                  Stake
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <ArrowUpRight size={12} className="text-danger" /> Unstake
                </span>
                <button
                  onClick={() => setUnstakeAmount(formatEther(stakedAmt))}
                  className="text-xs text-primary hover:underline"
                >
                  Max
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={unstakeAmount}
                  onChange={e => setUnstakeAmount(e.target.value)}
                  placeholder="0.0"
                  className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 font-mono text-sm outline-none focus:border-primary transition-all"
                />
                <button
                  onClick={handleUnstake}
                  disabled={isPending || parseFloat(unstakeAmount) <= 0 || !isConnected}
                  className="px-4 py-2 rounded-lg bg-danger/20 text-danger text-sm font-medium hover:bg-danger/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {isPending ? <Loader2 size={12} className="animate-spin" /> : null}
                  Unstake
                </button>
              </div>
            </div>
          </div>
          {pool.isLp && (
            <p className="text-xs text-text-muted mt-3">
              You need WOPN/MEMEDEX LP tokens to farm here. Add liquidity to the pair to receive LP.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
