import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'arbiflow_favorite_coins';

// Favoris persistants côté appareil (localStorage) — pas de table dédiée
// côté backend pour l'instant, mais le comportement est bien réel et
// persiste entre les sessions, comme un vrai système de favoris.
export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // stockage indisponible (mode privé, quota...) — on ignore silencieusement
    }
  }, [favorites]);

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  return { favorites, isFavorite, toggleFavorite };
}
