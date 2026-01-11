import React, { createContext, useContext, useState, useEffect } from 'react';

const Web3Context = createContext({});

export function Web3Provider({ children }) {
    const [account, setAccount] = useState(null);
    const [chainId, setChainId] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);

    // Check if provider exists
    const getProvider = () => {
        if (typeof window === 'undefined') return null;

        // If multiple providers are present, try to find MetaMask
        if (window.ethereum?.providers) {
            return window.ethereum.providers.find(p => p.isMetaMask) || window.ethereum.providers[0];
        }

        // Return standard window.ethereum if it exists
        if (window.ethereum) {
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

        // Specific MetaMask detection if needed
        const isMetaMask = provider.isMetaMask;
        console.log('🔌 Connecting to provider...', isMetaMask ? ' (MetaMask detected)' : '');

        try {
            setIsConnecting(true);
            setError(null);

            // Some providers/environments might fail on these requests even if window.ethereum exists
            const accounts = await provider.request({ method: 'eth_requestAccounts' });
            const chain = await provider.request({ method: 'eth_chainId' });

            handleAccountsChanged(accounts);
            setChainId(chain);

        } catch (err) {
            console.error("❌ Error connecting wallet:", err);

            // Handle specific "provider not found" or "failed to connect" errors
            if (err.message?.includes('MetaMask extension not found') || err.code === -32601) {
                setError("MetaMask extension not found or not responding.");
            } else {
                setError(err.message || "Failed to connect to wallet");
            }
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
            // Only attach listeners if provider supports them
            if (provider.on) {
                provider.on('accountsChanged', handleAccountsChanged);
                provider.on('chainChanged', handleChainChanged);
            }

            const fetchInitialStatus = async () => {
                // DON'T auto-fetch if it's not MetaMask and we are in a potentially conflicting environment
                // To avoid "i: Failed to connect to MetaMask" or similar injected errors
                if (provider.isMetaMask === false && window.tronWeb) {
                    console.log("ℹ️ Skipping auto-web3 fetch as TronLink is detected and provider is not MetaMask");
                    return;
                }

                try {
                    // Use a very short timeout or just don't do it if not requested?
                    // Let's try to fetch but with more localized error handling
                    const accounts = await provider.request({ method: 'eth_accounts' });
                    if (accounts) handleAccountsChanged(accounts);

                    const chain = await provider.request({ method: 'eth_chainId' });
                    if (chain) setChainId(chain);
                } catch (err) {
                    // Silently fail initial fetch to avoid console clutter
                }
            };

            fetchInitialStatus();

            return () => {
                if (provider.removeListener) {
                    try {
                        provider.removeListener('accountsChanged', handleAccountsChanged);
                        provider.removeListener('chainChanged', handleChainChanged);
                    } catch (e) { }
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
