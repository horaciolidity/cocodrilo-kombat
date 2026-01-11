import React, { createContext, useContext, useState, useEffect } from 'react';

const Web3Context = createContext({});

export function Web3Provider({ children }) {
    const [account, setAccount] = useState(null);
    const [chainId, setChainId] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);

    // Check if provider exists
    const getProvider = () => {
        if (typeof window !== 'undefined' && window.ethereum) {
            return window.ethereum;
        }
        return null;
    };

    const connectWallet = async () => {
        const provider = getProvider();
        if (!provider) {
            window.open('https://metamask.io/download/', '_blank');
            setError("Please install MetaMask!");
            return;
        }

        try {
            setIsConnecting(true);
            setError(null);

            const accounts = await provider.request({ method: 'eth_requestAccounts' });
            const chain = await provider.request({ method: 'eth_chainId' });

            handleAccountsChanged(accounts);
            setChainId(chain);

        } catch (err) {
            console.error("Error connecting wallet:", err);
            setError(err.message);
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnectWallet = () => {
        setAccount(null);
        setChainId(null);
    };

    const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
            console.log('Please connect to MetaMask.');
            setAccount(null);
        } else {
            setAccount(accounts[0]);
        }
    };

    const handleChainChanged = (chainId) => {
        setChainId(chainId);
        window.location.reload();
    };

    useEffect(() => {
        const provider = getProvider();
        if (provider) {
            provider.on('accountsChanged', handleAccountsChanged);
            provider.on('chainChanged', handleChainChanged);

            // Check current status
            provider.request({ method: 'eth_accounts' })
                .then(handleAccountsChanged)
                .catch(console.error);

            provider.request({ method: 'eth_chainId' })
                .then(setChainId)
                .catch(console.error);

            return () => {
                if (provider.removeListener) {
                    provider.removeListener('accountsChanged', handleAccountsChanged);
                    provider.removeListener('chainChanged', handleChainChanged);
                }
            };
        }
    }, []);

    return (
        <Web3Context.Provider
            value={{
                account,
                chainId,
                isConnecting,
                error,
                connectWallet,
                disconnectWallet,
                isConnected: !!account
            }}
        >
            {children}
        </Web3Context.Provider>
    );
}

export const useWeb3 = () => useContext(Web3Context);
