import { create } from 'zustand';
import { getApiBase } from '../utils/apiBase';

interface Account {
  id: string;
  handle: string;
  platform: 'YouTube' | 'Instagram';
}

interface StoreState {
  connectedAccounts: Account[];
  selectedFilter: string; // 'all', or account id
  fetchAccounts: () => Promise<void>;
  setSelectedFilter: (filter: string) => void;
}

export const useStore = create<StoreState>((set) => ({
  connectedAccounts: [],
  selectedFilter: 'all',
  fetchAccounts: async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/v1/auth/accounts`);
      const data = await res.json();
      set({ connectedAccounts: data });
    } catch (e) {
      console.error(e);
    }
  },
  setSelectedFilter: (filter) => set({ selectedFilter: filter }),
}));
