'use client'

export default function AdminLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '4px 0' }}>
      <div style={{ lineHeight: 1.2 }}>
        <div style={{
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 800,
          fontSize: 15,
          color: '#2D2D2D',
          letterSpacing: '-0.02em',
        }}>
          Prô <span style={{ color: '#E0527F' }}>Dani</span>
        </div>
        <div style={{
          fontFamily: 'Nunito, sans-serif',
          fontSize: 10,
          color: '#AAAAAA',
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          Painel Admin
        </div>
      </div>
    </div>
  )
}
