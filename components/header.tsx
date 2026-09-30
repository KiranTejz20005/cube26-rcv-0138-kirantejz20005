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
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold shadow-2xs">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-slate-900">
                Receiving Manager
              </span>
              <span className="hidden sm:inline-block text-[11px] font-mono text-slate-500 border-l border-slate-200 pl-2">
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
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

        </div>
      </div>
    </header>
  );
}
