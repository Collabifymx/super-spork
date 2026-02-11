'use client';

import { Search, Mic } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function HeroSection() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <section className="gradient-hero relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-10 right-20 w-40 h-40 rounded-full border border-white/10 opacity-30" />
      <div className="absolute bottom-20 right-40 w-24 h-24 rounded-full border border-lime-400/20" />
      <div className="absolute top-20 right-60">
        <svg className="w-8 h-8 text-lime-400/40" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.4 7.4-6.4-4.8-6.4 4.8 2.4-7.4-6-4.6h7.6z" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16 lg:py-20">
        <div className="grid lg:grid-cols-[1fr,auto] gap-8 items-start">
          {/* Left: Text + Search */}
          <div>
            <h1 className="font-display font-bold text-white text-5xl lg:text-7xl leading-[1.1] mb-8">
              <span className="inline-flex items-center gap-3">
                Find
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl border-2 border-lime-400/60 bg-lime-400/10">
                  <Search className="w-5 h-5 text-lime-400" />
                </span>
                Influencers
              </span>
              <br />
              <span className="inline-flex items-center gap-3">
                {/* Colored circle avatars */}
                <span className="flex -space-x-2">
                  <span className="w-10 h-10 rounded-full bg-yellow-400 border-2 border-surface-dark" />
                  <span className="w-10 h-10 rounded-full bg-pink-400 border-2 border-surface-dark" />
                  <span className="w-10 h-10 rounded-full bg-blue-400 border-2 border-surface-dark" />
                </span>
                to collaborate
              </span>
              <br />
              with
            </h1>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative max-w-xl">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="w-full py-4 px-6 pr-24 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white placeholder-gray-400 text-base focus:ring-2 focus:ring-lime-400 focus:border-transparent outline-none transition-all"
                aria-label="Search for creators"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  className="p-2.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Voice search"
                >
                  <Mic className="w-5 h-5" />
                </button>
                <button
                  type="submit"
                  className="p-2.5 rounded-full bg-lime-400 text-surface-dark hover:bg-lime-300 transition-colors"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>

          {/* Right: CTA Card */}
          <div className="hidden lg:block">
            <div className="w-64 h-48 rounded-3xl bg-lime-400 p-6 flex flex-col justify-between relative overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full border-2 border-surface-dark/10" />
              <div className="absolute bottom-4 right-4 w-16 h-16 rounded-full border-2 border-surface-dark/10" />

              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-surface-dark/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-surface-dark" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <div className="w-10 h-10 rounded-full bg-surface-dark flex items-center justify-center">
                  <svg className="w-5 h-5 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>

              <div>
                <p className="font-display font-bold text-surface-dark text-xl leading-tight">
                  See how<br />it&apos;s done
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
