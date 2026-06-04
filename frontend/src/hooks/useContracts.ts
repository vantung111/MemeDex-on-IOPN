import { useReadContract, useWriteContract, useAccount, useBalance, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther, erc20Abi, isAddress } from 'viem';
import { CONTRACTS } from '@/lib/config';

// ============================================================
// ERC20 Token helpers
// ============================================================

export function useTokenBalance(address: string | undefined, tokenAddress: string) {
  return useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: { enabled: !!address && isAddress(tokenAddress) },
  });
}

export function useTokenAllowance(owner: string | undefined, spender: string, tokenAddress: string) {
  return useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [owner as `0x${string}`, spender as `0x${string}`],
    query: { enabled: !!owner && isAddress(tokenAddress) },
  });
}

export function useApproveToken() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  return {
    approve: (token: string, spender: string, amount: string) =>
      writeContract({
        address: token as `0x${string}`,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender as `0x${string}`, parseEther(amount)],
      }),
    hash,
    isPending,
    error,
  };
}

// ============================================================
// MEMEDEX Token
// ============================================================

const MEMEDEX_ABI = [
  ...erc20Abi,
  { name: 'INITIAL_SUPPLY', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint256' }] } as const,
];

export function useMEMEDEXTotalSupply() {
  return useReadContract({
    address: CONTRACTS.MEMEDEX as `0x${string}`,
    abi: MEMEDEX_ABI,
    functionName: 'totalSupply',
  });
}

export function useMEMEDEXBalance(address: string | undefined) {
  return useTokenBalance(address, CONTRACTS.MEMEDEX);
}

export function useMEMEDEXAllowance(owner: string | undefined, spender: string) {
  return useTokenAllowance(owner, spender, CONTRACTS.MEMEDEX);
}

// ============================================================
// MemeRouter — Swap
// ============================================================

const ROUTER_ABI = [
  {
    name: 'factory',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'getAmountOut',
    type: 'function',
    stateMutability: 'pure',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'reserveIn', type: 'uint256' },
      { name: 'reserveOut', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getAmountsOut',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'path', type: 'address[]' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
  {
    name: 'swapExactTokensForTokens',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
] as const;

export function useSwapQuote(amountIn: string, path: `0x${string}`[], slippageBps: number = 50) {
  return useReadContract({
    address: CONTRACTS.MemeRouter as `0x${string}`,
    abi: ROUTER_ABI,
    functionName: 'getAmountsOut',
    args: amountIn ? [parseEther(amountIn), path] : undefined,
    query: { enabled: !!amountIn && path.length >= 2 },
  });
}

export function useSwap() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  return {
    swapExactTokensForTokens: (amountIn: bigint, amountOutMin: bigint, path: `0x${string}`[], to: string) =>
      writeContract({
        address: CONTRACTS.MemeRouter as `0x${string}`,
        abi: ROUTER_ABI,
        functionName: 'swapExactTokensForTokens',
        args: [amountIn, amountOutMin, path, to as `0x${string}`],
      }),
    hash,
    isPending,
    error,
  };
}

// ============================================================
// MasterChef — Stake & Farm
// ============================================================

const MASTERCHEF_ABI = [
  {
    name: 'poolLength',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'poolInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      { name: 'lpToken', type: 'address' },
      { name: 'allocPoint', type: 'uint256' },
      { name: 'lastRewardBlock', type: 'uint256' },
      { name: 'accRewardPerShare', type: 'uint256' },
      { name: 'isNative', type: 'bool' },
      { name: 'totalStaked', type: 'uint256' },
    ],
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
  {
    name: 'userInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: '', type: 'uint256' },
      { name: '', type: 'address' },
    ],
    outputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'rewardDebt', type: 'uint256' },
      { name: 'lastClaimBlock', type: 'uint256' },
    ],
  },
  {
    name: 'pendingReward',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: '_pid', type: 'uint256' },
      { name: '_user', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_pid', type: 'uint256' },
      { name: '_amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'depositNative',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: '_pid', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_pid', type: 'uint256' },
      { name: '_amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'rewardToken',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'totalAllocPoint',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'rewardPerBlock',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'addPool',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_allocPoint', type: 'uint256' },
      { name: '_lpToken', type: 'address' },
      { name: '_isNative', type: 'bool' },
      { name: '_withUpdate', type: 'bool' },
    ],
    outputs: [],
  },
] as const;

