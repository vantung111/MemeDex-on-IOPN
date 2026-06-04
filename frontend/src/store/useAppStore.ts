import { create } from 'zustand';

interface AppState {
  // Swap state
  swapFromToken: string;
  swapToToken: string;
  swapFromAmount: string;
  swapToAmount: string;
  slippage: number;
  setSwapFromToken: (token: string) => void;
  setSwapToToken: (token: string) => void;
  setSwapFromAmount: (amount: string) => void;
  setSwapToAmount: (amount: string) => void;
  setSlippage: (slippage: number) => void;
  switchTokens: () => void;

  // UI state
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Modal state
  walletModalOpen: boolean;
  setWalletModalOpen: (open: boolean) => void;

  // Notification state
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

export const useAppStore = create<AppState>((set) => ({
  // Swap state
  swapFromToken: 'OPN',
  swapToToken: 'MEMEDEX',
  swapFromAmount: '',
  swapToAmount: '',
  slippage: 0.5,
  setSwapFromToken: (token) => set({ swapFromToken: token }),
  setSwapToToken: (token) => set({ swapToToken: token }),
  setSwapFromAmount: (amount) => set({ swapFromAmount: amount }),
  setSwapToAmount: (amount) => set({ swapToAmount: amount }),
  setSlippage: (slippage) => set({ slippage }),
  switchTokens: () => set((state) => ({
    swapFromToken: state.swapToToken,
    swapToToken: state.swapFromToken,
    swapFromAmount: state.swapToAmount,
    swapToAmount: state.swapFromAmount,
  })),

  // UI state
  activeTab: 'swap',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Modal state
  walletModalOpen: false,
  setWalletModalOpen: (open) => set({ walletModalOpen: open }),

  // Notification state
  notifications: [],
  addNotification: (notification) => set((state) => ({
    notifications: [
      ...state.notifications,
      { ...notification, id: Date.now().toString() },
    ],
  })),
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id),
  })),
}));
