import { supabase } from '@/integrations/supabase/client';

/**
 * Traducteur automatique de l'interface.
 *
 * Tout texte affiché (nœuds texte + placeholder / title / aria-label) est traduit
 * dans la langue choisie. Les traductions viennent du cache local, puis du cache
 * global en base, puis de DeepL (fonction `translate-texts`). Un MutationObserver
 * traduit aussi tout ce que React affiche ensuite (pages, popups, toasts...).
 *
 * - On ne touche jamais aux champs de saisie, <code>, <pre>, ni aux éléments
 *   marqués translate="no".
 * - L'espace admin reste en français.
 * - Retour au français : rechargement de la page (restauration garantie).
 */

type Cache = Record<string, string>;
type Applied = { lang: string; value: string };

const ATTRS = ['placeholder', 'title', 'aria-label'] as const;
const CACHE_KEY = (lang: string) => `tr_cache_v1_${lang}`;
const MAX_CACHE_CHARS = 1_500_000;

let currentLang = 'fr';
let observer: MutationObserver | null = null;
let runTimer: number | undefined;
let persistTimer: number | undefined;
let backoffUntil = 0;

const caches = new Map<string, Cache>();
const inFlight = new Set<string>();

const textOriginal = new WeakMap<Text, string>();
const textApplied = new WeakMap<Text, Applied>();
const attrOriginal = new WeakMap<Element, Record<string, string>>();
const attrApplied = new WeakMap<Element, Record<string, Applied>>();

function cacheFor(lang: string): Cache {
  let c = caches.get(lang);
  if (!c) {
    try { c = JSON.parse(localStorage.getItem(CACHE_KEY(lang)) || '{}'); } catch { c = {}; }
    caches.set(lang, c as Cache);
  }
  return c as Cache;
}

function schedulePersist(lang: string) {
  window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(() => {
    try {
      const s = JSON.stringify(cacheFor(lang));
      if (s.length < MAX_CACHE_CHARS) localStorage.setItem(CACHE_KEY(lang), s);
    } catch { /* stockage plein ou indisponible */ }
  }, 1000);
}

function translatable(s: string): boolean {
  if (s.length > 600 || !/\p{L}{2,}/u.test(s)) return false;
  if (/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(s)) return false; // e-mail
  if (/^(https?:\/\/|www\.)\S+$/i.test(s)) return false; // URL
  return true;
}

function skipped(el: Element | null): boolean {
  if (!el) return true;
  return !!el.closest('[translate="no"], script, style, noscript, textarea, code, pre, [contenteditable="true"]');
}

interface Item {
  src: string;
  apply: (translated: string) => void;
}

function collect(root: ParentNode): Item[] {
  const items: Item[] = [];
  const lang = currentLang;

  // --- Nœuds texte ---
  const walker = document.createTreeWalker(root as Node, NodeFilter.SHOW_TEXT);
  let n: Node | null;
  while ((n = walker.nextNode())) {
    const node = n as Text;
    if (skipped(node.parentElement)) continue;
    const value = node.nodeValue ?? '';
    const applied = textApplied.get(node);

    let original: string;
    if (applied && applied.value === value) {
      if (applied.lang === lang) continue;         // déjà dans la bonne langue
      original = textOriginal.get(node) ?? value;  // changement de langue : on repart de l'original
    } else {
      original = value;                            // nouveau texte (ou React a réécrit le nœud)
      textOriginal.set(node, value);
    }

    const src = original.trim();
    if (!translatable(src)) continue;
    const lead = original.match(/^\s*/)![0];
    const trail = original.match(/\s*$/)![0];
    items.push({
      src,
      apply: (tr) => {
        const next = lead + tr + trail;
        if (node.nodeValue !== next) node.nodeValue = next;
        textApplied.set(node, { lang, value: next });
      },
    });
  }

  // --- Attributs ---
  const sel = ATTRS.map((a) => `[${a}]`).join(',');
  const els: Element[] = [];
  if (root instanceof Element && root.matches(sel)) els.push(root);
  root.querySelectorAll(sel).forEach((e) => els.push(e));
  for (const el of els) {
    if (skipped(el)) continue;
    for (const attr of ATTRS) {
      const value = el.getAttribute(attr);
      if (value == null) continue;
      const applied = attrApplied.get(el)?.[attr];
      let original: string;
      if (applied && applied.value === value) {
        if (applied.lang === lang) continue;
        original = attrOriginal.get(el)?.[attr] ?? value;
      } else {
        original = value;
        attrOriginal.set(el, { ...(attrOriginal.get(el) || {}), [attr]: value });
      }
      const src = original.trim();
      if (!translatable(src)) continue;
      items.push({
        src,
        apply: (tr) => {
          if (el.getAttribute(attr) !== tr) el.setAttribute(attr, tr);
          attrApplied.set(el, { ...(attrApplied.get(el) || {}), [attr]: { lang, value: tr } });
        },
      });
    }
  }
  return items;
}

async function fetchMissing(lang: string, missing: string[]) {
  const todo = missing.filter((s) => !inFlight.has(`${lang}|${s}`));
  if (!todo.length || Date.now() < backoffUntil) return;
  todo.forEach((s) => inFlight.add(`${lang}|${s}`));

  // Lots de 50 textes / ~4500 caractères
  const batches: string[][] = [];
  let cur: string[] = [], size = 0;
  for (const s of todo) {
    if (cur.length >= 50 || (cur.length && size + s.length > 4500)) { batches.push(cur); cur = []; size = 0; }
    cur.push(s); size += s.length;
  }
  if (cur.length) batches.push(cur);

  await Promise.all(batches.map(async (texts) => {
    try {
      const { data, error } = await supabase.functions.invoke('translate-texts', { body: { lang, texts } });
      if (error) throw error;
      const tr = (data as any)?.translations as Cache | undefined;
      if (tr) {
        Object.assign(cacheFor(lang), tr);
        schedulePersist(lang);
      }
      if ((data as any)?.error) backoffUntil = Date.now() + 60_000; // clé manquante / limite atteinte
    } catch {
      backoffUntil = Date.now() + 30_000; // on réessaiera plus tard, le texte reste en français
    } finally {
      texts.forEach((s) => inFlight.delete(`${lang}|${s}`));
    }
  }));
  if (currentLang === lang) schedule();
}

function run() {
  if (currentLang === 'fr' || location.pathname.startsWith('/admin')) return;
  const lang = currentLang;
  const cache = cacheFor(lang);
  const missing = new Set<string>();
  for (const it of collect(document.body)) {
    const tr = cache[it.src];
    if (tr !== undefined) it.apply(tr);
    else missing.add(it.src);
  }
  if (missing.size) void fetchMissing(lang, [...missing]);
}

function schedule() {
  window.clearTimeout(runTimer);
  runTimer = window.setTimeout(run, 120);
}

export function startAutoTranslate(lang: string) {
  currentLang = lang;
  document.documentElement.lang = lang;
  if (lang === 'fr') {
    observer?.disconnect();
    observer = null;
    return;
  }
  if (!observer) {
    observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...ATTRS],
    });
  }
  schedule();
}
