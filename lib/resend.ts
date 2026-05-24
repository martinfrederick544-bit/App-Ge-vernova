import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = 'GE Vernova Drawings <no-reply@ge-vernova-app.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function sendNewRevisionEmail(params: {
  engineerEmails: string[]
  drawingNumber: string
  drawingTitle: string
  drawingId: string
  revisionNumber: string
  submittedBy: string
}) {
  const url = `${APP_URL}/drawings/${params.drawingId}`

  await resend.emails.send({
    from: FROM,
    to: params.engineerEmails,
    subject: `[GEV] Nouvelle révision ${params.revisionNumber} — ${params.drawingNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e3a8a; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">GE Vernova — Nouvelle Révision</h2>
        </div>
        <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
          <p>Une nouvelle révision est en attente de votre examen :</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px; font-weight: bold; color: #64748b;">Dessin</td><td style="padding: 8px;">${params.drawingNumber} — ${params.drawingTitle}</td></tr>
            <tr style="background: #f1f5f9;"><td style="padding: 8px; font-weight: bold; color: #64748b;">Révision</td><td style="padding: 8px;">${params.revisionNumber}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; color: #64748b;">Soumis par</td><td style="padding: 8px;">${params.submittedBy}</td></tr>
          </table>
          <a href="${url}" style="display: inline-block; background: #1d4ed8; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            Réviser le dessin →
          </a>
        </div>
      </div>
    `,
  })
}

export async function sendApprovedEmail(params: {
  drafterEmail: string
  drawingNumber: string
  drawingTitle: string
  drawingId: string
  revisionNumber: string
  reviewedBy: string
}) {
  const url = `${APP_URL}/drawings/${params.drawingId}`

  await resend.emails.send({
    from: FROM,
    to: [params.drafterEmail],
    subject: `[GEV] ✓ Révision ${params.revisionNumber} approuvée — ${params.drawingNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #166534; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">GE Vernova — Révision Approuvée ✓</h2>
        </div>
        <div style="background: #f0fdf4; padding: 24px; border: 1px solid #bbf7d0; border-radius: 0 0 8px 8px;">
          <p>Votre révision a été approuvée :</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px; font-weight: bold; color: #64748b;">Dessin</td><td style="padding: 8px;">${params.drawingNumber} — ${params.drawingTitle}</td></tr>
            <tr style="background: #dcfce7;"><td style="padding: 8px; font-weight: bold; color: #64748b;">Révision</td><td style="padding: 8px;">${params.revisionNumber}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; color: #64748b;">Approuvée par</td><td style="padding: 8px;">${params.reviewedBy}</td></tr>
          </table>
          <a href="${url}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            Voir le dessin →
          </a>
        </div>
      </div>
    `,
  })
}

export async function sendReturnedEmail(params: {
  drafterEmail: string
  drawingNumber: string
  drawingTitle: string
  drawingId: string
  revisionNumber: string
  reviewedBy: string
  comment: string
}) {
  const url = `${APP_URL}/drawings/${params.drawingId}`

  await resend.emails.send({
    from: FROM,
    to: [params.drafterEmail],
    subject: `[GEV] ↩ Révision ${params.revisionNumber} retournée — ${params.drawingNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #9a3412; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">GE Vernova — Révision Retournée</h2>
        </div>
        <div style="background: #fff7ed; padding: 24px; border: 1px solid #fed7aa; border-radius: 0 0 8px 8px;">
          <p>Votre révision a été retournée pour correction :</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px; font-weight: bold; color: #64748b;">Dessin</td><td style="padding: 8px;">${params.drawingNumber} — ${params.drawingTitle}</td></tr>
            <tr style="background: #ffedd5;"><td style="padding: 8px; font-weight: bold; color: #64748b;">Révision</td><td style="padding: 8px;">${params.revisionNumber}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; color: #64748b;">Retourné par</td><td style="padding: 8px;">${params.reviewedBy}</td></tr>
          </table>
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 16px 0; border-radius: 0 6px 6px 0;">
            <p style="font-weight: bold; margin: 0 0 8px; color: #991b1b;">Commentaire :</p>
            <p style="margin: 0; color: #1e293b;">${params.comment}</p>
          </div>
          <a href="${url}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            Voir les détails →
          </a>
        </div>
      </div>
    `,
  })
}
