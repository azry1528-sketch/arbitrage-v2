import { useState, useEffect } from 'react';

export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  price_change_percentage_1h_in_currency?: number;
  price_change_percentage_7d_in_currency?: number;
  total_volume?: number;
  image: string;
  market_cap?: number;
  sparkline_in_7d?: { price: number[] };
}

const FALLBACK: CryptoPrice[] = [
  { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 97542, price_change_percentage_24h: 2.34, total_volume: 28_400_000_000, image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
  { id: 'ethereum', symbol: 'eth', name: 'Ethereum', current_price: 3245.67, price_change_percentage_24h: 1.89, total_volume: 12_100_000_000, image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
  { id: 'tether', symbol: 'usdt', name: 'Tether', current_price: 1, price_change_percentage_24h: 0.01, total_volume: 45_000_000_000, image: 'https://assets.coingecko.com/coins/images/325/small/Tether.png' },
  { id: 'binancecoin', symbol: 'bnb', name: 'BNB', current_price: 612.45, price_change_percentage_24h: 3.21, total_volume: 1_800_000_000, image: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png' },
  { id: 'solana', symbol: 'sol', name: 'Solana', current_price: 198.76, price_change_percentage_24h: 5.67, total_volume: 3_200_000_000, image: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
  { id: 'ripple', symbol: 'xrp', name: 'XRP', current_price: 2.34, price_change_percentage_24h: -0.56, total_volume: 2_100_000_000, image: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png' },
  { id: 'cardano', symbol: 'ada', name: 'Cardano', current_price: 0.98, price_change_percentage_24h: 4.12, total_volume: 620_000_000, image: 'https://assets.coingecko.com/coins/images/975/small/cardano.png' },
  { id: 'dogecoin', symbol: 'doge', name: 'Dogecoin', current_price: 0.34, price_change_percentage_24h: 2.11, total_volume: 980_000_000, image: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png' },
  { id: 'polkadot', symbol: 'dot', name: 'Polkadot', current_price: 7.89, price_change_percentage_24h: -1.23, total_volume: 210_000_000, image: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png' },
  { id: 'tron', symbol: 'trx', name: 'TRON', current_price: 0.24, price_change_percentage_24h: 1.02, total_volume: 480_000_000, image: 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png' },
  { id: 'avalanche-2', symbol: 'avax', name: 'Avalanche', current_price: 38.4, price_change_percentage_24h: 3.15, total_volume: 390_000_000, image: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png' },
  { id: 'chainlink', symbol: 'link', name: 'Chainlink', current_price: 18.2, price_change_percentage_24h: 2.72, total_volume: 410_000_000, image: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png' },
  { id: 'polygon-ecosystem-token', symbol: 'pol', name: 'Polygon', current_price: 0.52, price_change_percentage_24h: -0.44, total_volume: 145_000_000, image: 'https://assets.coingecko.com/coins/images/32440/small/polygon.png' },
  { id: 'litecoin', symbol: 'ltc', name: 'Litecoin', current_price: 108.5, price_change_percentage_24h: 1.32, total_volume: 320_000_000, image: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png' },
  { id: 'shiba-inu', symbol: 'shib', name: 'Shiba Inu', current_price: 0.000024, price_change_percentage_24h: 4.5, total_volume: 210_000_000, image: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png' },
  { id: 'uniswap', symbol: 'uni', name: 'Uniswap', current_price: 12.1, price_change_percentage_24h: 2.55, total_volume: 180_000_000, image: 'https://assets.coingecko.com/coins/images/12504/small/uni.jpg' },
  { id: 'stellar', symbol: 'xlm', name: 'Stellar', current_price: 0.42, price_change_percentage_24h: 0.9, total_volume: 95_000_000, image: 'https://assets.coingecko.com/coins/images/100/small/Stellar_symbol_black_RGB.png' },
  { id: 'cosmos', symbol: 'atom', name: 'Cosmos', current_price: 6.8, price_change_percentage_24h: -0.85, total_volume: 88_000_000, image: 'https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png' },
  { id: 'monero', symbol: 'xmr', name: 'Monero', current_price: 172.3, price_change_percentage_24h: 1.65, total_volume: 62_000_000, image: 'https://assets.coingecko.com/coins/images/69/small/monero_logo.png' },
  { id: 'ethereum-classic', symbol: 'etc', name: 'Ethereum Classic', current_price: 26.7, price_change_percentage_24h: 0.7, total_volume: 71_000_000, image: 'https://assets.coingecko.com/coins/images/453/small/ethereum-classic-logo.png' },
];

// ---------------------------------------------------------------------------
// Magasin partagé : UNE seule requête et UN seul timer pour toute l'application,
// quel que soit le nombre de composants qui appellent useCryptoPrices().
// ---------------------------------------------------------------------------
const CACHE_KEY = 'covesting:prices:v1';
const REFRESH_MS = 60_000;
const BACKOFF_MS = 120_000; // pause après un 429
const DIRECT_URL =
  'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=1h,24h,7d';

type State = { prices: CryptoPrice[]; loading: boolean; error: string | null };

const sortByCap = (list: CryptoPrice[]) =>
  [...list].sort((a, b) => (b.market_cap || b.current_price) - (a.market_cap || a.current_price));

function readCache(): CryptoPrice[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data } = JSON.parse(raw);
    return Array.isArray(data) && data.length ? data : null;
  } catch {
    return null;
  }
}

function writeCache(data: CryptoPrice[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), data }));
  } catch {
    /* stockage plein ou indisponible : on ignore */
  }
}

let state: State = { prices: readCache() ?? sortByCap(FALLBACK), loading: true, error: null };
const listeners = new Set<(s: State) => void>();
let timer: ReturnType<typeof setTimeout> | null = null;
let inFlight = false;

function setState(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l(state));
}

async function getJson(url: string): Promise<{ ok: boolean; status: number; data?: any }> {
  const res = await fetch(url);
  if (!res.ok) return { ok: false, status: res.status };
  return { ok: true, status: res.status, data: await res.json() };
}

async function refresh(): Promise<number> {
  if (inFlight) return REFRESH_MS;
  inFlight = true;
  let nextDelay = REFRESH_MS;
  try {
    // 1) proxy Vercel (réponse mise en cache côté CDN) ; 2) API directe en secours (dev local)
    let result: { ok: boolean; status: number; data?: any } | null = null;
    try {
      result = await getJson('/api/prices');
      if (result.ok && !Array.isArray(result.data)) result = null; // ex. index.html renvoyé en dev
    } catch {
      result = null;
    }
    if (!result || !result.ok) {
      try {
        result = await getJson(DIRECT_URL);
      } catch {
        result = null;
      }
    }

    if (result?.ok && Array.isArray(result.data) && result.data.length) {
      const sorted = sortByCap(result.data as CryptoPrice[]);
      writeCache(sorted);
      setState({ prices: sorted, error: null, loading: false });
    } else {
      if (result?.status === 429) nextDelay = BACKOFF_MS;
      // On garde les derniers prix connus (cache ou secours) au lieu de les écraser
      setState({ error: 'Using cached prices', loading: false });
    }
  } finally {
    inFlight = false;
  }
  return nextDelay;
}

function schedule(delay: number) {
  timer = setTimeout(async () => {
    const next = await refresh();
    if (listeners.size > 0) schedule(next);
  }, delay);
}

function subscribe(listener: (s: State) => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    // premier abonné : on démarre (ou on relance si le cache est périmé)
    refresh().then((next) => {
      if (listeners.size > 0 && timer === null) schedule(next);
    });
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
}

export function useCryptoPrices() {
  const [snapshot, setSnapshot] = useState<State>(state);

  useEffect(() => {
    setSnapshot(state);
    return subscribe(setSnapshot);
  }, []);

  return { prices: snapshot.prices, loading: snapshot.loading, error: snapshot.error };
}
