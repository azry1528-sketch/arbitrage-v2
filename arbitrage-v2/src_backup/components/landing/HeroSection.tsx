import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, TrendingUp, Zap, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnimatedCounter } from '@/components/ui/ScrollReveal';

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex flex-col">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      </div>

      {/* Hero Content */}
      <div className="relative flex-1 flex items-center pt-32">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              <span className="text-sm font-medium text-primary">
                Arbitrage crypto automatisé
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold leading-tight mb-6"
            >
              Maximisez vos gains{' '}
              <span className="text-gradient-gold">avec l'Arbitrage</span>
              <br />
              Crypto
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
            >
              Notre algorithme d'arbitrage haute fréquence exploite les différences de prix entre
              les exchanges pour vous permettre de <span className="text-primary font-semibold">trader intelligemment</span>,
              manuellement ou via des bots automatiques.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            >
              <Button
                size="lg"
                className="btn-gold px-8 py-6 text-lg group"
                onClick={() => navigate('/register')}
              >
                Commencer à investir
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-6 text-lg border-border hover:bg-secondary"
                onClick={() => {
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Play className="mr-2 w-5 h-5" />
                Voir comment ça marche
              </Button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-success" />
                <span>Sécurité renforcée</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span>Trading manuel ou automatique</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent" />
                <span>Suivi en temps réel</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="relative bg-secondary/30 border-y border-border/50 py-8"
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gradient-gold">
                <AnimatedCounter value={47} prefix="$" suffix="M+" />
              </div>
              <div className="text-sm text-muted-foreground mt-1">Volume échangé</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gradient-gold">
                <AnimatedCounter value={12500} suffix="+" />
              </div>
              <div className="text-sm text-muted-foreground mt-1">Investisseurs actifs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gradient-gold">
                <AnimatedCounter value={50} suffix="+" />
              </div>
              <div className="text-sm text-muted-foreground mt-1">Exchanges connectés</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gradient-gold">
                <AnimatedCounter value={99.9} decimals={1} suffix="%" />
              </div>
              <div className="text-sm text-muted-foreground mt-1">Uptime plateforme</div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
