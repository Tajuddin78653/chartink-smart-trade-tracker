'use client';

interface Trade {
  id: string; trade_id: string; symbol: string; exchange: string;
  signal: string; entry_price: number; current_price: number;
  pnl: number; pnl_pct: number; sl: number; current_target: number;
  highest_price: number; entry_time: string; status: string;
  scan_name: string; target_count: number;
}

export default function TradeCard({ trade, onClick }: { trade: Trade; onClick?: () => void }) {
  const pnlPos = parseFloat(String(trade.pnl)) >= 0;
  const pctPos = parseFloat(String(trade.pnl_pct)) >= 0;

  const statusStyle: Record<string, string> = {
    OPEN:          'bg-blue-950   text-blue-400   border-blue-700',
    TRAILING:      'bg-purple-950 text-purple-400 border-purple-700',
    TARGET_HIT:    'bg-green-950  text-green-400  border-green-700',
    STOP_LOSS_HIT: 'bg-red-950    text-red-400    border-red-700',
    CLOSED:        'bg-gray-800   text-gray-400   border-gray-600',
  };

  const duration = () => {
    const diff = Math.floor((Date.now() - new Date(trade.entry_time).getTime()) / 60000);
    return diff < 60 ? `${diff}m` : `${Math.floor(diff/60)}h ${diff%60}m`;
  };

  return (
    <div
      onClick={onClick}
      className="bg-[#1a1f36] border border-[#2d3748] border-l-4 border-l-green-500 rounded-xl p-4
                 hover:border-green-400 hover:shadow-lg hover:shadow-green-900/20
                 transition-all cursor-pointer animate-fade-in">

      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-lg font-bold text-white">{trade.symbol}</p>
          <p className="text-xs text-gray-500 mt-0.5">{trade.scan_name}</p>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded border ${statusStyle[trade.status] || ''}`}>
          {trade.status}
        </span>
      </div>

      {/* Price row */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
        <div>
          <p className="text-xs text-gray-500">Entry</p>
          <p className="font-semibold text-gray-200">₹{parseFloat(String(trade.entry_price)).toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">CMP</p>
          <p className="font-semibold text-yellow-300">₹{parseFloat(String(trade.current_price || trade.entry_price)).toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">🛑 SL</p>
          <p className="font-semibold text-red-400">₹{parseFloat(String(trade.sl)).toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">🎯 Target</p>
          <p className="font-semibold text-green-400">₹{parseFloat(String(trade.current_target)).toFixed(2)}</p>
        </div>
      </div>

      {/* P&L */}
      <div className="flex justify-between items-center pt-3 border-t border-[#2d3748]">
        <div>
          <span className={`text-lg font-bold ${pnlPos ? 'text-green-400' : 'text-red-400'}`}>
            {pnlPos ? '+' : ''}₹{parseFloat(String(trade.pnl || 0)).toFixed(2)}
          </span>
          <span className={`ml-2 text-sm ${pctPos ? 'text-green-400' : 'text-red-400'}`}>
            ({pctPos ? '+' : ''}{parseFloat(String(trade.pnl_pct || 0)).toFixed(2)}%)
          </span>
        </div>
        <span className="text-xs text-gray-500">⏱ {duration()}</span>
      </div>

      {/* Trail count */}
      {trade.target_count > 0 && (
        <div className="mt-2 text-xs text-purple-400">
          🔄 Trail Level {trade.target_count}
        </div>
      )}
    </div>
  );
}
