'use client';

import Image from 'next/image';
import { useReadContract, useBalance } from 'wagmi';
import { ABI, CONTRACT_ADDRESS, getThemeGradient, FRAME_STYLES } from '@/lib/contract';
import { useLatestTx, formatTimeAgo, formatTxLabel, formatAddress } from '@/lib/useLatestTx';
import type { FarcasterUser } from '@/lib/farcaster';
import type { Address } from 'viem';

interface AuraCardProps {
  address: Address;
  user: FarcasterUser | null;
  onEdit?: () => void;
  compact?: boolean;
}

export function AuraCard({ address, user, onEdit, compact = false }: AuraCardProps) {
  const { data: profileData, isLoading: profileLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'getProfile',
    args: [address],
    query: { enabled: !!address },
  });

  const { data: balance } = useBalance({ address, chainId: 8453 });
  const { tx, isLoading: txLoading } = useLatestTx(address);

  const [favoriteArtists, themeColor, frameStyle] =
    profileData ?? [[], '#7c3aed', 'glow', BigInt(0)];

  const gradient = getThemeGradient(themeColor || '#7c3aed');
  const frame = FRAME_STYLES.find((f) => f.id === frameStyle) ?? FRAME_STYLES[1];

  const frameClass = {
    minimal: 'border border-white/20',
    glow: `shadow-[0_0_30px_rgba(124,58,237,0.4)] border border-white/20`,
    neon: `shadow-[0_0_20px_2px] border-2`,
    crystal: 'backdrop-blur-xl border border-white/30 shadow-xl',
  }[frame.id] ?? '';

  const displayName = user?.displayName ?? address.slice(0, 6) + '...' + address.slice(-4);
  const username = user?.username ?? null;
  const pfpUrl = user?.pfpUrl ?? null;

  if (compact) {
    return (
      <div
        className={`relative rounded-2xl overflow-hidden bg-gray-900/90 ${frameClass} p-4 flex items-center gap-4`}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10`} />
        {pfpUrl && (
          <Image
            src={pfpUrl}
            alt={displayName}
            width={48}
            height={48}
            className="rounded-full border-2 border-white/20 flex-shrink-0"
          />
        )}
        <div className="relative">
          <p className="font-bold text-white text-sm">{displayName}</p>
          {username && <p className="text-white/50 text-xs">@{username}</p>}
        </div>
        <div className={`ml-auto w-2 h-2 rounded-full bg-gradient-to-br ${gradient}`} />
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-3xl overflow-hidden bg-gray-900/95 ${frameClass} p-6 w-full max-w-sm mx-auto`}
      style={{ minHeight: 420 }}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10`} />

      {/* Animated orb */}
      <div
        className={`absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gradient-to-br ${gradient} opacity-20 blur-3xl`}
      />

      <div className="relative z-10 flex flex-col gap-5">
        {/* Header: avatar + name */}
        <div className="flex items-center gap-4">
          {pfpUrl ? (
            <Image
              src={pfpUrl}
              alt={displayName}
              width={64}
              height={64}
              className="rounded-full border-2 border-white/20 flex-shrink-0"
            />
          ) : (
            <div
              className={`w-16 h-16 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl font-bold text-white flex-shrink-0`}
            >
              {displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">{displayName}</h2>
            {username && (
              <p className="text-white/50 text-sm">@{username}</p>
            )}
            <div className="flex items-center gap-1.5 mt-1">
              <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${gradient}`} />
              <span className="text-white/40 text-xs capitalize">{frame.label} aura</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className={`h-px bg-gradient-to-r ${gradient} opacity-30`} />

        {/* Favorite Artists */}
        <div>
          <p className="text-white/40 text-xs uppercase tracking-widest mb-2">
            ♪ Vibing to
          </p>
          {profileLoading ? (
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-6 w-16 rounded-full bg-white/10 animate-pulse" />
              ))}
            </div>
          ) : (favoriteArtists as string[]).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {(favoriteArtists as string[]).map((artist, i) => (
                <span
                  key={i}
                  className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${gradient} text-white shadow-sm`}
                >
                  {artist}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-white/30 text-sm italic">No artists set yet</p>
          )}
        </div>

        {/* Base Activity */}
        <div>
          <p className="text-white/40 text-xs uppercase tracking-widest mb-2">
            ⬡ Base Activity
          </p>
          <div className="flex gap-3 mb-3">
            <div className="bg-white/5 rounded-xl px-4 py-2 flex-1 text-center">
              <p className="text-white font-bold text-base">
                {balance
                  ? (Number(balance.value) / 1e18).toFixed(4)
                  : '—'}
              </p>
              <p className="text-white/40 text-xs mt-0.5">ETH</p>
            </div>
            <div className="bg-white/5 rounded-xl px-4 py-2 flex-1 text-center">
              <p className="text-white font-bold text-base">Base</p>
              <p className="text-white/40 text-xs mt-0.5">Mainnet</p>
            </div>
          </div>

          {/* Latest tx */}
          {txLoading ? (
            <>
              <p className="text-white/30 text-xs uppercase tracking-widest mb-1.5">Latest tx</p>
              <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2.5">
                <div className="w-3 h-3 rounded-full border-2 border-white/20 border-t-white/60 animate-spin flex-shrink-0" />
                <span className="text-white/30 text-xs">Fetching latest tx...</span>
              </div>
            </>
          ) : tx ? (
            <>
              <p className="text-white/30 text-xs uppercase tracking-widest mb-1.5">Latest tx</p>
              <a
                href={`https://basescan.org/tx/${tx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors rounded-xl px-4 py-2.5 group"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-white text-xs font-medium">
                    {formatTxLabel(tx, address)}
                  </span>
                  <span className="text-white/40 text-xs font-mono">
                    → {formatAddress(tx.to)}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-white/40 text-xs">{formatTimeAgo(tx.timeStamp)}</span>
                  {tx.isError === '1' && (
                    <span className="text-red-400 text-xs">failed</span>
                  )}
                  <span className="text-white/20 text-xs group-hover:text-white/40 transition-colors">↗</span>
                </div>
              </a>
            </>
          ) : null}
        </div>

        {/* Wallet address */}
        <div className="bg-white/5 rounded-xl px-4 py-2">
          <p className="text-white/30 text-xs font-mono text-center">
            {address.slice(0, 10)}...{address.slice(-8)}
          </p>
        </div>

        {/* Edit button */}
        {onEdit && (
          <button
            onClick={onEdit}
            className={`w-full py-3 rounded-2xl font-semibold text-white bg-gradient-to-r ${gradient} hover:opacity-90 transition-opacity shadow-lg`}
          >
            Edit My Aura
          </button>
        )}
      </div>
    </div>
  );
}
