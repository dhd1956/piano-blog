import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Global Piano Network'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #312e81 50%, #0f172a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          padding: '60px',
        }}
      >
        {/* Piano keys decoration bar */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            marginBottom: '40px',
          }}
        >
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: '18px',
                height: '80px',
                borderRadius: '0 0 6px 6px',
                backgroundColor: i % 7 !== 2 && i % 7 !== 5 ? 'white' : '#1e3a8a',
                opacity: 0.9,
              }}
            />
          ))}
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 80,
            fontWeight: 'bold',
            color: 'white',
            letterSpacing: '-2px',
            textAlign: 'center',
            lineHeight: 1.1,
          }}
        >
          Global Piano Network
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            color: '#93c5fd',
            marginTop: '24px',
            textAlign: 'center',
            maxWidth: '800px',
            lineHeight: 1.4,
          }}
        >
          Discover piano venues · Connect with musicians · Share the joy
        </div>

        {/* URL */}
        <div
          style={{
            fontSize: 22,
            color: '#60a5fa',
            marginTop: '40px',
            opacity: 0.7,
            letterSpacing: '1px',
          }}
        >
          GlobalPiano.Network
        </div>
      </div>
    ),
    { ...size }
  )
}
