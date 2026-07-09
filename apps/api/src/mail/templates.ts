import type { MailContent } from './mail-gateway.interface';

const INSTITUTION = 'Instituto Superior Metropolitano de Angola';
const BRAND = 'IMETRO';

export function welcomeEmail(name: string): MailContent {
  return {
    subject: `Bem-vindo ao ${BRAND}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a">
        <h1 style="font-size:22px;margin:0 0 12px">Olá, ${escapeHtml(name)} 👋</h1>
        <p style="margin:0 0 12px;line-height:1.6">A sua conta foi criada no <strong>${INSTITUTION}</strong>. Já pode aceder à plataforma com o seu email e a palavra-passe definida no acto do registo.</p>
        <p style="margin:0 0 12px;line-height:1.6">Cumprimentos,<br/><strong>${INSTITUTION}</strong></p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>
        <p style="font-size:12px;color:#64748b;margin:0">Se não criou esta conta, pode ignorar este email.</p>
      </div>
    `,
  };
}

export function passwordResetEmail(name: string, resetUrl: string): MailContent {
  return {
    subject: `Recuperação de palavra-passe — ${BRAND}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a">
        <h1 style="font-size:20px;margin:0 0 12px">Recuperar palavra-passe</h1>
        <p style="margin:0 0 12px;line-height:1.6">Olá, ${escapeHtml(name)}. Recebemos um pedido para redefinir a sua palavra-passe no <strong>${INSTITUTION}</strong>.</p>
        <p style="margin:0 0 16px">
          <a href="${escapeHtml(resetUrl)}"
             style="display:inline-block;background:#0f172a;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">
             Redefinir palavra-passe
          </a>
        </p>
        <p style="margin:0 0 12px;line-height:1.6;font-size:14px;color:#475569">Este link expira em 30 minutos. Se não fez este pedido, ignore este email.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>
        <p style="font-size:12px;color:#64748b;margin:0">${INSTITUTION}</p>
      </div>
    `,
    text: `Olá ${name},\n\nRecebemos um pedido para redefinir a sua palavra-passe no ${INSTITUTION}. Aceda ao seguinte link (expira em 30 minutos):\n${resetUrl}\n\nSe não fez este pedido, ignore este email.\n\n${INSTITUTION}`,
  };
}

export function enrollmentStatusEmail(name: string, status: string): MailContent {
  const labels: Record<string, string> = {
    APPROVED: 'Aprovada',
    REJECTED: 'Recusada',
    IN_REVIEW: 'Em análise',
    WAITLIST: 'Lista de espera',
  };
  const label = labels[status] ?? status;
  return {
    subject: `Estado da inscrição atualizado — ${BRAND}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a">
        <h1 style="font-size:20px;margin:0 0 12px">Estado da inscrição: ${escapeHtml(label)}</h1>
        <p style="margin:0 0 12px;line-height:1.6">Olá, ${escapeHtml(name)}. O estado da sua inscrição no <strong>${INSTITUTION}</strong> foi atualizado para <strong>${escapeHtml(label)}</strong>.</p>
        <p style="margin:0 0 12px;line-height:1.6">Aceda à plataforma para mais detalhes.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>
        <p style="font-size:12px;color:#64748b;margin:0">${INSTITUTION}</p>
      </div>
    `,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
