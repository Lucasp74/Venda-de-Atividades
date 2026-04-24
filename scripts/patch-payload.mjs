/**
 * patch-payload.mjs
 *
 * Postinstall script que corrige @payloadcms/db-postgres/dist/connect.js.
 *
 * PROBLEMA: o Payload bloqueia pushDevSchema em produção com essa condição:
 *   if (process.env.NODE_ENV !== 'production' && ...)
 *
 * CORREÇÃO: quando push:true está configurado no adapter, permite que o
 * pushDevSchema rode independente do NODE_ENV — criando todas as tabelas
 * no Neon automaticamente no primeiro request em produção.
 *
 * Executado automaticamente pelo npm via "postinstall" em package.json.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const filePath = resolve('node_modules/@payloadcms/db-postgres/dist/connect.js')

if (!existsSync(filePath)) {
  console.log('[patch-payload] Arquivo não encontrado — pulando patch.')
  process.exit(0)
}

const original = `if (process.env.NODE_ENV !== 'production' && process.env.PAYLOAD_MIGRATING !== 'true' && this.push !== false) {`
const patched  = `if ((process.env.NODE_ENV !== 'production' || this.push === true) && process.env.PAYLOAD_MIGRATING !== 'true' && this.push !== false) {`

const content = readFileSync(filePath, 'utf8')

if (content.includes(patched)) {
  console.log('[patch-payload] ✅ Patch já aplicado — nada a fazer.')
  process.exit(0)
}

if (!content.includes(original)) {
  console.warn('[patch-payload] ⚠️  Linha original não encontrada — versão do pacote pode ter mudado.')
  process.exit(0)
}

const fixed = content.replace(original, patched)
writeFileSync(filePath, fixed, 'utf8')
console.log('[patch-payload] ✅ connect.js corrigido com sucesso.')
