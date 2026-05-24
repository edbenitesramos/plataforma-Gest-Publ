import crypto from 'crypto'
import { prisma } from '../../config/prisma'
import { env } from '../../config/env'
import { sendEmail, inviteEmailHtml } from '../../utils/email'

export async function listUsers() {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, plan: true, isActive: true, emailVerified: true, organization: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function toggleUserActive(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
  return prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
    select: { id: true, isActive: true },
  })
}

export async function inviteUser(
  input: { email: string; name: string; role: string; plan: string },
  adminId: string,
) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) throw new Error('E-mail já possui conta cadastrada.')

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000)

  const admin = await prisma.user.findUniqueOrThrow({ where: { id: adminId }, select: { name: true } })

  await prisma.invite.upsert({
    where: { email: input.email },
    update: { name: input.name, role: input.role as any, plan: input.plan as any, token, expiresAt, acceptedAt: null, createdById: adminId },
    create: { email: input.email, name: input.name, role: input.role as any, plan: input.plan as any, token, expiresAt, createdById: adminId },
  })

  const inviteUrl = `${env.APP_URL}/aceitar-convite?token=${token}`
  await sendEmail(input.email, 'Convite para acessar a plataforma EBR Consultoria', inviteEmailHtml(input.name, admin.name, inviteUrl))
}

export async function listInvites() {
  return prisma.invite.findMany({
    select: { id: true, email: true, name: true, role: true, plan: true, expiresAt: true, acceptedAt: true, createdAt: true, createdBy: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function cancelInvite(inviteId: string) {
  await prisma.invite.delete({ where: { id: inviteId } })
}
