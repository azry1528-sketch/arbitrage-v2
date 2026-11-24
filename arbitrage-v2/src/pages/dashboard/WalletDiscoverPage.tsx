import { Compass } from 'lucide-react';

// Placeholder minimal — à construire. Reste volontairement dans /dashboard/portefeuille/*
// pour ne jamais faire basculer la barre de navigation ou le sélecteur Exchange/Portefeuille.
export default function WalletDiscoverPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
      <Compass className="w-12 h-12 opacity-50" strokeWidth={1.3} />
      <p className="mt-4 text-sm">Découvrir arrive bientôt dans le Portefeuille.</p>
    </div>
  );
}
