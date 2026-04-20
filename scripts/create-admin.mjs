import { getPayload } from 'payload'
import config from '../src/payload.config.ts'

const EMAIL = 'admin@profdani.com.br'
const PASSWORD = 'ProfDani@2025'

const payload = await getPayload({ config })

try {
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: EMAIL } },
    limit: 1,
  })

  if (existing.docs.length > 0) {
    // Usuário existe — atualiza a senha
    await payload.update({
      collection: 'users',
      id: existing.docs[0].id,
      data: { password: PASSWORD },
    })
    console.log('✅ Senha atualizada com sucesso!')
  } else {
    // Cria novo usuário
    await payload.create({
      collection: 'users',
      data: {
        email:    EMAIL,
        password: PASSWORD,
        role:     'admin',
      },
    })
    console.log('✅ Usuário criado com sucesso!')
  }

  console.log(`\n  E-mail : ${EMAIL}`)
  console.log(`  Senha  : ${PASSWORD}\n`)
} catch (err) {
  console.error('Erro:', err.message)
} finally {
  process.exit(0)
}
