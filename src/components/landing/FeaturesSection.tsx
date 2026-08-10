import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ui/ScrollReveal';
import { 
  Zap, 
  Shield, 
  TrendingUp, 
  Clock, 
  Users, 
  Lock,
  BarChart3,
  Wallet
} from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Arbitrage Automatique',
    description: "Notre algorithme analyse 50+ exchanges en temps réel pour détecter les opportunités d'arbitrage.",
  },
  {
    icon: Shield,
    title: 'Zéro Risque',
    description: "L'arbitrage exploite les différences de prix. Pas de spéculation, pas de pertes possibles.",
  },
  {
    icon: TrendingUp,
    title: 'Manuel ou Automatique',
    description: 'Exécutez vos propres trades sur nos signaux ou déléguez à un bot qui trade pour vous 24/7.',
  },
  {
    icon: Clock,
    title: 'Retraits 24/7',
    description: 'Retirez vos gains à tout moment. Traitement en moins de 24 heures.',
  },
  {
    icon: Users,
    title: 'Programme Parrainage',
    description: 'Gagnez 10% sur les investissements de vos filleuls à vie.',
  },
  {
    icon: Lock,
    title: 'Sécurité Maximale',
    description: 'Fonds stockés en cold wallet avec assurance. Authentification 2FA disponible.',
  },
  {
    icon: BarChart3,
    title: 'Tableau de Bord Live',
    description: 'Suivez vos trades et gains en temps réel avec notre interface intuitive.',
  },
  {
    icon: Wallet,
    title: 'Dépôts dès 50$',
    description: "Commencez petit et grandissez. Aucun montant minimum pour retirer.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      
      <div className="container mx-auto px-4 relative">
        <ScrollReveal className="text-center mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Pourquoi nous choisir
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold mt-4 mb-6">
            La technologie au service de{' '}
            <span className="text-gradient-gold">votre stratégie</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            ArbiFlow combine une technologie d'arbitrage éprouvée, un tableau de bord en temps réel
            et un contrôle total — manuel ou automatisé — pour trader en toute confiance.
          </p>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {features.map((feature, index) => (
            <StaggerItem key={index}>
              <div className="glass-card p-6 h-full group cursor-default">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
