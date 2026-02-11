'use client';

import { useState, useEffect } from 'react';
import { CreatorCard, ShowAllCard, CreatorCardSkeleton } from './CreatorCard';

interface CreatorData {
  id: string;
  displayName: string;
  slug: string;
  avatarUrl?: string;
  location?: string;
  totalFollowers: number;
  startingPrice?: number;
  categories: string[];
  verificationStatus: string;
  platforms: string[];
  isAvailable: boolean;
}

const DEMO_CREATORS: CreatorData[] = [
  {
    id: '1', displayName: 'Susan Adams', slug: 'susan-adams',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Susan',
    location: 'Barcelona, ESP', totalFollowers: 870000, startingPrice: 520000,
    categories: ['Comedy'], verificationStatus: 'VERIFIED',
    platforms: ['INSTAGRAM', 'YOUTUBE', 'TIKTOK'], isAvailable: true,
  },
  {
    id: '2', displayName: 'Tamara Brown', slug: 'tamara-brown',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Tamara',
    location: 'Wellington, NZ', totalFollowers: 440000, startingPrice: 240000,
    categories: ['Lifestyle'], verificationStatus: 'VERIFIED',
    platforms: ['INSTAGRAM', 'TIKTOK'], isAvailable: true,
  },
  {
    id: '3', displayName: 'Jay Kellor', slug: 'jay-kellor',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Jay',
    location: 'New York, USA', totalFollowers: 315000, startingPrice: 215000,
    categories: ['Fashion'], verificationStatus: 'VERIFIED',
    platforms: ['INSTAGRAM', 'YOUTUBE', 'TWITTER'], isAvailable: true,
  },
  {
    id: '4', displayName: 'Maria Garcia', slug: 'maria-garcia',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Maria',
    location: 'Mexico City, MX', totalFollowers: 520000, startingPrice: 180000,
    categories: ['Beauty'], verificationStatus: 'VERIFIED',
    platforms: ['TIKTOK', 'INSTAGRAM', 'YOUTUBE'], isAvailable: true,
  },
  {
    id: '5', displayName: 'David Kim', slug: 'david-kim',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=David',
    location: 'Seoul, KR', totalFollowers: 890000, startingPrice: 350000,
    categories: ['Tech', 'Gaming'], verificationStatus: 'VERIFIED',
    platforms: ['YOUTUBE', 'TIKTOK'], isAvailable: true,
  },
  {
    id: '6', displayName: 'Emma Wilson', slug: 'emma-wilson',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Emma',
    location: 'London, UK', totalFollowers: 650000, startingPrice: 280000,
    categories: ['Travel', 'Food'], verificationStatus: 'VERIFIED',
    platforms: ['INSTAGRAM', 'YOUTUBE', 'TIKTOK'], isAvailable: true,
  },
];

export function CreatorGrid() {
  const [creators, setCreators] = useState<CreatorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(13150);

  useEffect(() => {
    async function fetchCreators() {
      try {
        const res = await fetch('/api/search/creators?limit=6&sortBy=followers');
        if (res.ok) {
          const data = await res.json();
          setCreators(data.data);
          setTotal(data.total);
        } else {
          setCreators(DEMO_CREATORS);
        }
      } catch {
        // Fallback to demo data
        setCreators(DEMO_CREATORS);
      } finally {
        setLoading(false);
      }
    }
    fetchCreators();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <CreatorCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Show first 2 creators, then Show All card, then remaining
  const firstTwo = creators.slice(0, 2);
  const rest = creators.slice(2);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {firstTwo.map((creator) => (
        <CreatorCard key={creator.id} {...creator} />
      ))}
      <ShowAllCard count={total} />
      {rest.slice(0, 1).map((creator) => (
        <CreatorCard key={creator.id} {...creator} />
      ))}
      {rest.slice(1).map((creator) => (
        <CreatorCard key={creator.id} {...creator} />
      ))}
    </div>
  );
}
