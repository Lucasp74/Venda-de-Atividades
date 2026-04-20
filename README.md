# Prô Dani — Site de Atividades Educativas

Site de venda de atividades e e-books pedagógicos para professores e educadores infantis.

---

## 🚀 Tecnologias

- **[Next.js 15](https://nextjs.org/)** — Framework React com App Router
- **[Payload CMS v3](https://payloadcms.com/)** — Painel administrativo integrado
- **[Tailwind CSS](https://tailwindcss.com/)** — Estilização
- **[SQLite](https://www.sqlite.org/)** — Banco de dados (via libSQL)
- **[Mercado Pago Bricks](https://www.mercadopago.com.br/developers)** — Checkout de pagamento (PIX, Cartão, Boleto)
- **[Resend](https://resend.com/)** — Envio de e-mails transacionais
- **[Vercel Blob](https://vercel.com/storage/blob)** — Armazenamento de arquivos/mídia

---

## ✨ Funcionalidades

- Catálogo de atividades com filtro por categoria
- Página de produto com detalhes e botão de compra
- Checkout embarcado com Mercado Pago Bricks
- Download automático do PDF após pagamento confirmado
- Painel admin para gerenciar produtos, pedidos e mídia
- Dashboard de analytics de vendas
- Rate limiting nas APIs
- Layout responsivo (mobile, tablet e desktop)

---

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── (frontend)/          # Páginas públicas
│   │   ├── page.tsx         # Home
│   │   ├── atividades/      # Catálogo e página de produto
│   │   ├── checkout/        # Fluxo de pagamento
│   │   └── quem-sou-eu/     # Página sobre
│   ├── (payload)/           # Painel admin (Payload CMS)
│   └── api/
│       ├── mercadopago/     # Checkout, webhook e processamento
│       └── download/        # Download seguro do PDF
├── collections/             # Products, Orders, Media, Users
├── components/              # Componentes reutilizáveis
└── lib/                     # Mercado Pago, e-mail, analytics, rate limit
```

---

## ⚙️ Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo de exemplo e preencha com suas credenciais:

```bash
cp .env.example .env.local
```

| Variável | Descrição |
|---|---|
| `PAYLOAD_SECRET` | String aleatória para segurança do Payload CMS |
| `DATABASE_URI` | URL do banco SQLite (ex: `file:./database.db`) |
| `MERCADOPAGO_ACCESS_TOKEN` | Access Token do Mercado Pago |
| `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` | Public Key do Mercado Pago |
| `RESEND_API_KEY` | Chave da API do Resend |
| `NEXT_PUBLIC_BASE_URL` | URL base do site (ex: `https://seusite.com.br`) |

### 3. Criar usuário admin

```bash
node scripts/create-admin.mjs
```

### 4. Iniciar o servidor de desenvolvimento

```bash
node dev.js
```

O servidor estará disponível em `http://localhost:3000`  
Painel admin em `http://localhost:3000/admin`

---

## 🌐 Deploy

O projeto está configurado para deploy na **Vercel** com **Turso** (SQLite remoto).

1. Faça o deploy pelo painel da Vercel conectando este repositório
2. Configure as variáveis de ambiente no painel da Vercel
3. Para o banco de dados em produção, crie um banco no [Turso](https://turso.tech/) e use a URL de conexão na variável `DATABASE_URI`

---

## 🔒 Segurança

- Variáveis sensíveis nunca são commitadas (`.env.local` está no `.gitignore`)
- Rate limiting em todos os endpoints de API
- Tokens de download únicos e com validade de 7 dias
- Verificação de assinatura nos webhooks do Mercado Pago

---

## 📄 Licença

Projeto privado — todos os direitos reservados.
