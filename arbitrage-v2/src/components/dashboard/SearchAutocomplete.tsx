import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';

const RECENT_KEY = 'covesting:recent-searches';
const MAX_SUGGESTIONS = 8;

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function readRecent(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(v) ? v.slice(0, 5) : [];
  } catch {
    return [];
  }
}

function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const i = norm(text).indexOf(norm(q));
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className="text-primary font-semibold">{text.slice(i, i + q.length)}</span>
      {text.slice(i + q.length)}
    </>
  );
}

interface Props {
  className?: string;
  inputClassName?: string;
}

// Barre de recherche avec autocomplétion : suggestions de cryptos au fil de la
// frappe (nom ou symbole), navigation clavier (↑ ↓ Entrée Échap) et recherches récentes.
export function SearchAutocomplete({ className = '', inputClassName = '' }: Props) {
  const navigate = useNavigate();
  const { prices } = useCryptoPrices();
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [recent, setRecent] = useState<string[]>(readRecent);
  const boxRef = useRef<HTMLDivElement>(null);

  const q = value.trim();

  const suggestions = useMemo(() => {
    if (!q) return [];
    const n = norm(q);
    return prices
      .map((c) => {
        const sym = c.symbol.toLowerCase();
        const name = norm(c.name);
        // Priorité : symbole exact > symbole commençant par > nom commençant par > contient
        let score = -1;
        if (sym === n) score = 0;
        else if (sym.startsWith(n)) score = 1;
        else if (name.startsWith(n)) score = 2;
        else if (sym.includes(n) || name.includes(n)) score = 3;
        return { c, score };
      })
      .filter((x) => x.score >= 0)
      .sort((a, b) => a.score - b.score)
      .slice(0, MAX_SUGGESTIONS)
      .map((x) => x.c);
  }, [prices, q]);

  const showRecent = open && !q && recent.length > 0;
  const showList = open && q.length > 0;
  // Ligne finale « Rechercher "..." » toujours présente quand on tape
  const total = suggestions.length + (q ? 1 : 0);

  useEffect(() => setActive(-1), [q]);

  useEffect(() => {
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, []);

  const go = (term: string) => {
    const t = term.trim();
    if (t) {
      const next = [t, ...recent.filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, 5);
      setRecent(next);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignoré */ }
    }
    setValue(t);
    setOpen(false);
    navigate(t ? `/dashboard/strategy?tab=marches&q=${encodeURIComponent(t)}` : '/dashboard/strategy?tab=marches');
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (total ? (i + 1) % total : -1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (total ? (i <= 0 ? total - 1 : i - 1) : -1));
    } else if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const pick = suggestions[active];
      go(pick ? pick.symbol.toUpperCase() : value);
    }
  };

  const clearRecent = () => {
    setRecent([]);
    try { localStorage.removeItem(RECENT_KEY); } catch { /* ignoré */ }
  };

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <Search className="w-4 h-4 absolute left-3 text-muted-foreground pointer-events-none" strokeWidth={2} />
        <input
          type="text"
          role="combobox"
          aria-expanded={showList || showRecent}
          aria-autocomplete="list"
          autoComplete="off"
          value={value}
          onChange={(e) => { setValue(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Rechercher des cryptos, produits..."
          className={`w-full pl-9 pr-8 rounded-md bg-secondary border border-transparent text-sm placeholder:text-muted-foreground input-premium ${inputClassName}`}
        />
        {value && (
          <button
            type="button"
            aria-label="Effacer la recherche"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { setValue(''); setOpen(true); }}
            className="absolute right-2 p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {(showList || showRecent) && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-md border border-border bg-card shadow-xl overflow-hidden max-h-[60vh] overflow-y-auto"
        >
          {showRecent && (
            <>
              <div className="flex items-center justify-between px-3 pt-2.5 pb-1 text-[11px] text-muted-foreground">
                <span>Recherches récentes</span>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={clearRecent} className="hover:text-foreground">
                  Effacer
                </button>
              </div>
              {recent.map((r) => (
                <button
                  key={r}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => go(r)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-secondary/70"
                >
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  {r}
                </button>
              ))}
            </>
          )}

          {showList && (
            <>
              {suggestions.map((c, i) => {
                const up = (c.price_change_percentage_24h ?? 0) >= 0;
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="option"
                    aria-selected={active === i}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(c.symbol.toUpperCase())}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left ${active === i ? 'bg-secondary' : 'hover:bg-secondary/70'}`}
                  >
                    <img src={c.image} alt="" className="w-6 h-6 rounded-full" loading="lazy" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium leading-tight">
                        <Highlight text={c.symbol.toUpperCase()} q={q} />
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        <Highlight text={c.name} q={q} />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm tabular-nums">
                        ${c.current_price.toLocaleString('fr-FR', { maximumFractionDigits: c.current_price < 1 ? 6 : 2 })}
                      </div>
                      <div className={`text-[11px] tabular-nums ${up ? 'text-success' : 'text-destructive'}`}>
                        {up ? '+' : ''}{(c.price_change_percentage_24h ?? 0).toFixed(2)}%
                      </div>
                    </div>
                  </button>
                );
              })}
              <button
                type="button"
                role="option"
                aria-selected={active === suggestions.length}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(suggestions.length)}
                onClick={() => go(q)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left border-t border-border ${active === suggestions.length ? 'bg-secondary' : 'hover:bg-secondary/70'}`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                <span className="truncate">
                  {suggestions.length === 0 ? 'Aucune crypto trouvée — chercher ' : 'Voir tous les résultats pour '}
                  « {q} »
                </span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
