'use client';

import { Navbar } from '@/components/layout/Navbar';
import { useAuthStore } from '@/lib/auth-store';
import { User } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuthStore();

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '';

  return (
    <div className="min-h-screen bg-surface-muted">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col items-center text-center">
        {user ? (
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center mb-6 ring-4 ring-purple-100">
            <span className="text-2xl font-bold text-white">{initials}</span>
          </div>
        ) : (
          <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center mb-6">
            <User className="w-10 h-10 text-gray-400" />
          </div>
        )}
        <h1 className="font-display font-bold text-3xl text-text-primary mb-3">
          {user ? `${user.firstName} ${user.lastName}` : 'Profile'}
        </h1>
        <p className="text-text-secondary max-w-md mb-8">
          Manage your profile, update your portfolio, and configure your account settings.
        </p>
        <span className="badge-lime text-sm px-4 py-2">Coming Soon</span>
      </div>
    </div>
  );
}
