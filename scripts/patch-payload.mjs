import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const filePath = resolve('node_modules/@payloadcms/db-postgres/dist/connect.js')

const ORIGINAL = `if (process.env.NODE_ENV !== 'production' && process.env.PAYLOAD_MIGRATING !== 'true' && this.push !== false) {`
const PATCHED  = `if ((process.env.NODE_ENV !== 'production' || this.push === true) && process.env.PAYLOAD_MIGRATING !== 'true' && this.push !== false) {`

let content
try {
  content = readFileSync(filePath, 'utf8')
} catch {
  console.log('[patch-payload] Arquivo não encontrado — pulando patch.')
  process.exit(0)
}

if (content.includes(PATCHED)) {
  console.log('[patch-payload] ✅ Patch já aplicado — nada a fazer.')
  process.exit(0)
}

if (!content.includes(ORIGINAL)) {
  console.warn('[patch-payload] ⚠️  Linha original não encontrada — versão do pacote pode ter mudado.')
  process.exit(0)
}

writeFileSync(filePath, content.replace(ORIGINAL, PATCHED), 'utf8')
console.log('[patch-payload] ✅ connect.js corrigido com sucesso.')
