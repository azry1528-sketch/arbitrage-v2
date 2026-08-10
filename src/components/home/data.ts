// Données du template d'accueil (basées sur le template Crypgo / Arbiflow)

export const headerData: { label: string; href: string }[] = [
  { label: "Fonctionnalités", href: "#work" },
  { label: "Avantages", href: "#development" },
  { label: "Services", href: "#portfolio" },
  { label: "Pourquoi nous", href: "#upgrade" },
  { label: "FAQ", href: "#faq" },
];

export const footerLabels: { label: string; href: string }[] = [
  { label: "Conditions", href: "#" },
  { label: "Mentions légales", href: "#" },
  { label: "Actualités", href: "#" },
];

export const brandList = [
  { image: "https://coin-images.coingecko.com/markets/images/52/small/binance.jpg", title: "Binance" },
  { image: "https://coin-images.coingecko.com/markets/images/23/small/Coinbase_Coin_Primary.png", title: "Coinbase" },
  { image: "https://assets.coingecko.com/markets/images/29/small/kraken.jpg", title: "Kraken" },
  { image: "https://coin-images.coingecko.com/markets/images/460/small/photo_2021-08-12_18-27-50.jpg", title: "Bybit" },
  { image: "https://assets.coingecko.com/markets/images/50/small/gemini.jpg", title: "Gemini" },
  { image: "https://assets.coingecko.com/markets/images/589/small/crypto_com.jpg", title: "Crypto.com" },
];

export const priceData: {
  title: string;
  short: string;
  icon: string;
  background: string;
  price: string;
  mark: string;
  width: number;
  height: number;
  padding: string;
}[] = [
  {
    title: "Bitcoin",
    short: "BTC/USD",
    icon: "/images/icons/icon-bitcoin.svg",
    background: "bg-[#f69e00]/20",
    price: "$93,291.24",
    mark: "$94,040.99 (-0.9%)",
    width: 18,
    height: 23,
    padding: "px-4 py-3",
  },
  {
    title: "Ethereum",
    short: "ETH/USD",
    icon: "/images/icons/icon-ethereum.svg",
    background: "bg-[#1dc8cd]/15",
    price: "$3,128.84",
    mark: "$4,878.26 (-35.9%)",
    width: 18,
    height: 23,
    padding: "px-4 py-2",
  },
  {
    title: "Polkadot",
    short: "DOT/USD",
    icon: "/images/icons/icon-bitcoin-circle.svg",
    background: "bg-[#f69e00]/20",
    price: "$443.27",
    mark: "$3,785.82 (-88.3%)",
    width: 46,
    height: 46,
    padding: "px-0 py-0",
  },
  {
    title: "Litecoin",
    short: "LTC/USD",
    icon: "/images/icons/icon-litecoin.svg",
    background: "bg-[#1dc8cd]/15",
    price: "$86.11",
    mark: "$410.26 (-79.1%)",
    width: 18,
    height: 23,
    padding: "px-4 py-3",
  },
  {
    title: "Solana",
    short: "SOL/USD",
    icon: "/images/icons/icon-solana.svg",
    background: "bg-[#1dc8cd]/15",
    price: "$238.70",
    mark: "$259.96 (-8.2%)",
    width: 24,
    height: 24,
    padding: "px-4 py-3",
  },
  {
    title: "Dogecoin",
    short: "DOGE/USD",
    icon: "/images/icons/icon-dogecoin.svg",
    background: "bg-[#1dc8cd]/15",
    price: "$0.394",
    mark: "$0.7316 (-46.2%)",
    width: 46,
    height: 46,
    padding: "px-0 py-0",
  },
];

export const portfolioData: { image: string; title: string }[] = [
  { image: "/images/portfolio/portfolio-icon-1.svg", title: "Suivez vos écarts de prix en temps réel" },
  { image: "/images/portfolio/portfolio-icon-2.svg", title: "Fonds protégés en portefeuille sécurisé" },
  { image: "/images/portfolio/portfolio-icon-3.svg", title: "Pilotez vos bots depuis votre mobile" },
];

export const upgradeData: { title: string }[] = [
  { title: "100% sécurisé" },
  { title: "Support dédié" },
  { title: "Frais d'arbitrage réduits" },
  { title: "Exécution en millisecondes" },
  { title: "Multi-exchanges" },
  { title: "Bots actifs 24/7" },
  { title: "Simple à utiliser" },
  { title: "Sans frais cachés" },
];

export const perksData: { icon: string; title: string; text: string; space: string }[] = [
  {
    icon: "/images/perks/peak-icon-1.svg",
    title: "Support 24/7",
    text: "Une question sur vos stratégies d'arbitrage ? Notre équipe répond rapidement à vos demandes.",
    space: "lg:mt-8",
  },
  {
    icon: "/images/perks/peak-icon-2.svg",
    title: "Communauté",
    text: "Échangez avec d'autres traders d'arbitrage à travers le monde.",
    space: "lg:mt-14",
  },
  {
    icon: "/images/perks/peak-icon-3.svg",
    title: "Académie",
    text: "Apprenez les mécanismes de l'arbitrage crypto gratuitement.",
    space: "lg:mt-4",
  },
];

export const timelineData: { icon: string; title: string; text: string }[] = [
  { icon: "/images/timeline/icon-planning.svg", title: "Détection", text: "Scan continu des écarts de prix entre exchanges" },
  { icon: "/images/timeline/icon-refinement.svg", title: "Analyse", text: "Validation de l'opportunité et du seuil de profit" },
  { icon: "/images/timeline/icon-prototype.svg", title: "Exécution", text: "Achat et revente automatisés en quelques millisecondes" },
  { icon: "/images/timeline/icon-support.svg", title: "Encaissement", text: "Le profit est crédité directement sur votre solde" },
];

export const faqData: { question: string; answer: string }[] = [
  { question: "Qu'est-ce qu'ArbiFlow ?", answer: "ArbiFlow est une plateforme d'arbitrage crypto : nos bots détectent les écarts de prix entre exchanges et les exploitent automatiquement pour générer un profit récurrent." },
  { question: "La plateforme est-elle disponible partout ?", answer: "Oui, ArbiFlow est accessible depuis la plupart des pays." },
  { question: "Quelles cryptomonnaies sont prises en charge ?", answer: "Nous prenons en charge Bitcoin, Ethereum, USDC et bien d'autres paires arbitrables." },
  { question: "Mes informations personnelles sont-elles sécurisées ?", answer: "Oui, nous priorisons votre sécurité avec un chiffrement avancé et des protocoles conformes." },
  { question: "Y a-t-il des frais de dépôt ou de retrait ?", answer: "Notre structure de frais est transparente. Consultez la page tarifs pour le détail." },
  { question: "Comment fonctionnent les bots d'arbitrage ?", answer: "Chaque bot surveille plusieurs exchanges en continu et exécute automatiquement l'achat/revente dès qu'un écart de prix dépasse le seuil de profit que vous avez défini." },
];

export const globalReachData: { count: number; prefix?: string; postfix?: string; title: string }[] = [
  { count: 6, postfix: "M+", title: "Utilisateurs actifs" },
  { count: 247, title: "Support utilisateurs" },
  { count: 160, postfix: "+", title: "Pays" },
  { count: 22, prefix: "$", postfix: "B+", title: "Volume arbitré" },
];
