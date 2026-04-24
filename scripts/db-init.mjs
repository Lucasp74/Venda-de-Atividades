/**
 * db-init.mjs
 *
 * Script de inicialização do banco de dados para o build da Vercel.
 * Deve ser executado com NODE_ENV=development para que o Payload
 * ative o pushDevSchema (cria/atualiza tabelas automaticamente via Drizzle).
 *
 * DATABASE_URL deve estar definido apontando para o Neon PostgreSQL.
 *
 * Uso no vercel.json:
 *   "buildCommand": "NODE_ENV=development node --import tsx/esm scripts/db-init.mjs; npm run build"
 */

import { getPayload } from 'payload'
import config from '../src/payload.config.ts'

console.log('[db-init] Iniciando sincronização do schema com o banco de dados...')

try {
  const payload = await getPayload({ config })
  console.log('[db-init] ✅ Schema sincronizado com sucesso!')
  await payload.db.destroy?.()
} catch (err) {
  console.error('[db-init] ❌ Erro ao sincronizar schema:', err.message)
  process.exit(1)
}

process.exit(0)
