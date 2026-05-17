import bcrypt from 'bcrypt'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '../../config/prisma'
import { redis } from '../../config/redis'
import { env } from '../../config/env'
import { sendEmail, verificationEmailHtml, resetPasswordEmailHtml } from '../../utils/email'
import type { RegisterInput, LoginInput } from './auth.schema'

const LOCKOUT_KEY = (ip: string) => `lockout:${ip}`
const VERIFY_KEY = (token: string) => `verify:${token}`
const RESET_KEY = (token: string) => `reset:${token}`

export async function register(input: RegisterInput, ip: string) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) {
    throw new Error('E-mail já cadastrado')
  }

  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS)
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      organization: input.organization,
    },
  })

  const verifyToken = crypto.randomBytes(32).toString('hex')
  await redis.setex(VERIFY_KEY(verifyToken), 86400, user.id)

  const verifyUrl = `${env.APP_URL}/verificar-email?token=${verifyToken}`
  await sendEmail(user.email, 'Verifique seu e-mail — EBR Consultoria', verificationEmailHtml(user.name, verifyUrl))

  return { message: 'Cadastro realizado. Verifique seu e-mail.' }
}

export async function login(input: LoginInput, ip: string) {
  const lockoutKey = LOCKOUT_KEY(ip)
  const lockedUntil = await redis.get(lockoutKey)
  if (lockedUntil) {
    throw new Error('IP bloqueado temporariamente. Tente novamente mais tarde.')
  }

  const user = await prisma.user.findUnique({ where: { email: input.email } })

  const logAttempt = async (success: boolean) => {
    await prisma.loginAttempt.create({
      data: { userId: user?.id, ip, email: input.email, success },
    })
  }

  if (!user || !user.isActive) {
    await logAttempt(false)
    await incrementFailures(ip)
    throw new Error('Credenciais inválidas')
  }

  const passwordMatch = await bcrypt.compare(input.password, user.passwordHash)
  if (!passwordMatch) {
    await logAttempt(false)
    await incrementFailures(ip)
    throw new Error('Credenciais inválidas')
  }

  await logAttempt(true)
  await redis.del(lockoutKey)
  await redis.del(`failures:${ip}`)

  const accessToken = jwt.sign(
    { sub: user.id, role: user.role, plan: user.plan },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN },
  )

  const refreshTokenRaw = uuidv4()
  const refreshTokenHash = crypto.createHash('sha256').update(refreshTokenRaw).digest('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await prisma.refreshToken.create({
    data: { token: refreshTokenHash, userId: user.id, expiresAt },
  })

  return {
    accessToken,
    refreshToken: refreshTokenRaw,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, plan: user.plan },
  }
}

async function incrementFailures(ip: string) {
  const key = `failures:${ip}`
  const count = await redis.incr(key)
  await redis.expire(key, 900) // 15 min window

  if (count >= env.LOGIN_MAX_ATTEMPTS) {
    await redis.setex(LOCKOUT_KEY(ip), env.LOGIN_LOCKOUT_MINUTES * 60, '1')
    await redis.del(key)
  }
}

export async function refresh(refreshTokenRaw: string) {
  const hash = crypto.createHash('sha256').update(refreshTokenRaw).digest('hex')
  const stored = await prisma.refreshToken.findUnique({
    where: { token: hash },
    include: { user: true },
  })

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new Error('Refresh token inválido ou expirado')
  }

  const accessToken = jwt.sign(
    { sub: stored.user.id, role: stored.user.role, plan: stored.user.plan },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN },
  )

  return { accessToken }
}

export async function logout(refreshTokenRaw: string) {
  const hash = crypto.createHash('sha256').update(refreshTokenRaw).digest('hex')
  await prisma.refreshToken.updateMany({
    where: { token: hash },
    data: { revokedAt: new Date() },
  })
}

export async function verifyEmail(token: string) {
  const userId = await redis.get(VERIFY_KEY(token))
  if (!userId) throw new Error('Token de verificação inválido ou expirado')

  await prisma.user.update({ where: { id: userId }, data: { emailVerified: true } })
  await redis.del(VERIFY_KEY(token))
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return // não revelar se existe

  const token = crypto.randomBytes(32).toString('hex')
  await redis.setex(RESET_KEY(token), 3600, user.id)

  const resetUrl = `${env.APP_URL}/redefinir-senha?token=${token}`
  await sendEmail(user.email, 'Redefinição de senha — EBR Consultoria', resetPasswordEmailHtml(user.name, resetUrl))
}

export async function resetPassword(token: string, newPassword: string) {
  const userId = await redis.get(RESET_KEY(token))
  if (!userId) throw new Error('Token inválido ou expirado')

  const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } })
  await redis.del(RESET_KEY(token))

  await prisma.refreshToken.updateMany({
    where: { userId },
    data: { revokedAt: new Date() },
  })
}

export async function getMe(userId: string) {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, plan: true, organization: true, avatarUrl: true, emailVerified: true, createdAt: true },
  })
}
