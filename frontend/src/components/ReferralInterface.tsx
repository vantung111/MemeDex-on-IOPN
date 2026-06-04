'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Users, Copy, Check, Link2, Gift, TrendingUp, Award, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import {
  useReferralInfo,
  useReferral,
  formatEther,
} from '@/hooks/useContracts';

export default function ReferralInterface() {
  const { address, isConnected } = useAccount();
  const [copied, setCopied] = useState(false);
  const [inputCode, setInputCode] = useState('');

  const { data: referralInfo, isLoading } = useReferralInfo(address);
  const [referralCount, totalEarnings, pendingEarnings, myCode] = (referralInfo as [bigint, bigint, bigint, string] | undefined) ?? [0n, 0n, 0n, ''];
  const { generateCode, registerReferral, claimEarnings, hash, isPending } = useReferral();

  const code = myCode || '';
  const referralLink = code ? `${typeof window !== 'undefined' ? window.location.origin : 'https://frontend-anle.vercel.app'}/?ref=${code}` : '';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateCode = () => {
    if (!isConnected) { toast.error('Connect wallet first'); return; }
    generateCode();
    toast.success('Referral code generation submitted!');
  };

  const handleRegister = () => {
    if (!inputCode.trim()) return;
    registerReferral(inputCode.trim());
    toast.success('Referral code registered!');
    setInputCode('');
  };

  const handleClaim = () => {
    claimEarnings();
    toast.success('Claim submitted!');
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-accent/10 via-surface to-primary/10 border border-border rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
            <Users size={24} className="text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-bold mb-1">Refer & Earn</h2>
            <p className="text-text-secondary text-sm">
              Earn 5% of your referee's trading rewards in MEMEDEX. Share your link and grow the community.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Referrals', value: String(referralCount ?? 0), icon: Users, color: 'text-primary' },
          { label: 'Total Earnings', value: `${parseFloat(formatEther(totalEarnings ?? 0n)).toFixed(2)} MEMEDEX`, icon: Award, color: 'text-accent' },
          { label: 'Pending', value: `${parseFloat(formatEther(pendingEarnings ?? 0n)).toFixed(2)} MEMEDEX`, icon: Gift, color: 'text-warning' },
          { label: 'Reward Rate', value: '5%', icon: TrendingUp, color: 'text-accent' },
        ].map((stat, i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-4">
            <stat.icon size={14} className={clsx(stat.color, 'mb-2')} />
            <p className="text-xs text-text-muted mb-1 mt-2">{stat.label}</p>
            <p className={clsx('font-bold font-mono text-sm', stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6">
        <h3 className="font-semibold mb-4">Your Referral Code</h3>

        {!code ? (
          <div className="text-center py-4">
            <Link2 size={32} className="mx-auto mb-3 text-text-muted" />
            <p className="text-text-secondary text-sm mb-4">
              {isConnected ? 'Generate your unique referral code to start earning rewards' : 'Connect wallet to generate your referral code'}
            </p>
            <button
              onClick={handleGenerateCode}
              disabled={!isConnected || isPending}
              className="px-6 py-2.5 rounded-xl bg-primary text-white font-medium text-sm btn-glow disabled:opacity-50 flex items-center gap-2 mx-auto"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {isPending ? 'Generating...' : 'Generate Code'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-surface-light rounded-xl p-4 text-center border border-border">
              <p className="text-xs text-text-muted mb-2">Your Referral Code</p>
              <p className="text-2xl font-mono font-bold tracking-widest gradient-text">{code}</p>
            </div>

            <div className="bg-surface-light rounded-xl p-3 border border-border">
              <p className="text-xs text-text-muted mb-2 flex items-center gap-1"><Link2 size={10} /> Share Link</p>
              <div className="flex items-center gap-2">
                <input readOnly value={referralLink} className="flex-1 bg-transparent text-xs font-mono text-text-secondary outline-none truncate" />
                <button onClick={copyToClipboard} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-medium hover:bg-primary/30 transition-all">
                  {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                </button>
              </div>
            </div>

            <div className="bg-surface-light rounded-xl p-3 border border-border">
              <p className="text-xs text-text-muted mb-2">Enter a referral code to link your account</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputCode}
                  onChange={e => setInputCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ABC123"
                  maxLength={10}
                  className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 font-mono text-sm outline-none focus:border-primary transition-all uppercase"
                />
                <button
                  onClick={handleRegister}
                  disabled={!inputCode.trim() || isPending}
                  className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/80 transition-all disabled:opacity-50 flex items-center gap-1"
                >
                  {isPending && <Loader2 size={12} className="animate-spin" />}
                  Register
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {(pendingEarnings ?? 0n) > 0n && (
        <div className="bg-accent/10 border border-accent/30 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Claimable Earnings</p>
              <p className="text-2xl font-bold font-mono text-accent mt-1">
                {parseFloat(formatEther(pendingEarnings ?? 0n)).toFixed(2)} MEMEDEX
              </p>
            </div>
            <button
              onClick={handleClaim}
              disabled={isPending}
              className="px-6 py-3 rounded-xl bg-accent text-background font-semibold text-sm hover:bg-accent/90 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Claim Rewards
            </button>
          </div>
        </div>
      )}

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Your Referrals</h3>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-text-muted flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Loading...
          </div>
        ) : (referralCount ?? 0n) === 0n ? (
          <div className="p-8 text-center text-text-muted">
            <Users size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No referrals yet. Share your code to get started!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {Array.from({ length: Number(referralCount) }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-surface-light flex items-center justify-center text-xs font-mono">{i + 1}</div>
                  <span className="font-mono text-xs text-text-secondary">Referral #{i + 1}</span>
                </div>
                <span className="font-mono text-xs text-accent">+ -- MEMEDEX</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
