'use client';
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import ActiveTradesTable from '@/components/ActiveTradesTable';
import StatsCards from '@/components/StatsCards';
import ClosedTradesTable from '@/components/ClosedTradesTable';
import ToastNotification from '@/components/ToastNotification';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const WS  = process.env.NEXT_PUBLIC_WS_URL  || 'http://localhost:4000';

export default function Dashboard() {
  const [activeTrades, setActiveTrades]   = useState<any[]>([]);
  const [analytics, setAnalytics]         = useState<any>({});
  const [toasts, setToasts]               = useState<any[]>([]);
  const [lastUpdated, setLastUpdated]     = useState<string>('');
  const [tab, setTab]                     = useState<'active'|'closed'|'analytics'>('active');

  useEffect(() => {
    loadData();
    const socket: Socket = io(WS, { transports: ['websocket'] });

    socket.on('new_trade',   (t) => { setActiveTrades(p => [t, ...p]); addToast('🟢 New Trade', `BUY ${t.symbol} @₹${t.entry_price}`, 'success'); });
    socket.on('trade_update',(t) => { setActiveTrades(p => p.map(x => x.id === t.id ? t : x)); });
    socket.on('trade_closed',(t) => { setActiveTrades(p => p.filter(x => x.id !== t.id)); loadData(); });
    socket.on('notification', (n) => addToast(n.type, `${n.symbol} — ${n.type}`, n.type === 'STOP_LOSS_HIT' ? 'error' : 'success'));

    return () => { socket.disconnect(); };
  }, []);

  const loadData = async () => {
    const [tradesRes, analyticsRes] = await Promise.all([
      axios.get(`${API}/api/trades/active`),
      axios.get(`${API}/api/analytics/summary`)
    ]);
    setActiveTrades(tradesRes.data);
    setAnalytics(analyticsRes.data);
    setLastUpdated(new Date().toLocaleTimeString('en-IN'));
  };

  const addToast = (title: string, msg: string, type: string) => {
    const id = Date.now();
    setToasts(p => [...p, { id, title, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  };

  return (
    <div className="min-h-screen p-5">
      {/* Toast */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => <ToastNotification key={t.id} {...t} />)}
      </div>

      {/* Header */}
      <div className="flex justify-between items-center bg-[#1a1f36] border border-[#2d3748] rounded-xl px-6 py-4 mb-5">
        <div>
          <h1 className="text-xl font-bold text-white">📈 Chartink Smart Trade Tracker</h1>
          <p className="text-xs text-gray-500 mt-0.5">N8N-Powered Automated Signal Monitor — NSE/BSE</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">Updated: {lastUpdated}</span>
          <span className="flex items-center gap-1.5 bg-green-950 border border-green-600 text-green-400 text-xs font-bold px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block"></span>LIVE
          </span>
        </div>
      </div>

      {/* Stats */}
      <StatsCards analytics={analytics} activeCount={activeTrades.length} />

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1a1f36] border border-[#2d3748] rounded-xl p-1 mb-4 w-fit">
        {(['active','closed','analytics'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg capitalize transition-all
              ${tab === t ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            {t === 'active' ? `Active (${activeTrades.length})` : t}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'active'    && <ActiveTradesTable trades={activeTrades} />}
      {tab === 'closed'    && <ClosedTradesTable />}
      {tab === 'analytics' && <AnalyticsPanel analytics={analytics} />}
    </div>
  );
}

function AnalyticsPanel({ analytics }: { analytics: any }) {
  const items = [
    { label: 'Total Trades',    value: analytics.total_trades    || 0 },
    { label: 'Winning Trades',  value: analytics.winning_trades  || 0, color: 'text-green-400' },
    { label: 'Losing Trades',   value: analytics.losing_trades   || 0, color: 'text-red-400' },
    { label: 'Win Rate',        value: `${analytics.win_rate     || 0}%`, color: 'text-blue-400' },
    { label: 'Total P&L',       value: `₹${analytics.total_pnl   || 0}`, color: parseFloat(analytics.total_pnl) >= 0 ? 'text-green-400' : 'text-red-400' },
    { label: 'Best Trade',      value: `₹${analytics.best_trade  || 0}`, color: 'text-green-400' },
    { label: 'Worst Trade',     value: `₹${analytics.worst_trade || 0}`, color: 'text-red-400' },
    { label: 'Avg Gain %',      value: `${analytics.avg_gain_pct || 0}%`, color: 'text-green-400' },
    { label: 'Avg Loss %',      value: `${analytics.avg_loss_pct || 0}%`, color: 'text-red-400' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {items.map(item => (
        <div key={item.label} className="bg-[#1a1f36] border border-[#2d3748] rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{item.label}</p>
          <p className={`text-2xl font-bold ${item.color || 'text-white'}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}
