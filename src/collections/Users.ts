import type { CollectionConfig } from 'payload'
import { buildResetPasswordEmailHtml } from '@/lib/email'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    forgotPassword: {
      generateEmailSubject: () => 'Redefinir sua senha — Prô Dani',
      generateEmailHTML: ({ token }) => {
        const baseUrl  = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
        const resetUrl = `${baseUrl}/admin/reset/${token}`
        return buildResetPasswordEmailHtml(resetUrl)
      },
    },
  },
  admin: {
    useAsTitle: 'email',
  },
  access: {
    read:   ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Nome',
    },
    {
      name: 'role',
      type: 'select',
      label: 'Perfil',
      defaultValue: 'admin',
      options: [{ label: 'Admin', value: 'admin' }],
    },
  ],
}
