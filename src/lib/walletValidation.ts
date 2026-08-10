// Validation d'adresses wallet crypto par réseau/type
// Utilisé sur la page Retraits pour garantir une adresse valide avant envoi

export type CryptoType = 'USDT-TRC20' | 'USDT-ERC20' | 'USDC-ERC20' | 'BTC' | 'ETH' | 'BNB' | 'SOL' | string;

const PATTERNS: Record<string, RegExp> = {
  BTC: /^(bc1[a-z0-9]{25,59}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/,
  ETH: /^0x[a-fA-F0-9]{40}$/,
  BNB: /^0x[a-fA-F0-9]{40}$/,
  'USDT-ERC20': /^0x[a-fA-F0-9]{40}$/,
  'USDC-ERC20': /^0x[a-fA-F0-9]{40}$/,
  'USDT-TRC20': /^T[a-km-zA-HJ-NP-Z1-9]{33}$/,
  'USDC-TRC20': /^T[a-km-zA-HJ-NP-Z1-9]{33}$/,
  SOL: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
};

/**
 * Vérifie qu'une adresse wallet correspond au format attendu pour la crypto sélectionnée.
 */
export function validateWalletAddress(crypto: CryptoType, address: string): boolean {
  const addr = (address || '').trim();
  if (!addr) return false;
  const pattern = PATTERNS[crypto];
  if (!pattern) return addr.length >= 20; // fallback prudent pour un type inconnu
  return pattern.test(addr);
}

/**
 * Message d'erreur localisé à afficher sous le champ adresse.
 */
export function getWalletAddressError(crypto: CryptoType, address: string): string | null {
  const addr = (address || '').trim();
  if (!addr) return null; // pas d'erreur tant que le champ est vide
  if (!validateWalletAddress(crypto, address)) {
    return `Adresse ${crypto} invalide. Vérifiez le format et le réseau sélectionné.`;
  }
  return null;
}
