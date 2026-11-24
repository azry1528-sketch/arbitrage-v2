// Avertissements déjà acceptés (par appareil, par compte).
const key = (name: string, userId?: string | null) => `cov_ack_${name}_${userId || 'anon'}`;

export function hasAcknowledged(name: string, userId?: string | null): boolean {
  try { return localStorage.getItem(key(name, userId)) === '1'; } catch { return false; }
}

export function acknowledge(name: string, userId?: string | null) {
  try { localStorage.setItem(key(name, userId), '1'); } catch { /* stockage indisponible */ }
}
