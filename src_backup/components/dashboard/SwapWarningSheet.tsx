import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { acknowledge, hasAcknowledged } from '@/lib/acknowledgements';
import { WarningSheet } from './WarningSheet';

// Avertissement affiché sur Portefeuille > Trader (Swapper) la première fois.
export function SwapWarningSheet() {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!hasAcknowledged('swap_warning', profile?.id)) setOpen(true);
  }, [profile?.id]);

  return (
    <WarningSheet
      open={open}
      confirmLabel="Accepter l'avertissement"
      checkLabel="Je comprends et accepte l'entière responsabilité de tous les risques."
      onConfirm={() => { acknowledge('swap_warning', profile?.id); setOpen(false); }}
    >
      <p>
        En effectuant un swap/transfert avec une application tierce, vous comprenez que cette transaction n'est pas
        effectuée par Covesting et que vous interagirez avec une application tierce. Covesting décline toute
        responsabilité quant à l'accès et à l'utilisation d'applications et de services tiers par l'intermédiaire du
        portefeuille Covesting. Vérifiez toujours la légitimité des applications tierces.
      </p>
    </WarningSheet>
  );
}
