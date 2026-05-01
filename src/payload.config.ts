import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter }   from '@payloadcms/db-sqlite'
import { lexicalEditor }    from '@payloadcms/richtext-lexical'
import { pt }               from '@payloadcms/translations/languages/pt'
import path   from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Media    } from './collections/Media.ts'
import { Orders   } from './collections/Orders.ts'
import { Products } from './collections/Products.ts'
import { Users    } from './collections/Users.ts'

// Usa PostgreSQL sempre que DATABASE_URL estiver definida (produção ou init local)
const isProd = Boolean(process.env.DATABASE_URL?.startsWith('postgres'))

// process.cwd() aponta para a raiz do projeto tanto em CJS quanto ESM,
// evitando import.meta.url que causa conflito no tsx v4 + Node.js 22
const dirname = path.resolve(process.cwd(), 'src')

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: ' — Prô Dani Admin',
    },
    css: path.resolve(dirname, 'app/(payload)/custom/admin.css'),
    components: {
      Nav: '@/app/(payload)/custom/CustomNav',
      graphics: {
        Logo: '@/app/(payload)/custom/AdminLogo',
        Icon: '@/app/(payload)/custom/AdminIcon',
      },
      views: {
        analytics: {
          Component: '@/app/(payload)/custom/AnalyticsWrapper',
          path: '/analytics',
        },
        uploadPdf: {
          Component: '@/app/(payload)/custom/LargeUpload',
          path: '/upload-arquivo',
        },
      },
    },
  },
  i18n: {
    fallbackLanguage: 'pt',
    supportedLanguages: { pt },
  },
  collections: [Products, Orders, Media, Users],
  editor: lexicalEditor(),
  secret: (() => {
    const s = process.env.PAYLOAD_SECRET
    if (!s) throw new Error('Variável de ambiente PAYLOAD_SECRET não configurada.')
    return s
  })(),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  // PostgreSQL em produção (Vercel), SQLite em desenvolvimento local
  db: isProd
    ? postgresAdapter({
        pool: {
          connectionString: (() => {
            const url = process.env.DATABASE_URL
            if (!url) throw new Error('Variável DATABASE_URL não configurada para produção.')
            return url
          })(),
        },
        // push: true foi removido — tabelas já existem no Neon.
        // drizzle-kit não está disponível em produção (dev dependency).
        // Para mudanças de schema futuras: rodar o servidor local apontando
        // para DATABASE_URL do Neon, o que dispara pushDevSchema em dev mode.
      })
    : sqliteAdapter({
        client: {
          url: process.env.DATABASE_URI ?? `file:${path.resolve(dirname, '../database.db')}`,
        },
      }),

  // Upload para Vercel Blob feito via hook beforeChange na coleção Media
  plugins: [],

  sharp,
  upload: {
    limits: {
      fileSize: 20_000_000,
    },
  },
})
