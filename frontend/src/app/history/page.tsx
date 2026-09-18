'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://chartink-backend.onrender.com';

export default function HistoryPage() {
  const [trades,  setTrades]  = useState<any[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(0);
  const [symbol,  setSymbol]  = useState('');
  const [status,  setStatus]  = useState('');
  const LIMIT = 20;

  const load = (p = 0) => {
    const params: any = { limit: LIMIT, offset: p * LIMIT };
    if (symbol) params.symbol = symbol;
    if (status) params.status = status;
    axios.get(`${API}/api/trades`, { params }).then(r => {
      setTrades(r.data.trades); setTotal(r.data.total); setPage(p);
    });
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-white mb-1">📋 Trade History</h1>
      <p className="text-sm text-gray-500 mb-5">{total} total trades recorded</p>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <input value={symbol} onChange={e => setSymbol(e.target.value)} placeholder="Filter by symbol..."
          className="bg-[#1a1f36] border border-[#2d3748] text-white rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:border-blue-500 placeholder-gray-600" />
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="bg-[#1a1f36] border border-[#2d3748] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="TRAILING">Trailing</option>
          <option value="STOP_LOSS_HIT">SL Hit</option>
          <option value="CLOSED">Closed</option>
        </select>
        <button onClick={() => load(0)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
          Search
        </button>
        <button onClick={() => { setSymbol(''); setStatus(''); setTimeout(() => load(0), 50); }}
          className="bg-[#1a1f36] border border-[#2d3748] text-gray-400 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors">
          Clear
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#1a1f36] border border-[#2d3748] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0f1117] border-b border-[#2d3748] text-gray-500 text-xs uppercase">
                {['Trade ID','Symbol','Scanner','Entry','Exit','P&L','P&L%','Duration','Status','Exit Reason'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.map(t => (
                <tr key={t.id} className="border-b border-[#1e2740] hover:bg-[#1e2a45] transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{t.trade_id}</td>
                  <td className="px-4 py-3 font-bold text-white">{t.symbol}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs max-w-32 truncate">{t.scan_name}</td>
                  <td className="px-4 py-3 text-gray-300">₹{parseFloat(t.entry_price).toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-300">{t.exit_price ? `₹${parseFloat(t.exit_price).toFixed(2)}` : '—'}</td>
                  <td className={`px-4 py-3 font-semibold ${parseFloat(t.pnl||0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {parseFloat(t.pnl||0) >= 0 ? '+' : ''}₹{parseFloat(t.pnl||0).toFixed(2)}
                  </td>
                  <td className={`px-4 py-3 ${parseFloat(t.pnl_pct||0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {parseFloat(t.pnl_pct||0).toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-gray-500">{t.duration_mins ? `${t.duration_mins}m` : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded border
                      ${ t.status === 'OPEN' || t.status === 'TRAILING' ? 'bg-blue-950 text-blue-400 border-blue-700'
                        : t.status === 'STOP_LOSS_HIT' ? 'bg-red-950 text-red-400 border-red-700'
                        : 'bg-green-950 text-green-400 border-green-700'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{t.exit_reason || '—'}</td>
                </tr>
              ))}
              {!trades.length && (
                <tr><td colSpan={10} className="text-center text-gray-500 py-8">No trades found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > LIMIT && (
          <div className="flex justify-between items-center px-4 py-3 border-t border-[#2d3748]">
            <span className="text-xs text-gray-500">Showing {page * LIMIT + 1}–{Math.min((page+1)*LIMIT, total)} of {total}</span>
            <div className="flex gap-2">
              <button onClick={() => load(page-1)} disabled={page === 0}
                className="px-3 py-1.5 text-xs bg-[#1a1f36] border border-[#2d3748] rounded text-gray-400 hover:text-white disabled:opacity-30">← Prev</button>
              <button onClick={() => load(page+1)} disabled={(page+1)*LIMIT >= total}
                className="px-3 py-1.5 text-xs bg-[#1a1f36] border border-[#2d3748] rounded text-gray-400 hover:text-white disabled:opacity-30">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
