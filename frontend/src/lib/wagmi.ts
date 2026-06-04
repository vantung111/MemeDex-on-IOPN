import { http, createConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { opnTestnet } from '@/lib/opnChain';

export const wagmiConfig = createConfig({
  chains: [opnTestnet],
  connectors: [
    injected(),
  ],
  transports: {
    [opnTestnet.id]: http('https://testnet-rpc.iopn.tech'),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}
