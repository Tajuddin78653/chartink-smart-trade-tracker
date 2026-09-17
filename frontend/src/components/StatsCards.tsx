export default function StatsCards({ analytics, activeCount }: { analytics: any; activeCount: number }) {
  const cards = [
    { label: 'Active Trades',  value: activeCount,                    color: 'blue',   icon: '📊' },
    { label: "Today's P&L",    value: `₹${analytics.total_pnl || 0}`, color: parseFloat(analytics.total_pnl) >= 0 ? 'green' : 'red', icon: '💰' },
    { label: 'Win Rate',       value: `${analytics.win_rate || 0}%`,  color: 'purple', icon: '🎯' },
    { label: 'Total Trades',   value: analytics.total_trades || 0,    color: 'amber',  icon: '📈' },
  ];

  const borderColors: Record<string,string> = {
    blue: 'border-t-blue-500', green: 'border-t-green-500',
    red: 'border-t-red-500',   purple: 'border-t-purple-500', amber: 'border-t-amber-500'
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
      {cards.map(c => (
        <div key={c.label} className={`bg-[#1a1f36] border border-[#2d3748] border-t-4 ${borderColors[c.color]} rounded-xl p-5`}>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{c.icon} {c.label}</p>
          <p className="text-2xl font-bold text-white">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
