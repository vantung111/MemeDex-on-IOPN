import { useReadContract } from 'wagmi';
import { isAddress } from 'viem';
import { CONTRACTS } from '@/lib/config';
import {
  useMasterChefRewardPerBlock,
  usePairReserves,
  usePairTokenA,
  usePairTotalSupply,
  useMemedexPriceInOPN,
} from './useContracts';

// OPN testnet targets ~2s block time.
const BLOCKS_PER_YEAR = (365 * 24 * 60 * 60) / 2;

const MASTERCHEF_MIN_ABI = [
  {
    name: 'totalAllocPoint',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getPoolInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_pid', type: 'uint256' }],
    outputs: [
      { name: 'lpToken', type: 'address' },
      { name: 'allocPoint', type: 'uint256' },
      { name: 'lastRewardBlock', type: 'uint256' },
      { name: 'accRewardPerShare', type: 'uint256' },
      { name: 'isNative', type: 'bool' },
      { name: 'lpBalance', type: 'uint256' },
    ],
  },
] as const;

export interface PoolStats {
  tvlOPN: number;        // total value locked, in OPN
  apy: number;           // annual percentage yield, %
  staked: bigint;        // raw staked amount (native OPN or LP units)
  isNative: boolean;
  isLoading: boolean;
}

/**
 * Computes TVL and APY for a MasterChef pool.
 *
 * Reward value is denominated in OPN via the MEMEDEX/WOPN pool price.
 * - Native pool: stakedValue = totalStaked (already OPN).
 * - LP pool (WOPN/MEMEDEX): stakedValue = LP share of (WOPN reserve + MEMEDEX reserve priced in OPN).
 */
export function usePoolStats(pid: number, isLpPool: boolean): PoolStats {
  const memedexPrice = useMemedexPriceInOPN(); // WOPN per MEMEDEX

  const { data: rewardPerBlock } = useMasterChefRewardPerBlock();
  const { data: totalAlloc } = useReadContract({
    address: CONTRACTS.MasterChef as `0x${string}`,
    abi: MASTERCHEF_MIN_ABI,
    functionName: 'totalAllocPoint',
  });
  const { data: poolInfo, isLoading: poolLoading } = useReadContract({
    address: CONTRACTS.MasterChef as `0x${string}`,
    abi: MASTERCHEF_MIN_ABI,
    functionName: 'getPoolInfo',
    args: [BigInt(pid)],
  });

  // LP valuation inputs (only meaningful for the WOPN/MEMEDEX LP pool).
  const lp = CONTRACTS.MEMEDEX_WOPN_LP;
  const { data: lpReserves } = usePairReserves(isLpPool && isAddress(lp) ? lp : '0x0');
  const { data: lpTokenA } = usePairTokenA(isLpPool && isAddress(lp) ? lp : '0x0');
  const { data: lpTotalSupply } = usePairTotalSupply(isLpPool && isAddress(lp) ? lp : '0x0');

  if (!poolInfo || !rewardPerBlock || !totalAlloc) {
    return { tvlOPN: 0, apy: 0, staked: 0n, isNative: !isLpPool, isLoading: true };
  }

  const [, allocPoint, , , isNative, staked] = poolInfo as [string, bigint, bigint, bigint, boolean, bigint];

  const stakedNum = Number(staked) / 1e18;

  // Value staked, in OPN.
  let stakedValueOPN = 0;
  if (!isLpPool) {
    // Native OPN staking.
    stakedValueOPN = stakedNum;
  } else if (lpReserves && lpTokenA && lpTotalSupply) {
    const [rA, rB] = lpReserves as [bigint, bigint];
    const wopnIsA = (lpTokenA as string).toLowerCase() === CONTRACTS.WOPN.toLowerCase();
    const wopnReserve = Number(wopnIsA ? rA : rB) / 1e18;
    const memedexReserve = Number(wopnIsA ? rB : rA) / 1e18;
    const totalLp = Number(lpTotalSupply as bigint) / 1e18;
    // Total pool value in OPN: WOPN side + MEMEDEX side priced in OPN.
    const poolValueOPN = wopnReserve + memedexReserve * memedexPrice;
    const lpShare = totalLp > 0 ? stakedNum / totalLp : 0;
    stakedValueOPN = poolValueOPN * lpShare;
  }

  // Annual rewards (in MEMEDEX), valued in OPN.
  const totalAllocNum = Number(totalAlloc as bigint);
  const allocNum = Number(allocPoint);
  const rpb = Number(rewardPerBlock as bigint) / 1e18;
  const poolShare = totalAllocNum > 0 ? allocNum / totalAllocNum : 0;
  const annualRewardMemedex = rpb * BLOCKS_PER_YEAR * poolShare;
  const annualRewardOPN = annualRewardMemedex * memedexPrice;

  const apy = stakedValueOPN > 0 ? (annualRewardOPN / stakedValueOPN) * 100 : 0;

  return {
    tvlOPN: stakedValueOPN,
    apy,
    staked,
    isNative,
    isLoading: poolLoading,
  };
}
