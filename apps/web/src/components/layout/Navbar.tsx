'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, MessageSquare, Users, BookOpen, MapPin, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Home', href: '/', icon: null },
  { label: 'Search', href: '/search', icon: null },
  { label: 'Messages', href: '/messages', icon: null },
  { label: 'Community', href: '/community', icon: null },
  { label: 'Resources', href: '/resources', icon: null },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-surface-dark border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-lime-400 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-surface-dark" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'text-lime-400 bg-lime-400/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Location */}
          <button className="hidden lg:flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20">
            <MapPin className="w-4 h-4" />
            <span>London, UK</span>
          </button>

          {/* Notifications */}
          <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-lime-400 rounded-full" />
          </button>

          {/* Profile */}
          <Link
            href="/profile"
            className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors"
          >
            <span className="hidden lg:block text-sm font-medium">Evelyn Munoz</span>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center ring-2 ring-white/20">
              <span className="text-xs font-bold text-white">EM</span>
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
}
