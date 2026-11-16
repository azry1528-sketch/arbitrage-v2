import * as React from "react";
import { cn } from "@/lib/utils";

// Boutons des popups « feuille du bas » (style Binance) : pleine largeur, 48px, arrondi.
export const PopupButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" }>(
  ({ className, variant = "primary", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "w-full h-12 rounded-xl text-base font-medium transition disabled:opacity-40 disabled:pointer-events-none inline-flex items-center justify-center gap-2",
        variant === "primary" ? "bg-primary text-primary-foreground hover:brightness-95" : "bg-secondary text-foreground hover:bg-secondary/80",
        className,
      )}
      {...props}
    />
  ),
);
PopupButton.displayName = "PopupButton";

// Overlay + feuille pour les modales construites à la main (mobile : en bas ; ≥ sm : centrée).
export function PopupShell({ onClose, children, className }: { onClose: () => void; children: React.ReactNode; className?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 sm:p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-card rounded-t-3xl sm:rounded-2xl sm:border sm:border-border px-5 pt-7 pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] sm:p-6",
          className,
        )}
      >
        <span aria-hidden className="absolute left-1/2 top-2.5 h-1 w-10 -translate-x-1/2 rounded-full bg-muted-foreground/40 sm:hidden" />
        {children}
      </div>
    </div>
  );
}
