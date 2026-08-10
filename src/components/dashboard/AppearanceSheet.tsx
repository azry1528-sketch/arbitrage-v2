import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';

// Reprend l'offcanvas "Appearance" du template Forexo : réglages de compte
// et généraux sous forme d'interrupteurs. Le mode sombre/clair est ici
// réellement branché sur le thème de l'app ; les autres réglages sont des
// préférences locales à l'appareil (comme dans le template d'origine).
export function AppearanceSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { theme, setTheme } = useLanguage();
  const [autoUpdates, setAutoUpdates] = useState(true);
  const [showOnline, setShowOnline] = useState(true);
  const [notifPopup, setNotifPopup] = useState(true);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Apparence</SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          <h6 className="text-sm font-semibold text-muted-foreground mb-3">Affichage</h6>
          <div className="flex items-center justify-between py-2">
            <Label htmlFor="theme-switch">Thème sombre</Label>
            <Switch id="theme-switch" checked={theme === 'dark'} onCheckedChange={(v) => setTheme(v ? 'dark' : 'light')} />
          </div>
        </div>

        <div className="mt-6">
          <h6 className="text-sm font-semibold text-muted-foreground mb-3">Compte</h6>
          <div className="flex items-center justify-between py-2">
            <Label htmlFor="auto-updates">Mises à jour automatiques</Label>
            <Switch id="auto-updates" checked={autoUpdates} onCheckedChange={setAutoUpdates} />
          </div>
          <div className="flex items-center justify-between py-2">
            <Label htmlFor="show-online">Visible comme en ligne</Label>
            <Switch id="show-online" checked={showOnline} onCheckedChange={setShowOnline} />
          </div>
          <div className="flex items-center justify-between py-2">
            <Label htmlFor="notif-popup">Notifications popup</Label>
            <Switch id="notif-popup" checked={notifPopup} onCheckedChange={setNotifPopup} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
