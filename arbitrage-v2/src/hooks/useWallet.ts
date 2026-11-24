import { useCallback, useEffect, useState } from 'react';

const KEY = 'cov_wallet_address';

// État de connexion du portefeuille. La vraie connexion (WalletConnect) n'est
// pas encore branchée : tant qu'aucune adresse n'est enregistrée, l'utilisateur
// n'a « pas encore de wallet » et on lui propose de le créer / l'importer.
export function useWallet() {
  const read = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
  const [address, setAddress] = useState<string | null>(read);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) setAddress(read()); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const connect = useCallback((addr: string) => {
    try { localStorage.setItem(KEY, addr); } catch { /* stockage indisponible */ }
    setAddress(addr);
  }, []);
  const disconnect = useCallback(() => {
    try { localStorage.removeItem(KEY); } catch { /* stockage indisponible */ }
    setAddress(null);
  }, []);

  return { address, hasWallet: !!address, connect, disconnect };
}
