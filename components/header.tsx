'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PackageCheck, PlusCircle, LayoutDashboard, History } from 'lucide-react';

export function Header() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'New Inspection', href: '/inspections/new', icon: PlusCircle },
    { label: 'Inspection History', href: '/inspections', icon: History },
  ];

  return (
    <header className="sticky top-0 z-40 bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-white">
                Receiving Manager
              </span>
              <span className="hidden sm:inline-block text-[11px] font-mono text-gray-400 border-l border-gray-700 pl-2">
                Visual Inspection Engine
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-gray-800 text-blue-400 border border-gray-700'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Mode Badge */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-gray-800 border border-gray-700 text-[10px] font-mono font-medium text-gray-300">
              Demo / Gemini Provider
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
