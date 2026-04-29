import type { CollectionConfig } from 'payload'
import { put } from '@vercel/blob'

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
        // Só faz upload no create e quando há arquivo e token configurado
        if (operation !== 'create') return data
        const file  = (req as unknown as { file?: { name: string; data: Buffer; mimetype: string } }).file
        const token = process.env.BLOB_READ_WRITE_TOKEN
        if (!file?.data || !token) return data

        try {
          const blob = await put(file.name, file.data, { access: 'public', token })
          data.url = blob.url
        } catch (err) {
          console.error('[Media] Falha ao enviar para Vercel Blob:', err)
        }

        return data
      },
    ],
  },
  upload: {
    staticDir: 'public/media',
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 240, crop: 'center' },
      { name: 'card',      width: 800, height: 480, crop: 'center' },
    ],
    adminThumbnail: 'thumbnail',
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
  ],
}
