'use client';

import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ── Helpers ────────────────────────────────────────────────────
const fmt = (v: number) => v >= 0
  ? <span className="text-green-600 font-semibold">✓ +₹{v.toFixed(2)}</span>
  : <span className="text-red-600 font-semibold">✗ -₹{Math.abs(v).toFixed(2)}</span>;

const fmtPct = (v: number) => v >= 0
  ? <span className="text-green-600 font-semibold">+{v.toFixed(2)}%</span>
  : <span className="text-red-600 font-semibold">{v.toFixed(2)}%</span>;

const statusColors: Record<string, string> = {
  OPEN:          'bg-blue-950 text-blue-400 border-blue-700',
  TRAILING:      'bg-purple-950 text-purple-400 border-purple-700',
  TARGET_HIT:    'bg-green-950 text-green-400 border-green-700',
  STOP_LOSS_HIT: 'bg-red-950 text-red-400 border-red-700',
  CLOSED:        'bg-gray-800 text-gray-400 border-gray-600',
};

const duration = (entryTime: string) => {
  const diff = Math.floor((Date.now() - new Date(entryTime).getTime()) / 60000);
  if (diff < 60) return `${diff}m`;
  return `${Math.floor(diff/60)}h ${diff%60}m`;
};

// SL distance as % from current price
const slDistance = (current: number, sl: number) =>
  Math.abs((current - sl) / current) * 100;

export default function ActiveTradesTable({
  trades,
  onExited,
}: {
  trades: any[];
  onExited?: (tradeId: string) => void;
}) {

  const handleExit = async (tradeId: string, symbol: string) => {
    if (!confirm(`Exit trade ${symbol}? This will place a MARKET SELL order.`)) return;
    try {
      await axios.post(`${API}/api/trades/${tradeId}/exit`);
      onExited?.(tradeId);
    } catch (e: any) {
      alert(`❌ Exit failed: ${e?.response?.data?.error || e.message}`);
    }
  };

  if (!trades.length) return (
    <div className="bg-[#1a1f36] border border-[#2d3748] rounded-xl p-12 text-center">
      <p className="text-4xl mb-3" role="img" aria-label="No trades">📭</p>
      <p className="text-gray-400">No active trades. Waiting for Chartink alerts...</p>
      <p className="text-gray-600 text-xs mt-2">Check that your scanner is running and alerts are firing.</p>
    </div>
  );

  return (
    <div className="bg-[#1a1f36] border border-[#2d3748] rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="table">
          <thead>
            <tr className="bg-[#0f1117] border-b border-[#2d3748] text-gray-500 text-xs uppercase tracking-wider">
              {['Trade ID','Symbol','Entry','CMP','P&L','P&L %','SL','Target','Duration','Status','Action'].map(h => (
                <th key={h} scope="col" className="px-4 py-3 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trades.map((t, i) => {
              const current   = parseFloat(t.current_price || t.entry_price);
              const sl        = parseFloat(t.sl);
              const slDist    = slDistance(current, sl);
              const slUrgent  = slDist < 1.0;

              return (
                <tr
                  key={t.id}
                  className={`border-b border-[#1e2740] hover:bg-[#1e2a45] transition-colors ${i === 0 ? 'bg-[#0d2b1e]' : ''}`}
                >
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{t.trade_id}</td>
                  <td className="px-4 py-3 font-bold text-white">{t.symbol}</td>
                  <td className="px-4 py-3 text-gray-300">₹{parseFloat(t.entry_price).toFixed(2)}</td>
                  <td className="px-4 py-3 font-semibold text-yellow-300">₹{current.toFixed(2)}</td>
                  <td className="px-4 py-3">{fmt(parseFloat(t.pnl || 0))}</td>
                  <td className="px-4 py-3">{fmtPct(parseFloat(t.pnl_pct || 0))}</td>

                  {/* SL — red pulsing warning if < 1% away */}
                  <td className={`px-4 py-3 font-semibold ${slUrgent ? 'text-red-500 animate-pulse' : 'text-red-400'}`}>
                    {slUrgent && <span title="SL within 1%!">⚠️ </span>}
                    ₹{sl.toFixed(2)}
                    <span className="text-xs text-gray-500 ml-1">({slDist.toFixed(1)}%)</span>
                  </td>

                  <td className="px-4 py-3 text-green-500">₹{parseFloat(t.current_target).toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-400">{duration(t.entry_time)}</td>

                  {/* Status badge */}
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded border ${statusColors[t.status] || ''}`}
                      aria-label={`Status: ${t.status}`}
                    >
                      {t.status}
                    </span>
                  </td>

                  {/* Emergency EXIT button */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleExit(t.trade_id, t.symbol)}
                      className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors focus-visible:outline-2 focus-visible:outline-red-500"
                      aria-label={`Exit trade ${t.trade_id} for ${t.symbol}`}
                    >
                      EXIT
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
