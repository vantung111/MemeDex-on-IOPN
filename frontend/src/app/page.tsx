'use client';

import Link from 'next/link';
import { ArrowLeftRight, TrendingUp, Coins, Rocket, Gift, Users, Zap, Globe, Sparkles } from 'lucide-react';

const FEATURES = [
  { icon: ArrowLeftRight, title: 'Swap', desc: 'Trade any meme token with deep liquidity', emoji: '🔄', href: '/swap', gradient: 'from-wojak-pink to-chad-orange' },
  { icon: TrendingUp, title: 'Stake', desc: 'Stake OPN, earn MEMEDEX rewards', emoji: '💎', href: '/stake', gradient: 'from-pepe-green to-laser-cyan' },
  { icon: Coins, title: 'Farm', desc: 'Provide LP, earn yield in MEMEDEX', emoji: '🌾', href: '/farm', gradient: 'from-doge-gold to-chad-orange' },
  { icon: Rocket, title: 'Launch', desc: 'Create your own meme token in minutes', emoji: '🚀', href: '/launch', gradient: 'from-rocket-red to-wojak-pink' },
  { icon: Gift, title: 'Airdrop', desc: 'Top traders earn weekly MEMEDEX drops', emoji: '🪂', href: '/airdrop', gradient: 'from-moon-purple to-wojak-pink' },
  { icon: Users, title: 'Referral', desc: 'Invite frens, earn 5% of their rewards', emoji: '🤝', href: '/referral', gradient: 'from-diamond-blue to-moon-purple' },
];

