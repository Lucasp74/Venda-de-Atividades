import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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
  const safeName     = escapeHtml(buyerName || 'professora')
  const safeTitle    = escapeHtml(productTitle)
  const safeUrl      = downloadUrl.startsWith('https://') || downloadUrl.startsWith('http://localhost')
    ? downloadUrl
    : '#'

  const { data, error } = await withRetry(() => resend.emails.send({
    from:    `Prô Dani <noreply@${process.env.EMAIL_DOMAIN ?? 'profdani.com.br'}>`,
    to,
    subject: `Seu download está pronto — ${safeTitle}`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FFF8F9;font-family:'Nunito',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 30px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#FF6B9D,#845EC2);padding:36px 40px;text-align:center;">
            <div style="width:52px;height:52px;background:rgba(255,255,255,0.2);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;color:white;margin-bottom:12px;">D</div>
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;">Prô Dani</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Atividades Infantis</p>
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="padding:40px;">
            <p style="font-size:22px;margin:0 0 8px;font-weight:800;color:#2D2D2D;">
              Olá, ${safeName}! 🎉
            </p>
            <p style="font-size:15px;color:#777;margin:0 0 24px;line-height:1.7;">
              Seu pagamento foi confirmado! Clique no botão abaixo para baixar sua atividade.
            </p>

            <div style="background:#FFF0F5;border-radius:16px;padding:20px;margin-bottom:28px;">
              <p style="margin:0 0 4px;font-size:12px;color:#FF6B9D;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Produto adquirido</p>
              <p style="margin:0;font-size:16px;font-weight:700;color:#2D2D2D;">${safeTitle}</p>
            </div>

            <div style="text-align:center;margin-bottom:28px;">
              <a
                href="${safeUrl}"
                style="display:inline-block;background:linear-gradient(135deg,#FF6B9D,#E0527F);color:#ffffff;font-size:16px;font-weight:800;padding:16px 36px;border-radius:50px;text-decoration:none;box-shadow:0 4px 20px rgba(255,107,157,0.35);"
              >
                📥 Baixar Atividade
              </a>
            </div>

            <p style="font-size:13px;color:#aaa;text-align:center;margin:0 0 4px;">
              Link válido por 7 dias.
            </p>
            <p style="font-size:12px;color:#ccc;text-align:center;margin:0;">
              Se o botão não funcionar, copie este link: <br/>
              <span style="color:#FF6B9D;">${safeUrl}</span>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8f8f8;padding:20px 40px;text-align:center;border-top:1px solid #f0f0f0;">
            <p style="margin:0;font-size:12px;color:#aaa;">
              © ${new Date().getFullYear()} Prô Dani. Todos os direitos reservados.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
    `.trim(),
  }))

  if (error) throw new Error(`Falha ao enviar e-mail: ${error.message}`)
  return data
}
