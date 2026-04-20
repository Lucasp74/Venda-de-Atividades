'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const AnalyticsView = dynamic(() => import('./AnalyticsView'), {
  ssr: false,
  loading: () => (
    <div style={{
      padding: '60px 28px',
      textAlign: 'center',
      fontFamily: 'Nunito, sans-serif',
      color: '#CCC',
      fontSize: 14,
    }}>
      Carregando Relatórios...
    </div>
  ),
})

/* ── Nav embutida (views customizadas do Payload não incluem o template padrão) ── */
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
      { href: '/admin/collections/media', label: 'Mídias'    },
      { href: '/admin/collections/users', label: 'Usuários'  },
    ],
  },
]

/* CSS com !important para garantir visibilidade acima de qualquer regra do Payload */
const NAV_CSS = `
#analytics-topnav {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  height: 60px !important;
  background: #FFFFFF !important;
  border-bottom: 2px solid #FFE0EC !important;
  box-shadow: 0 2px 16px rgba(255,107,157,0.10) !important;
  z-index: 99999 !important;
  display: flex !important;
  align-items: stretch !important;
  font-family: Nunito, sans-serif !important;
  opacity: 1 !important;
  visibility: visible !important;
  overflow: visible !important;
  transform: none !important;
  width: 100% !important;
  pointer-events: auto !important;
}
#analytics-page-root {
  background: #FFF8F9 !important;
  min-height: 100vh !important;
  opacity: 1 !important;
  visibility: visible !important;
  display: block !important;
}
`

function InlineNav() {
  const pathname = usePathname()
  const isActive = (href: string) => pathname?.startsWith(href)

  return (
    <div id="analytics-topnav">
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
            textTransform: 'uppercase' as const,
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
              textTransform: 'uppercase' as const,
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
                    ...(active ? {
                      background: 'linear-gradient(135deg, #FFF0F5, #FFE0EC)',
                      color: '#E0527F',
                      borderBottom: '2px solid #FF6B9D',
                    } : {
                      color: '#555555',
                      background: 'transparent',
                    }),
                  }}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      {/* Sair */}
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
        }}>
          Sair
        </Link>
      </div>
    </div>
  )
}

export default function AnalyticsWrapper() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: NAV_CSS }} />
      <div id="analytics-page-root">
        <InlineNav />
        <div style={{ paddingTop: 60 }}>
          <Suspense fallback={
            <div style={{ padding: '60px 28px', textAlign: 'center', color: '#CCC', fontSize: 14, fontFamily: 'Nunito, sans-serif' }}>
              Carregando Relatórios...
            </div>
          }>
            <AnalyticsView />
          </Suspense>
        </div>
      </div>
    </>
  )
}