const STATS = [
  { label: 'Total Volume', value: '$1.2M+', emoji: '💰' },
  { label: 'MEMEDEX Price', value: '$0.042', emoji: '🐸' },
  { label: 'TVL Locked', value: '$425K+', emoji: '🔒' },
  { label: 'Total Trades', value: '28.5K', emoji: '📈' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-wojak-pink/20 rounded-full blur-[128px] animate-pulse-slow" />
          <div className="absolute top-40 right-1/4 w-80 h-80 bg-chad-orange/20 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-moon-purple/20 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Sticker badge */}
          <div className="inline-flex items-center gap-2 mb-6 animate-wiggle-slow">
            <span className="sticker">
              <Zap size={12} />
              BUILT ON OPN CHAIN
            </span>
            <span className="sticker sticker-fire">
              <Sparkles size={12} />
              NEW
            </span>
          </div>

          {/* Meme headline */}
          <h1 className="font-meme text-5xl sm:text-6xl md:text-7xl lg:text-8xl mb-4 leading-[0.95]">
            <span className="block text-stroke">WAGMI</span>
            <span className="block gradient-meme text-stroke">FRENSHIP</span>
            <span className="block text-stroke">ENERGY ✨</span>
          </h1>

          <div className="flex items-center justify-center gap-2 mb-8 text-2xl md:text-3xl">
            <span className="meme-emoji animate-bounce-in" style={{ animationDelay: '0.1s' }}>🐸</span>
            <span className="meme-emoji animate-bounce-in" style={{ animationDelay: '0.2s' }}>🐕</span>
            <span className="meme-emoji animate-bounce-in" style={{ animationDelay: '0.3s' }}>🚀</span>
            <span className="meme-emoji animate-bounce-in" style={{ animationDelay: '0.4s' }}>💎</span>
            <span className="meme-emoji animate-bounce-in" style={{ animationDelay: '0.5s' }}>🌕</span>
            <span className="meme-emoji animate-bounce-in" style={{ animationDelay: '0.6s' }}>🔥</span>
          </div>

          <p className="text-base md:text-lg text-text-secondary max-w-2xl mx-auto mb-10 font-medium">
            The <span className="text-doge-gold font-bold">first dedicated meme DEX</span> on OPN Chain.
            Swap, stake, farm, launch — <span className="text-pepe-green font-bold">to the moon</span> together! 🚀
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link href="/swap" className="btn-meme">
              <Rocket size={18} className="-rotate-45" />
              APE IN NOW
            </Link>
            <Link href="/launch" className="btn-meme btn-meme-yellow">
              <Sparkles size={18} />
              LAUNCH MEME
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="sticker sticker-cool">
              <Globe size={12} /> OPN Native
            </span>
            <span className="sticker">
              🔒 Audited
            </span>
            <span className="sticker sticker-hot">
              ⚡ Low Gas
            </span>
            <span className="sticker sticker-rare">
              🌈 8 Features
            </span>
          </div>
        </div>
      </section>

      {/* STATS BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((stat, i) => (
            <div
              key={i}
              className="card-meme p-5 text-center zoom-hover"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="meme-emoji mb-2">{stat.emoji}</div>
              <p className="text-[10px] text-text-muted font-mono uppercase tracking-wider mb-1">
                {stat.label}
              </p>
              <p className="font-meme text-2xl gradient-meme">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="font-meme text-4xl md:text-5xl text-stroke mb-3">
            <span className="gradient-wojak">6 WAYS TO WIN</span> 🏆
          </h2>
          <p className="text-text-secondary text-base">
            A complete DeFi suite for the <span className="text-doge-gold font-bold">meme economy</span>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => (
            <Link
              key={i}
              href={feature.href}
              className="card-meme p-6 group zoom-hover"
              style={{ animation: `slide-up 0.5s ease-out ${i * 0.05}s both` }}
            >
              <div className="ribbon">{feature.title.toUpperCase()}</div>

              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} border-2 border-black flex items-center justify-center mb-4 shadow-[3px_3px_0_#000] group-hover:rotate-12 group-hover:scale-110 transition-transform`}>
                <span className="text-3xl">{feature.emoji}</span>
              </div>

              <h3 className="font-meme text-2xl text-white mb-2 tracking-wide">
                {feature.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {feature.desc}
              </p>

              <div className="mt-4 flex items-center gap-1 text-doge-gold font-meme text-sm group-hover:translate-x-1 transition-transform">
                LET'S GO <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* MEMEDEX TOKEN */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="relative card-meme p-8 md:p-12 text-center overflow-hidden">
          <div className="absolute inset-0 gradient-bg-hot opacity-10" />

          <div className="relative">
            <div className="inline-block sticker sticker-fire mb-4">
              🐸 NATIVE TOKEN
            </div>

            <h2 className="font-meme text-5xl md:text-6xl text-stroke mb-3">
              <span className="gradient-meme">$MEMEDEX</span>
            </h2>

            <p className="text-text-secondary text-base max-w-xl mx-auto mb-8">
              The <span className="text-doge-gold font-bold">governance & utility</span> token.
              Earn by staking, farming, trading, and referring frens. Wen lambo? Soon™ 🚀
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
              {[
                { label: 'Total Supply', value: '10M', emoji: '🏦' },
                { label: 'Circulating', value: '6M', emoji: '💸' },
                { label: 'Market Cap', value: '$252K', emoji: '📊' },
              ].map((item, i) => (
                <div key={i} className="bg-black/40 border-2 border-black rounded-xl p-4">
                  <div className="meme-emoji mb-1">{item.emoji}</div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">
                    {item.label}
                  </p>
                  <p className="font-meme text-2xl gradient-doge">{item.value}</p>
                </div>
              ))}
            </div>

            <Link href="/stake" className="btn-meme btn-meme-green">
              <Coins size={18} />
              STAKE $MEMEDEX
            </Link>
          </div>
        </div>
      </section>

      {/* ROADMAP / HOW IT WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="font-meme text-4xl md:text-5xl text-stroke mb-3">
            <span className="gradient-pepe">HOW IT WORKS</span> 🛠️
          </h2>
          <p className="text-text-secondary text-base">3 steps to financial freedom (probably)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: '1', title: 'CONNECT', desc: 'Plug in your wallet, switch to OPN Chain', emoji: '🔌', color: 'bg-wojak-pink' },
            { step: '2', title: 'TRADE', desc: 'Swap, stake, farm — pick your poison', emoji: '💸', color: 'bg-doge-gold' },
            { step: '3', title: 'MOON', desc: 'Earn MEMEDEX, watch your bags pump', emoji: '🌕', color: 'bg-pepe-green' },
          ].map((item, i) => (
            <div
              key={i}
              className="card-meme p-6 text-center relative"
              style={{ animation: `slide-up 0.5s ease-out ${i * 0.15}s both` }}
            >
              <div className={`absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 ${item.color} border-2 border-black rounded-full flex items-center justify-center font-meme text-2xl text-black shadow-[3px_3px_0_#000]`}>
                {item.step}
              </div>
              <div className="meme-emoji-giant mt-4 mb-2 animate-float" style={{ animationDelay: `${i * 0.3}s` }}>
                {item.emoji}
              </div>
              <h3 className="font-meme text-3xl text-white mb-2 tracking-wide">
                {item.title}
              </h3>
              <p className="text-sm text-text-secondary">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-16">
        <div className="relative card-meme p-10 md:p-16 text-center overflow-hidden">
          <div className="absolute inset-0 gradient-bg-cool opacity-10" />

          <div className="relative">
            <div className="meme-emoji-giant animate-rocket mb-4">🚀</div>
            <h2 className="font-meme text-5xl md:text-6xl text-stroke mb-3">
              <span className="gradient-meme">READY TO APE?</span>
            </h2>
            <p className="text-text-secondary text-base mb-8 max-w-md mx-auto">
              Join the <span className="text-doge-gold font-bold">meme revolution</span> on OPN Chain.
              This is the way. 🐸
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/swap" className="btn-meme">
                <Rocket size={18} className="-rotate-45" />
                LAUNCH APP
              </Link>
              <Link href="/presale" className="btn-meme btn-meme-cyan">
                <Gift size={18} />
                JOIN PRESALE
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t-4 border-black bg-black/40 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-bg-hot border-2 border-black flex items-center justify-center shadow-[3px_3px_0_#000]">
                <Rocket size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-meme text-xl text-stroke-thin">MEMEDEX</h3>
                <p className="text-[10px] text-text-muted font-mono">opn chain • gm gn</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span className="sticker">🐸 PEPE</span>
              <span className="sticker sticker-fire">🐕 WOJAK</span>
              <span className="sticker sticker-cool">💎 GEM</span>
              <span className="sticker sticker-rare">🌕 MOON</span>
            </div>

            <p className="text-xs text-text-muted font-mono">
              © 2026 MEMEDEX • NOT FINANCIAL ADVICE
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
