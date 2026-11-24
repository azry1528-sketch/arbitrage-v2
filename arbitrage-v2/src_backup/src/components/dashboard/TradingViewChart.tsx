import { useEffect, useRef } from 'react';

// Widget graphique TradingView (script public embarqué), même widget que
// celui utilisé dans le template Forexo pour afficher le cours en direct.
export function TradingViewChart({ symbol = 'BINANCE:BTCUSDT' }: { symbol?: string }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    container.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: '60',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'fr',
      backgroundColor: 'rgba(4, 7, 13, 1)',
      gridColor: 'rgba(255, 255, 255, 0.06)',
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: true,
      support_host: 'https://www.tradingview.com',
    });

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';

    container.current.appendChild(widgetDiv);
    container.current.appendChild(script);
  }, [symbol]);

  return (
    <div className="glass-card p-2 h-[420px] overflow-hidden">
      <div className="tradingview-widget-container h-full w-full" ref={container} />
    </div>
  );
}
