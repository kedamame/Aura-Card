'use client';

import { useEffect, useState } from 'react';
import { useConnect } from 'wagmi';

interface ConnectWalletProps {
  isInMiniApp: boolean;
}

export function ConnectWallet({ isInMiniApp }: ConnectWalletProps) {
  const { connect, connectors, isPending, error } = useConnect();
  const [autoConnectFailed, setAutoConnectFailed] = useState(false);

  // miniapp内ではfarcasterMiniAppコネクタで自動接続を試みる
  useEffect(() => {
    if (!isInMiniApp || autoConnectFailed) return;
    const fc = connectors.find((c) => c.id === 'farcasterMiniApp');
    if (fc) {
      connect(
        { connector: fc },
        { onError: () => setAutoConnectFailed(true) },
      );
    }
  }, [isInMiniApp, connectors, connect, autoConnectFailed]);

  // エラー時はフォールバックボタンを表示
  useEffect(() => {
    if (error) setAutoConnectFailed(true);
  }, [error]);

  // 4秒経っても接続できなければフォールバックボタンを表示
  useEffect(() => {
    if (!isInMiniApp) return;
    const timer = setTimeout(() => setAutoConnectFailed(true), 4000);
    return () => clearTimeout(timer);
  }, [isInMiniApp]);

  if (isInMiniApp && !autoConnectFailed) {
    return (
      <div className="flex flex-col items-center gap-3 w-full max-w-xs mx-auto">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        <p className="text-white/40 text-sm">Connecting wallet...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
      <p className="text-white/50 text-sm text-center mb-2">
        Connect your wallet to view or create your Aura Card
      </p>
      {connectors.map((connector) => (
        <button
          key={connector.id}
          onClick={() => connect({ connector })}
          disabled={isPending}
          className="w-full py-3 px-6 rounded-2xl font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/10 transition-all disabled:opacity-50"
        >
          {connector.id === 'farcasterMiniApp' ? 'Farcaster Wallet' : connector.name}
        </button>
      ))}
      {error && (
        <p className="text-red-400 text-xs text-center">{error.message}</p>
      )}
    </div>
  );
}
