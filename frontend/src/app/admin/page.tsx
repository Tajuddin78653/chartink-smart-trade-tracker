'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://chartink-backend.onrender.com';

export default function AdminPage() {
  const [settings, setSettings]   = useState<any>(null);
  const [saving,   setSaving]     = useState(false);
  const [saved,    setSaved]      = useState(false);

  useEffect(() => { axios.get(`${API}/api/settings`).then(r => setSettings(r.data)); }, []);

  const save = async () => {
    setSaving(true);
    await axios.put(`${API}/api/settings`, settings);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const set = (key: string, val: any) => setSettings((p: any) => ({ ...p, [key]: val }));

  if (!settings) return <div className="p-8 text-gray-500">Loading settings...</div>;

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-bold text-white mb-1">⚙️ Admin Panel</h1>
      <p className="text-sm text-gray-500 mb-6">Configure trading rules, broker, and notifications</p>

      {/* Risk Settings */}
      <Section title="📊 Risk Settings">
        <Row label="Target %" desc="First target above entry price">
          <NumInput value={settings.target_pct} onChange={v => set('target_pct', v)} step={0.1} />
        </Row>
        <Row label="Stop Loss %" desc="Fixed SL below entry price">
          <NumInput value={settings.sl_pct} onChange={v => set('sl_pct', v)} step={0.1} />
        </Row>
        <Row label="Trailing %" desc="Each trailing step size">
          <NumInput value={settings.trailing_pct} onChange={v => set('trailing_pct', v)} step={0.1} />
        </Row>
        <Row label="Price Interval (s)" desc="How often to fetch live price">
          <NumInput value={settings.price_interval || 5} onChange={v => set('price_interval', v)} step={1} />
        </Row>
      </Section>

      {/* Trading Hours */}
      <Section title="🕐 Trading Hours (IST)">
        <Row label="Market Open" desc="Start tracking from">
          <input type="time" value={settings.trading_start || '09:15'}
            onChange={e => set('trading_start', e.target.value)}
            className="bg-[#0f1117] border border-[#2d3748] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
        </Row>
        <Row label="Market Close" desc="Stop tracking after">
          <input type="time" value={settings.trading_end || '15:30'}
            onChange={e => set('trading_end', e.target.value)}
            className="bg-[#0f1117] border border-[#2d3748] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
        </Row>
      </Section>

      {/* Broker */}
      <Section title="🏦 Broker / Price Source">
        <Row label="Active Broker" desc="Source for live market prices">
          <select value={settings.broker || 'dhan'} onChange={e => set('broker', e.target.value)}
            className="bg-[#0f1117] border border-[#2d3748] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
            <option value="dhan">Dhan</option>
            <option value="upstox">Upstox</option>
            <option value="zerodha">Zerodha Kite</option>
            <option value="angel">Angel One</option>
            <option value="fyers">Fyers</option>
          </select>
        </Row>
      </Section>

      {/* Formula Preview */}
      <Section title="🧮 Formula Preview">
        <div className="bg-[#0f1117] rounded-lg p-4 font-mono text-sm space-y-1.5 text-gray-300">
          <p>Entry Price = <span className="text-yellow-300">₹2950 (from Chartink alert)</span></p>
          <p>Stop Loss = 2950 × (1 - {settings.sl_pct}/100) = <span className="text-red-400">₹{(2950 * (1 - settings.sl_pct/100)).toFixed(2)}</span></p>
          <p>Target 1  = 2950 × (1 + {settings.target_pct}/100) = <span className="text-green-400">₹{(2950 * (1 + settings.target_pct/100)).toFixed(2)}</span></p>
          <p>Trail Step = 2950 × {settings.trailing_pct}/100 = <span className="text-purple-400">₹{(2950 * settings.trailing_pct/100).toFixed(2)}</span></p>
        </div>
      </Section>

      {/* Save button */}
      <button onClick={save} disabled={saving}
        className={`mt-2 px-8 py-3 rounded-xl font-semibold text-sm transition-all
          ${saved    ? 'bg-green-600 text-white'
          : saving   ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
        {saved ? '✅ Saved!' : saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#1a1f36] border border-[#2d3748] rounded-xl p-5 mb-4">
      <h2 className="text-sm font-semibold text-gray-300 mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Row({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <p className="text-sm font-medium text-gray-200">{label}</p>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
      {children}
    </div>
  );
}

function NumInput({ value, onChange, step = 0.1 }: { value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <input type="number" value={value} step={step} min={0}
      onChange={e => onChange(parseFloat(e.target.value))}
      className="w-24 bg-[#0f1117] border border-[#2d3748] text-white text-center rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
  );
}
