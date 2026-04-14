import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const maxDuration = 15;

const RPC = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org';
const CONTRACT =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x2966a0eFA55F03F86Dd2736c25Ef76300B9c07D9';
const BLOCKSCOUT = 'https://base.blockscout.com/api';
const OWN_CONTRACT = CONTRACT.toLowerCase();

// ── profile ───────────────────────────────────────────────────────────────────

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

// ── tx ────────────────────────────────────────────────────────────────────────

interface Tx {
  hash: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  functionName?: string;
  tokenSymbol?: string;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

function formatTxLabel(tx: Tx, address: string): string {
  const isOutgoing = tx.from.toLowerCase() === address.toLowerCase();
  if (tx.tokenSymbol) return isOutgoing ? `Sent ${tx.tokenSymbol}` : `Received ${tx.tokenSymbol}`;
  const funcShort = tx.functionName ? tx.functionName.split('(')[0] + '()' : null;
  if (funcShort) return funcShort;
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

function formatAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr ?? '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
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
  let ethBalance: string | null = null;
  let latestTx: Tx | null = null;

  if (/^0x[0-9a-fA-F]{40}$/.test(address)) {
    const [profileRes, balanceRes, txRes] = await Promise.allSettled([
      // profile
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

      // ETH balance
      fetch(RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [address, 'latest'],
          id: 2,
        }),
      }).then((r) => r.json() as Promise<{ result?: string }>),

      // latest tx: fetch txlist only (1 request, no 4byte), skip deployments
      withTimeout(
        fetch(
          `${BLOCKSCOUT}?module=account&action=txlist&address=${address}&page=1&offset=5&sort=desc`,
          { cache: 'no-store' },
        )
          .then((r) => r.text())
          .then((text) => {
            const json = JSON.parse(text) as { status?: string; result?: Tx[] };
            if (json.status !== '1' || !Array.isArray(json.result)) return null;
            return (
              json.result.find(
                (t) => t.to && t.to.toLowerCase() !== OWN_CONTRACT,
              ) ?? null
            );
          }),
        6000,
      ),
    ]);

    if (profileRes.status === 'fulfilled' && profileRes.value?.result && profileRes.value.result.length > 10) {
      const decoded = decodeProfile(profileRes.value.result);
      artists = decoded.artists;
      themeColor = decoded.themeColor;
    }

    if (balanceRes.status === 'fulfilled' && balanceRes.value?.result) {
      const wei = parseInt(balanceRes.value.result, 16);
      ethBalance = (wei / 1e18).toFixed(4);
    }

    if (txRes.status === 'fulfilled') {
      latestTx = txRes.value;
    }
  }

  const [from, , label] = COLOR_MAP[themeColor] ?? ['#7c3aed', '#6366f1', 'Aurora'];
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
          background: '#080d14',
        }}
      >
        <div
          style={{
            width: 560,
            background: '#111827',
            border: `1px solid rgba(255,255,255,0.12)`,
            borderRadius: 28,
            padding: 36,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 28, background: from, display: 'flex', flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ color: '#ffffff', fontWeight: 700, fontSize: 22 }}>{short}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: from, display: 'flex' }} />
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{`${label} aura`}</div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', display: 'flex' }} />

          {/* Base Activity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, letterSpacing: 2, display: 'flex' }}>
              BASE ACTIVITY
            </div>
            {/* ETH + Network boxes */}
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 14, paddingTop: 10, paddingBottom: 10, paddingLeft: 16, paddingRight: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <div style={{ color: '#ffffff', fontWeight: 700, fontSize: 18 }}>{ethBalance ?? '—'}</div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>ETH</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 14, paddingTop: 10, paddingBottom: 10, paddingLeft: 16, paddingRight: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <div style={{ color: '#ffffff', fontWeight: 700, fontSize: 18 }}>Base</div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>Mainnet</div>
              </div>
            </div>

            {/* Latest tx */}
            {latestTx && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, letterSpacing: 2, display: 'flex' }}>
                  LATEST TX
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 14, paddingTop: 10, paddingBottom: 10, paddingLeft: 16, paddingRight: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ color: '#ffffff', fontSize: 14, fontWeight: 600, display: 'flex' }}>
                      {formatTxLabel(latestTx, address)}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, display: 'flex' }}>
                      {`-> ${formatAddress(latestTx.to)}`}
                    </div>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, display: 'flex' }}>
                    {formatTimeAgo(latestTx.timeStamp)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Vibing to */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, letterSpacing: 2, display: 'flex' }}>
              VIBING TO
            </div>
            {artists.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {artists.map((a, i) => (
                  <div
                    key={i}
                    style={{
                      paddingTop: 5, paddingBottom: 5, paddingLeft: 14, paddingRight: 14,
                      borderRadius: 100, background: from,
                      color: '#ffffff', fontSize: 13, fontWeight: 600, display: 'flex',
                    }}
                  >
                    {a}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, fontStyle: 'italic', display: 'flex' }}>
                No artists set yet
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    { width: 900, height: 600 },
  );
}
