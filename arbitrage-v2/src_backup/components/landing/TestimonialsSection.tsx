import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ui/ScrollReveal';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Sophie Martin',
    role: 'Investisseuse depuis 8 mois',
    avatar: 'SM',
    content: "J'ai commencé avec seulement 100$ et aujourd'hui mon portefeuille dépasse les 5000$. Le suivi en temps réel et la simplicité des retraits font toute la différence.",
    earnings: '+4,900$',
  },
  {
    name: 'Thomas Dubois',
    role: 'Trader indépendant',
    avatar: 'TD',
    content: "En tant que trader expérimenté, j'étais sceptique. Mais l'algorithme d'arbitrage est vraiment efficace. Je génère maintenant des revenus passifs sans effort.",
    earnings: '+12,350$',
  },
  {
    name: 'Marie Lefebvre',
    role: 'Entrepreneuse',
    avatar: 'ML',
    content: "La plateforme est intuitive et le support client est exceptionnel. J'ai parrainé 15 personnes et les commissions s'accumulent chaque jour.",
    earnings: '+8,200$',
  },
  {
    name: 'Lucas Bernard',
    role: 'Investisseur Gold',
    avatar: 'LB',
    content: "L'arbitrage automatisé a changé ma façon d'investir. En 6 mois, les gains cumulés m'ont permis de réduire mon activité salariée.",
    earnings: '+45,000$',
  },
  {
    name: 'Emma Petit',
    role: 'Étudiante',
    avatar: 'EP',
    content: "Parfait pour les étudiants ! Avec le plan Starter à 50$, je génère assez pour payer mes dépenses mensuelles. Simple et efficace.",
    earnings: '+1,250$',
  },
  {
    name: 'Nicolas Moreau',
    role: 'Investisseur Diamond',
    avatar: 'NM',
    content: "Le plan Diamond offre une vraie tranquillité d'esprit : je vois mes trades s'exécuter en direct et mes gains s'accumuler jour après jour. Merci ArbiFlow !",
    earnings: '+210,000$',
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative">
        <ScrollReveal className="text-center mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Témoignages
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold mt-4 mb-6">
            Ce que disent nos <span className="text-gradient-gold">investisseurs</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Rejoignez des milliers d'investisseurs satisfaits qui génèrent des revenus 
            passifs grâce à notre plateforme.
          </p>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <StaggerItem key={index}>
              <div className="glass-card p-6 h-full flex flex-col">
                {/* Quote icon */}
                <Quote className="w-10 h-10 text-primary/30 mb-4" />
                
                {/* Content */}
                <p className="text-foreground/90 mb-6 flex-1">
                  "{testimonial.content}"
                </p>

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>

                {/* Author */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-success font-bold">{testimonial.earnings}</div>
                    <div className="text-xs text-muted-foreground">Gains totaux</div>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
