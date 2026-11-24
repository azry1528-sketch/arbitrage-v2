import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ui/ScrollReveal';
import { Shield, Award, Lock, CheckCircle2, FileCheck, Globe } from 'lucide-react';

const partners = [
  { name: 'Binance', slug: 'binance', color: 'F0B90B' },
  { name: 'Coinbase', slug: 'coinbase', color: '0052FF' },
  { name: 'Kraken', slug: 'kraken', color: '5741D9' },
  { name: 'Bybit', slug: 'bybit', color: 'F7A600' },
  { name: 'KuCoin', slug: 'kucoin', color: '24AE8F' },
  { name: 'Bitfinex', slug: 'bitfinex', color: '16B157' },
  { name: 'OKX', slug: 'okx', color: '000000' },
];

const certifications = [
  { icon: Shield, title: 'Licence MiCA', description: 'Régulé selon la réglementation européenne Markets in Crypto-Assets', badge: 'EU-2024-CA-0847' },
  { icon: FileCheck, title: 'Certifié SOC 2 Type II', description: 'Sécurité des données conforme aux standards internationaux', badge: 'AUDIT-2024' },
  { icon: Lock, title: 'Assurance Lloyd\'s', description: 'Vos fonds sont assurés jusqu\'à 250,000$ par compte', badge: 'POL-CX-9284' },
  { icon: Award, title: 'Membre FinCEN', description: 'Enregistrement en tant que Money Services Business', badge: 'MSB-31000217482' },
  { icon: Globe, title: 'Conforme RGPD', description: 'Protection totale de vos données personnelles', badge: 'GDPR-COMPLIANT' },
  { icon: CheckCircle2, title: 'Audit CertiK', description: 'Smart contracts audités par le leader mondial', badge: 'SCORE: 96/100' },
];

export function PartnersSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/10 to-background" />
      <div className="container mx-auto px-4 relative">
        <ScrollReveal className="text-center mb-12">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Sources de marché</span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold mt-4 mb-6">
            Connectés aux plus grands <span className="text-gradient-gold">exchanges</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Notre algorithme suit les prix et la liquidité de ces exchanges pour repérer des opportunités d'arbitrage.
          </p>
        </ScrollReveal>

        <ScrollReveal className="mb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
            {partners.map((partner) => (
              <div key={partner.slug} className="glass-card p-6 flex flex-col items-center justify-center aspect-square group hover:border-primary/50 transition-all">
                <div className="w-14 h-14 rounded-xl bg-white/95 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform overflow-hidden">
                  <img
                    src={`https://cdn.simpleicons.org/${partner.slug}/${partner.color}`}
                    alt={partner.name}
                    className="w-9 h-9 object-contain"
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <span className="text-sm text-muted-foreground font-medium">{partner.name}</span>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal className="text-center mb-12">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Régulé & Sécurisé</span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold mt-4 mb-6">
            Une plateforme <span className="text-gradient-gold">de confiance</span>
          </h2>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certifications.map((cert, index) => (
            <StaggerItem key={index}>
              <div className="glass-card p-6 h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <cert.icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-xs font-mono text-primary/80 bg-primary/10 px-2 py-1 rounded">{cert.badge}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{cert.title}</h3>
                <p className="text-sm text-muted-foreground">{cert.description}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <ScrollReveal className="mt-20 text-center">
          <p className="text-sm uppercase tracking-wider text-muted-foreground mb-8">Mentionné dans</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-60">
            {['Forbes', 'Bloomberg', 'CoinDesk', 'Reuters', 'The Block', 'Cointelegraph'].map((media) => (
              <div key={media} className="text-2xl font-serif font-bold text-muted-foreground hover:text-foreground transition-colors">
                {media}
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
