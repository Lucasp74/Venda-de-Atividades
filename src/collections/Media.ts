import type { CollectionConfig } from 'payload'


export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Mídia', plural: 'Mídias' },
  access: { read: () => true },
  admin: {
    group: 'Sistema',
    description: 'Imagens e PDFs usados nas atividades. Para fazer upload, use os campos diretamente na tela de edição de cada atividade.',
    components: {
      Description: '@/app/(payload)/custom/MediaBanner',
    },
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation !== 'create') return data
        const file  = (req as unknown as { file?: { name: string; data: Buffer; mimetype: string } }).file
        const token = process.env.BLOB_READ_WRITE_TOKEN
        if (!file?.data || !token) return data

        try {
          const { put } = await import('@vercel/blob')
          const blob = await put(file.name, file.data, { access: 'public', token })
          // Salva em ambos: url (campo nativo do Payload) e blobUrl (campo customizado)
          data.url     = blob.url
          data.blobUrl = blob.url
        } catch (err) {
          console.error('[Media] Falha ao enviar para Vercel Blob:', err)
        }

        return data
      },
    ],
    afterRead: [
      ({ doc }) => {
        // Payload v3 sobrescreve o campo url com /api/media/file/[filename].
        // Usamos blobUrl (que nunca é alterado) para restaurar a URL correta.
        if (doc.blobUrl && typeof doc.blobUrl === 'string') {
          doc.url = doc.blobUrl
        }
        return doc
      },
    ],
  },
  upload: {
    disableLocalStorage: true,
    mimeTypes: ['image/*', 'application/pdf'],
    crop:       true,
    focalPoint: true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Texto alternativo',
    },
    {
      name: 'blobUrl',
      type: 'text',
      admin: { hidden: true, readOnly: true },
    },
  ],
}
