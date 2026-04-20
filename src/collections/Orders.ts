import type { CollectionConfig } from 'payload'

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Pedido', plural: 'Pedidos' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'productTitle', 'amount', 'status', 'createdAt'],
    group: 'Loja',
    description: 'Registro de todos os pedidos realizados.',
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: () => true,
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      label: 'E-mail do comprador',
      required: true,
    },
    {
      name: 'buyerName',
      type: 'text',
      label: 'Nome do comprador',
    },
    {
      name: 'product',
      type: 'relationship',
      label: 'Produto',
      relationTo: 'products',
      required: true,
    },
    {
      name: 'productTitle',
      type: 'text',
      label: 'Título do produto (snapshot)',
      admin: { readOnly: true },
    },
    {
      name: 'amount',
      type: 'number',
      label: 'Valor pago (R$)',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      label: 'Status do pagamento',
      defaultValue: 'pending',
      options: [
        { label: 'Pendente',   value: 'pending'   },
        { label: 'Aprovado',   value: 'approved'  },
        { label: 'Rejeitado',  value: 'rejected'  },
        { label: 'Reembolsado',value: 'refunded'  },
      ],
    },
    {
      name: 'mercadoPagoId',
      type: 'text',
      label: 'ID Mercado Pago',
      admin: { readOnly: true },
    },
    {
      name: 'downloadToken',
      type: 'text',
      label: 'Token de download',
      admin: { readOnly: true },
    },
    {
      name: 'downloadSentAt',
      type: 'date',
      label: 'E-mail de download enviado em',
      admin: { readOnly: true },
    },
    {
      name: 'paymentMethod',
      type: 'text',
      label: 'Método de pagamento',
      admin: { readOnly: true },
    },
  ],
  timestamps: true,
}
