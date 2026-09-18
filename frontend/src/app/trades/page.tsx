'use client';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import TradeCard from '@/components/TradeCard';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://chartink-backend.onrender.com';
const WS  = process.env.NEXT_PUBLIC_WS_URL  || 'https://chartink-backend.onrender.com';

export default function TradesPage() {
  const [trades, setTrades] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    axios.get(`${API}/api/trades/active`).then(r => setTrades(r.data));
    const socket = io(WS, { transports: ['websocket'] });
    socket.on('new_trade',    (t) => setTrades(p => [t, ...p]));
    socket.on('trade_update', (t) => setTrades(p => p.map(x => x.id === t.id ? t : x)));
    socket.on('trade_closed', (t) => setTrades(p => p.filter(x => x.id !== t.id)));
    return () => { socket.disconnect(); };
  }, []);

  const statuses = ['ALL', 'OPEN', 'TRAILING', 'TARGET_HIT'];
  const filtered = filter === 'ALL' ? trades : trades.filter(t => t.status === filter);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">📈 Active Trades</h1>
          <p className="text-sm text-gray-500 mt-0.5">{trades.length} positions being tracked</p>
        </div>
        {/* Filter pills */}
        <div className="flex gap-2">
          {statuses.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                ${filter === s ? 'bg-blue-600 text-white' : 'bg-[#1a1f36] text-gray-400 border border-[#2d3748] hover:text-white'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[#1a1f36] border border-[#2d3748] rounded-xl p-12 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-400 text-sm">No active trades. Waiting for Chartink alerts...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(trade => <TradeCard key={trade.id} trade={trade} />)}
        </div>
      )}
    </div>
  );
}
