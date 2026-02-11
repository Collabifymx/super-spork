'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { CreatorCard, CreatorCardSkeleton } from '@/components/creators/CreatorCard';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const CATEGORIES = ['Fashion', 'Beauty', 'Fitness', 'Travel', 'Food', 'Tech', 'Gaming', 'Lifestyle', 'Comedy', 'Education', 'Music', 'Art'];
const PLATFORMS = ['TIKTOK', 'INSTAGRAM', 'YOUTUBE', 'TWITTER'];

function SearchContent() {
  const searchParams = useSearchParams();
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState({
    categories: [] as string[],
    platforms: [] as string[],
    verifiedOnly: false,
    sortBy: 'followers',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchCreators();
  }, [page, filters]);

  async function fetchCreators() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('query', query);
      filters.categories.forEach((c) => params.append('categories', c));
      filters.platforms.forEach((p) => params.append('platforms', p));
      if (filters.verifiedOnly) params.set('verifiedOnly', 'true');
      params.set('sortBy', filters.sortBy);
      params.set('page', page.toString());
      params.set('limit', '20');

      const res = await fetch(`/api/search/creators?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCreators(data.data);
        setTotal(data.total);
      }
    } catch {
      // Demo fallback
    } finally {
      setLoading(false);
    }
  }

  const toggleCategory = (cat: string) => {
    setFilters((f) => ({
      ...f,
      categories: f.categories.includes(cat) ? f.categories.filter((c) => c !== cat) : [...f.categories, cat],
    }));
  };

  return (
    <div className="min-h-screen bg-surface-muted">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchCreators()}
              placeholder="Search creators by name, category, location..."
              className="input-base pl-12"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${showFilters ? '!bg-lime-400 !text-surface-dark !border-lime-400' : ''}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="card p-6 mb-8 space-y-6">
            <div>
              <h3 className="font-semibold text-sm mb-3">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat} onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      filters.categories.includes(cat) ? 'bg-lime-400 text-surface-dark font-medium' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-3">Platforms</h3>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p} onClick={() => setFilters((f) => ({
                      ...f,
                      platforms: f.platforms.includes(p) ? f.platforms.filter((x) => x !== p) : [...f.platforms, p],
                    }))}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      filters.platforms.includes(p) ? 'bg-purple-500 text-white font-medium' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                    }`}
                  >
                    {p.charAt(0) + p.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox" checked={filters.verifiedOnly}
                  onChange={(e) => setFilters((f) => ({ ...f, verifiedOnly: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-lime-500 focus:ring-lime-400"
                />
                <span className="text-sm">Verified only</span>
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value }))}
                className="input-base w-auto text-sm"
              >
                <option value="followers">Most followers</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="response_time">Fastest response</option>
              </select>
            </div>
          </div>
        )}

        {/* Results */}
        <p className="text-text-secondary text-sm mb-4">{total} creators found</p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <CreatorCardSkeleton key={i} />)}
          </div>
        ) : creators.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-text-secondary text-lg">No creators found</p>
            <p className="text-text-secondary text-sm mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {creators.map((creator: any) => (
              <CreatorCard key={creator.id} {...creator} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-muted"><Navbar /><div className="max-w-7xl mx-auto px-6 py-8"><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{Array.from({ length: 8 }).map((_, i) => <CreatorCardSkeleton key={i} />)}</div></div></div>}>
      <SearchContent />
    </Suspense>
  );
}
