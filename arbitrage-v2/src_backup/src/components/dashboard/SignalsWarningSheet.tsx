import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { acknowledge, hasAcknowledged } from '@/lib/acknowledgements';
import { WarningSheet } from './WarningSheet';

// Avertissement affiché à l'ouverture des Signaux de trading (une fois par compte et par appareil).
export function SignalsWarningSheet() {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!hasAcknowledged('signals_warning', profile?.id)) setOpen(true);
  }, [profile?.id]);

  return (
    <WarningSheet
      open={open}
      withIcon
      confirmLabel="Je comprends"
      onConfirm={() => { acknowledge('signals_warning', profile?.id); setOpen(false); }}
    >
      <p>
        Les signaux de trading sont fournis à titre informatif uniquement et ne reposent sur aucune garantie de résultat.
      </p>
      <p>
        Aucun de ces signaux de trading ne constitue un conseil financier, juridique ou d'investissement (personnalisé
        ou autre). Covesting ne fait aucune déclaration et ne donne aucune garantie (expresse ou implicite) quant à
        l'exactitude, l'exhaustivité ou l'actualité des informations.
      </p>
      <p>
        En tant qu'utilisateur, vous reconnaissez être seul(e) responsable de vos décisions de trading et acceptez tous
        les risques associés.
      </p>
    </WarningSheet>
  );
}
