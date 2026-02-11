'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { HeroSection } from '@/components/layout/HeroSection';
import { CreatorGrid } from '@/components/creators/CreatorGrid';
import { useAuthStore } from '@/lib/auth-store';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/search');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-muted">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface-muted">
      <Navbar />
      <HeroSection />
      <main className="max-w-7xl mx-auto px-6 -mt-8 relative z-10 pb-20">
        <CreatorGrid />
      </main>
    </div>
  );
}
