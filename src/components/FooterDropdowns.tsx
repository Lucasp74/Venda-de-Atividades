'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

type Item =
  | { type: 'internal'; href: string; label: string }
  | { type: 'external'; href: string; label: string }

const SECTIONS: { title: string; items: Item[] }[] = [
  {
    title: 'Páginas',
    items: [
      { type: 'internal', href: '/',            label: 'Home'        },
      { type: 'internal', href: '/quem-sou-eu', label: 'Quem Sou Eu' },
      { type: 'internal', href: '/atividades',  label: 'Atividades'  },
    ],
  },
  {
    title: 'Categorias',
    items: [
      { type: 'internal', href: '/atividades?cat=alfabetizacao', label: 'Alfabetização' },
      { type: 'internal', href: '/atividades?cat=matematica',    label: 'Matemática'    },
      { type: 'internal', href: '/atividades?cat=artes',         label: 'Artes'         },
      { type: 'internal', href: '/atividades?cat=ciencias',      label: 'Ciências'      },
      { type: 'internal', href: '/atividades?cat=jogos',         label: 'Jogos'         },
      { type: 'internal', href: '/atividades?cat=sequencias',    label: 'Sequências'    },
    ],
  },
  {
    title: 'Contato',
    items: [
      { type: 'external', href: 'https://instagram.com',       label: '📸 Instagram' },
      { type: 'external', href: 'mailto:dani@profdani.com.br', label: '✉️ E-mail'    },
    ],
  },
]

const linkClass = 'flex items-center px-4 py-2.5 text-body-sm text-ink hover:bg-primary-50 hover:text-primary transition-colors duration-150 min-h-[40px] whitespace-nowrap'

export default function FooterDropdowns() {
  const [open, setOpen] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(null)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div ref={ref} className="flex flex-wrap items-center gap-2">
      {SECTIONS.map((section) => {
        const isOpen = open === section.title
        return (
          <div key={section.title} className="relative">
            <button
              onClick={() => setOpen(isOpen ? null : section.title)}
              aria-expanded={isOpen}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-body-sm font-700 border transition-all duration-200 ${
                isOpen
                  ? 'bg-white text-ink border-white'
                  : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
              }`}
            >
              {section.title}
              <span className={`text-[10px] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {isOpen && (
              <div className="absolute bottom-[calc(100%+8px)] left-0 z-50 bg-white rounded-xl shadow-card-lg border border-primary py-2 min-w-[160px] animate-fade-in">
                {section.items.map((item) =>
                  item.type === 'external' ? (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setOpen(null)}
                      className={linkClass}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(null)}
                      className={linkClass}
                    >
                      {item.label}
                    </Link>
                  )
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
