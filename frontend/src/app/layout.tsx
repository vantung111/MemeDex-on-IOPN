import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { ClientLayout } from './ClientLayout';

export const metadata: Metadata = {
  title: 'MemeDex — The MEME Trading Hub on OPN Chain 🐸🚀',
  description: 'Trade, stake, farm, and launch meme tokens on the first dedicated meme DEX on OPN Chain. WAGMI! 🌕',
  keywords: 'meme, dex, opn chain, iopn, meme coin, swap, farm, stake, presale, launchpad',
  openGraph: {
    title: 'MemeDex — MEME Trading Reimagined',
    description: 'The first dedicated meme DEX on OPN Chain. PEPE WOJAK DOGE to the moon!',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </body>
    </html>
  );
}
