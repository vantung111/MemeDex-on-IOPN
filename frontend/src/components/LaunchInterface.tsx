'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useWaitForTransactionReceipt } from 'wagmi';
import { Rocket, Coins, ExternalLink, CheckCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLaunchpad } from '@/hooks/useContracts';

const LAUNCHPAD_CONFIG = {
  creationFee: '2 OPN',
  minLiquidity: '10 OPN',
  maxPresaleDuration: '7 days',
};

interface LaunchFormData {
  name: string;
  symbol: string;
  imageURI: string;
  description: string;
  initialLiquidity: string;
  presaleRate: string;
  presaleHardCap: string;
  presaleSoftCap: string;
  presaleDuration: string;
  presaleMinPurchase: string;
  presaleMaxPurchase: string;
}

export default function LaunchInterface() {
  const [formData, setFormData] = useState<LaunchFormData>({
    name: '',
    symbol: '',
    imageURI: '',
    description: '',
    initialLiquidity: '',
    presaleRate: '',
    presaleHardCap: '',
    presaleSoftCap: '',
    presaleDuration: '3',
    presaleMinPurchase: '0.1',
    presaleMaxPurchase: '5',
  });

  const [step, setStep] = useState<'form' | 'confirm' | 'launching' | 'success' | 'error'>('form');
  const [errors, setErrors] = useState<Partial<Record<keyof LaunchFormData, string>>>({});

  const { address, isConnected } = useAccount();
  const { createLaunch, hash, isPending, error: launchError } = useLaunchpad();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  const txHash = hash ?? '';

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof LaunchFormData, string>> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.symbol.trim() || formData.symbol.length > 10)
      newErrors.symbol = 'Symbol required (max 10 chars)';
    if (!formData.initialLiquidity || parseFloat(formData.initialLiquidity) < 10)
      newErrors.initialLiquidity = 'Min 10 OPN liquidity';
    if (!formData.presaleRate || parseFloat(formData.presaleRate) <= 0)
      newErrors.presaleRate = 'Rate required';
    if (!formData.presaleHardCap || parseFloat(formData.presaleHardCap) < parseFloat(formData.presaleSoftCap || '0'))
      newErrors.presaleHardCap = 'Hard cap must be >= soft cap';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setStep('confirm');
  };

  const handleLaunch = async () => {
    if (!isConnected) { toast.error('Connect your wallet first'); return; }
    try {
      setStep('launching');
      createLaunch({
        name: formData.name,
        symbol: formData.symbol,
        imageURI: formData.imageURI,
        description: formData.description,
        initialLiquidity: formData.initialLiquidity,
        presaleRate: formData.presaleRate,
        presaleHardCap: formData.presaleHardCap || '0',
        presaleSoftCap: formData.presaleSoftCap || '0',
        presaleDurationDays: formData.presaleDuration || '3',
        presaleMinPurchase: formData.presaleMinPurchase || '0',
        presaleMaxPurchase: formData.presaleMaxPurchase || '0',
        listingRate: formData.presaleRate,
      });
      toast.success('Launch transaction submitted!');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Launch failed');
      setStep('error');
    }
  };

  // React to transaction lifecycle.
  useEffect(() => {
    if (step === 'launching' && isConfirmed) setStep('success');
  }, [step, isConfirmed]);

  useEffect(() => {
    if (step === 'launching' && launchError) setStep('error');
  }, [step, launchError]);

  const estimatedTokens = formData.initialLiquidity
    ? (parseFloat(formData.initialLiquidity) * 100000).toLocaleString()
    : '0';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <Rocket size={24} className="text-primary" />
          <div>
            <h2 className="text-lg font-bold">Launch Your Meme</h2>
            <p className="text-xs text-text-muted">Create and launch your meme token on OPN Chain</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { icon: Coins, label: 'Creation Fee', value: LAUNCHPAD_CONFIG.creationFee },
            { icon: Coins, label: 'Min Liquidity', value: LAUNCHPAD_CONFIG.minLiquidity },
            { icon: Coins, label: 'Max Duration', value: LAUNCHPAD_CONFIG.maxPresaleDuration },
          ].map((item, i) => (
            <div key={i} className="bg-surface-light rounded-lg p-2 text-center">
              <item.icon size={12} className="mx-auto mb-1 text-primary" />
              <p className="text-xs text-text-muted">{item.label}</p>
              <p className="text-xs font-semibold">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      {step === 'form' && (
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
          <h3 className="font-semibold">Token Details</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-text-muted mb-1.5">Token Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Dogecoin"
                className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary transition-all"
              />
              {errors.name && <p className="text-xs text-danger mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1.5">Symbol *</label>
              <input
                type="text"
                value={formData.symbol}
                onChange={e => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                placeholder="DOGE"
                maxLength={10}
                className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 text-sm font-mono outline-none focus:border-primary transition-all uppercase"
              />
              {errors.symbol && <p className="text-xs text-danger mt-1">{errors.symbol}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1.5">Image URL</label>
            <input
              type="text"
              value={formData.imageURI}
              onChange={e => setFormData({ ...formData, imageURI: e.target.value })}
              placeholder="https://..."
              className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1.5">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your meme token..."
              rows={3}
              className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary transition-all resize-none"
            />
          </div>

          <div className="border-t border-border pt-5">
            <h3 className="font-semibold mb-4">Liquidity & Presale</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-text-muted mb-1.5">Initial Liquidity (OPN) *</label>
                <input
                  type="number"
                  value={formData.initialLiquidity}
                  onChange={e => setFormData({ ...formData, initialLiquidity: e.target.value })}
                  placeholder="50"
                  className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 text-sm font-mono outline-none focus:border-primary transition-all"
                />
                {errors.initialLiquidity && <p className="text-xs text-danger mt-1">{errors.initialLiquidity}</p>}
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1.5">Presale Rate (tokens/OPN) *</label>
                <input
                  type="number"
                  value={formData.presaleRate}
                  onChange={e => setFormData({ ...formData, presaleRate: e.target.value })}
                  placeholder="100000"
                  className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 text-sm font-mono outline-none focus:border-primary transition-all"
                />
                {errors.presaleRate && <p className="text-xs text-danger mt-1">{errors.presaleRate}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs text-text-muted mb-1.5">Hard Cap (OPN)</label>
                <input
                  type="number"
                  value={formData.presaleHardCap}
                  onChange={e => setFormData({ ...formData, presaleHardCap: e.target.value })}
                  placeholder="50"
                  className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 text-sm font-mono outline-none focus:border-primary transition-all"
                />
                {errors.presaleHardCap && <p className="text-xs text-danger mt-1">{errors.presaleHardCap}</p>}
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1.5">Soft Cap (OPN)</label>
                <input
                  type="number"
                  value={formData.presaleSoftCap}
                  onChange={e => setFormData({ ...formData, presaleSoftCap: e.target.value })}
                  placeholder="10"
                  className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 text-sm font-mono outline-none focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-xs text-text-muted mb-1.5">Duration (days)</label>
                <input
                  type="number"
                  value={formData.presaleDuration}
                  onChange={e => setFormData({ ...formData, presaleDuration: e.target.value })}
                  min="1"
                  max="7"
                  className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 text-sm font-mono outline-none focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1.5">Min Purchase</label>
                <input
                  type="number"
                  value={formData.presaleMinPurchase}
                  onChange={e => setFormData({ ...formData, presaleMinPurchase: e.target.value })}
                  placeholder="0.1"
                  className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 text-sm font-mono outline-none focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1.5">Max Purchase</label>
                <input
                  type="number"
                  value={formData.presaleMaxPurchase}
                  onChange={e => setFormData({ ...formData, presaleMaxPurchase: e.target.value })}
                  placeholder="5"
                  className="w-full bg-surface-light border border-border rounded-lg px-3 py-2.5 text-sm font-mono outline-none focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          {formData.name && formData.initialLiquidity && (
            <div className="bg-surface-light/50 rounded-xl p-4 border border-border">
              <h4 className="text-xs text-text-muted mb-2">Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between"><span className="text-text-muted">Token Name</span><span className="font-semibold">{formData.name}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Symbol</span><span className="font-mono font-semibold">{formData.symbol}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Total Supply</span><span className="font-mono font-semibold">1B {formData.symbol}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Estimated Tokens</span><span className="font-mono font-semibold">{estimatedTokens}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Creation Fee</span><span className="font-mono font-semibold text-warning">{LAUNCHPAD_CONFIG.creationFee}</span></div>
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            className="w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm btn-glow"
          >
            Review Launch
          </button>
        </div>
      )}

      {/* Confirm */}
      {step === 'confirm' && (
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold">Confirm Launch</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-text-muted">Token</span><span>{formData.name} ({formData.symbol})</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Liquidity</span><span>{formData.initialLiquidity} OPN</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Presale Rate</span><span>{parseFloat(formData.presaleRate).toLocaleString()} tokens/OPN</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Hard Cap</span><span>{formData.presaleHardCap || 'N/A'} OPN</span></div>
            <div className="flex justify-between text-warning"><span>Creation Fee</span><span>{LAUNCHPAD_CONFIG.creationFee}</span></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep('form')} className="flex-1 py-2.5 rounded-xl bg-surface-light border border-border text-sm font-medium">
              Back
            </button>
            <button
              onClick={handleLaunch}
              disabled={!isConnected || isPending}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold btn-glow disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending && <Loader size={14} className="animate-spin" />}
              {!isConnected ? 'Connect Wallet' : isPending ? 'Confirm in wallet...' : 'Launch Now'}
            </button>
          </div>
        </div>
      )}

      {/* Launching */}
      {step === 'launching' && (
        <div className="bg-surface border border-border rounded-2xl p-8 text-center">
          <Loader size={40} className="mx-auto mb-4 text-primary animate-spin" />
          <h3 className="font-semibold mb-2">Creating Your Token...</h3>
          <p className="text-sm text-text-muted">
            {isConfirming ? 'Waiting for confirmation on OPN Chain...' : 'Submitting your transaction...'}
          </p>
          {txHash && (
            <a
              href={`https://testnet.iopn.tech/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-mono mt-3"
            >
              View transaction <ExternalLink size={10} />
            </a>
          )}
        </div>
      )}

      {/* Error */}
      {step === 'error' && (
        <div className="bg-surface border border-danger/30 rounded-2xl p-6 space-y-4 text-center">
          <h3 className="font-semibold text-danger">Launch Failed</h3>
          <p className="text-sm text-text-muted break-words">
            {launchError instanceof Error ? launchError.message : 'The transaction was rejected or reverted.'}
          </p>
          <button onClick={() => setStep('form')} className="w-full py-2.5 rounded-xl bg-surface-light border border-border text-sm font-medium">
            Back to Form
          </button>
        </div>
      )}

      {/* Success */}
      {step === 'success' && (
        <div className="bg-surface border border-accent/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle size={32} className="text-accent" />
            <div>
              <h3 className="font-semibold">Launch Successful!</h3>
              <p className="text-xs text-text-muted">Your token has been deployed to OPN Chain</p>
            </div>
          </div>
          <div className="bg-surface-light rounded-xl p-3">
            <p className="text-xs text-text-muted mb-1">Transaction Hash</p>
            <a
              href={`https://testnet.iopn.tech/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline font-mono break-all"
            >
              {txHash.slice(0, 20)}... <ExternalLink size={10} />
            </a>
          </div>
          <button onClick={() => { setStep('form'); setFormData({ name: '', symbol: '', imageURI: '', description: '', initialLiquidity: '', presaleRate: '', presaleHardCap: '', presaleSoftCap: '', presaleDuration: '3', presaleMinPurchase: '0.1', presaleMaxPurchase: '5' }); }} className="w-full py-2.5 rounded-xl bg-surface-light border border-border text-sm font-medium">
            Launch Another
          </button>
        </div>
      )}
    </div>
  );
}
