import { NextRequest, NextResponse } from 'next/server';

const BASESCAN = 'https://api.basescan.org/api';

async function fetchTxList(action: string, address: string, apiKey: string) {
  const url =
    `${BASESCAN}?module=account&action=${action}` +
    `&address=${address}&page=1&offset=5&sort=desc` +
    (apiKey ? `&apikey=${apiKey}` : '');
  const res = await fetch(url, { cache: 'no-store' });
  return res.json();
}

function pickFirst(data: unknown): Record<string, string> | null {
  const d = data as { status?: string; result?: unknown };
  if (d?.status === '1' && Array.isArray(d?.result) && d.result.length > 0) {
    return d.result[0] as Record<string, string>;
  }
  return null;
}

function pickLatest(
  ...txs: (Record<string, string> | null)[]
): Record<string, string> | null {
  return txs
    .filter((t): t is Record<string, string> => t !== null)
    .sort((a, b) => parseInt(b.timeStamp) - parseInt(a.timeStamp))[0] ?? null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { address: string } }
) {
  const { address } = params;
  const apiKey = process.env.NEXT_PUBLIC_BASESCAN_API_KEY ?? '';

  try {
    const [normal, internal, token] = await Promise.all([
      fetchTxList('txlist', address, apiKey),
      fetchTxList('txlistinternal', address, apiKey),
      fetchTxList('tokentx', address, apiKey),
    ]);

    const tx = pickLatest(
      pickFirst(normal),
      pickFirst(internal),
      pickFirst(token),
    );

    return NextResponse.json({
      tx,
      _debug: {
        normalStatus: (normal as {status?:string})?.status,
        internalStatus: (internal as {status?:string})?.status,
        tokenStatus: (token as {status?:string})?.status,
        normalMsg: (normal as {message?:string})?.message,
        internalMsg: (internal as {message?:string})?.message,
        tokenMsg: (token as {message?:string})?.message,
        hasApiKey: !!apiKey,
      },
    });
  } catch (e) {
    return NextResponse.json({ tx: null, error: String(e) });
  }
}
