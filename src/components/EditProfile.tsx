'use client';

import { useState, useEffect } from 'react';
import { useSendTransaction, useReadContract, useAccount, useWaitForTransactionReceipt, useSwitchChain, useChainId } from 'wagmi';
import { base } from 'wagmi/chains';
import { ABI, CONTRACT_ADDRESS, THEME_PRESETS, FRAME_STYLES } from '@/lib/contract';
import { encodeWithAttribution } from '@/lib/attribution';
import type { Address } from 'viem';

interface EditProfileProps {
  address: Address;
  onClose: () => void;
  onSaved: () => void;
}

export function EditProfile({ address, onClose, onSaved }: EditProfileProps) {
  const { data: profileData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'getProfile',
    args: [address],
  });

  const [artists, setArtists] = useState<string[]>(['', '', '']);
  const [themeColor, setThemeColor] = useState('#7c3aed');
  const [frameStyle, setFrameStyle] = useState('glow');
  const [artistInput, setArtistInput] = useState('');

  useEffect(() => {
    if (!profileData) return;
    const [savedArtists, savedColor, savedFrame] = profileData;
    if ((savedArtists as string[]).length > 0) setArtists(savedArtists as string[]);
    if (savedColor) setThemeColor(savedColor);
    if (savedFrame) setFrameStyle(savedFrame);
  }, [profileData]);

  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { sendTransaction, data: txHash, isPending } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (isSuccess) onSaved();
  }, [isSuccess, onSaved]);

  const filteredArtists = artists.filter((a) => a.trim().length > 0);

  const handleAddArtist = () => {
    const trimmed = artistInput.trim();
    if (!trimmed || filteredArtists.length >= 5) return;
    setArtists((prev) => [...prev.filter((a) => a.trim()), trimmed]);
    setArtistInput('');
  };

  const handleRemoveArtist = (idx: number) => {
    setArtists((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (chainId !== base.id) {
      try {
        await switchChainAsync({ chainId: base.id });
      } catch {
        return;
      }
    }
    const tx = encodeWithAttribution('setProfile', [
      filteredArtists,
      themeColor,
      frameStyle,
    ]);
    sendTransaction(tx);
  };

  const selectedPreset = THEME_PRESETS.find((t) => t.color === themeColor);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-gray-900 border border-white/10 rounded-3xl w-full max-w-sm p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-xl">Edit Aura</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white text-2xl leading-none">
            ×
          </button>
        </div>

        {/* Theme Color */}
        <div>
          <p className="text-white/50 text-xs uppercase tracking-widest mb-3">Aura Color</p>
          <div className="flex flex-wrap gap-2">
            {THEME_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setThemeColor(preset.color)}
                className={`relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                  themeColor === preset.color
                    ? 'bg-white/10 ring-2 ring-white/40'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: preset.color }}
                />
                <span className="text-white/60 text-xs">{preset.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Frame Style */}
        <div>
          <p className="text-white/50 text-xs uppercase tracking-widest mb-3">Frame Style</p>
          <div className="flex gap-2 flex-wrap">
            {FRAME_STYLES.map((frame) => (
              <button
                key={frame.id}
                onClick={() => setFrameStyle(frame.id)}
                className={`px-4 py-2 rounded-xl text-sm transition-all ${
                  frameStyle === frame.id
                    ? 'bg-white/20 text-white font-semibold ring-1 ring-white/30'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {frame.label}
              </button>
            ))}
          </div>
        </div>

        {/* Favorite Artists */}
        <div>
          <p className="text-white/50 text-xs uppercase tracking-widest mb-3">
            Vibing to ({filteredArtists.length}/5)
          </p>

          {/* Existing artists */}
          <div className="flex flex-wrap gap-2 mb-3">
            {filteredArtists.map((artist, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-sm"
              >
                {artist}
                <button
                  onClick={() => handleRemoveArtist(i)}
                  className="text-white/40 hover:text-white leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          {/* Add artist input */}
          {filteredArtists.length < 5 && (
            <div className="flex gap-2">
              <input
                type="text"
                value={artistInput}
                onChange={(e) => setArtistInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddArtist()}
                placeholder="Artist name..."
                maxLength={50}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/30"
              />
              <button
                onClick={handleAddArtist}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm transition-all"
              >
                Add
              </button>
            </div>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={isPending || isConfirming}
          className={`w-full py-3 rounded-2xl font-semibold text-white transition-all ${
            selectedPreset
              ? `bg-gradient-to-r ${selectedPreset.gradient}`
              : 'bg-violet-600'
          } disabled:opacity-50`}
        >
          {isPending
            ? 'Confirm in wallet...'
            : isConfirming
            ? 'Saving on Base...'
            : 'Save Aura'}
        </button>

        {txHash && (
          <a
            href={`https://basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-center text-white/30 text-xs hover:text-white/60 transition-colors"
          >
            View on Basescan ↗
          </a>
        )}
      </div>
    </div>
  );
}
