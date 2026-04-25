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
