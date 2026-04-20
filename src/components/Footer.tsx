import Link from 'next/link'
import FooterDropdowns from './FooterDropdowns'

export default function Footer() {
  return (
    <footer className="bg-ink text-white">
      <div className="container-main py-8">

        {/* Brand + dropdowns */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="font-heading font-800 text-xl mr-2">
            Prô <span className="text-primary">Dani</span>
          </span>
          <FooterDropdowns />
        </div>

        {/* Barra inferior */}
        <div className="border-t border-white/10 pt-5 flex flex-col sm:grid sm:grid-cols-3 sm:items-center gap-3 sm:gap-4">

          {/* Direitos — linha 1 no mobile */}
          <Link
            href="/direitos-reservados"
            className="text-ink-light text-caption hover:text-primary transition-colors duration-200"
          >
            © {new Date().getFullYear()} Prô Dani. Todos os direitos reservados.
          </Link>

          {/* Crédito dev — linha 2 no mobile, centro no desktop */}
          <div className="flex sm:justify-center">
            <a
              href="https://techworkspace.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/30 text-caption hover:text-white/60 transition-colors duration-200"
            >
              Dev: Tech Workspace
            </a>
          </div>

          {/* Métodos de pagamento — linha 3 no mobile, direita no desktop */}
          <div className="flex items-center sm:justify-end gap-2 flex-wrap">
            {['PIX', 'Cartão', 'Boleto'].map((m) => (
              <span key={m} className="bg-white/10 rounded px-2 py-0.5 text-caption font-700 text-ink-light">
                {m}
              </span>
            ))}
            <Link
              href="/admin"
              className="text-white/30 text-caption hover:text-white/60 transition-colors duration-200 ml-1"
            >
              Área Restrita
            </Link>
          </div>

        </div>
      </div>
    </footer>
  )
}
