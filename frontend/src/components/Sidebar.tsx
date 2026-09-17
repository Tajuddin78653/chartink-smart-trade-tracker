'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/',          icon: '📊', label: 'Dashboard'    },
  { href: '/trades',    icon: '📈', label: 'Active Trades' },
  { href: '/history',   icon: '📋', label: 'Trade History' },
  { href: '/analytics', icon: '🎯', label: 'Analytics'     },
  { href: '/admin',     icon: '⚙️',  label: 'Admin Panel'   },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-56 bg-[#1a1f36] border-r border-[#2d3748] min-h-screen flex flex-col py-6 px-3">
      {/* Logo */}
      <div className="px-3 mb-8">
        <h2 className="text-base font-bold text-white leading-tight">📈 Chartink</h2>
        <p className="text-xs text-gray-500 mt-0.5">Smart Trade Tracker</p>
      </div>

      {/* Nav Links */}
      <nav className="flex flex-col gap-1">
        {NAV.map(({ href, icon, label }) => {
          const active = path === href;
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${active
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-[#252d47]'
                }`}>
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom status */}
      <div className="mt-auto px-3">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block"></span>
          System Online
        </div>
      </div>
    </aside>
  );
}
