'use client';

import { Navbar } from '@/components/layout/Navbar';
import { Users } from 'lucide-react';

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-surface-muted">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-3xl bg-lime-100 flex items-center justify-center mb-6">
          <Users className="w-10 h-10 text-lime-600" />
        </div>
        <h1 className="font-display font-bold text-3xl text-text-primary mb-3">Community</h1>
        <p className="text-text-secondary max-w-md mb-8">
          Connect with fellow creators, share tips, collaborate on projects, and grow together.
        </p>
        <span className="badge-lime text-sm px-4 py-2">Coming Soon</span>
      </div>
    </div>
  );
}
