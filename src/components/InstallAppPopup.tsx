import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Download, Zap, Share, PlusSquare, MoreVertical, X, Wifi, Bell, Gauge,
} from 'lucide-react';
import {
  isAppInstalled,
  hasNativeInstallPrompt,
  onPwaInstallEvent,
  triggerNativeInstallPrompt,
  getPlatformInfo,
} from '@/lib/pwaInstall';

interface InstallAppPopupProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Popup "Installer l'application" affichée après la connexion ou
 * l'inscription. Elle s'adapte à la plateforme :
 * - Android / Chrome / Edge (desktop & mobile) : bouton d'installation natif.
 * - iOS / Safari : instructions manuelles (Partager -> Sur l'écran d'accueil),
 *   car Apple ne propose pas d'API d'installation programmatique.
 * - Autres navigateurs (Firefox desktop, etc.) : instructions génériques via
 *   le menu du navigateur.
 */
export function InstallAppPopup({ open, onClose }: InstallAppPopupProps) {
  const [canPromptNatively, setCanPromptNatively] = useState(hasNativeInstallPrompt());
  const [installing, setInstalling] = useState(false);
  const { isIOS, isAndroid, isSafari, isFirefox } = getPlatformInfo();

  useEffect(() => {
    const unsubscribe = onPwaInstallEvent(() => {
      setCanPromptNatively(hasNativeInstallPrompt());
    });
    return unsubscribe;
  }, []);

  // Si l'app est déjà installée (mode standalone), on ne montre jamais la popup.
  if (!open || isAppInstalled()) return null;

  const handleInstallClick = async () => {
    if (!canPromptNatively) return;
    setInstalling(true);
    const outcome = await triggerNativeInstallPrompt();
    setInstalling(false);
    if (outcome === 'accepted' || outcome === 'dismissed') {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        hideClose
        className="sm:max-w-sm p-0 overflow-hidden border-2 border-primary/40 shadow-[0_0_60px_rgba(212,175,55,0.25)]"
      >
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-2.5 top-2.5 z-10 w-7 h-7 rounded-full bg-background/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Bandeau supérieur */}
        <div className="bg-gradient-to-br from-primary/20 via-secondary to-accent/20 px-5 pt-6 pb-4 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse-glow">
            <Zap className="w-7 h-7 text-primary-foreground" />
          </div>
          <h2 className="text-lg font-serif font-bold">
            Installez <span className="text-gradient-gold">ArbiFlow</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1.5">
            Ajoutez l'application sur votre appareil pour un accès plus rapide,
            même hors ligne.
          </p>
        </div>

        <div className="px-5 py-4 space-y-3">
          {/* Bénéfices */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="glass-card p-2">
              <Gauge className="w-4 h-4 mx-auto mb-1 text-primary" />
              <div className="text-[10px] text-muted-foreground">Accès instantané</div>
            </div>
            <div className="glass-card p-2">
              <Bell className="w-4 h-4 mx-auto mb-1 text-primary" />
              <div className="text-[10px] text-muted-foreground">Notifications</div>
            </div>
            <div className="glass-card p-2">
              <Wifi className="w-4 h-4 mx-auto mb-1 text-primary" />
              <div className="text-[10px] text-muted-foreground">Hors ligne</div>
            </div>
          </div>

          {/* Action principale : Android / Chrome / Edge avec prompt natif */}
          {canPromptNatively && (
            <Button
              className="w-full btn-gold py-4 text-sm"
              onClick={handleInstallClick}
              disabled={installing}
            >
              <Download className="mr-2 w-4 h-4" />
              {installing ? 'Installation...' : "Installer l'application"}
            </Button>
          )}

          {/* Instructions iOS (pas d'API native d'installation sur Safari) */}
          {!canPromptNatively && isIOS && (
            <div className="glass-card p-3 space-y-2">
              <p className="text-xs font-medium">Comment installer sur iPhone / iPad :</p>
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <span className="w-6 h-6 shrink-0 rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold text-[11px]">1</span>
                <span className="flex items-center gap-1">
                  Appuyez sur <Share className="w-3.5 h-3.5 inline text-primary" /> (Partager) dans Safari
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <span className="w-6 h-6 shrink-0 rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold text-[11px]">2</span>
                <span className="flex items-center gap-1">
                  Sélectionnez <PlusSquare className="w-3.5 h-3.5 inline text-primary" /> « Sur l'écran d'accueil »
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                <span className="w-6 h-6 shrink-0 rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold text-[11px]">3</span>
                <span>Confirmez avec « Ajouter »</span>
              </div>
            </div>
          )}

          {/* Instructions génériques (Firefox desktop, Safari desktop, ou navigateur
              Android/Chrome dont l'événement natif n'a pas encore été proposé) */}
          {!canPromptNatively && !isIOS && (
            <div className="glass-card p-3 space-y-2">
              <p className="text-xs font-medium">Comment installer :</p>
              {isFirefox ? (
                <p className="text-xs text-muted-foreground">
                  Ouvrez le menu <MoreVertical className="w-3.5 h-3.5 inline text-primary" /> de votre
                  navigateur puis choisissez « Installer » ou « Ajouter à l'écran d'accueil ».
                </p>
              ) : isAndroid ? (
                <p className="text-xs text-muted-foreground">
                  Ouvrez le menu <MoreVertical className="w-3.5 h-3.5 inline text-primary" /> de Chrome
                  puis appuyez sur « Installer l'application » ou « Ajouter à l'écran d'accueil ».
                </p>
              ) : isSafari ? (
                <p className="text-xs text-muted-foreground">
                  Cliquez sur <Share className="w-3.5 h-3.5 inline text-primary" /> (Partager) dans la
                  barre d'adresse puis choisissez « Ajouter au Dock ».
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Cliquez sur l'icône d'installation <Download className="w-3.5 h-3.5 inline text-primary" /> dans
                  la barre d'adresse de votre navigateur, ou ouvrez son menu et choisissez « Installer
                  l'application ».
                </p>
              )}
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Plus tard
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
