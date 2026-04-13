import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const RPC = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org';
const CONTRACT = (
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x2966a0eFA55F03F86Dd2736c25Ef76300B9c07D9'
).toLowerCase();

// ABI-encode getProfile(address) call
function encodeGetProfile(address: string): string {
  const selector = '0x0f53a470';
  const padded = address.replace('0x', '').toLowerCase().padStart(64, '0');
  return selector + padded;
}

// hex string → Uint8Array → UTF-8 string (edge runtime safe)
function hexToUtf8(hex: string): string {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return new TextDecoder().decode(bytes);
}

// Minimal ABI decoder for (string[], string, string, uint256)
function decodeProfileResult(hex: string): { artists: string[]; themeColor: string } {
  try {
    const data = hex.startsWith('0x') ? hex.slice(2) : hex;
    const toNum = (s: string) => parseInt(s, 16);
    const slot = (i: number) => data.slice(i * 64, i * 64 + 64);

    // slot 1 = offset (bytes) to themeColor string
    const themeColorOffset = toNum(slot(1)) * 2;
    const themeColorLen = toNum(data.slice(themeColorOffset, themeColorOffset + 64));
    const themeColor = themeColorLen > 0 && themeColorLen < 100
      ? hexToUtf8(data.slice(themeColorOffset + 64, themeColorOffset + 64 + themeColorLen * 2))
      : '#7c3aed';

    // slot 0 = offset (bytes) to string[] (artists)
    const artistsOffset = toNum(slot(0)) * 2;
    const artistCount = toNum(data.slice(artistsOffset, artistsOffset + 64));

    const artists: string[] = [];
    for (let i = 0; i < Math.min(artistCount, 5); i++) {
      const elemOffsetHex = data.slice(artistsOffset + 64 + i * 64, artistsOffset + 128 + i * 64);
      const elemOffset = toNum(elemOffsetHex) * 2 + artistsOffset;
      const elemLen = toNum(data.slice(elemOffset, elemOffset + 64));
      if (elemLen > 0 && elemLen < 200) {
        const str = hexToUtf8(data.slice(elemOffset + 64, elemOffset + 64 + elemLen * 2));
        if (str.trim()) artists.push(str.trim());
      }
    }

    return { artists, themeColor };
  } catch {
    return { artists: [], themeColor: '#7c3aed' };
  }
}

function getColors(themeColor: string) {
  const colorMap: Record<string, { from: string; to: string; label: string }> = {
    '#7c3aed': { from: '#7c3aed', to: '#6366f1', label: 'Aurora' },
    '#f97316': { from: '#f97316', to: '#ec4899', label: 'Sunset' },
    '#06b6d4': { from: '#06b6d4', to: '#2563eb', label: 'Ocean' },
    '#10b981': { from: '#10b981', to: '#0d9488', label: 'Forest' },
    '#ef4444': { from: '#ef4444', to: '#fb923c', label: 'Ember' },
    '#6366f1': { from: '#4f46e5', to: '#7e22ce', label: 'Midnight' },
  };
  return colorMap[themeColor] ?? { from: '#7c3aed', to: '#6366f1', label: 'Aurora' };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('addr') ?? '';

  let artists: string[] = [];
  let themeColor = '#7c3aed';

  if (address && address.startsWith('0x') && address.length === 42) {
    try {
      const res = await fetch(RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [{ to: CONTRACT, data: encodeGetProfile(address) }, 'latest'],
          id: 1,
        }),
      });
      const json = await res.json() as { result?: string };
      if (json.result && json.result !== '0x') {
        const decoded = decodeProfileResult(json.result);
        artists = decoded.artists;
        themeColor = decoded.themeColor;
      }
    } catch {
      // use defaults
    }
  }

  const { from, to, label } = getColors(themeColor);
  const displayAddr = address
    ? address.slice(0, 6) + '...' + address.slice(-4)
    : 'Aura Card';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #080810 0%, #12101e 100%)',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Background glow */}
        <div style={{ position: 'absolute', top: -120, right: -120, width: 480, height: 480, borderRadius: 240, background: `radial-gradient(circle, ${from}55 0%, transparent 70%)` }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 320, height: 320, borderRadius: 160, background: `radial-gradient(circle, ${to}33 0%, transparent 70%)` }} />

        {/* Card */}
        <div
          style={{
            margin: 'auto',
            width: 500,
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${from}55`,
            borderRadius: 28,
            padding: '36px 44px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            boxShadow: `0 0 40px ${from}44`,
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 28, background: `linear-gradient(135deg, ${from}, ${to})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: 'white', flexShrink: 0 }}>
              ✦
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 22 }}>{displayAddr}</div>
              <div style={{ color: `${from}cc`, fontSize: 14 }}>{label} Aura · Base</div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: `linear-gradient(to right, ${from}66, ${to}66)` }} />

          {/* Artists */}
          {artists.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, letterSpacing: 3 }}>♪ VIBING TO</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {artists.map((a) => (
                  <div key={a} style={{ padding: '6px 18px', borderRadius: 100, background: `linear-gradient(to right, ${from}, ${to})`, color: 'white', fontSize: 15, fontWeight: 600 }}>
                    {a}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>aura-card-five.vercel.app</div>
            <div style={{ color: from, fontSize: 20, fontWeight: 800 }}>Aura Card</div>
          </div>
        </div>
      </div>
    ),
    { width: 900, height: 600 }
  );
}
