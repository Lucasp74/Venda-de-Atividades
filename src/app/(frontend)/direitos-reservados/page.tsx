import type { Metadata } from 'next'
import Link from 'next/link'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Direitos Reservados',
  description: 'Política de direitos autorais e termos de uso — Prô Dani.',
}

export default function DireitosReservadosPage() {
  const year = new Date().getFullYear()

  return (
    <section className="py-16 md:py-24">
      <div className="container-main max-w-[720px]">

        <h1 className="font-heading text-h2 md:text-h1 text-ink mb-2">
          Direitos Reservados
        </h1>
        <p className="text-ink-light text-body-sm mb-10">
          Última atualização: {year}
        </p>

        <div className="space-y-8 text-ink-muted text-body leading-relaxed">

          <div>
            <h2 className="font-heading font-700 text-h4 text-ink mb-3">1. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo disponível neste site — incluindo atividades, e-books, ilustrações, textos, logotipos e demais materiais pedagógicos — é de propriedade exclusiva de <strong className="text-ink">Prô Dani</strong> e está protegido pelas leis de direitos autorais vigentes no Brasil (Lei nº 9.610/1998).
            </p>
          </div>

          <div>
            <h2 className="font-heading font-700 text-h4 text-ink mb-3">2. Uso Permitido</h2>
            <p>
              Ao adquirir um material, você recebe uma <strong className="text-ink">licença pessoal e intransferível</strong> para uso em sala de aula ou ambiente doméstico. É permitido imprimir o material para uso próprio com seus alunos.
            </p>
          </div>

          <div>
            <h2 className="font-heading font-700 text-h4 text-ink mb-3">3. Uso Proibido</h2>
            <p>É expressamente proibido:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Reproduzir, copiar ou redistribuir os materiais sem autorização;</li>
              <li>Vender ou compartilhar os arquivos digitais com terceiros;</li>
              <li>Publicar o conteúdo em redes sociais, grupos ou plataformas online;</li>
              <li>Remover marcas d'água, logotipos ou qualquer identificação de autoria.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-heading font-700 text-h4 text-ink mb-3">4. Violação de Direitos</h2>
            <p>
              O descumprimento destas condições poderá acarretar responsabilização civil e criminal, conforme previsto na legislação brasileira de direitos autorais.
            </p>
          </div>

          <div>
            <h2 className="font-heading font-700 text-h4 text-ink mb-3">5. Contato</h2>
            <p>
              Dúvidas sobre licenciamento ou uso comercial? Entre em contato pelo e-mail{' '}
              <a href="mailto:dani@profdani.com.br" className="text-primary hover:underline">
                dani@profdani.com.br
              </a>.
            </p>
          </div>

        </div>

        <div className="mt-12">
          <Link href="/" className="btn-outline text-sm">
            ← Voltar para o início
          </Link>
        </div>
      </div>
    </section>
  )
}