export function usePoolLength() {
  return useReadContract({
    address: CONTRACTS.MasterChef as `0x${string}`,
    abi: MASTERCHEF_ABI,
    functionName: 'poolLength',
  });
}

export function usePoolInfo(pid: number) {
  return useReadContract({
    address: CONTRACTS.MasterChef as `0x${string}`,
    abi: MASTERCHEF_ABI,
    functionName: 'poolInfo',
    args: [BigInt(pid)],
  });
}

export function useUserInfo(pid: number, address: string | undefined) {
  return useReadContract({
    address: CONTRACTS.MasterChef as `0x${string}`,
    abi: MASTERCHEF_ABI,
    functionName: 'userInfo',
    args: [BigInt(pid), address as `0x${string}`],
    query: { enabled: !!address },
  });
}

export function usePendingReward(pid: number, address: string | undefined) {
  return useReadContract({
    address: CONTRACTS.MasterChef as `0x${string}`,
    abi: MASTERCHEF_ABI,
    functionName: 'pendingReward',
    args: [BigInt(pid), address as `0x${string}`],
    query: { enabled: !!address },
  });
}

export function useMasterChefRewardPerBlock() {
  return useReadContract({
    address: CONTRACTS.MasterChef as `0x${string}`,
    abi: MASTERCHEF_ABI,
    functionName: 'rewardPerBlock',
  });
}

export function useStakeFarm() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  return {
    deposit: (pid: number, amount: string) =>
      writeContract({
        address: CONTRACTS.MasterChef as `0x${string}`,
        abi: MASTERCHEF_ABI,
        functionName: 'deposit',
        args: [BigInt(pid), parseEther(amount)],
      }),
    depositNative: (pid: number, amount: string) =>
      writeContract({
        address: CONTRACTS.MasterChef as `0x${string}`,
        abi: MASTERCHEF_ABI,
        functionName: 'depositNative',
        args: [BigInt(pid)],
        value: parseEther(amount),
      }),
    withdraw: (pid: number, amount: string) =>
      writeContract({
        address: CONTRACTS.MasterChef as `0x${string}`,
        abi: MASTERCHEF_ABI,
        functionName: 'withdraw',
        args: [BigInt(pid), parseEther(amount)],
      }),
    // Harvest by withdrawing 0 — this still pays out pending rewards and works
    // for both native and ERC20 pools.
    harvest: (pid: number) =>
      writeContract({
        address: CONTRACTS.MasterChef as `0x${string}`,
        abi: MASTERCHEF_ABI,
        functionName: 'withdraw',
        args: [BigInt(pid), 0n],
      }),
    hash,
    isPending,
    error,
  };
}

// ============================================================
// ReferralSystem
// ============================================================

const REFERRAL_ABI = [
  {
    name: 'generateCode',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'getCodeString',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'getReferralInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [
      { name: 'totalReferrals', type: 'uint256' },
      { name: 'lifetimeEarnings', type: 'uint256' },
      { name: 'pendingEarnings', type: 'uint256' },
      { name: 'code', type: 'string' },
    ],
  },
  {
    name: 'registerReferral',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'code', type: 'string' }],
    outputs: [],
  },
  {
    name: 'claimEarnings',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'referralEarnings',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export function useReferralInfo(address: string | undefined) {
  return useReadContract({
    address: CONTRACTS.ReferralSystem as `0x${string}`,
    abi: REFERRAL_ABI,
    functionName: 'getReferralInfo',
    args: [address as `0x${string}`],
    query: { enabled: !!address },
  });
}

export function useMyReferralCode(address: string | undefined) {
  return useReadContract({
    address: CONTRACTS.ReferralSystem as `0x${string}`,
    abi: REFERRAL_ABI,
    functionName: 'getCodeString',
    args: [address as `0x${string}`],
    query: { enabled: !!address },
  });
}

export function useReferralEarnings(address: string | undefined) {
  return useReadContract({
    address: CONTRACTS.ReferralSystem as `0x${string}`,
    abi: REFERRAL_ABI,
    functionName: 'referralEarnings',
    args: [address as `0x${string}`],
    query: { enabled: !!address },
  });
}

export function useReferral() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  return {
    generateCode: () =>
      writeContract({
        address: CONTRACTS.ReferralSystem as `0x${string}`,
        abi: REFERRAL_ABI,
        functionName: 'generateCode',
        args: [],
      }),
    registerReferral: (code: string) =>
      writeContract({
        address: CONTRACTS.ReferralSystem as `0x${string}`,
        abi: REFERRAL_ABI,
        functionName: 'registerReferral',
        args: [code],
      }),
    claimEarnings: () =>
      writeContract({
        address: CONTRACTS.ReferralSystem as `0x${string}`,
        abi: REFERRAL_ABI,
        functionName: 'claimEarnings',
        args: [],
      }),
    hash,
    isPending,
    error,
  };
}

