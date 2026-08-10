import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ui/ScrollReveal';
import { UserPlus, Wallet, Play, Banknote } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    number: '01',
    title: 'Créez votre compte',
    description: "Inscription gratuite en moins de 2 minutes. Vérification d'identité simple et rapide.",
  },
  {
    icon: Wallet,
    number: '02',
    title: 'Déposez vos fonds',
    description: 'Dépôt minimum de 1$ en crypto. Bitcoin, Ethereum, USDT acceptés.',
  },
  {
    icon: Play,
    number: '03',
    title: "Lancez l'arbitrage",
    description: "Activez votre session d'arbitrage et regardez les trades s'exécuter en temps réel.",
  },
  {
    icon: Banknote,
    number: '04',
    title: 'Récoltez vos gains',
    description: 'Suivez vos gains en temps réel et demandez un retrait quand vous le souhaitez.',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      <div className="container mx-auto px-4">
        <ScrollReveal className="text-center mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Processus simple
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold mt-4 mb-6">
            Comment <span className="text-gradient-gold">ça fonctionne</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Quatre étapes simples pour commencer à générer des revenus passifs 
            avec notre système d'arbitrage automatisé.
          </p>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <StaggerItem key={index}>
              <div className="relative">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent z-0" />
                )}
                
                <div className="glass-card p-8 text-center relative z-10">
                  {/* Step number */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-sm font-bold rounded-full">
                    {step.number}
                  </div>
                  
                  {/* Icon */}
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6 mt-4">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
