import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';

const RPC = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org';
const CONTRACT =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x2966a0eFA55F03F86Dd2736c25Ef76300B9c07D9';
const BLOCKSCOUT = 'https://base.blockscout.com/api';
const OWN_CONTRACT = CONTRACT.toLowerCase();

// ── profile ──────────────────────────────────────────────────────────────────

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
    const themeColor =
      tcLen > 0 && tcLen < 50
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

// ── latest tx ─────────────────────────────────────────────────────────────────

interface Tx {
  hash: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  functionName?: string;
  tokenSymbol?: string;
  input?: string;
}

async function fetchTxList(action: string, address: string): Promise<Tx[]> {
  try {
    const url =
      `${BLOCKSCOUT}?module=account&action=${action}` +
      `&address=${address}&page=1&offset=10&sort=desc`;
    const res = await fetch(url, { cache: 'no-store' });
    const json = JSON.parse(await res.text()) as { status?: string; result?: unknown };
    if (json.status === '1' && Array.isArray(json.result)) return json.result as Tx[];
  } catch { /* ignore */ }
  return [];
}

async function resolveFunctionName(input: string | undefined): Promise<string> {
  if (!input || input === '0x' || input.length < 10) return '';
  try {
    const res = await fetch(
      `https://www.4byte.directory/api/v1/signatures/?hex_signature=${input.slice(0, 10)}`,
      { next: { revalidate: 86400 } },
    );
    const data = await res.json() as { results?: { text_signature: string }[] };
    return data?.results?.[0]?.text_signature ?? '';
  } catch { return ''; }
}

async function getLatestTx(address: string): Promise<Tx | null> {
  const [normal, internal, token] = await Promise.all([
    fetchTxList('txlist', address),
    fetchTxList('txlistinternal', address),
    fetchTxList('tokentx', address),
  ]);

  const tx = [...normal, ...internal, ...token]
    .filter((t) => t.to?.toLowerCase() !== OWN_CONTRACT)
    .sort((a, b) => parseInt(b.timeStamp) - parseInt(a.timeStamp))[0] ?? null;

  if (tx && !tx.functionName) {
    tx.functionName = await resolveFunctionName(tx.input);
  }
  return tx;
}

function formatTxLabel(tx: Tx, address: string): string {
  const isOutgoing = tx.from.toLowerCase() === address.toLowerCase();
  if (tx.tokenSymbol) return isOutgoing ? `Sent ${tx.tokenSymbol}` : `Received ${tx.tokenSymbol}`;
  const funcShort = tx.functionName ? tx.functionName.split('(')[0] : null;
  if (funcShort) return `${funcShort}()`;
  const eth = Number(tx.value) / 1e18;
  if (!isOutgoing) return `Received ${eth > 0 ? eth.toFixed(4) + ' ETH' : 'tx'}`;
  if (eth > 0) return `Sent ${eth.toFixed(4)} ETH`;
  return 'Contract call';
}

function formatTimeAgo(ts: string): string {
  const diff = Math.floor(Date.now() / 1000) - parseInt(ts, 10);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── color map ─────────────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, [string, string, string]> = {
  '#7c3aed': ['#7c3aed', '#6366f1', 'Aurora'],
  '#f97316': ['#f97316', '#ec4899', 'Sunset'],
  '#06b6d4': ['#06b6d4', '#2563eb', 'Ocean'],
  '#10b981': ['#10b981', '#0d9488', 'Forest'],
  '#ef4444': ['#ef4444', '#fb923c', 'Ember'],
  '#6366f1': ['#4f46e5', '#7e22ce', 'Midnight'],
};

// ── handler ───────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('addr') ?? '';

  let artists: string[] = [];
  let themeColor = '#7c3aed';
  let latestTx: Tx | null = null;

  if (/^0x[0-9a-fA-F]{40}$/.test(address)) {
    const [profileRes, txRes] = await Promise.allSettled([
      fetch(RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [{ to: CONTRACT, data: encodeGetProfile(address) }, 'latest'],
          id: 1,
        }),
      }).then((r) => r.json() as Promise<{ result?: string }>),
      getLatestTx(address),
    ]);

    if (profileRes.status === 'fulfilled' && profileRes.value?.result?.length > 10) {
      const decoded = decodeProfile(profileRes.value.result);
      artists = decoded.artists;
      themeColor = decoded.themeColor;
    }
    if (txRes.status === 'fulfilled') {
      latestTx = txRes.value;
    }
  }

  const [from, to, label] = COLOR_MAP[themeColor] ?? ['#7c3aed', '#6366f1', 'Aurora'];
  const short = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Aura Card';
  const txLabel = latestTx ? formatTxLabel(latestTx, address) : null;
  const txTime = latestTx ? formatTimeAgo(latestTx.timeStamp) : null;

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
        <div
          style={{
            width: 560,
            background: '#1a1730',
            border: `2px solid ${from}`,
            borderRadius: 28,
            padding: 36,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                background: from,
                display: 'flex',
                flexShrink: 0,
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ color: '#ffffff', fontWeight: 700, fontSize: 22 }}>{short}</div>
              <div style={{ color: from, fontSize: 13 }}>{`${label} Aura - Base`}</div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: from, display: 'flex', opacity: 0.25 }} />

          {/* Latest tx */}
          {txLabel && txTime && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, letterSpacing: 2, display: 'flex' }}>
                BASE ACTIVITY
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    background: to,
                    display: 'flex',
                    flexShrink: 0,
                  }}
                />
                <div style={{ color: '#ffffff', fontSize: 15, fontWeight: 600, display: 'flex' }}>
                  {txLabel}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, display: 'flex', marginLeft: 4 }}>
                  {txTime}
                </div>
              </div>
            </div>
          )}

          {/* Artists */}
          {artists.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, letterSpacing: 2, display: 'flex' }}>
                VIBING TO
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {artists.map((a, i) => (
                  <div
                    key={i}
                    style={{
                      paddingTop: 5,
                      paddingBottom: 5,
                      paddingLeft: 16,
                      paddingRight: 16,
                      borderRadius: 100,
                      background: from,
                      color: '#ffffff',
                      fontSize: 14,
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>on Base Mainnet</div>
            <div style={{ color: to, fontSize: 18, fontWeight: 800 }}>Aura Card</div>
          </div>
        </div>
      </div>
    ),
    { width: 900, height: 600 },
  );
}
