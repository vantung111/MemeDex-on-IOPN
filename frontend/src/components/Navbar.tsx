'use client';

import { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Rocket, Menu, X, Flame, Copy, Check, ExternalLink, LogOut } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/swap', label: 'Swap', emoji: '🔄' },
  { href: '/stake', label: 'Stake', emoji: '💎' },
  { href: '/farm', label: 'Farm', emoji: '🌾' },
  { href: '/launch', label: 'Launch', emoji: '🚀' },
  { href: '/presale', label: 'Presale', emoji: '🎯' },
  { href: '/airdrop', label: 'Airdrop', emoji: '🪂' },
  { href: '/referral', label: 'Referral', emoji: '🤝' },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConnect = () => {
    const connector = connectors[0];
    if (connector) connect({ connector });
  };

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-bg-deep/90 backdrop-blur-xl border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-bg-hot border-2 border-black flex items-center justify-center shadow-[3px_3px_0_#000] group-hover:shadow-[5px_5px_0_#000] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 transition-all">
                <Rocket size={20} className="text-white animate-wiggle-slow" />
              </div>
              <div>
                <h1 className="font-meme text-xl text-stroke-thin leading-none">MEMEDEX</h1>
                <p className="text-[9px] text-text-muted font-mono leading-none mt-0.5">opn chain • gm</p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-1.5 rounded-lg font-meme text-sm transition-all border-2 ${
                      isActive
                        ? 'bg-doge-gold text-black border-black shadow-[3px_3px_0_#000] -translate-y-0.5'
                        : 'bg-transparent text-text-secondary border-transparent hover:border-black hover:bg-surface hover:text-white'
                    }`}
                  >
                    <span className="mr-1">{item.emoji}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Wallet */}
            <div className="flex items-center gap-2">
              {isConnected && address ? (
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    onClick={copyAddress}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pepe-green/20 border-2 border-black text-pepe-green font-mono text-xs"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </button>
                  <a
                    href={`https://testnet.iopn.tech/address/${address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-surface border-2 border-black text-text-secondary hover:text-white"
                  >
                    <ExternalLink size={12} />
                  </a>
                  <button
                    onClick={() => disconnect()}
                    className="p-1.5 rounded-lg bg-rocket-red/20 border-2 border-black text-rocket-red hover:bg-rocket-red/30"
                  >
                    <LogOut size={12} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={isPending}
                  className="btn-meme btn-meme-yellow text-xs sm:text-sm"
                >
                  <Flame size={14} />
                  {isPending ? '...' : 'Connect'}
                </button>
              )}

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-lg bg-surface border-2 border-black text-white"
              >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>

          {/* Mobile Nav */}
          {mobileOpen && (
            <nav className="lg:hidden py-3 border-t-2 border-black grid grid-cols-2 gap-2">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`px-3 py-2 rounded-lg font-meme text-sm text-center border-2 ${
                      isActive
                        ? 'bg-doge-gold text-black border-black'
                        : 'bg-surface text-text-secondary border-black hover:bg-surface-light'
                    }`}
                  >
                    <span className="mr-1">{item.emoji}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
