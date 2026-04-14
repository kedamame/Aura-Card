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
          background: '#080810',
        }}
      >
        {/* Left: branding */}
        <div
          style={{
            width: 480,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            paddingLeft: 72,
            paddingRight: 48,
            gap: 28,
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <div style={{ fontSize: 36, fontWeight: 800, color: 'white', display: 'flex' }}>A</div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'white', display: 'flex' }}>Aura Card</div>
          </div>

          {/* Tagline */}
          <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.55)', display: 'flex', lineHeight: 1.4 }}>
            Your living onchain identity on Base
          </div>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { dot: '#7c3aed', text: 'Set your favorite artists' },
              { dot: '#06b6d4', text: 'Track Base activity' },
              { dot: '#f97316', text: 'Choose your Aura color' },
            ].map((item) => (
              <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    background: item.dot,
                    display: 'flex',
                    flexShrink: 0,
                  }}
                />
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18, display: 'flex' }}>{item.text}</div>
              </div>
            ))}
          </div>

          {/* Base badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              paddingTop: 8,
              paddingBottom: 8,
              paddingLeft: 18,
              paddingRight: 18,
              borderRadius: 100,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: 4, background: '#3b82f6', display: 'flex' }} />
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, display: 'flex' }}>Powered by Base</div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, background: 'rgba(255,255,255,0.06)', display: 'flex' }} />

        {/* Right: card mockup */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 380,
              background: '#111827',
              border: '1px solid rgba(124,58,237,0.5)',
              borderRadius: 28,
              padding: 32,
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                  display: 'flex',
                  flexShrink: 0,
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ color: 'white', fontWeight: 700, fontSize: 16, display: 'flex' }}>0x59DC...fDAD</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: 3, background: '#7c3aed', display: 'flex' }} />
                  <div style={{ color: '#7c3aed', fontSize: 12, display: 'flex' }}>Aurora aura</div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', display: 'flex' }} />

            {/* Base activity */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, letterSpacing: 2, display: 'flex' }}>BASE ACTIVITY</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingTop: 10, paddingBottom: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <div style={{ color: 'white', fontWeight: 700, fontSize: 15, display: 'flex' }}>0.0024</div>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, display: 'flex' }}>ETH</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingTop: 10, paddingBottom: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <div style={{ color: 'white', fontWeight: 700, fontSize: 15, display: 'flex' }}>Base</div>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, display: 'flex' }}>Mainnet</div>
                </div>
              </div>
            </div>

            {/* Vibing to */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, letterSpacing: 2, display: 'flex' }}>VIBING TO</div>
              <div style={{ display: 'flex', gap: 7 }}>
                {['Tame Impala', 'FKA Twigs'].map((a) => (
                  <div
                    key={a}
                    style={{
                      paddingTop: 5, paddingBottom: 5, paddingLeft: 12, paddingRight: 12,
                      borderRadius: 100, background: '#7c3aed',
                      color: 'white', fontSize: 12, fontWeight: 600, display: 'flex',
                    }}
                  >
                    {a}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
