import { Resend } from 'resend'

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY não configurada')
  return new Resend(key)
}

async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  delayMs   = 1000,
): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      if (i === attempts - 1) throw err
      await new Promise(r => setTimeout(r, delayMs * 2 ** i))
    }
  }
  throw new Error('withRetry: unreachable')
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

export async function sendDownloadEmail({
  to,
  buyerName,
  productTitle,
  downloadUrl,
}: {
  to:           string
  buyerName:    string
  productTitle: string
  downloadUrl:  string
}) {
  const safeName     = escapeHtml(buyerName || 'professor(a)')
  const safeTitle    = escapeHtml(productTitle)
  const safeUrl      = downloadUrl.startsWith('https://') || downloadUrl.startsWith('http://localhost')
    ? downloadUrl
    : '#'

  const year = new Date().getFullYear()

  const { data, error } = await withRetry(() => getResend().emails.send({
    from:    `Prô Dani <${process.env.EMAIL_FROM ?? 'contato@prodanitezolin.com.br'}>`,
    to,
    subject: `Seu download está pronto — ${safeTitle}`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#FFF0F5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FFF0F5;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
          style="max-width:580px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(255,107,157,0.15);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#FF6B9D 0%,#845EC2 100%);padding:40px 40px 32px;text-align:center;">
              <div style="display:inline-block;width:64px;height:64px;background:rgba(255,255,255,0.2);border-radius:18px;line-height:64px;font-size:28px;margin-bottom:16px;">📚</div>
              <h1 style="margin:0 0 4px;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Prô Dani</h1>
              <p style="margin:0;color:rgba(255,255,255,0.80);font-size:14px;">Atividades de Alfabetização</p>
            </td>
          </tr>

          <!-- Faixa confirmação -->
          <tr>
            <td style="background:#FF6B9D;padding:12px 40px;text-align:center;">
              <p style="margin:0;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">✅ &nbsp;Pagamento Confirmado</p>
            </td>
          </tr>

          <!-- Corpo -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#2D2D2D;">Olá, ${safeName}! 🎉</h2>
              <p style="margin:0 0 28px;font-size:15px;color:#666666;line-height:1.7;">
                Que alegria ter você aqui! Seu pagamento foi aprovado e sua atividade já está
                pronta para download. Obrigada por confiar no meu trabalho! 💕
              </p>

              <!-- Box produto -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                style="background:#FFF0F5;border-radius:16px;margin-bottom:32px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#FF6B9D;text-transform:uppercase;letter-spacing:1px;">Produto adquirido</p>
                    <p style="margin:0;font-size:17px;font-weight:800;color:#2D2D2D;">${safeTitle}</p>
                  </td>
                </tr>
              </table>

              <!-- Destaque download -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                style="background:linear-gradient(135deg,#FFF0F5,#F3EEFF);border:2px dashed #FF6B9D;border-radius:20px;margin-bottom:32px;">
                <tr>
                  <td style="padding:28px 24px;text-align:center;">
                    <p style="margin:0 0 6px;font-size:13px;color:#845EC2;font-weight:700;">Seu arquivo está esperando por você!</p>
                    <p style="margin:0 0 24px;font-size:13px;color:#999999;">Clique no botão abaixo para baixar agora mesmo</p>
                    <a href="${safeUrl}"
                      style="display:inline-block;background:linear-gradient(135deg,#FF6B9D,#845EC2);color:#ffffff;font-size:17px;font-weight:800;padding:18px 44px;border-radius:50px;text-decoration:none;box-shadow:0 6px 24px rgba(255,107,157,0.40);letter-spacing:0.2px;">
                      📥 &nbsp;Baixar Minha Atividade
                    </a>
                    <p style="margin:20px 0 0;font-size:12px;color:#bbbbbb;">Link válido por <strong>3 dias</strong></p>
                  </td>
                </tr>
              </table>

              <!-- Fallback URL -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                style="background:#f9f9f9;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 4px;font-size:12px;color:#aaaaaa;">Se o botão não funcionar, copie e cole este link no navegador:</p>
                    <p style="margin:0;font-size:12px;color:#FF6B9D;word-break:break-all;">${safeUrl}</p>
                  </td>
                </tr>
              </table>

              <!-- Mensagem pessoal -->
              <p style="margin:0;font-size:14px;color:#888888;line-height:1.7;text-align:center;font-style:italic;">
                "Espero que essa atividade ajude muito os seus alunos!<br/>
                Com carinho, <strong style="color:#FF6B9D;">Prô Dani</strong> 💗"
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f8f8;padding:24px 40px;text-align:center;border-top:1px solid #FFE4EF;">
              <p style="margin:0 0 8px;font-size:13px;color:#aaaaaa;">Este é um e-mail automático. Por favor, não responda.</p>
              <p style="margin:0;font-size:11px;color:#cccccc;">© ${year} Prô Dani · Atividades de Alfabetização</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  }))

  if (error) throw new Error(`Falha ao enviar e-mail: ${error.message}`)
  return data
}

