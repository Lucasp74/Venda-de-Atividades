/**
 * ─────────────────────────────────────────────────────────────
 *  Singleton pg.Pool — conexão direta ao Neon (PostgreSQL)
 * ─────────────────────────────────────────────────────────────
 *
 *  Por que isso existe:
 *  Inicializar o Payload CMS (getPayload) em rotas de API leva ~2.500ms
 *  a cada cold start porque ele conecta ao banco, carrega todas as
 *  coleções e monta os schemas. Para consultas simples (ex: buscar preço
 *  de um produto), esse custo é desnecessário.
 *
 *  Este módulo expõe um Pool pg que é criado UMA vez e reutilizado em
 *  todas as invocações quentes da função Vercel — zerando o overhead
 *  de inicialização nas requisições subsequentes.
 *
 *  Uso:
 *    import { getPool } from '@/lib/db'
 *    const { rows } = await getPool().query('SELECT ...', [...])
 * ─────────────────────────────────────────────────────────────
 */

import { Pool } from 'pg'

// Armazenado fora do handler para sobreviver entre invocações quentes
let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) throw new Error('[db] DATABASE_URL não configurada')

    pool = new Pool({
      connectionString,
      // Neon exige SSL — sslmode=require já vem na connection string,
      // mas rejectUnauthorized: false evita erros de certificado em edge cases.
      ssl: { rejectUnauthorized: false },
      // Serverless: pool pequeno para não esgotar conexões no Neon free tier.
      max:                    3,
      idleTimeoutMillis:  30_000,
      connectionTimeoutMillis: 5_000,
    })
  }
  return pool
}
