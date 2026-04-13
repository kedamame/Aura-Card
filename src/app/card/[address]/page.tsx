import type { Metadata } from 'next';
import ClientRedirect from './ClientRedirect';

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://aura-card-five.vercel.app';

interface Props {
  params: { address: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { address } = params;
  const ogImage = `${APP_URL}/og?addr=${address}`;

  const miniAppEmbed = {
    version: '1',
    imageUrl: ogImage,
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

  return {
    title: `Aura Card — ${address.slice(0, 6)}...${address.slice(-4)}`,
    description: 'Living onchain identity on Base',
    openGraph: {
      title: 'Aura Card',
      description: 'Living onchain identity on Base',
      images: [{ url: ogImage, width: 900, height: 600 }],
    },
    other: {
      'fc:miniapp': JSON.stringify(miniAppEmbed),
    },
  };
}

export default function CardPage({ params }: Props) {
  // Client-side redirect so OG metadata HTML is served first
  return <ClientRedirect address={params.address} />;
}
