import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/components/providers/AppProvider';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aura-card-five.vercel.app';

const miniAppEmbed = {
  version: '1',
  imageUrl: `${APP_URL}/opengraph-image`,
  button: {
    title: 'View My Aura',
    action: {
      type: 'launch_miniapp',
      name: 'Aura Card',
      url: APP_URL,
      splashImageUrl: `${APP_URL}/splash.png`,
      splashBackgroundColor: '#080810',
    },
  },
};

export const metadata: Metadata = {
  title: 'Aura Card',
  description: 'Your living onchain identity on Base',
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: 'Aura Card',
    description: 'Your living onchain identity on Base',
    type: 'website',
    images: ['/og-image.png'],
  },
  other: {
    'fc:miniapp': JSON.stringify(miniAppEmbed),
    'base:app_id': '69ddd22f33eb726c42bba983',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
