const { execSync, spawn } = require('child_process')

console.log('Limpando cache .next...')
try { execSync('rmdir /s /q .next', { stdio: 'ignore', shell: true }) } catch {}

console.log('Iniciando servidor Next.js...\n')
const server = spawn('npx', ['next', 'dev'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname,
})

const routes = [
  '/',
  '/atividades',
  '/quem-sou-eu',
]

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      await fetch('http://localhost:3000/', { signal: AbortSignal.timeout(2000) })
      return true
    } catch {}
    await new Promise(r => setTimeout(r, 1000))
  }
  return false
}

async function warmup() {
  console.log('\nAguardando servidor ficar pronto...')
  const ready = await waitForServer()
  if (!ready) {
    console.log('Servidor nao respondeu apos 60s.')
    return
  }

  // Aguarda mais 3s para compilacao terminar
  await new Promise(r => setTimeout(r, 3000))

  console.log('Pre-compilando rotas...')
  for (const route of routes) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(`http://localhost:3000${route}`, { signal: AbortSignal.timeout(30000) })
        console.log(`  OK ${route} -> ${res.status}`)
        break
      } catch (e) {
        if (attempt === 2) console.log(`  ERRO ${route} -> ${e.message}`)
        await new Promise(r => setTimeout(r, 2000))
      }
    }
  }
  console.log('\nPronto! Abra http://localhost:3000 no navegador.\n')
}

setTimeout(warmup, 8000)

server.on('close', (code) => process.exit(code))
process.on('SIGINT', () => { server.kill(); process.exit() })
