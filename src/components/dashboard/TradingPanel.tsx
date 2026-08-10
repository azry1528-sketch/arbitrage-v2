import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Edit, X, Mail, PenSquare, BellRing } from 'lucide-react';
import { CryptoPrice } from '@/hooks/useCryptoPrices';

// Reprend le gros bloc à onglets du template Forexo (Trades / History / News
// / Calendar / Mailbox / Alerts). Comme dans le template d'origine, les
// données affichées ici sont des exemples de démonstration : aucune donnée
// réelle de trading n'est disponible côté app pour cette maquette.

function seedTrades(prices: CryptoPrice[]) {
  const types: Array<'Achat' | 'Vente'> = ['Achat', 'Vente'];
  return prices.slice(0, 6).map((c, i) => ({
    symbol: `${c.symbol.toUpperCase()}/USDT`,
    ticket: 12000000 + i * 481293,
    date: new Date(Date.now() - i * 3600_000).toLocaleString('fr-FR'),
    type: types[i % 2],
    volume: (0.05 + i * 0.02).toFixed(2),
    price: c.current_price,
    profit: (c.price_change_percentage_24h * 12.4).toFixed(2),
  }));
}

export function TradingPanel({ prices }: { prices: CryptoPrice[] }) {
  const trades = useMemo(() => seedTrades(prices), [prices]);

  return (
    <div className="glass-card p-4 md:p-6">
      <Tabs defaultValue="trades">
        <TabsList className="flex flex-wrap h-auto bg-transparent gap-1 justify-start p-0 border-b border-border rounded-none mb-4">
          <TabsTrigger value="trades" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">Positions</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">Historique</TabsTrigger>
          <TabsTrigger value="news" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">Actualités</TabsTrigger>
          <TabsTrigger value="calendar" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">Calendrier</TabsTrigger>
          <TabsTrigger value="mailbox" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">Messagerie</TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">Alertes</TabsTrigger>
        </TabsList>

        {/* Positions ouvertes */}
        <TabsContent value="trades">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbole</TableHead>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.map((tr) => (
                  <TableRow key={tr.ticket}>
                    <TableCell className="font-medium">{tr.symbol}</TableCell>
                    <TableCell className="text-muted-foreground">{tr.ticket}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{tr.date}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${tr.type === 'Achat' ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}`}>{tr.type}</span>
                    </TableCell>
                    <TableCell>{tr.volume}</TableCell>
                    <TableCell>${tr.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                    <TableCell className={`text-right font-medium ${Number(tr.profit) >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {Number(tr.profit) >= 0 ? '+' : ''}{tr.profit}
                    </TableCell>
                    <TableCell className="text-right">
                      <button className="text-muted-foreground hover:text-destructive"><X className="w-4 h-4 inline" /></button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Historique */}
        <TabsContent value="history">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-secondary/40 rounded-xl p-4 lg:col-span-1">
              <p className="my-2 text-sm font-medium flex justify-between"><span className="text-muted-foreground">Profit</span><span className="text-success">+2 254.94 USDT</span></p>
              <p className="my-2 text-sm font-medium flex justify-between"><span className="text-muted-foreground">Dépôts</span><span>200.00 USDT</span></p>
              <p className="my-2 text-sm font-medium flex justify-between"><span className="text-muted-foreground">Frais</span><span className="text-destructive">-2.34 USDT</span></p>
              <p className="my-2 text-sm font-medium flex justify-between"><span className="text-muted-foreground">Commission</span><span>0.00 USDT</span></p>
              <hr className="hr-dashed" />
              <p className="text-sm font-bold flex justify-between"><span>Total</span><span className="text-primary">2 336.50 USDT</span></p>
            </div>
            <div className="lg:col-span-2 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbole</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.slice(0, 4).map((tr) => (
                    <TableRow key={tr.ticket}>
                      <TableCell className="font-medium">{tr.symbol}</TableCell>
                      <TableCell>{tr.type}</TableCell>
                      <TableCell>{tr.volume}</TableCell>
                      <TableCell className={`text-right font-medium ${Number(tr.profit) >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {Number(tr.profit) >= 0 ? '+' : ''}{tr.profit}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* Actualités */}
        <TabsContent value="news">
          <Accordion type="single" collapsible className="space-y-2">
            {[
              { title: 'Le Bitcoin franchit un nouveau seuil de résistance', author: 'Léa Dubois', time: 'il y a 40 min', body: "Le BTC a testé un nouveau plus haut cette semaine, porté par des volumes en hausse sur les principales plateformes d'échange. Les analystes restent partagés sur la suite de la tendance." },
              { title: 'ETH/USDT : consolidation avant la prochaine mise à jour du réseau', author: 'Marc Petit', time: 'il y a 1 h', body: "Ethereum évolue dans un range serré à l'approche d'une mise à jour réseau majeure, les traders privilégiant la prudence à court terme." },
              { title: 'Les stablecoins gagnent du terrain sur les marchés émergents', author: 'Équipe ArbiFlow', time: 'il y a 2 h', body: "L'usage des stablecoins continue de progresser comme moyen de paiement transfrontalier, notamment sur les corridors à forte volatilité monétaire locale." },
            ].map((n, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border border-border rounded-lg px-3">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                  <div className="text-left">
                    {n.title}
                    <span className="block text-xs font-normal italic text-muted-foreground mt-1">{n.author} · {n.time}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{n.body}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>

        {/* Calendrier économique */}
        <TabsContent value="calendar">
          <EconomicCalendarWidget />
        </TabsContent>

        {/* Messagerie interne */}
        <TabsContent value="mailbox">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1 border-r border-border/50 pr-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm">Boîte de réception</h4>
                <button className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-primary/10 text-primary"><PenSquare className="w-3 h-3" /> Nouveau</button>
              </div>
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {[
                  { from: 'Support ArbiFlow', subject: 'Votre vérification KYC a été approuvée', time: '2 min' },
                  { from: 'Équipe Sécurité', subject: 'Nouvelle connexion détectée', time: '1 h' },
                  { from: 'Support ArbiFlow', subject: 'Réponse à votre ticket #4821', time: '3 h' },
                ].map((m, i) => (
                  <div key={i} className="p-2 rounded-lg hover:bg-secondary/50 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{m.from}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{m.time}</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{m.subject}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-2 flex items-center justify-center text-sm text-muted-foreground">
              <div className="text-center">
                <Mail className="w-8 h-8 mx-auto mb-2 opacity-40" />
                Sélectionnez un message pour l'afficher
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Alertes de prix */}
        <TabsContent value="alerts">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbole</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Répétitions</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prices.slice(0, 5).map((c, i) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium flex items-center gap-1.5">
                      <BellRing className="w-3.5 h-3.5 text-warning" /> {c.symbol.toUpperCase()}/USDT
                    </TableCell>
                    <TableCell>Prix &gt; ${(c.current_price * 1.05).toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(Date.now() + i * 86400000).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <button className="text-muted-foreground hover:text-primary"><Edit className="w-4 h-4 inline" /></button>
                      <button className="text-muted-foreground hover:text-destructive"><X className="w-4 h-4 inline" /></button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EconomicCalendarWidget() {
  return (
    <div className="glass-card p-1 h-[420px] overflow-hidden rounded-lg">
      <iframe
        title="Calendrier économique"
        src="https://s.tradingview.com/embed-widget/events/?locale=fr#%7B%22colorTheme%22%3A%22dark%22%2C%22isTransparent%22%3Atrue%2C%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%2C%22importanceFilter%22%3A%22-1%2C0%2C1%22%7D"
        className="w-full h-full border-0"
      />
    </div>
  );
}
