import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Medal, Loader2, Users, TrendingUp, Clock, Star, Award, X, Zap, Shield, Target, Crown } from 'lucide-react';

interface RankedTrader {
  id: string;
  full_name: string | null;
  total_earnings: number | null;
  rank: number;
  win_rate?: number;
  trades_count?: number;
  best_trade?: number;
  avg_profit?: number;
  level?: number;
  achievements?: number;
  win_streak?: number;
}

function generateFakeTraders(count: number, existingIds: Set<string>): RankedTrader[] {
  const pseudos = [
    // Style crypto français
    'BitcoinFr', 'EthereumFr', 'CryptoFranc', 'BlockchainFr',
    'TradingFou', 'ForexMaster', 'BourseGuru', 'ActionHunter',
    'BearMarket', 'BullRun', 'HODLFr', 'DiamondHandsFr',
    'WalletWarrior', 'TokenMaster', 'CoinCollector', 'YieldHunter',
    
    // Style joueur français
    'LeTrader', 'LeCrack', 'LeRoiDuTrade', 'LeMaître',
    'LaMachine', 'LeProphète', 'LeGénie', 'LeMentalist',
    'LeRenard', 'LeLoup', 'LeRequin', 'LePirate',
    'LeChampion', 'LeGladiateur', 'LeNinja', 'LeSamouraï',
    
    // Style fun français
    'CryptoFou', 'BlockMan', 'TokenBoy', 'CoinMan',
    'LeDéjanté', 'LeBarjo', 'LeTimbré', 'LeFada',
    'CryptoGamin', 'Boursicoteur', 'Speculo', 'FlipCoin',
    
    // Style pro français
    'Analyste', 'Strategiste', 'ExpertTrade', 'ProTrader',
    'Gestionnaire', 'Portefeuille', 'Investisseur', 'Speculateur',
    'Chartiste', 'TrendHunter', 'BreakoutHunter', 'SupportHunter',
    'ResistanceBreaker', 'VolumeHunter', 'MomentumHunter',
    
    // Style geek français
    'Satoshifr', 'VitalikFr', 'GavinFr', 'CharlesFr',
    'BinanceFr', 'CoinbaseFr', 'KrakenFr', 'LedgerFr',
    'TrezorFr', 'MetamaskFr', 'OpenSeaFr', 'RaribleFr',
    
    // Nouveaux français
    'LeBoursicoteur', 'LeSpeculo', 'LeFlipper', 'LeChiffreur',
    'CryptoGamin', 'BlockEnFolie', 'TokenTonic', 'CoinCasseur',
    'LeRentier', 'LeDividende', 'LeFiscal', 'LeOptimiste',
    'LePessimiste', 'LeRealiste', 'LeStratège', 'LeTacticien',
    'LePivot', 'LeRebond', 'LaTendance', 'LeMomentum',
    'LeScalper', 'LeSwingeur', 'LePositonneur', 'LeDayTrader',
    
    // Style animalier français
    'LeTaureau', 'Lours', 'LeLion', 'LeTigre', 'LeDragon',
    'LePhoenix', 'LeLynx', 'LeFaucon', 'LeAigle', 'LeRequinBlanc',
    
    // Style mythologique français
    'LeZeus', 'LePoseidon', 'LeAthena', 'LeApollo', 'LeHermes',
    'LeThor', 'LeOdin', 'LeLoki', 'LeFreyja', 'LeRagnar',
    
    // Style street français
    'LeBoss', 'LeDon', 'LeKing', 'LePrince', 'LeDuc',
    'LeBaron', 'LeComte', 'LeMarquis', 'LeChevalier', 'LeSire'
  ];

  const fakeTraders: RankedTrader[] = [];
  const usedNames = new Set<string>();
  
  let attempts = 0;
  const maxAttempts = count * 10;
  
  while (fakeTraders.length < count && attempts < maxAttempts) {
    attempts++;
    const pseudo = pseudos[Math.floor(Math.random() * pseudos.length)];
    
    // Éviter les doublons exacts
    if (usedNames.has(pseudo)) continue;
    usedNames.add(pseudo);
    
    const id = `fake_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    if (existingIds.has(id)) continue;
    
    // Montants en USDT
    const baseEarnings = 50 + Math.random() * 200;
    const randomMultiplier = Math.random();
    let earnings;
    
    if (randomMultiplier < 0.02) {
      earnings = Math.floor(baseEarnings * (200 + Math.random() * 600));
    } else if (randomMultiplier < 0.08) {
      earnings = Math.floor(baseEarnings * (50 + Math.random() * 150));
    } else if (randomMultiplier < 0.20) {
      earnings = Math.floor(baseEarnings * (10 + Math.random() * 40));
    } else if (randomMultiplier < 0.50) {
      earnings = Math.floor(baseEarnings * (3 + Math.random() * 7));
    } else {
      earnings = Math.floor(baseEarnings * (0.5 + Math.random() * 2.5));
    }
    
    // Plus de trades (500-5000)
    const tradesCount = 500 + Math.floor(Math.random() * 4500);
    const winRate = 40 + Math.floor(Math.random() * 45);
    const bestTrade = Math.floor(earnings * (0.15 + Math.random() * 0.45));
    const avgProfit = Number((earnings / tradesCount * 10).toFixed(1));
    const level = Math.floor(Math.random() * 15) + 1;
    const achievements = Math.floor(Math.random() * 12);
    const winStreak = Math.floor(Math.random() * 15);

    fakeTraders.push({
      id,
      full_name: pseudo,
      total_earnings: earnings,
      rank: 0,
      win_rate: Math.min(98, winRate),
      trades_count: Math.min(5000, tradesCount),
      best_trade: Math.round(bestTrade),
      avg_profit: avgProfit,
      level: level,
      achievements: achievements,
      win_streak: winStreak
    });
  }
  
  return fakeTraders;
}

function TraderModal({ trader, onClose }: { trader: RankedTrader; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card p-5 max-w-sm w-full animate-in fade-in zoom-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">Profil trader</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto text-2xl font-bold text-foreground">
              {trader.full_name?.charAt(0) || 'T'}
            </div>
            <div className="mt-2 font-semibold text-foreground">{trader.full_name}</div>
            <div className="flex items-center justify-center gap-3 mt-1">
              <span className="text-sm text-muted-foreground">#{trader.rank}</span>
              <span className="text-xs bg-secondary/50 px-2 py-0.5 rounded-full text-foreground">Niv. {trader.level || 1}</span>
              <span className="text-xs bg-amber-500/20 px-2 py-0.5 rounded-full text-amber-500">🏆 {trader.achievements || 0}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-secondary/30 p-3 rounded-lg text-center">
              <div className="text-[10px] text-muted-foreground uppercase">Gains totaux</div>
              <div className="text-base font-bold text-success">{Number(trader.total_earnings || 0).toLocaleString()} USDT</div>
            </div>
            <div className="bg-secondary/30 p-3 rounded-lg text-center">
              <div className="text-[10px] text-muted-foreground uppercase">Taux de réussite</div>
              <div className="text-base font-bold text-primary">{trader.win_rate || 0}%</div>
            </div>
            <div className="bg-secondary/30 p-3 rounded-lg text-center">
              <div className="text-[10px] text-muted-foreground uppercase">Nombre de trades</div>
              <div className="text-base font-bold text-foreground">{trader.trades_count || 0}</div>
            </div>
            <div className="bg-secondary/30 p-3 rounded-lg text-center">
              <div className="text-[10px] text-muted-foreground uppercase">Meilleur trade</div>
              <div className="text-base font-bold text-success">+{(trader.best_trade || 0).toLocaleString()} USDT</div>
            </div>
            <div className="bg-secondary/30 p-3 rounded-lg text-center col-span-2">
              <div className="text-[10px] text-muted-foreground uppercase">Profit moyen par trade</div>
              <div className="text-base font-bold text-success">+{trader.avg_profit || 0} USDT</div>
            </div>
            {trader.win_streak && trader.win_streak > 0 && (
              <div className="bg-secondary/30 p-3 rounded-lg text-center col-span-2">
                <div className="text-[10px] text-muted-foreground uppercase">Série de victoires</div>
                <div className="text-base font-bold text-green-500">🔥 {trader.win_streak} trades gagnants</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TraderRow({ 
  trader, 
  isMe,
  onSelect
}: { 
  trader: RankedTrader; 
  isMe: boolean;
  onSelect: (trader: RankedTrader) => void;
}) {
  const rankBadge = () => {
    if (trader.rank === 1) return <Crown className="w-4 h-4 text-yellow-500" />;
    if (trader.rank === 2) return <Medal className="w-4 h-4 text-gray-400" />;
    if (trader.rank === 3) return <Medal className="w-4 h-4 text-amber-700" />;
    return null;
  };

  const earnings = Number(trader.total_earnings || 0);

  return (
    <div 
      className={`flex items-center gap-2 py-2 px-3 rounded-lg transition-all duration-300 cursor-pointer ${
        isMe ? 'bg-primary/10 border border-primary/30' : 'hover:bg-secondary/40'
      }`}
      onClick={() => onSelect(trader)}
    >
      <div className="w-6 flex justify-center flex-shrink-0">
        {rankBadge() || (
          <span className="text-xs text-muted-foreground font-medium">{trader.rank}</span>
        )}
      </div>
      
      <div className="w-7 h-7 rounded-full bg-secondary/50 flex items-center justify-center flex-shrink-0 text-xs font-medium text-foreground">
        {isMe ? 'Moi' : trader.full_name?.charAt(0) || 'T'}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium truncate text-foreground">
            {isMe ? 'Moi' : trader.full_name || 'Trader'}
          </div>
          {trader.win_streak && trader.win_streak > 3 && (
            <span className="text-[10px] text-green-500 flex-shrink-0">🔥{trader.win_streak}</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-0.5 font-semibold text-primary">
            <TrendingUp className="w-3 h-3" />
            {trader.win_rate || 0}%
          </span>
          <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/30" />
          <span className="font-medium">{trader.trades_count || 0} trades</span>
          <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/30" />
          <span className="flex items-center gap-0.5">
            <Zap className="w-3 h-3" />
            Niv.{trader.level || 1}
          </span>
        </div>
      </div>
      
      <div className={`text-sm font-bold flex-shrink-0 ${
        isMe ? 'text-primary' : 'text-success'
      }`}>
        +{earnings.toLocaleString()} USDT
      </div>
    </div>
  );
}

export function TradersRanking() {
  const { profile } = useAuth();
  const [traders, setTraders] = useState<RankedTrader[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrader, setSelectedTrader] = useState<RankedTrader | null>(null);

  useEffect(() => {
    if (!profile) return;
    
    let active = true;
    setLoading(true);
    
    const fetchRanking = () => {
      supabase.rpc('get_traders_ranking').then(({ data }) => {
        if (!active) return;
        
        const realTraders = (data as RankedTrader[]) || [];
        const existingIds = new Set(realTraders.map(t => t.id));
        
        // 200 traders fictifs
        const fakeTraders = generateFakeTraders(200, existingIds);
        
        const allTraders = [...realTraders, ...fakeTraders];
        
        const sorted = allTraders.sort((a, b) => {
          const earningsA = Number(a.total_earnings || 0);
          const earningsB = Number(b.total_earnings || 0);
          return earningsB - earningsA;
        });
        
        const ranked = sorted.map((trader, index) => ({
          ...trader,
          rank: index + 1
        }));
        
        setTraders(ranked);
        setLoading(false);
      });
    };
    
    fetchRanking();
    
    const interval = setInterval(fetchRanking, 60000);
    
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [profile?.id]);

  const me = traders.find((r) => r.id === profile?.id);
  const userRank = me?.rank ?? traders.length + 1;
  const top3 = traders.slice(0, 3);
  const rest = traders.slice(3);

  if (loading) {
    return (
      <div className="glass-card p-4">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="glass-card p-3 md:p-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Classement</span>
            <span className="text-xs text-muted-foreground">{traders.length}</span>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground uppercase">Ma position</div>
            <div className="text-sm font-bold text-gradient-gold">#{userRank}</div>
            {me && (
              <div className="text-xs text-success font-medium">
                +{Number(me.total_earnings || 0).toLocaleString()} USDT
              </div>
            )}
          </div>
        </div>

        <div className="space-y-0.5 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
          {top3.map((t) => (
            <TraderRow 
              key={t.id} 
              trader={t} 
              isMe={t.id === profile?.id} 
              onSelect={setSelectedTrader}
            />
          ))}

          {rest.length > 0 && (
            <>
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/20"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-2 py-0.5 text-[10px] bg-secondary/50 text-muted-foreground rounded-full font-medium">
                    {rest.length} autres traders
                  </span>
                </div>
              </div>
              
              {rest.map((t) => (
                <TraderRow 
                  key={t.id} 
                  trader={t} 
                  isMe={t.id === profile?.id} 
                  onSelect={setSelectedTrader}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {selectedTrader && (
        <TraderModal 
          trader={selectedTrader} 
          onClose={() => setSelectedTrader(null)} 
        />
      )}
    </>
  );
}
