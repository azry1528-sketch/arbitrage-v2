import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { Trophy, TrendingUp, Medal } from 'lucide-react';

const topInvestors = [
  { rank: 1, name: 'Alexander Müller', country: '🇩🇪 Allemagne', invested: 250000, earned: 87500, days: 45 },
  { rank: 2, name: 'Isabella Rossi', country: '🇮🇹 Italie', invested: 180000, earned: 63000, days: 40 },
  { rank: 3, name: 'François Dubois', country: '🇫🇷 France', invested: 150000, earned: 52500, days: 42 },
  { rank: 4, name: 'Erik Andersson', country: '🇸🇪 Suède', invested: 125000, earned: 43750, days: 38 },
  { rank: 5, name: 'Sofia García', country: '🇪🇸 Espagne', invested: 100000, earned: 35000, days: 35 },
  { rank: 6, name: 'James Whitmore', country: '🇬🇧 Royaume-Uni', invested: 95000, earned: 33250, days: 40 },
  { rank: 7, name: 'Anna Kowalski', country: '🇵🇱 Pologne', invested: 80000, earned: 28000, days: 32 },
  { rank: 8, name: 'Lars Jensen', country: '🇩🇰 Danemark', invested: 75000, earned: 26250, days: 30 },
  { rank: 9, name: 'Maria van der Berg', country: '🇳🇱 Pays-Bas', invested: 65000, earned: 22750, days: 28 },
  { rank: 10, name: 'Klaus Weber', country: '🇦🇹 Autriche', invested: 60000, earned: 21000, days: 30 },
];

const rankStyles: Record<number, { icon: any; color: string; bg: string }> = {
  1: { icon: Trophy, color: 'text-primary', bg: 'from-primary/20 to-primary/10' },
  2: { icon: Medal, color: 'text-slate-300', bg: 'from-slate-400/20 to-slate-500/20' },
  3: { icon: Medal, color: 'text-amber-700', bg: 'from-amber-700/20 to-amber-900/20' },
};

export function LeaderboardSection() {
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />

      <div className="container mx-auto px-4 relative">
        <ScrollReveal className="text-center mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Classement
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold mt-4 mb-6">
            Top <span className="text-gradient-gold">investisseurs</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Découvrez les meilleurs performeurs de ce mois. Ces investisseurs ont maximisé leurs rendements grâce à ArbiFlow.
          </p>
        </ScrollReveal>

        <ScrollReveal>
          <div className="glass-card overflow-hidden max-w-5xl mx-auto">
            {/* Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-secondary/50 text-sm font-medium text-muted-foreground border-b border-border">
              <div className="col-span-1">Rang</div>
              <div className="col-span-4">Investisseur</div>
              <div className="col-span-3">Pays</div>
              <div className="col-span-2 text-right">Investi</div>
              <div className="col-span-2 text-right">Gains</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border">
              {topInvestors.map((investor) => {
                const rankStyle = rankStyles[investor.rank];
                const RankIcon = rankStyle?.icon;
                
                return (
                  <div
                    key={investor.rank}
                    className={`grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-secondary/30 transition-colors ${
                      investor.rank <= 3 ? `bg-gradient-to-r ${rankStyle.bg}` : ''
                    }`}
                  >
                    <div className="col-span-1 flex items-center gap-2">
                      {RankIcon ? (
                        <RankIcon className={`w-5 h-5 ${rankStyle.color}`} />
                      ) : (
                        <span className="text-muted-foreground font-mono w-5 text-center">
                          {investor.rank}
                        </span>
                      )}
                    </div>
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm">
                        {investor.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-medium">{investor.name}</div>
                        <div className="text-xs text-muted-foreground">{investor.days} jours actif</div>
                      </div>
                    </div>
                    <div className="col-span-3 text-sm text-muted-foreground">
                      {investor.country}
                    </div>
                    <div className="col-span-2 text-right font-medium">
                      ${investor.invested.toLocaleString()}
                    </div>
                    <div className="col-span-2 text-right">
                      <div className="text-success font-bold flex items-center justify-end gap-1">
                        <TrendingUp className="w-4 h-4" />
                        +${investor.earned.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        +{((investor.earned / investor.invested) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
