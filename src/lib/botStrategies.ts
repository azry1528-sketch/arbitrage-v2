import { Zap, Layers, Activity, Bot, LucideIcon } from 'lucide-react';

export interface StrategyParamDef {
  key: string;
  label: string;
  type: 'number' | 'select';
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
  default: number | string;
  suffix?: string;
  help?: string;
}

export interface StrategyDef {
  id: string;
  name: string;
  icon: LucideIcon;
  risk: string;
  desc: string;
  params: StrategyParamDef[];
}

// Stratégies disponibles à la création d'un bot. Chacune a ses propres
// paramètres, configurables à la création et modifiables ensuite.
export const BOT_STRATEGIES: StrategyDef[] = [
  {
    id: 'inter',
    name: 'Arbitrage inter-exchanges',
    icon: Zap,
    risk: 'Faible',
    desc: "Achat sur un exchange à bas prix, revente instantanée sur un exchange à prix plus élevé. Aucune exposition directionnelle.",
    params: [
      {
        key: 'minSpreadPct', label: 'Écart minimum requis', type: 'number',
        min: 0.05, max: 2, step: 0.05, default: 0.15, suffix: '%',
        help: "Le bot n'exécute un trade que si l'écart de prix entre exchanges dépasse ce seuil.",
      },
      {
        key: 'exchangesMonitored', label: "Nombre d'exchanges surveillés", type: 'select',
        options: [
          { value: '3', label: '3 exchanges' },
          { value: '5', label: '5 exchanges' },
          { value: '7', label: '7 exchanges (tous)' },
        ],
        default: '5',
        help: 'Plus il y a d\'exchanges surveillés, plus le bot trouve d\'opportunités, mais consomme plus de crédits.',
      },
    ],
  },
  {
    id: 'triangular',
    name: 'Arbitrage triangulaire',
    icon: Layers,
    risk: 'Faible',
    desc: 'Exploitation des déséquilibres entre 3 paires de crypto sur un même exchange. Ultra-rapide et sécurisé.',
    params: [
      {
        key: 'minSpreadPct', label: 'Écart minimum requis', type: 'number',
        min: 0.05, max: 2, step: 0.05, default: 0.12, suffix: '%',
      },
      {
        key: 'pathLength', label: 'Longueur du cycle de conversion', type: 'select',
        options: [
          { value: '3', label: '3 paires (triangle simple)' },
          { value: '4', label: '4 paires (cycle étendu)' },
        ],
        default: '3',
        help: 'Un cycle plus long peut capter plus de spread mais augmente le délai d\'exécution.',
      },
    ],
  },
  {
    id: 'stat',
    name: 'Statistical arbitrage',
    icon: Activity,
    risk: 'Moyen',
    desc: 'Modèles statistiques et machine learning pour détecter des inefficiences de marché récurrentes.',
    params: [
      {
        key: 'lookbackMinutes', label: 'Fenêtre d\'analyse historique', type: 'number',
        min: 5, max: 180, step: 5, default: 30, suffix: 'min',
      },
      {
        key: 'confidenceThreshold', label: 'Seuil de confiance du modèle', type: 'select',
        options: [
          { value: '70', label: '70% (plus de trades)' },
          { value: '85', label: '85% (équilibré)' },
          { value: '95', label: '95% (prudent)' },
        ],
        default: '85',
      },
    ],
  },
  {
    id: 'mm',
    name: 'Market making AI',
    icon: Bot,
    risk: 'Moyen',
    desc: "Positionnement automatique sur le carnet d'ordres pour capter le spread bid/ask sur les paires liquides.",
    params: [
      {
        key: 'spreadTargetPct', label: 'Spread cible bid/ask', type: 'number',
        min: 0.05, max: 1, step: 0.05, default: 0.2, suffix: '%',
      },
      {
        key: 'orderSizePct', label: 'Taille d\'ordre', type: 'number',
        min: 1, max: 50, step: 1, default: 10, suffix: '% du capital',
      },
    ],
  },
];

export function getStrategy(id: string): StrategyDef {
  return BOT_STRATEGIES.find((s) => s.id === id) || BOT_STRATEGIES[0];
}

export function defaultConfigFor(strategyId: string): Record<string, number | string> {
  const strat = getStrategy(strategyId);
  const config: Record<string, number | string> = {};
  strat.params.forEach((p) => { config[p.key] = p.default; });
  return config;
}
