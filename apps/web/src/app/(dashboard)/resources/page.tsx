'use client';

import { Navbar } from '@/components/layout/Navbar';
import { BookOpen } from 'lucide-react';

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-surface-muted">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-3xl bg-blue-100 flex items-center justify-center mb-6">
          <BookOpen className="w-10 h-10 text-blue-500" />
        </div>
        <h1 className="font-display font-bold text-3xl text-text-primary mb-3">Resources</h1>
        <p className="text-text-secondary max-w-md mb-8">
          Guides, templates, and tools to help you create better content and land more brand deals.
        </p>
        <span className="badge-purple text-sm px-4 py-2">Coming Soon</span>
      </div>
    </div>
  );
}
