import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter }   from '@payloadcms/db-sqlite'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { lexicalEditor }    from '@payloadcms/richtext-lexical'
import { pt }               from '@payloadcms/translations/languages/pt'
import path   from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Media    } from './collections/Media'
import { Orders   } from './collections/Orders'
import { Products } from './collections/Products'
import { Users    } from './collections/Users'

const isProd = process.env.NODE_ENV === 'production'

const filename = fileURLToPath(import.meta.url)
const dirname  = path.dirname(filename)

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
        // Cria/atualiza as tabelas automaticamente na inicialização.
        // Equivale a "drizzle-kit push" — ideal para projetos sem arquivos
        // de migração gerados ainda (evita o erro "relation does not exist").
        push: true,
      })
    : sqliteAdapter({
        client: {
          url: process.env.DATABASE_URI ?? `file:${path.resolve(dirname, '../database.db')}`,
        },
      }),

  // Vercel Blob Storage em produção, sistema de arquivos local em desenvolvimento
  plugins: isProd && process.env.BLOB_READ_WRITE_TOKEN
    ? [
        vercelBlobStorage({
          enabled:     true,
          collections: { media: true },
          token:       process.env.BLOB_READ_WRITE_TOKEN,
        }),
      ]
    : [],

  sharp,
  upload: {
    limits: {
      fileSize: 20_000_000,
    },
  },
})
