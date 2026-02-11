import { Navbar } from '@/components/layout/Navbar';
import { HeroSection } from '@/components/layout/HeroSection';
import { CreatorGrid } from '@/components/creators/CreatorGrid';

export default function HomePage() {
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
