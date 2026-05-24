import nodemailer from 'nodemailer'
import { env } from '../config/env'

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: env.SMTP_USER
    ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
    : undefined,
})

export async function sendEmail(to: string, subject: string, html: string) {
  if (!env.SMTP_HOST) {
    console.log(`[Email] Would send to ${to}: ${subject}`)
    return
  }

  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
  })
}

export function verificationEmailHtml(name: string, verifyUrl: string) {
  return `
    <h2>Olá, ${name}!</h2>
    <p>Clique no link abaixo para verificar seu e-mail:</p>
    <a href="${verifyUrl}" style="background:#0EA5E9;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">
      Verificar e-mail
    </a>
    <p>O link expira em 24 horas.</p>
  `
}

export function resetPasswordEmailHtml(name: string, resetUrl: string) {
  return `
    <h2>Olá, ${name}!</h2>
    <p>Você solicitou redefinição de senha. Clique no link abaixo:</p>
    <a href="${resetUrl}" style="background:#0EA5E9;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">
      Redefinir senha
    </a>
    <p>O link expira em 1 hora. Se não foi você, ignore este e-mail.</p>
  `
}

export function inviteEmailHtml(name: string, inviterName: string, inviteUrl: string) {
  return `
    <h2>Olá, ${name}!</h2>
    <p>${inviterName} convidou você para acessar a plataforma EBR Consultoria GovAnalytics.</p>
    <p>Clique no botão abaixo para definir sua senha e ativar sua conta:</p>
    <a href="${inviteUrl}" style="background:#0EA5E9;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin:16px 0;">
      Ativar minha conta
    </a>
    <p>Este link expira em 48 horas.</p>
    <p>Se você não esperava este convite, pode ignorar este e-mail.</p>
  `
}
