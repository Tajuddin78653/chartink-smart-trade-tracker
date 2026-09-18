'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://chartink-backend.onrender.com';

export default function ClosedTradesTable() {
  const [trades, setTrades] = useState<any[]>([]);

  useEffect(() => {
    axios.get(`${API}/api/trades?status=STOP_LOSS_HIT&limit=50`)
      .then(r => setTrades(r.data.trades));
  }, []);

  return (
    <div className="bg-[#1a1f36] border border-[#2d3748] rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#0f1117] border-b border-[#2d3748] text-gray-500 text-xs uppercase tracking-wider">
              {['Trade ID','Symbol','Entry Time','Exit Time','Entry','Exit','P&L','P&L %','Duration','Exit Reason'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trades.map(t => (
              <tr key={t.id} className="border-b border-[#1e2740] hover:bg-[#1e2a45] transition-colors">
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{t.trade_id}</td>
                <td className="px-4 py-3 font-bold text-white">{t.symbol}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{new Date(t.entry_time).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{t.exit_time ? new Date(t.exit_time).toLocaleString('en-IN') : '—'}</td>
                <td className="px-4 py-3 text-gray-300">₹{parseFloat(t.entry_price).toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-300">₹{parseFloat(t.exit_price || 0).toFixed(2)}</td>
                <td className={`px-4 py-3 font-semibold ${parseFloat(t.pnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {parseFloat(t.pnl) >= 0 ? '+' : ''}₹{parseFloat(t.pnl).toFixed(2)}
                </td>
                <td className={`px-4 py-3 ${parseFloat(t.pnl_pct) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {parseFloat(t.pnl_pct).toFixed(2)}%
                </td>
                <td className="px-4 py-3 text-gray-400">{t.duration_mins}m</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded border
                    ${t.exit_reason === 'SL Hit' ? 'bg-red-950 text-red-400 border-red-700' : 'bg-green-950 text-green-400 border-green-700'}`}>
                    {t.exit_reason || '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!trades.length && <p className="text-center text-gray-500 p-8">No closed trades yet.</p>}
      </div>
    </div>
  );
}
