import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import ProductCard from '@/components/ProductCard'
import type { Product } from '@/payload-types'

// ── ISR: revalida a cada 1 hora — página serve do cache e atualiza em background
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Prô Dani — Atividades Infantis',
  description: 'E-books e atividades educativas criados com carinho para tornar o aprendizado mais colorido e divertido.',
}

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'products',
      where: {
        and: [
          { featured: { equals: true  } },
          { status:   { equals: 'published' } },
        ],
      },
      limit: 4,
      sort: '-createdAt',
    })
    return docs as Product[]
  } catch {
    return []
  }
}

async function getTotalProducts(): Promise<number> {
  try {
    const payload = await getPayload({ config })
    const { totalDocs } = await payload.find({
      collection: 'products',
      where: { status: { equals: 'published' } },
      limit: 1,
    })
    return totalDocs
  } catch {
    return 0
  }
}

const CATEGORY_ICONS: Record<string, string> = {
  alfabetizacao: '📖',
  matematica:    '🔢',
  artes:         '🎨',
  ciencias:      '🌱',
  jogos:         '🧩',
  sequencias:    '📚',
}

const CATEGORIES_DISPLAY = [
  { value: 'alfabetizacao', label: 'Alfabetização', color: 'bg-pink-50    border-pink-200   text-pink-700'   },
  { value: 'matematica',    label: 'Matemática',    color: 'bg-blue-50    border-blue-200   text-blue-700'   },
  { value: 'artes',         label: 'Artes',         color: 'bg-yellow-50  border-yellow-200 text-yellow-700' },
  { value: 'ciencias',      label: 'Ciências',      color: 'bg-green-50   border-green-200  text-green-700'  },
  { value: 'jogos',         label: 'Jogos',         color: 'bg-purple-50  border-purple-200 text-purple-700' },
  { value: 'sequencias',    label: 'Sequências',    color: 'bg-rose-50    border-rose-200   text-rose-700'   },
]

