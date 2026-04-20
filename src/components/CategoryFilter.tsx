'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useRef, useState } from 'react'
import { CATEGORIES as PRODUCT_CATEGORIES } from '@/collections/Products'

const CATEGORIES = [
  { value: '', label: 'Todas' },
  ...PRODUCT_CATEGORIES.map(({ value, label }) => ({ value, label })),
]

function CategoryButton({
  value,
  label,
  active,
  onSelect,
}: {
  value: string
  label: string
  active: boolean
  onSelect: (v: string) => void
}) {
  return (
    <button
      onClick={() => onSelect(value)}
      aria-pressed={active}
      className={`flex-shrink-0 rounded-pill px-4 py-2 text-body-sm font-700 transition-all duration-200 min-h-[44px] border-2 whitespace-nowrap
        ${active
          ? 'bg-primary text-white border-primary shadow-primary'
          : 'bg-white text-ink border-gray-200 hover:border-primary hover:text-primary'
        }`}
    >
      {label}
    </button>
  )
}

export default function CategoryFilter() {
  const router  = useRouter()
  const params  = useSearchParams()
  const current = params.get('cat') ?? ''
  const [paused, setPaused] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)

  const select = (value: string) => {
    const url = value ? `/atividades?cat=${value}` : '/atividades'
    router.push(url, { scroll: false })
  }

  return (
    <>
      {/* ── Mobile: marquee infinito ── */}
      <div
        className="md:hidden relative overflow-hidden"
        role="group"
        aria-label="Filtrar por categoria"
        // Pausa ao tocar para permitir o clique
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Gradiente de fade nas bordas para indicar continuidade */}
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div
          ref={trackRef}
          className="flex gap-2 py-1 animate-marquee"
          style={{
            width: 'max-content',
            animationPlayState: paused ? 'paused' : 'running',
          }}
        >
          {/* Lista original + cópia para loop contínuo */}
          {[...CATEGORIES, ...CATEGORIES].map(({ value, label }, i) => (
            <CategoryButton
              key={`${value}-${i}`}
              value={value}
              label={label}
              active={current === value}
              onSelect={select}
            />
          ))}
        </div>
      </div>

      {/* ── Desktop: grade com quebra de linha, centralizado ── */}
      <div
        className="hidden md:flex flex-wrap gap-2 justify-center"
        role="group"
        aria-label="Filtrar por categoria"
      >
        {CATEGORIES.map(({ value, label }) => (
          <CategoryButton
            key={value}
            value={value}
            label={label}
            active={current === value}
            onSelect={select}
          />
        ))}
      </div>
    </>
  )
}
