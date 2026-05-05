import type { CollectionConfig } from 'payload'

export const OrderItems: CollectionConfig = {
  slug: 'order-items',
  labels: { singular: 'Item do Pedido', plural: 'Itens do Pedido' },
  admin: {
    useAsTitle:     'productTitle',
    defaultColumns: ['productTitle', 'price', 'order', 'downloadCount', 'createdAt'],
    group:          'Loja',
    // Acessível via pedido — não aparece no menu lateral principal
    hidden: true,
    description: 'Produtos individuais de cada pedido. Gerenciado automaticamente pelo sistema.',
  },
  access: {
    read:   ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name:       'order',
      type:       'relationship',
      relationTo: 'orders',
      required:   true,
      index:      true,
      label:      'Pedido',
      admin: { readOnly: true },
    },
    {
      name:       'product',
      type:       'relationship',
      relationTo: 'products',
      label:      'Produto',
      admin: { readOnly: true },
    },
    {
      name:     'productTitle',
      type:     'text',
      label:    'Título do produto (snapshot)',
      required: true,
      admin: { readOnly: true },
    },
    {
      name:     'price',
      type:     'number',
      label:    'Preço (R$)',
      required: true,
      admin: { readOnly: true },
    },
    {
      name:     'downloadToken',
      type:     'text',
      label:    'Token de download',
      required: true,
      unique:   true,
      admin: { readOnly: true },
    },
    {
      name:  'downloadUrl',
      type:  'text',
      label: 'URL de download',
      admin: { readOnly: true },
    },
    {
      name:         'downloadCount',
      type:         'number',
      label:        'Nº de downloads realizados',
      defaultValue: 0,
      admin: {
        readOnly:    true,
        description: 'Incrementado a cada download. Limite: 5.',
      },
    },
  ],
  timestamps: true,
}
