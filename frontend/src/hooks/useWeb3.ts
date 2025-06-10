import { useAccount, useConnect, useDisconnect, useNetwork, useSwitchNetwork } from 'wagmi';
import { useCallback } from 'react';

export const useWeb3 = () => {
  const { address: account, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();

  const connectWallet = useCallback(async () => {
    const connector = connectors[0];
    if (connector) {
      await connect({ connector });
    }
  }, [connect, connectors]);

  const switchChain = useCallback(async (chainId: number) => {
    if (switchNetwork) {
      await switchNetwork(chainId);
    }
  }, [switchNetwork]);

  return {
    account,
    chainId: chain?.id,
    isConnected,
    connectWallet,
    disconnect,
    switchChain
  };
};
