import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#080810',
        }}
      >
        {/* Outer glow ring */}
        <div
          style={{
            position: 'absolute',
            width: 860,
            height: 860,
            borderRadius: 430,
            border: '3px solid rgba(124,58,237,0.15)',
            display: 'flex',
          }}
        />
        {/* Mid ring */}
        <div
          style={{
            position: 'absolute',
            width: 680,
            height: 680,
            borderRadius: 340,
            border: '5px solid rgba(124,58,237,0.30)',
            display: 'flex',
          }}
        />
        {/* Inner ring */}
        <div
          style={{
            position: 'absolute',
            width: 500,
            height: 500,
            borderRadius: 250,
            border: '8px solid rgba(124,58,237,0.55)',
            display: 'flex',
          }}
        />

        {/* Card body */}
        <div
          style={{
            width: 560,
            height: 380,
            borderRadius: 60,
            background: 'linear-gradient(145deg, #1a1040 0%, #0f0a2a 100%)',
            border: '4px solid #7c3aed',
            display: 'flex',
            flexDirection: 'column',
            padding: 52,
            gap: 32,
          }}
        >
          {/* Avatar row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                display: 'flex',
                flexShrink: 0,
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div
                style={{
                  width: 220,
                  height: 24,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.7)',
                  display: 'flex',
                }}
              />
              <div
                style={{
                  width: 140,
                  height: 18,
                  borderRadius: 9,
                  background: 'rgba(124,58,237,0.6)',
                  display: 'flex',
                }}
              />
            </div>
          </div>

          {/* Content lines */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ width: 120, height: 36, borderRadius: 18, background: '#7c3aed', display: 'flex' }} />
              <div style={{ width: 140, height: 36, borderRadius: 18, background: '#6366f1', display: 'flex' }} />
              <div style={{ width: 100, height: 36, borderRadius: 18, background: '#4f46e5', display: 'flex' }} />
            </div>
            <div
              style={{
                width: '100%',
                height: 2,
                background: 'rgba(124,58,237,0.3)',
                display: 'flex',
              }}
            />
          </div>
        </div>
      </div>
    ),
    { width: 1024, height: 1024 }
  );
}
