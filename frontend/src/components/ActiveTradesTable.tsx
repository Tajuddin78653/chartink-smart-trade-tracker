'use client';

const fmt = (v: number) => v >= 0
  ? <span className="text-green-400">+₹{v.toFixed(2)}</span>
  : <span className="text-red-400">-₹{Math.abs(v).toFixed(2)}</span>;

const fmtPct = (v: number) => v >= 0
  ? <span className="text-green-400">+{v.toFixed(2)}%</span>
  : <span className="text-red-400">{v.toFixed(2)}%</span>;

const statusColors: Record<string, string> = {
  OPEN: 'bg-blue-950 text-blue-400 border-blue-700',
  TRAILING: 'bg-purple-950 text-purple-400 border-purple-700',
  TARGET_HIT: 'bg-green-950 text-green-400 border-green-700',
  STOP_LOSS_HIT: 'bg-red-950 text-red-400 border-red-700',
  CLOSED: 'bg-gray-800 text-gray-400 border-gray-600',
};

const duration = (entryTime: string) => {
  const diff = Math.floor((Date.now() - new Date(entryTime).getTime()) / 60000);
  if (diff < 60) return `${diff}m`;
  return `${Math.floor(diff/60)}h ${diff%60}m`;
};

export default function ActiveTradesTable({ trades }: { trades: any[] }) {
  if (!trades.length) return (
    <div className="bg-[#1a1f36] border border-[#2d3748] rounded-xl p-12 text-center">
      <p className="text-4xl mb-3">📭</p>
      <p className="text-gray-400">No active trades. Waiting for Chartink alerts...</p>
    </div>
  );

  return (
    <div className="bg-[#1a1f36] border border-[#2d3748] rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#0f1117] border-b border-[#2d3748] text-gray-500 text-xs uppercase tracking-wider">
              {['Trade ID','Symbol','Entry','CMP','P&L','P&L %','SL','Target','High','Duration','Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trades.map((t, i) => (
              <tr key={t.id} className={`border-b border-[#1e2740] hover:bg-[#1e2a45] transition-colors ${i === 0 ? 'bg-[#0d2b1e]' : ''}`}>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{t.trade_id}</td>
                <td className="px-4 py-3 font-bold text-white">{t.symbol}</td>
                <td className="px-4 py-3 text-gray-300">₹{parseFloat(t.entry_price).toFixed(2)}</td>
                <td className="px-4 py-3 font-semibold text-yellow-300">₹{parseFloat(t.current_price || t.entry_price).toFixed(2)}</td>
                <td className="px-4 py-3">{fmt(parseFloat(t.pnl || 0))}</td>
                <td className="px-4 py-3">{fmtPct(parseFloat(t.pnl_pct || 0))}</td>
                <td className="px-4 py-3 text-red-400">₹{parseFloat(t.sl).toFixed(2)}</td>
                <td className="px-4 py-3 text-green-400">₹{parseFloat(t.current_target).toFixed(2)}</td>
                <td className="px-4 py-3 text-blue-300">₹{parseFloat(t.highest_price || t.entry_price).toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-400">{duration(t.entry_time)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded border ${statusColors[t.status] || ''}`}>{t.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
