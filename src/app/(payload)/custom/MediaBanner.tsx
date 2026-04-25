'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Banner exibido nas telas de Mídia.
 * — Na lista: explica como usar a galeria corretamente.
 * — Na tela de criar/editar: mostra botão "Voltar às Atividades".
 */
export default function MediaBanner() {
  const pathname = usePathname() ?? ''
  const isCreate = pathname.endsWith('/create') || /\/media\/[^/]+$/.test(pathname)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '10px 16px',
      marginBottom: 16,
      borderRadius: 10,
      background: 'linear-gradient(135deg, #FFF0F5, #FFE0EC)',
      border: '1.5px solid #FFBAD5',
      fontFamily: 'Nunito, sans-serif',
      fontSize: 13,
      color: '#9A3060',
      flexWrap: 'wrap',
    }}>
      <span style={{ flex: 1, lineHeight: 1.5, minWidth: 200 }}>
        {isCreate ? (
          <>
            💡 <strong>Dica:</strong> Para associar uma imagem ou PDF a uma atividade, volte à tela de edição da atividade e use o campo &quot;Imagem de Capa&quot; ou &quot;Arquivo PDF&quot; — o upload abre direto lá, sem precisar criar mídia separadamente.
          </>
        ) : (
          <>
            📁 <strong>Galeria de Mídias</strong> — As imagens e PDFs são gerenciados automaticamente quando você faz upload dentro de uma atividade. Use esta tela para visualizar ou excluir arquivos.
          </>
        )}
      </span>

      {isCreate && (
        <Link
          href="/admin/collections/products"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 16px',
            borderRadius: 8,
            background: '#FF6B9D',
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          ← Voltar às Atividades
        </Link>
      )}
    </div>
  )
}
