import { useEffect, useState, type ReactNode } from 'react';
import { Check, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

interface WarningSheetProps {
  open: boolean;
  onConfirm: () => void;
  title?: string;
  children: ReactNode;
  confirmLabel: string;
  /** Si fourni : case à cocher obligatoire avant de pouvoir confirmer. */
  checkLabel?: string;
  /** Affiche l'icône « document + point d'exclamation » au-dessus du titre. */
  withIcon?: boolean;
}

/**
 * Feuille « Avertissement » façon Binance : poignée, titre, texte, (case à
 * cocher) et gros bouton jaune plein largeur. Non fermable en cliquant à côté :
 * l'utilisateur doit confirmer.
 */
export function WarningSheet({ open, onConfirm, title = 'Avertissement', children, confirmLabel, checkLabel, withIcon }: WarningSheetProps) {
  const [checked, setChecked] = useState(false);
  useEffect(() => { if (open) setChecked(false); }, [open]);

  const disabled = !!checkLabel && !checked;

  return (
    <Dialog open={open} onOpenChange={() => { /* confirmation obligatoire */ }}>
      <DialogContent
        hideClose
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="z-[90] gap-0 sm:max-w-md"
      >
        {withIcon ? (
          <div className="flex flex-col items-center">
            <div className="relative mt-1">
              <FileText className="w-20 h-20 text-foreground" strokeWidth={1.2} />
              <span className="absolute -bottom-1 -right-3 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">!</span>
            </div>
            <DialogTitle className="mt-4 text-xl font-semibold tracking-normal text-center">{title}</DialogTitle>
          </div>
        ) : (
          <DialogTitle className="text-xl font-semibold tracking-normal leading-snug">{title}</DialogTitle>
        )}

        <DialogDescription asChild>
          <div className="mt-4 space-y-1 text-[15px] leading-relaxed text-foreground/90">{children}</div>
        </DialogDescription>

        {checkLabel && (
          <>
            <div className="mt-6 border-t border-border" />
            <label className="mt-4 flex items-start gap-3 cursor-pointer select-none text-[15px] leading-snug">
              <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
              <span
                aria-hidden
                className={`mt-0.5 w-6 h-6 shrink-0 rounded-md flex items-center justify-center transition-colors ${checked ? 'bg-primary text-primary-foreground' : 'border-2 border-muted-foreground/60'}`}
              >
                {checked && <Check className="w-4 h-4" strokeWidth={3} />}
              </span>
              <span>{checkLabel}</span>
            </label>
          </>
        )}

        <button
          type="button"
          disabled={disabled}
          onClick={onConfirm}
          className="mt-5 w-full h-12 rounded-xl bg-primary text-primary-foreground text-base font-medium transition disabled:opacity-40 hover:brightness-95"
        >
          {confirmLabel}
        </button>
      </DialogContent>
    </Dialog>
  );
}