// ── E-mail de pagamento pendente (PIX / boleto) ───────────────────

export async function sendPendingEmail({
  to,
  buyerName,
  amount,
  isPix,
}: {
  to:         string
  buyerName:  string
  amount:     number
  isPix:      boolean
}) {
  const safeName = escapeHtml(buyerName || 'professor(a)')
  const year     = new Date().getFullYear()
  const fmt      = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const methodLabel = isPix ? 'PIX' : 'boleto bancário'
  const methodTip   = isPix
    ? 'Abra o aplicativo do seu banco, acesse a área PIX e escaneie o QR code ou cole o código que apareceu na tela.'
    : 'O boleto bancário pode levar até <strong>3 dias úteis</strong> para ser compensado após o pagamento.'

  const { data, error } = await withRetry(() => getResend().emails.send({
    from:    `Prô Dani <${process.env.EMAIL_FROM ?? 'contato@prodanitezolin.com.br'}>`,
    to,
    subject: `Pedido recebido — aguardando confirmação do ${methodLabel}`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#FFF0F5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FFF0F5;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
          style="max-width:580px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(255,107,157,0.15);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#FF6B9D 0%,#845EC2 100%);padding:40px 40px 32px;text-align:center;">
              <div style="display:inline-block;width:64px;height:64px;background:rgba(255,255,255,0.2);border-radius:18px;line-height:64px;font-size:28px;margin-bottom:16px;">📚</div>
              <h1 style="margin:0 0 4px;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Prô Dani</h1>
              <p style="margin:0;color:rgba(255,255,255,0.80);font-size:14px;">Atividades de Alfabetização</p>
            </td>
          </tr>

          <!-- Faixa status -->
          <tr>
            <td style="background:#F59E0B;padding:12px 40px;text-align:center;">
              <p style="margin:0;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">⏳ &nbsp;Aguardando confirmação de pagamento</p>
            </td>
          </tr>

          <!-- Corpo -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#2D2D2D;">Olá, ${safeName}! 🎉</h2>
              <p style="margin:0 0 24px;font-size:15px;color:#666666;line-height:1.7;">
                Recebemos seu pedido e estamos aguardando a confirmação do seu pagamento via <strong>${methodLabel}</strong>.
              </p>

              <!-- Box valor -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                style="background:#FFF0F5;border-radius:16px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#FF6B9D;text-transform:uppercase;letter-spacing:1px;">Valor do pedido</p>
                    <p style="margin:0;font-size:22px;font-weight:800;color:#2D2D2D;">${fmt(amount)}</p>
                  </td>
                </tr>
              </table>

              <!-- Instrução -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:16px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#92400E;">📋 Como pagar</p>
                    <p style="margin:0;font-size:13px;color:#78350F;line-height:1.7;">${methodTip}</p>
                  </td>
                </tr>
              </table>

              <!-- Próximo passo -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:16px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#166534;">✅ O que acontece depois</p>
                    <p style="margin:0;font-size:13px;color:#15803D;line-height:1.7;">
                      Assim que o pagamento for confirmado, você receberá <strong>outro e-mail</strong> com o link para baixar suas atividades. Fique de olho na caixa de entrada!
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;color:#888888;line-height:1.7;text-align:center;font-style:italic;">
                "Com carinho, <strong style="color:#FF6B9D;">Prô Dani</strong> 💗"
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f8f8;padding:24px 40px;text-align:center;border-top:1px solid #FFE4EF;">
              <p style="margin:0 0 8px;font-size:13px;color:#aaaaaa;">Este é um e-mail automático. Por favor, não responda.</p>
              <p style="margin:0;font-size:11px;color:#cccccc;">© ${year} Prô Dani · Atividades de Alfabetização</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  }))

  if (error) throw new Error(`Falha ao enviar e-mail pendente: ${error.message}`)
  return data
}

// ── E-mail de download — carrinho (múltiplos produtos) ────────────