// ============================================================
// TradingRewards — Airdrop
// ============================================================

const TRADING_REWARDS_ABI = [
  {
    name: 'getSnapshotLeaderboard',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'snapshotId', type: 'uint256' }],
    outputs: [
      { name: 'traders', type: 'address[]' },
      { name: 'volumes', type: 'uint256[]' },
    ],
  },
  {
    name: 'getClaimableReward',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'snapshotId', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'claimRewards',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'snapshotId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'snapshotCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'hasClaimed',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'snapshotId', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'getUserVolume',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'snapshotId', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export function useSnapshotCount() {
  return useReadContract({
    address: CONTRACTS.TradingRewards as `0x${string}`,
    abi: TRADING_REWARDS_ABI,
    functionName: 'snapshotCount',
  });
}

export function useClaimableReward(address: string | undefined, snapshotId: number) {
  return useReadContract({
    address: CONTRACTS.TradingRewards as `0x${string}`,
    abi: TRADING_REWARDS_ABI,
    functionName: 'getClaimableReward',
    args: [address as `0x${string}`, BigInt(snapshotId)],
    query: { enabled: !!address },
  });
}

export function useTradingRewardsClaim() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  return {
    claimRewards: (snapshotId: number) =>
      writeContract({
        address: CONTRACTS.TradingRewards as `0x${string}`,
        abi: TRADING_REWARDS_ABI,
        functionName: 'claimRewards',
        args: [BigInt(snapshotId)],
      }),
    hash,
    isPending,
    error,
  };
}

// ============================================================
// MemeFactory
// ============================================================

const FACTORY_ABI = [
  {
    name: 'getPair',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: '', type: 'address' },
      { name: '', type: 'address' },
    ],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'allPairs',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'pairLength',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export function usePairLength() {
  return useReadContract({
    address: CONTRACTS.MemeFactory as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: 'pairLength',
  });
}

export function usePair(tokenA: string, tokenB: string) {
  return useReadContract({
    address: CONTRACTS.MemeFactory as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: 'getPair',
    args: [tokenA as `0x${string}`, tokenB as `0x${string}`],
    query: { enabled: isAddress(tokenA) && isAddress(tokenB) },
  });
}

export function useAllPairs(index: number) {
  return useReadContract({
    address: CONTRACTS.MemeFactory as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: 'allPairs',
    args: [BigInt(index)],
  });
}

// ============================================================
// MemePair — reserves & pricing
// ============================================================

