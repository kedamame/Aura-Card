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

    // slot 1 → themeColor offset (bytes)
    const tcOff = toNum(data.slice(64, 128)) * 2;
    const tcLen = toNum(data.slice(tcOff, tcOff + 64));
    const themeColor = (tcLen > 0 && tcLen < 50)
      ? hexToUtf8(data.slice(tcOff + 64, tcOff + 64 + tcLen * 2))
      : '#7c3aed';

    // slot 0 → artists offset (bytes)
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
  try {
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
    const short = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '—';

    return new ImageResponse(
      (
        <div
          style={{
            width: 900,
            height: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #080810 0%, #12101e 100%)',
            position: 'relative',
          }}
        >
          {/* glow top-right */}
          <div style={{ position: 'absolute', top: 0, right: 0, width: 400, height: 400, borderRadius: 200, background: `radial-gradient(circle, ${from}44 0%, transparent 70%)`, display: 'flex' }} />
          {/* glow bottom-left */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: 280, height: 280, borderRadius: 140, background: `radial-gradient(circle, ${to}33 0%, transparent 70%)`, display: 'flex' }} />

          {/* Card */}
          <div
            style={{
              width: 520,
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${from}66`,
              borderRadius: 28,
              padding: '40px 48px',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              boxShadow: `0 0 60px ${from}33`,
            }}
          >
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{ width: 60, height: 60, borderRadius: 30, background: `linear-gradient(135deg, ${from}, ${to})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, color: 'white', flexShrink: 0 }}>
                ✦
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ color: 'white', fontWeight: 700, fontSize: 24 }}>{short}</div>
                <div style={{ color: `${from}cc`, fontSize: 15, marginTop: 4 }}>{label} Aura · Base</div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: `linear-gradient(to right, ${from}55, ${to}55)`, display: 'flex' }} />

            {/* Artists */}
            {artists.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, letterSpacing: 3 }}>♪ VIBING TO</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {artists.map((a, i) => (
                    <div key={i} style={{ padding: '7px 20px', borderRadius: 100, background: `linear-gradient(to right, ${from}, ${to})`, color: 'white', fontSize: 16, fontWeight: 600 }}>
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>on Base Mainnet</div>
              <div style={{ color: from, fontSize: 22, fontWeight: 800 }}>Aura Card</div>
            </div>
          </div>
        </div>
      ),
      { width: 900, height: 600 }
    );
  } catch (e) {
    // Return minimal fallback image on any error
    return new ImageResponse(
      (
        <div style={{ width: 900, height: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080810' }}>
          <div style={{ color: '#7c3aed', fontSize: 48, fontWeight: 800 }}>Aura Card</div>
        </div>
      ),
      { width: 900, height: 600 }
    );
  }
}
