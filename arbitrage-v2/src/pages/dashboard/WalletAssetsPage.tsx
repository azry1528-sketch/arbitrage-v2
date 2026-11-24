import { Wallet } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { WalletSetupScreen } from '@/components/dashboard/WalletSetupDialog';

// Reste volontairement dans /dashboard/portefeuille/* pour ne jamais faire basculer
// la barre de navigation ou le sélecteur Exchange/Portefeuille.
export default function WalletAssetsPage() {
  const { hasWallet } = useWallet();

  // Pas encore de wallet : on affiche directement la page pour créer / importer le portefeuille.
  if (!hasWallet) return <WalletSetupScreen />;

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
      <Wallet className="w-12 h-12 opacity-50" strokeWidth={1.2} />
      <p className="mt-4 text-sm">Vos actifs apparaîtront ici.</p>
    </div>
  );
}