const PAIR_ABI = [
  {
    name: 'getReserves',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'reserveA', type: 'uint256' },
      { name: 'reserveB', type: 'uint256' },
    ],
  },
  {
    name: 'tokenA',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'tokenB',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export function usePairReserves(pairAddress: string) {
  return useReadContract({
    address: pairAddress as `0x${string}`,
    abi: PAIR_ABI,
    functionName: 'getReserves',
    query: { enabled: isAddress(pairAddress) },
  });
}

export function usePairTokenA(pairAddress: string) {
  return useReadContract({
    address: pairAddress as `0x${string}`,
    abi: PAIR_ABI,
    functionName: 'tokenA',
    query: { enabled: isAddress(pairAddress) },
  });
}

export function usePairTotalSupply(pairAddress: string) {
  return useReadContract({
    address: pairAddress as `0x${string}`,
    abi: PAIR_ABI,
    functionName: 'totalSupply',
    query: { enabled: isAddress(pairAddress) },
  });
}

/// Returns the price of MEMEDEX in OPN (WOPN), derived from the LP reserves.
/// e.g. 0.00001 means 1 MEMEDEX = 0.00001 OPN.
export function useMemedexPriceInOPN(): number {
  const { data: reserves } = usePairReserves(CONTRACTS.MEMEDEX_WOPN_LP);
  const { data: tokenA } = usePairTokenA(CONTRACTS.MEMEDEX_WOPN_LP);
  if (!reserves || !tokenA) return 0;
  const [rA, rB] = reserves as [bigint, bigint];
  const wopnIsA = (tokenA as string).toLowerCase() === CONTRACTS.WOPN.toLowerCase();
  const wopnReserve = wopnIsA ? rA : rB;
  const memedexReserve = wopnIsA ? rB : rA;
  if (memedexReserve === 0n) return 0;
  // price = WOPN per MEMEDEX
  return Number(wopnReserve) / Number(memedexReserve);
}

// ============================================================
// WOPN Wrapper
// ============================================================

const WOPN_ABI = [
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'payable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'wad', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '', type: 'address' },
      { name: '', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

export function useWOPNBalance(address: string | undefined) {
  return useReadContract({
    address: CONTRACTS.WOPN as `0x${string}`,
    abi: WOPN_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: { enabled: !!address && isAddress(CONTRACTS.WOPN) },
  });
}

export function useWrapOPN() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  return {
    wrap: (amountWei: bigint) =>
      writeContract({
        address: CONTRACTS.WOPN as `0x${string}`,
        abi: WOPN_ABI,
        functionName: 'deposit',
        args: [],
        value: amountWei,
      }),
    hash,
    isPending,
    error,
  };
}

// ============================================================
// Utility
// ============================================================

export function useNativeBalance(address: string | undefined) {
  return useBalance({
    address: address as `0x${string}`,
    query: { enabled: !!address },
  });
}

// ============================================================
// MemeLaunchpad
// ============================================================

const LAUNCHPAD_ABI = [
  {
    name: 'CREATION_FEE',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getLaunchCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'createLaunch',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: '_name', type: 'string' },
      { name: '_symbol', type: 'string' },
      { name: '_imageURI', type: 'string' },
      { name: '_description', type: 'string' },
      { name: '_initialLiquidity', type: 'uint256' },
      { name: '_presaleRate', type: 'uint256' },
      { name: '_presaleHardCap', type: 'uint256' },
      { name: '_presaleSoftCap', type: 'uint256' },
      { name: '_presaleDuration', type: 'uint256' },
      { name: '_presaleMinPurchase', type: 'uint256' },
      { name: '_presaleMaxPurchase', type: 'uint256' },
      { name: '_listingRate', type: 'uint256' },
    ],
    outputs: [{ name: 'launchId', type: 'uint256' }],
  },
] as const;

const CREATION_FEE_WEI = parseEther('2');

export function useLaunchCount() {
  return useReadContract({
    address: CONTRACTS.MemeLaunchpad as `0x${string}`,
    abi: LAUNCHPAD_ABI,
    functionName: 'getLaunchCount',
    query: { enabled: isAddress(CONTRACTS.MemeLaunchpad) },
  });
}

export interface CreateLaunchParams {
  name: string;
  symbol: string;
  imageURI: string;
  description: string;
  initialLiquidity: string;   // in OPN
  presaleRate: string;        // tokens per OPN
  presaleHardCap: string;     // in OPN
  presaleSoftCap: string;     // in OPN
  presaleDurationDays: string;
  presaleMinPurchase: string; // in OPN
  presaleMaxPurchase: string; // in OPN
  listingRate: string;        // tokens per OPN
}

export function useLaunchpad() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  return {
    createLaunch: (p: CreateLaunchParams) =>
      writeContract({
        address: CONTRACTS.MemeLaunchpad as `0x${string}`,
        abi: LAUNCHPAD_ABI,
        functionName: 'createLaunch',
        args: [
          p.name,
          p.symbol,
          p.imageURI,
          p.description,
          parseEther(p.initialLiquidity || '0'),
          BigInt(Math.floor(parseFloat(p.presaleRate || '0'))),
          parseEther(p.presaleHardCap || '0'),
          parseEther(p.presaleSoftCap || '0'),
          BigInt(Math.floor(parseFloat(p.presaleDurationDays || '0') * 86400)),
          parseEther(p.presaleMinPurchase || '0'),
          parseEther(p.presaleMaxPurchase || '0'),
          BigInt(Math.floor(parseFloat(p.listingRate || '0'))),
        ],
        value: CREATION_FEE_WEI,
      }),
    hash,
    isPending,
    error,
  };
}

