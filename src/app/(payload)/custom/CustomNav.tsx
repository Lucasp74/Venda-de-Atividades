'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  {
    label: 'Loja',
    links: [
      { href: '/admin/collections/products', label: 'Atividades' },
      { href: '/admin/collections/orders',   label: 'Pedidos'    },
    ],
  },
  {
    label: 'Análise',
    links: [
      { href: '/admin/analytics', label: 'Relatórios' },
    ],
  },
  {
    label: 'Sistema',
    links: [
      { href: '/admin/upload-arquivo',    label: '⬆ Upload Grande' },
      { href: '/admin/collections/media', label: 'Mídias'          },
      { href: '/admin/collections/users', label: 'Usuários'        },
    ],
  },
]

export default function CustomNav() {
  const pathname = usePathname()

  const isActive = (href: string) => pathname?.startsWith(href)

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: 60,
      background: '#FFFFFF',
      borderBottom: '2px solid #FFE0EC',
      boxShadow: '0 2px 16px rgba(255,107,157,0.10)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'stretch',
      fontFamily: 'Nunito, sans-serif',
    }}>
      {/* Logo */}
      <Link href="/admin" style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 20px',
        background: 'linear-gradient(135deg, #FF6B9D 0%, #845EC2 100%)',
        textDecoration: 'none',
        flexShrink: 0,
      }}>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 800,
            fontSize: 14,
            color: '#fff',
            letterSpacing: '-0.02em',
          }}>Prô <span style={{ color: '#FFE0EC' }}>Dani</span></div>
          <div style={{
            fontSize: 9,
            color: 'rgba(255,255,255,0.75)',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>Painel Admin</div>
        </div>
      </Link>

      {/* Links */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        flex: 1,
        padding: '0 16px',
        gap: 4,
      }}>
        {navItems.map((group, gi) => (
          <div key={gi} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            ...(gi > 0 ? {
              borderLeft: '1px solid #FFE0EC',
              marginLeft: 8,
              paddingLeft: 8,
            } : {}),
          }}>
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#CCCCCC',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginRight: 4,
            }}>{group.label}</span>
            {group.links.map((link) => {
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '6px 14px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                    ...(active ? {
                      background: 'linear-gradient(135deg, #FFF0F5, #FFE0EC)',
                      color: '#E0527F',
                      borderBottom: '2px solid #FF6B9D',
                    } : {
                      color: '#555555',
                      background: 'transparent',
                    }),
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = '#FFF0F5'
                      ;(e.currentTarget as HTMLElement).style.color = '#FF6B9D'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = 'transparent'
                      ;(e.currentTarget as HTMLElement).style.color = '#555555'
                    }
                  }}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      {/* Logout */}
      <div style={{ display: 'flex', alignItems: 'center', paddingRight: 16 }}>
        <Link href="/admin/logout" style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '6px 14px',
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
          color: '#AAAAAA',
          textDecoration: 'none',
          border: '1px solid #FFE0EC',
          transition: 'all 0.2s ease',
        }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.color = '#E05050'
            ;(e.currentTarget as HTMLElement).style.borderColor = '#FFCCCC'
            ;(e.currentTarget as HTMLElement).style.background = '#FFF0F0'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.color = '#AAAAAA'
            ;(e.currentTarget as HTMLElement).style.borderColor = '#FFE0EC'
            ;(e.currentTarget as HTMLElement).style.background = 'transparent'
          }}
        >
          Sair
        </Link>
      </div>
    </nav>
  )
}