export default async function HomePage() {
  const [featured, totalProducts] = await Promise.all([getFeaturedProducts(), getTotalProducts()])

  return (
    <>
      {/* ── HERO ── */}
      <section className="bg-hero-gradient py-12 md:py-24" aria-labelledby="hero-heading">
        <div className="container-main">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">

            {/* Text */}
            <div className="flex-1 text-center lg:text-left animate-fade-up">
              <span className="inline-block bg-secondary-100 text-secondary-700 border border-secondary-300 rounded-pill px-4 py-1.5 text-caption font-700 tracking-wide mb-4">
                ✨ + de {totalProducts > 0 ? totalProducts : '200'} atividades disponíveis
              </span>
              <h1 id="hero-heading" className="font-heading text-h2 sm:text-h1 md:text-display text-ink mb-4 leading-tight">
                Materiais para{' '}
                <span className="text-primary relative inline-block">
                  alfabetização
                  <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none" aria-hidden="true">
                    <path d="M0 6 Q100 0 200 6" stroke="#FF6B9D" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.6"/>
                  </svg>
                </span>{' '}
                e desenvolvimento infantil
              </h1>
              <p className="text-ink-muted text-body md:text-body-lg max-w-[500px] mx-auto lg:mx-0 mb-7 leading-relaxed">
                Recursos práticos para o 1° ao 5° ano, com atividades de consciência fonológica e conteúdos para diversas áreas de aprendizagem.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link href="/atividades" className="btn-primary text-base px-8">
                  Ver Atividades
                </Link>
                <Link href="/quem-sou-eu" className="btn-outline text-base px-8">
                  Conheça a Prô Dani
                </Link>
              </div>
            </div>

            {/* Floating books visual — oculto em celulares pequenos para não empurrar o CTA */}
            <div className="hidden sm:grid flex-shrink-0 grid-cols-2 gap-4 lg:gap-5" aria-hidden="true">
              {[
                { bg: 'bg-primary-gradient', emoji: '📚', label: 'Alfabetização' },
                { bg: 'from-accent-purple to-purple-700 bg-gradient-to-br', emoji: '🔢', label: 'Matemática',  extra: 'translate-y-4' },
                { bg: 'from-secondary-400 to-secondary-600 bg-gradient-to-br', emoji: '🎨', label: 'Artes',  extra: '-translate-y-2' },
                { bg: 'from-accent-green to-green-600 bg-gradient-to-br', emoji: '🌱', label: 'Ciências' },
              ].map(({ bg, emoji, label, extra = '' }) => (
                <div
                  key={label}
                  className={`w-28 h-36 sm:w-32 sm:h-44 md:w-36 md:h-48 ${bg} rounded-2xl shadow-float flex flex-col items-center justify-center gap-2 text-white ${extra} transition-transform hover:-translate-y-1 duration-300`}
                >
                  <span className="text-3xl md:text-4xl">{emoji}</span>
                  <span className="text-[0.6rem] md:text-[0.65rem] font-700 text-center px-2 opacity-90">{label}</span>
                </div>
              ))}
            </div>

            {/* Versão mobile das categorias — só ícones, substitui os cards */}
            <div className="flex sm:hidden justify-center gap-4" aria-hidden="true">
              {[
                { bg: 'bg-primary-gradient', emoji: '📚' },
                { bg: 'from-accent-purple to-purple-700 bg-gradient-to-br', emoji: '🔢' },
                { bg: 'from-secondary-400 to-secondary-600 bg-gradient-to-br', emoji: '🎨' },
                { bg: 'from-accent-green to-green-600 bg-gradient-to-br', emoji: '🌱' },
              ].map(({ bg, emoji }, i) => (
                <div
                  key={i}
                  className={`w-14 h-14 ${bg} rounded-xl shadow-float flex items-center justify-center text-2xl`}
                >
                  {emoji}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="container-main mt-6 sm:-mt-8 mb-0 relative z-10" aria-label="Números do site">
        <div className="bg-white rounded-2xl shadow-card-lg grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100 overflow-hidden">
          {[
            { num: `${totalProducts > 0 ? totalProducts : '200'}+`, label: 'Atividades'         },
            { num: '5k+',                                           label: 'Professoras atendidas'},
            { num: '4.9★',                                          label: 'Avaliação média'      },
            { num: 'R$ 3,90',                                       label: 'A partir de'          },
          ].map(({ num, label }) => (
            <div key={label} className="flex flex-col items-center py-6 px-4 text-center">
              <span className="font-heading font-800 text-h3 text-primary tabular-nums">{num}</span>
              <span className="text-ink-muted text-caption font-700 mt-1">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="pt-12 md:pt-20 pb-4" aria-labelledby="categories-heading">
        <div className="container-main">
          <h2 id="categories-heading" className="font-heading text-h3 md:text-h2 text-center text-ink mb-2">
            Explore por Categoria
          </h2>
          <p className="text-ink-muted text-body text-center mb-10">
            Encontre a atividade perfeita para cada momento da aula
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {CATEGORIES_DISPLAY.map(({ value, label, color }) => (
              <Link
                key={value}
                href={`/atividades?cat=${value}`}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 ${color} hover:scale-105 transition-all duration-200 font-700 text-body-sm text-center min-h-[44px]`}
                aria-label={`Ver atividades de ${label}`}
              >
                <span className="text-2xl" aria-hidden="true">{CATEGORY_ICONS[value]}</span>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      {featured.length > 0 && (
        <section className="py-12 md:py-20" aria-labelledby="featured-heading">
          <div className="container-main">
            <h2 id="featured-heading" className="font-heading text-h3 md:text-h2 text-center text-ink mb-2">
              Atividades em Destaque
            </h2>
            <p className="text-ink-muted text-body text-center mb-10">
              As mais baixadas pelas professoras essa semana
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map(product => (
                <ProductCard key={product.id} product={product} featured />
              ))}
            </div>
            <div className="flex justify-center mt-10">
              <Link href="/atividades" className="btn-outline text-base">
                Ver todas as atividades
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ── */}
      <section className="py-12 md:py-20 bg-primary-50" aria-labelledby="howto-heading">
        <div className="container-main">
          <h2 id="howto-heading" className="font-heading text-h3 md:text-h2 text-center mb-2">Como funciona?</h2>
          <p className="text-ink-muted text-body text-center mb-12">Simples, rápido e seguro</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', icon: '🔍', title: 'Escolha a atividade', desc: 'Navegue pelas categorias e encontre a atividade ideal para a sua turma.' },
              { step: '02', icon: '💳', title: 'Pague com segurança',  desc: 'Pague via PIX, cartão de crédito ou boleto. 100% seguro pelo Mercado Pago.' },
              { step: '03', icon: '📥', title: 'Baixe na hora',        desc: 'Após o pagamento, você recebe o link de download no seu e-mail automaticamente.' },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="bg-white rounded-2xl p-6 shadow-card text-center">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-50 text-primary font-heading font-800 text-h4 mb-4">
                  {step}
                </span>
                <div className="text-3xl mb-3" aria-hidden="true">{icon}</div>
                <h3 className="font-heading font-700 text-h4 mb-2">{title}</h3>
                <p className="text-ink-muted text-body-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </>
  )
}
