import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { WalletTermsSheet } from './WalletTermsSheet';

// Écran « Ajoutez votre portefeuille ».
// Pas de connexion réelle pour l'instant : volontairement, aucun champ ne demande
// de phrase mnémonique ou de clé privée. Une vraie connexion viendra plus tard via
// WalletConnect, qui ne fait jamais transiter la clé par ce site.

function SetupContent({ onClose }: { onClose?: () => void }) {
  const [notice, setNotice] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  return (
    <>
      {onClose && (
        <div className="flex items-center justify-between px-4 h-14 shrink-0">
          <span className="font-semibold">Covesting Wallet</span>
          <button onClick={onClose} aria-label="Fermer" className="p-2 -mr-2 rounded-full hover:bg-secondary/60">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-7 text-center">
        <Logo size={56} to={null} variant="auto" />
        <h1 className="mt-8 text-2xl font-bold">Ajoutez votre portefeuille</h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-xs">
          Créez ou importez un portefeuille pour vous connecter.
        </p>
        {notice && (
          <p className="mt-6 text-sm text-primary max-w-xs">Cette fonctionnalité arrive bientôt.</p>
        )}
      </div>

      <div className="px-5 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] space-y-3 shrink-0 w-full max-w-md mx-auto">
        <p className="text-xs text-muted-foreground text-center">
          En utilisant les services du portefeuille Covesting, vous acceptez les{' '}
          <button type="button" onClick={() => setTermsOpen(true)} className="text-primary underline underline-offset-2">
            conditions d'utilisation
          </button>
          .
        </p>
        <button
          onClick={() => setNotice(true)}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold"
        >
          Restaurer un portefeuille sans clé
        </button>
        <button
          onClick={() => setNotice(true)}
          className="w-full py-3.5 rounded-xl bg-secondary/70 font-semibold"
        >
          Importer le portefeuille
        </button>
      </div>

      <WalletTermsSheet open={termsOpen} onClose={() => setTermsOpen(false)} />
    </>
  );
}

/** Version plein écran (ouverte depuis « Configurer le portefeuille »). */
export function WalletSetupDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => { /* garde le montage/démontage propre */ }, [open]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[80] bg-background flex flex-col" role="dialog" aria-modal="true" aria-label="Ajoutez votre portefeuille">
      <SetupContent onClose={onClose} />
    </div>,
    document.body,
  );
}

/** Version intégrée à une page (onglet Actifs quand aucun wallet n'est connecté). */
export function WalletSetupScreen() {
  return (
    <div className="flex flex-col min-h-[calc(100dvh-14rem)]">
      <SetupContent />
    </div>
  );
}
