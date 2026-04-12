import { type Address } from 'viem';

// Deploy ProfileRegistry to Base Mainnet and paste the address here
// npx hardhat run scripts/deploy.ts --network base
export const CONTRACT_ADDRESS: Address =
  (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as Address) ||
  '0x2966a0eFA55F03F86Dd2736c25Ef76300B9c07D9';

export const ABI = [
  {
    type: 'function',
    name: 'setProfile',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'favoriteArtists', type: 'string[]' },
      { name: 'themeColor', type: 'string' },
      { name: 'frameStyle', type: 'string' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getProfile',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'favoriteArtists', type: 'string[]' },
      { name: 'themeColor', type: 'string' },
      { name: 'frameStyle', type: 'string' },
      { name: 'updatedAt', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'hasProfile',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'event',
    name: 'ProfileUpdated',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'themeColor', type: 'string', indexed: false },
      { name: 'frameStyle', type: 'string', indexed: false },
      { name: 'updatedAt', type: 'uint256', indexed: false },
    ],
  },
  { type: 'error', name: 'TooManyArtists', inputs: [] },
  { type: 'error', name: 'ArtistNameTooLong', inputs: [] },
  { type: 'error', name: 'InvalidColor', inputs: [] },
] as const;

// Theme presets — maps themeColor to gradient CSS
export const THEME_PRESETS = [
  { id: 'aurora',   color: '#7c3aed', label: 'Aurora',   gradient: 'from-violet-600 to-indigo-500' },
  { id: 'sunset',   color: '#f97316', label: 'Sunset',   gradient: 'from-orange-500 to-pink-500' },
  { id: 'ocean',    color: '#06b6d4', label: 'Ocean',    gradient: 'from-cyan-500 to-blue-600' },
  { id: 'forest',   color: '#10b981', label: 'Forest',   gradient: 'from-emerald-500 to-teal-600' },
  { id: 'ember',    color: '#ef4444', label: 'Ember',    gradient: 'from-red-500 to-orange-400' },
  { id: 'midnight', color: '#6366f1', label: 'Midnight', gradient: 'from-indigo-600 to-purple-700' },
] as const;

export const FRAME_STYLES = [
  { id: 'minimal', label: 'Minimal' },
  { id: 'glow',    label: 'Glow' },
  { id: 'neon',    label: 'Neon' },
  { id: 'crystal', label: 'Crystal' },
] as const;

export function getThemeGradient(color: string): string {
  const preset = THEME_PRESETS.find((t) => t.color === color);
  return preset?.gradient ?? 'from-violet-600 to-indigo-500';
}
