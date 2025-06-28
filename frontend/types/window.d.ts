interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request?: (...args: any[]) => Promise<void>;
    on?: (...args: any[]) => void;
    removeListener?: (...args: any[]) => void;
    autoRefreshOnNetworkChange?: boolean;
  };
}
