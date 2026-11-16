import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PopupButton } from '@/components/ui/popup';
import { Wallet, Bot, Zap, ArrowUpCircle, ChevronRight, ChevronLeft, Rocket } from 'lucide-react';

const STEPS = [
  {
    icon: Wallet,
    title: 'Bienvenue sur Covesting 🎉',
    text: "Votre compte a été créé avec succès. Voici un rapide tour pour bien démarrer votre activité d'arbitrage crypto.",
  },
  {
    icon: ArrowUpCircle,
    title: '1. Déposez des fonds',
    text: "Effectuez un dépôt depuis l'onglet Dépôts. Ce solde servira de capital pour vos bots de trading automatique.",
  },
  {
    icon: Bot,
    title: '2. Créez un bot',
    text: "Depuis l'onglet Trade, créez un bot en choisissant une paire, un niveau de risque, une stratégie d'arbitrage (avec ses propres paramètres) et un capital alloué. Le déploiement se fait en 4 étapes pour calibrer l'algorithme.",
  },
  {
    icon: Zap,
    title: '3. Surveillez vos crédits',
    text: "Chaque bot consomme des crédits de calcul pour trader. Vous démarrez avec un nombre limité de crédits par jour — rechargez-les pour prolonger votre session.",
  },
  {
    icon: Rocket,
    title: '4. Encaissez vos gains',
    text: "Les gains générés par vos bots sont automatiquement ajoutés à votre solde principal. Retirez-les à tout moment depuis l'onglet Retraits.",
  },
];

export function TutorialDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  const handleClose = () => { setStep(0); onClose(); };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center sm:items-start">
          <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mb-1">
            <Icon className="w-7 h-7 text-primary" strokeWidth={1.8} />
          </div>
          <DialogTitle>{current.title}</DialogTitle>
        </DialogHeader>
        <p className="text-[15px] text-foreground/80 leading-relaxed">{current.text}</p>
        <div className="flex items-center justify-center gap-1.5 py-2">
          {STEPS.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-primary' : 'w-1.5 bg-border'}`} />
          ))}
        </div>
        <div className="flex gap-2">
          {step > 0 && (
            <PopupButton variant="secondary" className="w-auto px-5" onClick={() => setStep((s) => s - 1)}>
              <ChevronLeft className="w-4 h-4" /> Précédent
            </PopupButton>
          )}
          <PopupButton className="flex-1" onClick={() => (isLast ? handleClose() : setStep((s) => s + 1))}>
            {isLast ? "C'est parti !" : 'Suivant'} {!isLast && <ChevronRight className="w-4 h-4" />}
          </PopupButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