// ============================================================
// PresaleFactory & Presale
// ============================================================

const PRESALE_FACTORY_ABI = [
  {
    name: 'presaleCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getPresales',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'start', type: 'uint256' },
      { name: 'count', type: 'uint256' },
    ],
    outputs: [
      {
        name: 'page',
        type: 'tuple[]',
        components: [
          { name: 'presale', type: 'address' },
          { name: 'token', type: 'address' },
          { name: 'creator', type: 'address' },
          { name: 'name', type: 'string' },
          { name: 'symbol', type: 'string' },
          { name: 'imageURI', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'createdAt', type: 'uint256' },
        ],
      },
    ],
  },
] as const;

const PRESALE_ABI = [
  {
    name: 'getFullInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'token', type: 'address' },
      { name: 'creator', type: 'address' },
      { name: 'rate', type: 'uint256' },
      { name: 'hardCap', type: 'uint256' },
      { name: 'softCap', type: 'uint256' },
      { name: 'minPurchase', type: 'uint256' },
      { name: 'maxPurchase', type: 'uint256' },
      { name: 'startTime', type: 'uint256' },
      { name: 'endTime', type: 'uint256' },
      { name: 'totalRaised', type: 'uint256' },
      { name: 'isFinalized', type: 'bool' },
      { name: 'isCancelled', type: 'bool' },
    ],
  },
  {
    name: 'getUserPosition',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'contributed', type: 'uint256' },
      { name: 'tokensBought', type: 'uint256' },
      { name: 'tokensClaimed', type: 'uint256' },
    ],
  },
  {
    name: 'buyTokens',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'referrer', type: 'address' }],
    outputs: [],
  },
  {
    name: 'claimTokens',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'refund',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
] as const;

export interface PresaleMeta {
  presale: `0x${string}`;
  token: `0x${string}`;
  creator: `0x${string}`;
  name: string;
  symbol: string;
  imageURI: string;
  description: string;
  createdAt: bigint;
}

export function usePresaleCount() {
  return useReadContract({
    address: CONTRACTS.PresaleFactory as `0x${string}`,
    abi: PRESALE_FACTORY_ABI,
    functionName: 'presaleCount',
    query: { enabled: isAddress(CONTRACTS.PresaleFactory) },
  });
}

export function usePresaleList(start: number = 0, count: number = 50) {
  return useReadContract({
    address: CONTRACTS.PresaleFactory as `0x${string}`,
    abi: PRESALE_FACTORY_ABI,
    functionName: 'getPresales',
    args: [BigInt(start), BigInt(count)],
    query: { enabled: isAddress(CONTRACTS.PresaleFactory) },
  });
}

export function usePresaleInfo(presaleAddress: string | undefined) {
  return useReadContract({
    address: presaleAddress as `0x${string}`,
    abi: PRESALE_ABI,
    functionName: 'getFullInfo',
    query: { enabled: !!presaleAddress && isAddress(presaleAddress) },
  });
}

export function usePresaleUserPosition(presaleAddress: string | undefined, user: string | undefined) {
  return useReadContract({
    address: presaleAddress as `0x${string}`,
    abi: PRESALE_ABI,
    functionName: 'getUserPosition',
    args: [user as `0x${string}`],
    query: { enabled: !!presaleAddress && !!user && isAddress(presaleAddress) },
  });
}

export function usePresaleActions() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  return {
    buyTokens: (presaleAddress: string, opnAmount: string, referrer?: string) =>
      writeContract({
        address: presaleAddress as `0x${string}`,
        abi: PRESALE_ABI,
        functionName: 'buyTokens',
        args: [(referrer ?? '0x0000000000000000000000000000000000000000') as `0x${string}`],
        value: parseEther(opnAmount),
      }),
    claimTokens: (presaleAddress: string) =>
      writeContract({
        address: presaleAddress as `0x${string}`,
        abi: PRESALE_ABI,
        functionName: 'claimTokens',
        args: [],
      }),
    refund: (presaleAddress: string) =>
      writeContract({
        address: presaleAddress as `0x${string}`,
        abi: PRESALE_ABI,
        functionName: 'refund',
        args: [],
      }),
    hash,
    isPending,
    error,
  };
}

export { parseEther, formatEther };