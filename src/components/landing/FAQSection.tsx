import { ScrollReveal } from '@/components/ui/ScrollReveal';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: "Qu'est-ce que l'arbitrage crypto ?",
    answer: "L'arbitrage crypto consiste à acheter une cryptomonnaie sur un exchange où son prix est bas, puis à la revendre immédiatement sur un autre exchange où son prix est plus élevé. Cette différence de prix génère un profit sans risque, car les deux transactions s'effectuent quasi-simultanément.",
  },
  {
    question: "Comment fonctionne l'arbitrage pour générer des gains ?",
    answer: "Notre algorithme haute fréquence analyse plus de 50 exchanges en temps réel et exécute des micro-transactions d'arbitrage en continu. Chaque écart de prix détecté représente un profit potentiel ; les résultats dépendent des conditions de marché et ne sont donc pas fixes ni garantis.",
  },
  {
    question: "Est-ce que je peux perdre mon argent ?",
    answer: "L'arbitrage vise à limiter l'exposition directionnelle en achetant et vendant quasi simultanément. Cela réduit certains risques, mais aucune activité de trading n'est totalement sans risque (latence d'exécution, frais, disponibilité de la liquidité, etc.).",
  },
  {
    question: "Quel est le montant minimum pour commencer ?",
    answer: "Vous pouvez commencer avec seulement 1$. C'est parfait pour tester la plateforme et voir les résultats par vous-même avant d'augmenter votre investissement.",
  },
  {
    question: "Combien de temps faut-il pour retirer mes gains ?",
    answer: "Les demandes de retrait sont traitées en moins de 24 heures. Une fois approuvé, les fonds sont envoyés immédiatement vers votre wallet crypto. Aucun montant minimum pour retirer.",
  },
  {
    question: "Comment fonctionne le programme de parrainage ?",
    answer: "Vous recevez 10% de tous les investissements effectués par les personnes que vous parrainez, à vie. Par exemple, si votre filleul investit 1000$, vous gagnez 100$ immédiatement. Les commissions sont cumulables sans limite.",
  },
  {
    question: "Mes fonds sont-ils en sécurité ?",
    answer: "Absolument. 95% des fonds sont stockés en cold wallet (hors ligne). Nous utilisons un chiffrement de niveau bancaire, l'authentification 2FA, et nos fonds sont assurés contre le vol et le piratage.",
  },
  {
    question: "Puis-je suivre mes gains en temps réel ?",
    answer: "Oui ! Notre tableau de bord affiche chaque transaction d'arbitrage en temps réel. Vous pouvez voir les achats, les ventes, et les profits générés seconde par seconde pendant vos sessions d'arbitrage.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/10 to-background" />
      
      <div className="container mx-auto px-4 relative">
        <ScrollReveal className="text-center mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            FAQ
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold mt-4 mb-6">
            Questions <span className="text-gradient-gold">fréquentes</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tout ce que vous devez savoir sur notre plateforme d'arbitrage crypto.
          </p>
        </ScrollReveal>

        <ScrollReveal className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="glass-card px-6 border-none"
              >
                <AccordionTrigger className="text-left hover:no-underline py-6 text-foreground">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollReveal>
      </div>
    </section>
  );
}
