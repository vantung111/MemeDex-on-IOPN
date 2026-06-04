'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  emoji: string;
  subtitle?: string;
  backHref?: string;
  rightSlot?: ReactNode;
  ribbon?: string;
  children?: ReactNode;
}

export function PageHeader({ title, emoji, subtitle, backHref = '/', rightSlot, children }: PageHeaderProps) {
  return (
    <div className="relative">
      <div className="absolute inset-0 gradient-bg-hot opacity-5 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex items-center justify-between mb-6">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border-2 border-black text-text-secondary hover:text-white text-sm font-mono"
          >
            <ArrowLeft size={14} />
            BACK
          </Link>
          {rightSlot}
        </div>

        <div className="text-center">
          <div className="meme-emoji-giant mb-3 animate-float">{emoji}</div>
          <h1 className="font-meme text-4xl md:text-5xl lg:text-6xl text-stroke mb-3 tracking-wide">
            <span className="gradient-meme">{title}</span>
          </h1>
          {subtitle && (
            <p className="text-text-secondary text-base max-w-xl mx-auto">{subtitle}</p>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
