import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/header';

export const metadata: Metadata = {
  title: 'Receiving Manager | AI Visual Receiving Inspection System',
  description: 'Evidence-backed visual receiving inspection application with deterministic decision logic.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased">
        <Header />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-slate-800 bg-slate-900/50 py-6">
          <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
            Receiving Manager &copy; {new Date().getFullYear()} &bull; AI Visual Receiving Inspection &bull; Built for Zero-Budget Hackathon &bull; Deterministic Decision Engine
          </div>
        </footer>
      </body>
    </html>
  );
}
