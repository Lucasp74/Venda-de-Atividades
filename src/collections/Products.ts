import type { CollectionConfig } from 'payload'

export const CATEGORIES = [
  { label: 'Alfabetização e Leitura',         value: 'alfabetizacao'     },
  { label: 'Matemática',                       value: 'matematica'        },
  { label: 'Língua Portuguesa',                value: 'portugues'         },
  { label: 'Ciências da Natureza',             value: 'ciencias'          },
  { label: 'História e Geografia',             value: 'historia-geografia'},
  { label: 'Artes e Criatividade',             value: 'artes'             },
  { label: 'Educação Física e Psicomotora',    value: 'educacao-fisica'   },
  { label: 'Jogos e Atividades Lúdicas',       value: 'jogos'             },
  { label: 'Sequências Didáticas',             value: 'sequencias'        },
  { label: 'Datas Comemorativas',              value: 'datas-comemorativas'},
  { label: 'Coordenação Motora',               value: 'coordenacao-motora'},
  { label: 'Valores e Socialização',           value: 'valores'           },
]

export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'Atividade', plural: 'Atividades' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'schoolLevel', 'price', 'featured', 'status'],
    group: 'Loja',
    description: 'Gerencie todas as atividades disponíveis para venda.',
  },
  access: { read: () => true },
  hooks: {
    beforeDelete: [
      async ({ id, req }) => {
        const { totalDocs } = await req.payload.find({
          collection: 'orders',
          where:      { product: { equals: id } },
          limit:      0,
          depth:      0,
        })
        if (totalDocs > 0) {
          throw new Error(
            `⚠️ Exclusão bloqueada — esta atividade possui ${totalDocs} venda(s) registrada(s) e não pode ser excluída. ` +
            `Para removê-la do site sem perder o histórico, altere o Status para "Arquivado".`,
          )
        }
      },
    ],
    beforeChange: [
      async ({ data, req, operation }) => {
        if (data.title && !data.slug) {
          const base = data.title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')

          // Garante unicidade: se o slug j\u00e1 existe, adiciona sufixo -2, -3, etc.
          let candidate = base
          let counter   = 1
          while (true) {
            const { totalDocs } = await req.payload.find({
              collection: 'products',
              where:      { slug: { equals: candidate } },
              limit:      0,
              depth:      0,
            })
            if (totalDocs === 0) break
            counter++
            candidate = `${base}-${counter}`
          }
          data.slug = candidate
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc }) => {
        // Import din\u00e2mico evita que next/cache seja inclu\u00eddo em bundles de cliente
        // (CategoryFilter.tsx importa CATEGORIES deste arquivo).
        try {
          const { revalidateTag, revalidatePath } = await import('next/cache')
          // revalidateTag invalida os dados em cache (unstable_cache)
          revalidateTag('products')
          // revalidatePath invalida o HTML das p\u00e1ginas em ISR
          revalidatePath('/', 'page')
          revalidatePath('/atividades', 'page')
          revalidatePath(`/atividades/${doc.slug}`, 'page')
        } catch (e) {
          console.error('[Products] falha ao revalidar cache:', e)
        }
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Título',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Slug (URL)',
      admin: {
        description: 'Preenchido automaticamente com base no título.',
      },
      unique: true,
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Descrição',
      required: true,
    },
    {
      name: 'category',
      type: 'select',
      label: 'Categoria / Disciplina',
      required: true,
      options: CATEGORIES,
      admin: {
        placeholder: 'Selecione uma Opção',
      },
    },
    {
      name: 'schoolLevel',
      type: 'select',
      label: 'Nível de Ensino',
      required: true,
      admin: {
        placeholder: 'Selecione uma Opção',
      },
      options: [
        { label: 'Educação Infantil (0-5 anos)',     value: 'infantil'     },
        { label: 'Fundamental 1 — 1º ano',           value: 'fund1-1ano'   },
        { label: 'Fundamental 1 — 2º ano',           value: 'fund1-2ano'   },
        { label: 'Fundamental 1 — 3º ano',           value: 'fund1-3ano'   },
        { label: 'Fundamental 1 — 4º ano',           value: 'fund1-4ano'   },
        { label: 'Fundamental 1 — 5º ano',           value: 'fund1-5ano'   },
        { label: 'Educação Infantil + Fundamental 1', value: 'infantil-fund1'},
      ],
    },
    {
      name: 'price',
      type: 'number',
      label: 'Preço (R$)',
      required: true,
      min: 0.01,
      admin: { step: 0.01 },
    },
    {
      name: 'coverImage',
      type: 'upload',
      label: 'Imagem de Capa',
      relationTo: 'media',
      filterOptions: { mimeType: { contains: 'image' } },
    },
    {
      name: 'pdfFile',
      type: 'upload',
      label: 'Arquivo PDF',
      relationTo: 'media',
      filterOptions: { mimeType: { equals: 'application/pdf' } },
      admin: {
        description: 'Arquivo enviado ao cliente após pagamento confirmado.',
      },
    },
    {
      name: 'details',
      type: 'array',
      label: 'O que está incluído',
      admin: { description: 'Ex: "10 páginas", "Pronto para imprimir"' },
      fields: [
        { name: 'item', type: 'text', label: 'Item' },
      ],
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Destaque na Home',
      defaultValue: false,
    },
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      defaultValue: 'published',
      options: [
        { label: 'Publicado',  value: 'published' },
        { label: 'Rascunho',   value: 'draft'     },
        { label: 'Arquivado',  value: 'archived'  },
      ],
    },
    {
      name: 'tags',
      type: 'array',
      label: 'Tags',
      fields: [{ name: 'tag', type: 'text', label: 'Tag' }],
    },
    {
      name: 'saveButtonBottom',
      type: 'ui',
      admin: {
        components: {
          Field: '@/app/(payload)/custom/SaveButtonBottom',
        },
      },
    },
  ],
}
