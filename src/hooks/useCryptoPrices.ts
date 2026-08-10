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

export function useCryptoPrices() {
  const [prices, setPrices] = useState<CryptoPrice[]>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=1h,24h,7d`
        );
        if (!response.ok) throw new Error('Failed to fetch prices');
        const data = await response.json();
        const sorted = [...data].sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0));
        setPrices(sorted);
        setError(null);
      } catch (err) {
        setPrices([...FALLBACK].sort((a, b) => (b.market_cap || b.current_price) - (a.market_cap || a.current_price)));
        setError('Using cached prices');
      } finally {
        setLoading(false);
      }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  return { prices, loading, error };
}
