import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Collabify - Find Influencers to Collaborate With',
  description: 'UGC & Influencer Marketplace for Brands and Creators',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface-muted antialiased">
        {children}
      </body>
    </html>
  );
}
