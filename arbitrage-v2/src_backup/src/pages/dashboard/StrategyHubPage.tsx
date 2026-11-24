import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import StrategyPage from './StrategyPage';
import MarketsPage from './MarketsPage';

const TABS = ['marches', 'strategies'] as const;
type HubTab = (typeof TABS)[number];

// Page unique qui regroupe Stratégies et Marchés.
// (Les signaux restent dans Trade > Manuel, où ils sont exécutables.)
// L'onglet actif est porté par l'URL : /dashboard/strategy?tab=marches
export default function StrategyHubPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('tab');
  const tab: HubTab = TABS.includes(raw as HubTab) ? (raw as HubTab) : 'marches';

  const onChange = (value: string) => {
    const next = new URLSearchParams(params);
    next.set('tab', value);
    if (value !== 'marches') next.delete('q');
    setParams(next, { replace: true });
  };

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={onChange}>
        <TabsList className="grid grid-cols-2 w-full max-w-sm">
          <TabsTrigger value="marches">Marchés</TabsTrigger>
          <TabsTrigger value="strategies">Stratégies</TabsTrigger>
        </TabsList>
        <TabsContent value="marches" className="mt-6"><MarketsPage /></TabsContent>
        <TabsContent value="strategies" className="mt-6"><StrategyPage /></TabsContent>
      </Tabs>
    </div>
  );
}
