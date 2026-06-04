import { useState, useEffect, useCallback } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';

export function useWallet() {
  const { address, isConnected, connector } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);

  useEffect(() => {
    setIsWrongNetwork(isConnected && chainId !== 984);
  }, [isConnected, chainId]);

  const switchToOPN = useCallback(() => {
    if (switchChain) {
      switchChain({ chainId: 984 });
    }
  }, [switchChain]);

  return {
    address,
    isConnected,
    connector,
    chainId,
    isWrongNetwork,
    switchToOPN,
    networkName: chainId === 984 ? 'OPN Testnet' : chainId === 1 ? 'Ethereum' : 'Unknown',
  };
}

export function useNetworkStats() {
  const [stats, setStats] = useState({
    blockNumber: 0,
    gasPrice: '0',
    isLoading: true,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [blockRes, gasRes] = await Promise.all([
          fetch('https://testnet-rpc.iopn.tech', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
          }),
          fetch('https://testnet-rpc.iopn.tech', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_gasPrice', params: [], id: 1 }),
          }),
        ]);

        const blockData = await blockRes.json();
        const gasData = await gasRes.json();

        setStats({
          blockNumber: parseInt(blockData.result, 16),
          gasPrice: parseInt(gasData.result, 16).toString(),
          isLoading: false,
        });
      } catch {
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  return stats;
}
