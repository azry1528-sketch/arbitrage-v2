// Proxy CoinGecko avec cache CDN Vercel.
// Tous les visiteurs partagent la même réponse pendant 60 s, ce qui évite les erreurs 429.
// Optionnel : définis COINGECKO_API_KEY (clé "Demo" gratuite) dans les variables Vercel.
const URL_MARKETS =
  'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=1h,24h,7d';

export default async function handler(req, res) {
  try {
    const headers = { accept: 'application/json' };
    if (process.env.COINGECKO_API_KEY) headers['x-cg-demo-api-key'] = process.env.COINGECKO_API_KEY;

    const upstream = await fetch(URL_MARKETS, { headers });
    if (!upstream.ok) {
      res.setHeader('Cache-Control', 'public, s-maxage=30');
      return res.status(upstream.status).json({ error: `coingecko ${upstream.status}` });
    }
    const data = await upstream.json();
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(data);
  } catch (e) {
    res.setHeader('Cache-Control', 'public, s-maxage=15');
    return res.status(502).json({ error: 'proxy failure' });
  }
}
