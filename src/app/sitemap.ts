import type { MetadataRoute } from 'next'
import { getPool } from '@/lib/db'

export const revalidate = 3600 // Regenera o sitemap a cada 1 hora

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://prodanitezolin.com.br'

  // Páginas estáticas
  const staticPages: MetadataRoute.Sitemap = [
    {
      url:              base,
      lastModified:     new Date(),
      changeFrequency:  'daily',
      priority:         1.0,
    },
    {
      url:              `${base}/atividades`,
      lastModified:     new Date(),
      changeFrequency:  'daily',
      priority:         0.9,
    },
    {
      url:              `${base}/quem-sou-eu`,
      lastModified:     new Date(),
      changeFrequency:  'monthly',
      priority:         0.6,
    },
  ]

  // Páginas dinâmicas — todos os produtos publicados
  try {
    const { rows } = await getPool().query<{ slug: string; updated_at: string }>(
      `SELECT slug, updated_at FROM products WHERE status = 'published' AND slug IS NOT NULL ORDER BY updated_at DESC`,
    )

    const productPages: MetadataRoute.Sitemap = rows.map(({ slug, updated_at }) => ({
      url:              `${base}/atividades/${slug}`,
      lastModified:     new Date(updated_at),
      changeFrequency:  'weekly',
      priority:         0.8,
    }))

    return [...staticPages, ...productPages]
  } catch {
    // Em caso de falha no banco, retorna apenas páginas estáticas
    return staticPages
  }
}
