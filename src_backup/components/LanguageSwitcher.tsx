import { Globe } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage, Lang } from '@/contexts/LanguageContext';

const OPTIONS: { value: Lang; label: string }[] = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
];

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { language, setLanguage } = useLanguage();
  return (
    <div className={className} translate="no">
      <Select value={language} onValueChange={(v) => setLanguage(v as Lang)}>
        <SelectTrigger className="h-8 w-auto gap-1.5 rounded-full border-border bg-card/90 px-3 text-xs backdrop-blur" aria-label="Language">
          <Globe className="w-3.5 h-3.5" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Sélecteur flottant sur les pages publiques (accueil, connexion, inscription). */
export function FloatingLanguageSwitcher() {
  const { pathname } = useLocation();
  if (!['/', '/login', '/register'].includes(pathname)) return null;
  return <LanguageSwitcher className="fixed bottom-3 left-3 z-50" />;
}
