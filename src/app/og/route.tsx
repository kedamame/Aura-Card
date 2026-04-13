import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const RPC = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org';
const CONTRACT = (
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x2966a0eFA55F03F86Dd2736c25Ef76300B9c07D9'
);

function encodeGetProfile(address: string): string {
  const selector = '0x0f53a470';
  const padded = address.replace('0x', '').toLowerCase().padStart(64, '0');
  return selector + padded;
}

function hexToUtf8(hex: string): string {
  try {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return new TextDecoder().decode(bytes).replace(/\0/g, '').trim();
  } catch {
    return '';
  }
}

function decodeProfile(hex: string): { artists: string[]; themeColor: string } {
  try {
    const data = hex.startsWith('0x') ? hex.slice(2) : hex;
    if (data.length < 128) return { artists: [], themeColor: '#7c3aed' };

    const toNum = (s: string) => parseInt(s || '0', 16);

    const tcOff = toNum(data.slice(64, 128)) * 2;
    const tcLen = toNum(data.slice(tcOff, tcOff + 64));
    const themeColor = (tcLen > 0 && tcLen < 50)
      ? hexToUtf8(data.slice(tcOff + 64, tcOff + 64 + tcLen * 2))
      : '#7c3aed';

    const arrOff = toNum(data.slice(0, 64)) * 2;
    const arrCount = toNum(data.slice(arrOff, arrOff + 64));

    const artists: string[] = [];
    for (let i = 0; i < Math.min(arrCount, 5); i++) {
      const elOff = toNum(data.slice(arrOff + 64 + i * 64, arrOff + 128 + i * 64)) * 2 + arrOff;
      const elLen = toNum(data.slice(elOff, elOff + 64));
      if (elLen > 0 && elLen < 100) {
        const s = hexToUtf8(data.slice(elOff + 64, elOff + 64 + elLen * 2));
        if (s) artists.push(s);
      }
    }

    return { artists, themeColor: themeColor || '#7c3aed' };
  } catch {
    return { artists: [], themeColor: '#7c3aed' };
  }
}

const COLOR_MAP: Record<string, [string, string, string]> = {
  '#7c3aed': ['#7c3aed', '#6366f1', 'Aurora'],
  '#f97316': ['#f97316', '#ec4899', 'Sunset'],
  '#06b6d4': ['#06b6d4', '#2563eb', 'Ocean'],
  '#10b981': ['#10b981', '#0d9488', 'Forest'],
  '#ef4444': ['#ef4444', '#fb923c', 'Ember'],
  '#6366f1': ['#4f46e5', '#7e22ce', 'Midnight'],
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('addr') ?? '';

  let artists: string[] = [];
  let themeColor = '#7c3aed';

  if (/^0x[0-9a-fA-F]{40}$/.test(address)) {
    try {
      const rpcRes = await fetch(RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [{ to: CONTRACT, data: encodeGetProfile(address) }, 'latest'],
          id: 1,
        }),
      });
      const rpcJson = await rpcRes.json() as { result?: string };
      if (rpcJson.result && rpcJson.result.length > 10) {
        const decoded = decodeProfile(rpcJson.result);
        artists = decoded.artists;
        themeColor = decoded.themeColor;
      }
    } catch {
      // use defaults
    }
  }

  const [from, to, label] = COLOR_MAP[themeColor] ?? ['#7c3aed', '#6366f1', 'Aurora'];
  const short = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Aura Card';

  return new ImageResponse(
    (
      <div
        style={{
          width: 900,
          height: 600,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0d0b18',
        }}
      >
        {/* Card */}
        <div
          style={{
            width: 520,
            background: '#1a1730',
            border: `2px solid ${from}`,
            borderRadius: 28,
            padding: 40,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                background: from,
                display: 'flex',
                flexShrink: 0,
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ color: '#ffffff', fontWeight: 700, fontSize: 24 }}>{short}</div>
              <div style={{ color: from, fontSize: 14 }}>{`${label} Aura - Base`}</div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: from, display: 'flex', opacity: 0.3 }} />

          {/* Artists */}
          {artists.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>VIBING TO</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {artists.map((a, i) => (
                  <div
                    key={i}
                    style={{
                      paddingTop: 6,
                      paddingBottom: 6,
                      paddingLeft: 18,
                      paddingRight: 18,
                      borderRadius: 100,
                      background: from,
                      color: '#ffffff',
                      fontSize: 15,
                      fontWeight: 600,
                      display: 'flex',
                    }}
                  >
                    {a}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>on Base Mainnet</div>
            <div style={{ color: to, fontSize: 20, fontWeight: 800 }}>Aura Card</div>
          </div>
        </div>
      </div>
    ),
    { width: 900, height: 600 }
  );
}
