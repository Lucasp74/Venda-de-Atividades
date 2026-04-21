import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { BLUR_DATA_URL } from '@/lib/blur-placeholder'

// ── Página totalmente estática — gerada uma vez no build, sem revalidação
export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Quem Sou Eu',
  description: 'Conheça a Prô Dani (Daniela), pedagoga apaixonada por criar atividades infantis que transformam o aprendizado.',
}

const VALUES = [
  {
    icon: '🎨',
    title: 'Visual Atraente',
    desc:  'Ilustrações coloridas e modernas que prendem a atenção das crianças e tornam o aprendizado mais envolvente.',
    color: 'bg-pink-50 border-pink-100',
  },
  {
    icon: '📐',
    title: 'Pedagogicamente Correto',
    desc:  'Cada atividade segue diretrizes pedagógicas e respeita as fases de desenvolvimento infantil.',
    color: 'bg-blue-50 border-blue-100',
  },
  {
    icon: '⚡',
    title: 'Pronto para Imprimir',
    desc:  'Baixe, imprima e aplique! Formato A4 otimizado para impressão caseira ou gráfica.',
    color: 'bg-yellow-50 border-yellow-100',
  },
  {
    icon: '♻️',
    title: 'Atualizações Grátis',
    desc:  'Comprou um e-book? Todas as melhorias futuras são suas, sem pagar nada a mais.',
    color: 'bg-green-50 border-green-100',
  },
  {
    icon: '💬',
    title: 'Suporte Ativo',
    desc:  'Dúvidas? Entre em contato por e-mail. Estou sempre disponível para ajudar.',
    color: 'bg-purple-50 border-purple-100',
  },
  {
    icon: '💰',
    title: 'Preço Acessível',
    desc:  'Atividades de qualidade a partir de R$ 3,90 para que toda professora tenha acesso ao melhor material.',
    color: 'bg-rose-50 border-rose-100',
  },
]

const TAGS = [
  '🎓 Pedagogia',
  '🎨 Artes Visuais',
  '📚 Alfabetização',
  '🔢 Matemática Lúdica',
  '🌱 Ed. Infantil',
  '💛 10+ anos de sala',
]

export default function QuemSouEuPage() {
  return (
    <>
      {/* ── HERO ABOUT ── */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-purple-50 py-10 md:py-24" aria-labelledby="about-heading">
        <div className="container-main">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">

            {/* Avatar */}
            <div className="flex-shrink-0 animate-fade-in">
              <div className="relative w-48 h-56 sm:w-64 sm:h-72 md:w-72 md:h-80 lg:w-80 lg:h-96 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(255,107,157,0.35)] ring-4 ring-primary-200">
                <Image
                  src="/dani-profile.jpg"
                  alt="Foto da Prô Dani"
                  fill
                  className="object-cover object-top"
                  priority
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 text-center lg:text-left animate-fade-up">
              <span className="inline-block bg-primary-50 text-primary border border-primary-200 rounded-pill px-4 py-1.5 text-caption font-700 mb-4">
                Olá! Prazer em te conhecer 👋
              </span>
              <h1 id="about-heading" className="font-heading text-h2 md:text-h1 lg:text-display text-ink mb-2">
                Prô Dani
              </h1>
              <p className="text-primary font-700 text-body-lg mb-6">
                Pedagoga • Criadora de Atividades Infantis
              </p>
              <div className="space-y-4 text-ink-muted text-body leading-relaxed max-w-[540px] mx-auto lg:mx-0">
                <p>
                  Sou professora há mais de 10 anos e sempre acreditei que aprender deve ser uma aventura cheia de cores, histórias e descobertas. Foi por isso que comecei a criar atividades especiais para tornar cada aula única.
                </p>
                <p>
                  Cada e-book que você encontra aqui foi desenvolvido com muito carinho, pensando no desenvolvimento integral das crianças e facilitando o trabalho das professoras e mamães.
                </p>
                <p>
                  Meu sonho é que toda criança tenha acesso a materiais pedagógicos de qualidade, e que toda professora possa preparar aulas incríveis sem estresse!
                </p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start mt-6">
                {TAGS.map(tag => (
                  <span
                    key={tag}
                    className="bg-white border-2 border-primary-100 text-purple-700 rounded-pill px-4 py-2 text-body-sm font-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mt-8">
                <Link href="/atividades" className="btn-primary">
                  Ver Atividades
                </Link>
                <Link href="/atividades" className="btn-outline">
                  Ver Atividades
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section className="py-12 md:py-20" aria-labelledby="values-heading">
        <div className="container-main">
          <h2 id="values-heading" className="font-heading text-h2 text-center mb-2">
            Por que minhas atividades?
          </h2>
          <p className="text-ink-muted text-body text-center mb-12">
            Cada detalhe foi pensado com cuidado especial para você e seus alunos
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUES.map(({ icon, title, desc, color }) => (
              <article key={title} className={`rounded-2xl border-2 ${color} p-6 text-center`}>
                <div className="text-4xl mb-4" aria-hidden="true">{icon}</div>
                <h3 className="font-heading font-700 text-h4 mb-2">{title}</h3>
                <p className="text-ink-muted text-body-sm leading-relaxed">{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-12 md:py-16 bg-surface-muted" aria-labelledby="testimonials-heading">
        <div className="container-main">
          <h2 id="testimonials-heading" className="font-heading text-h2 text-center mb-2">
            O que dizem as professoras
          </h2>
          <p className="text-ink-muted text-body text-center mb-10">
            Mais de 5.000 professoras já usaram minhas atividades
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Ana Paula', role: 'Professora, SP',      rating: 5, text: 'As atividades são lindas e super bem elaboradas. Minhas crianças adoraram!' },
              { name: 'Carla M.',  role: 'Pedagoga, RJ',        rating: 5, text: 'Compro sempre que sai algo novo. Material de altíssima qualidade pelo preço justo.' },
              { name: 'Renata S.', role: 'Ed. Infantil, MG',    rating: 5, text: 'Facilita muito meu planejamento. Tudo pensado pedagogicamente, faz diferença!' },
            ].map(({ name, role, rating, text }) => (
              <article key={name} className="bg-white rounded-2xl p-6 shadow-card">
                <div className="flex gap-0.5 mb-4" aria-label={`${rating} de 5 estrelas`}>
                  {Array.from({ length: rating }).map((_, i) => (
                    <span key={i} className="text-secondary text-lg" aria-hidden="true">★</span>
                  ))}
                </div>
                <p className="text-ink-muted text-body-sm leading-relaxed mb-4 italic">"{text}"</p>
                <div>
                  <p className="font-700 text-body-sm text-ink">{name}</p>
                  <p className="text-caption text-ink-light">{role}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16" aria-labelledby="about-cta-heading">
        <div className="container-main text-center">
          <h2 id="about-cta-heading" className="font-heading text-h2 mb-4">
            Pronta para transformar suas aulas?
          </h2>
          <p className="text-ink-muted text-body-lg mb-8 max-w-md mx-auto">
            Explore mais de 200 atividades e encontre o material perfeito para sua turma.
          </p>
          <Link href="/atividades" className="btn-primary text-lg px-10 py-4">
            Ver todas as Atividades
          </Link>
        </div>
      </section>
    </>
  )
}
