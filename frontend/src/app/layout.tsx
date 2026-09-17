import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Chartink Smart Trade Tracker',
  description: 'Real-time trading signal monitoring platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0f1117] text-gray-200 min-h-screen">{children}</body>
    </html>
  );
}