export async function sendCartDownloadEmail({
  to,
  buyerName,
  items,
}: {
  to:        string
  buyerName: string
  items:     Array<{ productTitle: string; downloadUrl: string }>
}) {
  const safeName = escapeHtml(buyerName || 'professor(a)')
  const year     = new Date().getFullYear()
  const baseUrl  = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

  // Bloco HTML de cada produto
  const itemsHtml = items.map(({ productTitle, downloadUrl }, i) => {
    const safeTitle = escapeHtml(productTitle)
    const safeUrl   = downloadUrl.startsWith('https://') || downloadUrl.startsWith('http://localhost')
      ? downloadUrl
      : '#'

    return `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
        style="background:#FFF0F5;border-radius:16px;margin-bottom:16px;">
        <tr>
          <td style="padding:20px 24px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#FF6B9D;text-transform:uppercase;letter-spacing:1px;">Atividade ${i + 1}</p>
            <p style="margin:0 0 14px;font-size:16px;font-weight:800;color:#2D2D2D;">${safeTitle}</p>
            <a href="${safeUrl}"
              style="display:inline-block;background:linear-gradient(135deg,#FF6B9D,#845EC2);color:#ffffff;font-size:14px;font-weight:800;padding:12px 28px;border-radius:50px;text-decoration:none;">
              📥 &nbsp;Baixar esta atividade
            </a>
          </td>
        </tr>
      </table>`
  }).join('')

  const { data, error } = await withRetry(() => getResend().emails.send({
    from:    `Prô Dani <${process.env.EMAIL_FROM ?? 'contato@prodanitezolin.com.br'}>`,
    to,
    subject: `Seus ${items.length} downloads estão prontos — Prô Dani`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#FFF0F5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FFF0F5;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
          style="max-width:580px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(255,107,157,0.15);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#FF6B9D 0%,#845EC2 100%);padding:40px 40px 32px;text-align:center;">
              <div style="display:inline-block;width:64px;height:64px;background:rgba(255,255,255,0.2);border-radius:18px;line-height:64px;font-size:28px;margin-bottom:16px;">📚</div>
              <h1 style="margin:0 0 4px;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Prô Dani</h1>
              <p style="margin:0;color:rgba(255,255,255,0.80);font-size:14px;">Atividades de Alfabetização</p>
            </td>
          </tr>

          <!-- Faixa confirmação -->
          <tr>
            <td style="background:#FF6B9D;padding:12px 40px;text-align:center;">
              <p style="margin:0;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">✅ &nbsp;Pagamento Confirmado — ${items.length} atividades</p>
            </td>
          </tr>

          <!-- Corpo -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#2D2D2D;">Olá, ${safeName}! 🎉</h2>
              <p style="margin:0 0 28px;font-size:15px;color:#666666;line-height:1.7;">
                Que alegria ter você aqui! Seu pagamento foi aprovado e suas
                <strong>${items.length} atividades</strong> já estão prontas para download.
                Obrigada por confiar no meu trabalho! 💕
              </p>

              <!-- Destaque download -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                style="background:linear-gradient(135deg,#FFF0F5,#F3EEFF);border:2px dashed #FF6B9D;border-radius:20px;margin-bottom:28px;">
                <tr>
                  <td style="padding:28px 24px;">
                    <p style="margin:0 0 20px;font-size:13px;color:#845EC2;font-weight:700;text-align:center;">Clique no botão de cada atividade para baixar</p>
                    ${itemsHtml}
                    <p style="margin:16px 0 0;font-size:12px;color:#bbbbbb;text-align:center;">Links válidos por <strong>3 dias</strong></p>
                  </td>
                </tr>
              </table>

              <!-- Mensagem pessoal -->
              <p style="margin:0;font-size:14px;color:#888888;line-height:1.7;text-align:center;font-style:italic;">
                "Espero que essas atividades ajudem muito os seus alunos!<br/>
                Com carinho, <strong style="color:#FF6B9D;">Prô Dani</strong> 💗"
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f8f8;padding:24px 40px;text-align:center;border-top:1px solid #FFE4EF;">
              <p style="margin:0 0 8px;font-size:13px;color:#aaaaaa;">Este é um e-mail automático. Por favor, não responda.</p>
              <p style="margin:0;font-size:11px;color:#cccccc;">© ${year} Prô Dani · Atividades de Alfabetização</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  }))

  if (error) throw new Error(`Falha ao enviar e-mail (carrinho): ${error.message}`)
  return data
}
