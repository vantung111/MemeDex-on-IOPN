'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { ArrowLeftRight, Settings, ChevronDown, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import {
  useSwapQuote,
  useSwap,
  useTokenBalance,
  useTokenAllowance,
  useApproveToken,
  useNativeBalance,
  useWOPNBalance,
  useWrapOPN,
  parseEther,
  formatEther,
} from '@/hooks/useContracts';
import { useAppStore } from '@/store/useAppStore';
import { CONTRACTS } from '@/lib/config';

const NATIVE = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

const TOKENS = [
  { symbol: 'OPN', name: 'OPN', address: NATIVE, decimals: 18, logo: 'O', color: 'bg-primary/20' },
  { symbol: 'WOPN', name: 'Wrapped OPN', address: CONTRACTS.WOPN, decimals: 18, logo: 'W', color: 'bg-blue-500/20' },
  { symbol: 'MEMEDEX', name: 'MemeDex Token', address: CONTRACTS.MEMEDEX, decimals: 18, logo: 'M', color: 'bg-accent/20' },
];

const SLIPPAGE_PRESETS = [0.1, 0.5, 1.0];

export default function SwapInterface() {
  const { address, isConnected } = useAccount();
  const {
    swapFromToken, swapToToken,
    swapFromAmount, swapToAmount,
    slippage, setSlippage,
    setSwapFromToken, setSwapToToken,
    setSwapFromAmount, setSwapToAmount,
    switchTokens,
  } = useAppStore();

  const [fromTokenSelectOpen, setFromTokenSelectOpen] = useState(false);
  const [toTokenSelectOpen, setToTokenSelectOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const fromToken = TOKENS.find(t => t.symbol === swapFromToken) || TOKENS[0];
  const toToken = TOKENS.find(t => t.symbol === swapToToken) || TOKENS[1];

  const { data: wopnBal } = useWOPNBalance(address);

  // Build swap path: if swapping OPN, must wrap first → use WOPN path
  const path = useMemo((): `0x${string}`[] => {
    if (fromToken.address === NATIVE && toToken.address !== NATIVE) {
      return [CONTRACTS.WOPN as `0x${string}`, toToken.address as `0x${string}`];
    }
    if (fromToken.address !== NATIVE && toToken.address === NATIVE) {
      return [fromToken.address as `0x${string}`, CONTRACTS.WOPN as `0x${string}`];
    }
    return [fromToken.address as `0x${string}`, toToken.address as `0x${string}`];
  }, [fromToken.address, toToken.address]);

  const { data: quote, isLoading: isLoadingQuote } = useSwapQuote(
    fromToken.address === NATIVE ? '' : swapFromAmount,
    path
  );

  const amounts = (quote as bigint[] | undefined);
  const expectedOut = amounts && amounts.length >= 2 ? amounts[amounts.length - 1] : 0n;
  const minOut = expectedOut > 0n
    ? (expectedOut * BigInt(Math.floor((100 - slippage) * 100))) / 10000n
    : 0n;

  const { data: fromBalance } = useTokenBalance(
    address,
    fromToken.address === NATIVE ? '0x0' : fromToken.address
  );
  const { data: nativeBalance } = useNativeBalance(address);
  const balance = fromToken.address === NATIVE
    ? nativeBalance?.value ?? 0n
    : (fromBalance ?? 0n);

  const { data: toBalance } = useTokenBalance(
    address,
    toToken.address === NATIVE ? '0x0' : toToken.address
  );

  // Allowance of the input (ERC20) token for the router.
  const { data: allowance } = useTokenAllowance(
    address,
    CONTRACTS.MemeRouter,
    fromToken.address === NATIVE ? '0x0' : fromToken.address
  );

  const { approve, isPending: isApproving } = useApproveToken();
  const { swapExactTokensForTokens, isPending: isSwapping } = useSwap();
  const { wrap, isPending: isWrapping } = useWrapOPN();

  const amountInWei = swapFromAmount && parseFloat(swapFromAmount) > 0 ? parseEther(swapFromAmount) : 0n;
  // Native OPN must be wrapped to WOPN first (the AMM trades WOPN, not native).
  const needsWrap = fromToken.address === NATIVE;
  const needsApproval = !needsWrap && (allowance ?? 0n) < amountInWei;
  const isProcessing = isApproving || isSwapping || isWrapping;

  // Wrap OPN -> WOPN.
  const handleWrap = async () => {
    if (amountInWei <= 0n || !address) { toast.error('Enter an amount'); return; }
    try {
      wrap(amountInWei);
      toast.success('Wrapping OPN to WOPN. After it confirms, switch From to WOPN to swap.');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Wrap failed');
    }
  };

  // Approve the router to spend the input token.
  const handleApprove = async () => {
    if (!address) { toast.error('Please connect your wallet'); return; }
    try {
      approve(fromToken.address, CONTRACTS.MemeRouter, swapFromAmount || '0');
      toast.success('Approval submitted. Confirm, then press Swap.');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Approve failed');
    }
  };

  const handleSwap = async () => {
    if (amountInWei <= 0n) return;
    if (!address) { toast.error('Please connect your wallet'); return; }
    try {
      swapExactTokensForTokens(amountInWei, minOut, path, address);
      toast.success('Swap submitted!');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Swap failed');
    }
  };

  useEffect(() => {
    if (amounts && amounts.length >= 2) {
      setSwapToAmount(formatEther(amounts[amounts.length - 1]));
    } else {
      setSwapToAmount('');
    }
  }, [amounts, setSwapToAmount]);

  const priceImpact = swapFromAmount ? (parseFloat(swapFromAmount) * 0.003).toFixed(2) : '0.00';
  const exchangeRate = amounts && amounts.length >= 2
    ? `1 ${fromToken.symbol} ≈ ${(Number(formatEther(amounts[1])) / Math.max(Number(formatEther(amounts[0])), 0.0001)).toFixed(2)} ${toToken.symbol}`
    : '1 WOPN = -- MEMEDEX';

  const wrapMode = fromToken.address === NATIVE;

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold">Swap</h2>
          <button onClick={() => setSettingsOpen(!settingsOpen)} className="p-2 rounded-lg hover:bg-surface-light transition-all">
            <Settings size={18} className="text-text-secondary" />
          </button>
        </div>

        {settingsOpen && (
          <div className="px-4 py-3 border-b border-border bg-surface-light/50">
            <p className="text-xs text-text-muted mb-2">Slippage Tolerance</p>
            <div className="flex items-center gap-2">
              {SLIPPAGE_PRESETS.map(preset => (
                <button
                  key={preset}
                  onClick={() => setSlippage(preset)}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                    slippage === preset ? 'bg-primary text-white' : 'bg-surface-light text-text-secondary hover:text-white'
                  )}
                >
                  {preset}%
                </button>
              ))}
              <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-surface-light border border-border">
                <input
                  type="number"
                  value={slippage}
                  onChange={e => setSlippage(parseFloat(e.target.value) || 0.5)}
                  className="w-12 bg-transparent text-sm text-center outline-none font-mono"
                  step="0.1"
                  min="0.1"
                  max="50"
                />
                <span className="text-sm text-text-muted">%</span>
              </div>
            </div>
          </div>
        )}

        {/* From */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-muted">You Pay</span>
            <span className="text-xs text-text-muted font-mono">
              Balance: {balance ? parseFloat(formatEther(balance)).toFixed(4) : '0.0000'} {fromToken.symbol}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={swapFromAmount}
              onChange={e => setSwapFromAmount(e.target.value)}
              placeholder="0.0"
              className="flex-1 bg-transparent text-2xl font-semibold outline-none font-mono"
            />
            <button
              onClick={() => setFromTokenSelectOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-light border border-border hover:border-primary/50 transition-all"
            >
              <div className={clsx('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold', fromToken.color)}>
                {fromToken.logo}
              </div>
              <span className="font-medium">{fromToken.symbol}</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </div>

        {/* Switch */}
        <div className="flex justify-center -my-2 relative z-10">
          <button
            onClick={switchTokens}
            className="p-2 rounded-xl bg-background border-2 border-border hover:border-primary hover:bg-primary/10 transition-all"
          >
            <ArrowLeftRight size={18} />
          </button>
        </div>

        {/* To */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-muted">You Receive</span>
            <span className="text-xs text-text-muted font-mono">
              Balance: {toBalance ? parseFloat(formatEther(toBalance)).toFixed(4) : '0.0000'} {toToken.symbol}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={swapToAmount}
              readOnly
              placeholder="0.0"
              className="flex-1 bg-transparent text-2xl font-semibold outline-none font-mono text-text-secondary"
            />
            <button
              onClick={() => setToTokenSelectOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-light border border-border hover:border-primary/50 transition-all"
            >
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                {toToken.logo}
              </div>
              <span className="font-medium">{toToken.symbol}</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </div>

        {swapFromAmount && (
          <div className="px-4 pb-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>Rate</span>
              <span className="font-mono">{exchangeRate}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>Price Impact</span>
              <span className={clsx('font-mono', parseFloat(priceImpact) > 5 ? 'text-danger' : 'text-accent')}>
                {priceImpact}%
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>Min Received</span>
              <span className="font-mono text-accent">
                {minOut ? parseFloat(formatEther(minOut)).toFixed(4) : '0'} {toToken.symbol}
              </span>
            </div>
          </div>
        )}

        <div className="p-4 pt-0 space-y-2">
          {wrapMode ? (
            <>
              <button
                onClick={handleWrap}
                disabled={!swapFromAmount || parseFloat(swapFromAmount) <= 0 || !isConnected || isProcessing}
                className={clsx(
                  'w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2',
                  !swapFromAmount || parseFloat(swapFromAmount) <= 0 || !isConnected || isProcessing
                    ? 'bg-surface-light text-text-muted cursor-not-allowed'
                    : 'bg-blue-600 text-white'
                )}
              >
                {isWrapping && <Loader2 size={14} className="animate-spin" />}
                {isWrapping ? 'Wrapping...' : 'Wrap OPN → WOPN'}
              </button>
              <p className="text-xs text-text-muted text-center">
                OPN must be wrapped to WOPN first. After it confirms, set From to WOPN and swap.
              </p>
            </>
          ) : needsApproval ? (
            <button
              onClick={handleApprove}
              disabled={!swapFromAmount || parseFloat(swapFromAmount) <= 0 || !isConnected || isProcessing}
              className={clsx(
                'w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2',
                !swapFromAmount || parseFloat(swapFromAmount) <= 0 || !isConnected || isProcessing
                  ? 'bg-surface-light text-text-muted cursor-not-allowed'
                  : 'bg-warning text-black'
              )}
            >
              {isApproving && <Loader2 size={14} className="animate-spin" />}
              {isApproving ? 'Approving...' : `Approve ${fromToken.symbol}`}
            </button>
          ) : (
            <button
              onClick={handleSwap}
              disabled={!swapFromAmount || parseFloat(swapFromAmount) <= 0 || !isConnected || isProcessing}
              className={clsx(
                'w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2',
                !swapFromAmount || parseFloat(swapFromAmount) <= 0 || !isConnected || isProcessing
                  ? 'bg-surface-light text-text-muted cursor-not-allowed'
                  : 'bg-primary text-white btn-glow'
              )}
            >
              {isProcessing && <Loader2 size={14} className="animate-spin" />}
              {!isConnected ? 'Connect Wallet' : isProcessing ? 'Processing...' : !swapFromAmount || parseFloat(swapFromAmount) <= 0 ? 'Enter Amount' : 'Swap'}
            </button>
          )}
        </div>
      </div>

      {(fromTokenSelectOpen || toTokenSelectOpen) && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setFromTokenSelectOpen(false); setToTokenSelectOpen(false); }} />
          <div className="relative bg-surface border border-border rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold">Select Token</h3>
              <button onClick={() => { setFromTokenSelectOpen(false); setToTokenSelectOpen(false); }} className="p-1 rounded-lg hover:bg-surface-light">X</button>
            </div>
            <div className="p-2 max-h-80 overflow-y-auto">
              {TOKENS.map(token => (
                <button
                  key={token.symbol}
                  onClick={() => {
                    if (fromTokenSelectOpen) setSwapFromToken(token.symbol);
                    else setSwapToToken(token.symbol);
                    setFromTokenSelectOpen(false); setToTokenSelectOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-light transition-all"
                >
                  <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold', token.color)}>
                    {token.logo}
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{token.symbol}</p>
                    <p className="text-xs text-text-muted">{token.name}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
