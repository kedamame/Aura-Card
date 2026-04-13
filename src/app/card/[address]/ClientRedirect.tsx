'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientRedirect({ address }: { address: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/?addr=${address}`);
  }, [address, router]);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#080810',
        color: 'rgba(255,255,255,0.4)',
        fontFamily: 'sans-serif',
        fontSize: 14,
      }}
    >
      Loading Aura Card...
    </main>
  );
}
