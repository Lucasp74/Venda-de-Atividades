'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const links = [
  { href: '/',            label: 'Home'        },
  { href: '/quem-sou-eu', label: 'Quem Sou Eu' },
  { href: '/atividades',  label: 'Atividades'  },
]

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Fecha o menu ao navegar
  useEffect(() => { setOpen(false) }, [pathname])

  // Bloqueia scroll do body quando o menu está aberto
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* ── Barra de navegação ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-[0_2px_16px_rgba(0,0,0,0.07)]">
        <nav
          className="container-main flex items-center justify-between h-[70px]"
          aria-label="Navegação principal"
        >
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center min-h-[44px]"
            aria-label="Página inicial — Prô Dani"
          >
            <span className="font-heading font-800 text-lg text-ink leading-none">
              Prô <span className="text-primary">Dani</span>
            </span>
          </Link>

          {/* Links — desktop */}
          <ul className="hidden md:flex items-center gap-8 list-none" role="list">
            {links.map(({ href, label }) => {
              const active = pathname === href
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`font-body font-700 text-body-sm transition-colors duration-200 min-h-[44px] flex items-center px-1 pb-0.5 border-b-2
                      ${active
                        ? 'text-primary border-primary'
                        : 'text-ink hover:text-primary border-transparent'
                      }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* CTA — desktop */}
          <Link
            href="/atividades"
            className="hidden md:inline-flex btn-primary text-sm px-5 py-2.5"
            aria-label="Ver todas as atividades"
          >
            Ver Atividades
          </Link>

          {/* Botão hamburger — mobile */}
          <button
            className="md:hidden flex flex-col justify-center items-center gap-1.5 w-11 h-11 rounded-lg hover:bg-primary-50 transition-colors"
            onClick={() => setOpen(v => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          >
            <span className={`block w-5 h-0.5 bg-ink transition-all duration-300 ${open ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-ink transition-all duration-300 ${open ? 'opacity-0 scale-x-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-ink transition-all duration-300 ${open ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </nav>
      </header>

      {/* ── Overlay escuro ── */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity duration-300
          ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* ── Sidebar — desliza da esquerda ── */}
      <aside
        id="mobile-menu"
        className={`fixed top-0 left-0 bottom-0 z-50 md:hidden
          w-[80vw] max-w-[300px]
          bg-white flex flex-col
          shadow-[4px_0_32px_rgba(0,0,0,0.18)]
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Menu de navegação"
        aria-hidden={!open}
      >
        {/* Cabeçalho da sidebar */}
        <div className="flex items-center justify-between px-5 h-[70px] border-b border-gray-100 flex-shrink-0">
          <span className="font-heading font-800 text-lg text-ink leading-none">
            Prô <span className="text-primary">Dani</span>
          </span>
          <button
            onClick={() => setOpen(false)}
            className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors text-ink-muted"
            aria-label="Fechar menu"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Links de navegação */}
        <nav className="flex-1 overflow-y-auto px-4 py-4" aria-label="Links de navegação">
          <ul className="flex flex-col gap-1 list-none" role="list">
            {links.map(({ href, label }) => {
              const active = pathname === href
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`flex items-center w-full min-h-[52px] px-4 rounded-xl font-body font-700 text-base transition-colors
                      ${active
                        ? 'bg-primary-50 text-primary'
                        : 'text-ink hover:bg-gray-50'
                      }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>

          <div className="mt-4">
            <Link href="/atividades" className="btn-primary w-full text-base">
              Ver Atividades
            </Link>
          </div>
        </nav>
      </aside>
    </>
  )
}
