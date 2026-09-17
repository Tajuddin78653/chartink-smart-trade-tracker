'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid } from 'recharts';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function AnalyticsPage() {
  const [summary, setSummary]   = useState<any>({});
  const [daily,   setDaily]     = useState<any[]>([]);

  useEffect(() => {
    axios.get(`${API}/api/analytics/summary`).then(r => setSummary(r.data));
    axios.get(`${API}/api/analytics/daily`).then(r => setDaily(r.data));
  }, []);

  const cards = [
    { label: 'Total Trades',   value: summary.total_trades    || 0, color: 'text-white',       border: 'border-t-blue-500' },
    { label: 'Winners',        value: summary.winning_trades  || 0, color: 'text-green-400',   border: 'border-t-green-500' },
    { label: 'Losers',         value: summary.losing_trades   || 0, color: 'text-red-400',     border: 'border-t-red-500' },
    { label: 'Win Rate',       value: `${summary.win_rate     || 0}%`, color: 'text-blue-400', border: 'border-t-blue-500' },
    { label: 'Total P&L',      value: `₹${summary.total_pnl  || 0}`, color: parseFloat(summary.total_pnl) >= 0 ? 'text-green-400' : 'text-red-400', border: 'border-t-amber-500' },
    { label: 'Best Trade',     value: `₹${summary.best_trade || 0}`, color: 'text-green-400', border: 'border-t-green-500' },
    { label: 'Worst Trade',    value: `₹${summary.worst_trade|| 0}`, color: 'text-red-400',   border: 'border-t-red-500' },
    { label: 'Avg Gain %',     value: `${summary.avg_gain_pct|| 0}%`, color: 'text-green-400',border: 'border-t-green-500' },
  ];

  const chartData = daily.map(t => ({
    name: t.symbol,
    pnl:  parseFloat(t.pnl || 0),
    fill: parseFloat(t.pnl) >= 0 ? '#4ade80' : '#f87171',
  }));

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-white mb-1">🎯 Analytics</h1>
      <p className="text-sm text-gray-500 mb-6">Performance overview and trade statistics</p>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {cards.map(c => (
          <div key={c.label} className={`bg-[#1a1f36] border border-[#2d3748] border-t-4 ${c.border} rounded-xl p-5`}>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* P&L Bar Chart */}
      {chartData.length > 0 && (
        <div className="bg-[#1a1f36] border border-[#2d3748] rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">📊 Today's P&L by Symbol</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
              <XAxis dataKey="name" stroke="#718096" tick={{ fontSize: 11 }} />
              <YAxis stroke="#718096" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1a1f36', border: '1px solid #2d3748', borderRadius: 8 }}
                labelStyle={{ color: '#e2e8f0' }}
                formatter={(v: any) => [`₹${parseFloat(v).toFixed(2)}`, 'P&L']}
              />
              <Bar dataKey="pnl" radius={[4,4,0,0]}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Daily Trade Table */}
      <div className="bg-[#1a1f36] border border-[#2d3748] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2d3748]">
          <h2 className="text-sm font-semibold text-gray-300">📋 Today's Trades</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0f1117] text-gray-500 text-xs uppercase">
                {['Symbol','Entry','Exit','P&L','P&L %','Duration','Reason'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {daily.map(t => (
                <tr key={t.trade_id} className="border-t border-[#1e2740] hover:bg-[#1e2a45] transition-colors">
                  <td className="px-4 py-3 font-bold text-white">{t.symbol}</td>
                  <td className="px-4 py-3 text-gray-300">₹{parseFloat(t.entry_price).toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-300">₹{parseFloat(t.exit_price || 0).toFixed(2)}</td>
                  <td className={`px-4 py-3 font-semibold ${parseFloat(t.pnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {parseFloat(t.pnl) >= 0 ? '+' : ''}₹{parseFloat(t.pnl).toFixed(2)}
                  </td>
                  <td className={`px-4 py-3 ${parseFloat(t.pnl_pct) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {parseFloat(t.pnl_pct).toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-gray-500">{t.duration_mins}m</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded border
                      ${t.exit_reason === 'SL Hit' ? 'bg-red-950 text-red-400 border-red-700' : 'bg-green-950 text-green-400 border-green-700'}`}>
                      {t.exit_reason || 'Open'}
                    </span>
                  </td>
                </tr>
              ))}
              {!daily.length && (
                <tr><td colSpan={7} className="text-center text-gray-500 py-8">No trades today yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
