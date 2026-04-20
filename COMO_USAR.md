# Profª Dani — Guia Rápido

## 1. Instalar dependências

```bash
npm install
```

## 2. Configurar variáveis de ambiente

Copie o arquivo de exemplo e preencha com suas credenciais:

```bash
cp .env.example .env.local
```

Preencha no mínimo:
- `PAYLOAD_SECRET` — qualquer string longa e aleatória
- `MERCADOPAGO_ACCESS_TOKEN` — pegue no painel do Mercado Pago
- `RESEND_API_KEY` — pegue no painel do Resend

## 3. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse:
- **Site:** http://localhost:3000
- **Admin:** http://localhost:3000/admin

## 4. Primeiro acesso ao admin

1. Vá em http://localhost:3000/admin
2. Crie sua conta de administrador (primeiro acesso cria automaticamente)
3. Pronto! Você já pode adicionar atividades

## 5. Como adicionar uma nova atividade

1. Acesse `/admin`
2. Clique em **Atividades** no menu lateral
3. Clique em **Criar novo**
4. Preencha:
   - Título, Descrição, Categoria, Preço
   - Faça upload da imagem de capa
   - Faça upload do arquivo PDF
5. Marque **"Destaque na Home"** se quiser exibir na página inicial
6. Status: **Publicado**
7. Clique em **Salvar**

A atividade aparece instantaneamente no site!

## 6. Deploy na Vercel

1. Instale o CLI: `npm i -g vercel`
2. Execute: `vercel`
3. Configure as variáveis de ambiente no painel da Vercel
4. Pronto!

## Tecnologias usadas

| Tecnologia | Função |
|---|---|
| Next.js 14 | Frontend + API Routes |
| Payload CMS | Admin + gerenciamento de produtos |
| Tailwind CSS | Estilização |
| Mercado Pago | Checkout (PIX, Cartão, Boleto) |
| Resend | Envio de e-mail com link de download |
| SQLite | Banco de dados |
| Vercel | Hospedagem |
