import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { pt } from '@payloadcms/translations/languages/pt'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Media    } from './collections/Media'
import { Orders   } from './collections/Orders'
import { Products } from './collections/Products'
import { Users    } from './collections/Users'

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
  secret: process.env.PAYLOAD_SECRET ?? 'mude-esta-chave-secreta-em-producao',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI ?? `file:${path.resolve(dirname, '../database.db')}`,
    },
  }),
  sharp,
  upload: {
    limits: {
      fileSize: 20_000_000,
    },
  },
})
