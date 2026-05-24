import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/auth'
import { createAuditLog } from '../../middleware/auditLog'
import * as authService from './auth.service'
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.schema'

function authError(reply: any, err: unknown) {
  const msg = err instanceof Error ? err.message : 'Erro interno do servidor'
  if (msg.includes('IP bloqueado')) return reply.status(429).send({ error: msg })
  if (msg.includes('Credenciais inválidas') || msg.includes('inválid')) return reply.status(401).send({ error: msg })
  if (msg.includes('já cadastrado')) return reply.status(409).send({ error: msg })
  throw err
}

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    try {
      const body = registerSchema.parse(request.body)
      const result = await authService.register(body, request.ip)
      return reply.status(201).send(result)
    } catch (err) { return authError(reply, err) }
  })

  app.post('/login', async (request, reply) => {
    try {
      const body = loginSchema.parse(request.body)
      const result = await authService.login(body, request.ip)
      await createAuditLog(request, 'LOGIN', 'User', result.user.id)
      return reply.send(result)
    } catch (err) { return authError(reply, err) }
  })

  app.post('/refresh', async (request, reply) => {
    try {
      const { refreshToken } = refreshSchema.parse(request.body)
      const result = await authService.refresh(refreshToken)
      return reply.send(result)
    } catch (err) { return authError(reply, err) }
  })

  app.post('/logout', async (request, reply) => {
    const { refreshToken } = refreshSchema.parse(request.body)
    await authService.logout(refreshToken)
    return reply.send({ message: 'Logout realizado' })
  })

  app.get('/verify-email/:token', async (request, reply) => {
    const { token } = request.params as { token: string }
    await authService.verifyEmail(token)
    return reply.redirect(`${process.env.APP_URL}/login?verified=1`)
  })

  app.post('/forgot-password', async (request, reply) => {
    const { email } = forgotPasswordSchema.parse(request.body)
    await authService.forgotPassword(email)
    return reply.send({ message: 'Se o e-mail existir, você receberá as instruções.' })
  })

  app.post('/reset-password', async (request, reply) => {
    const { token, password } = resetPasswordSchema.parse(request.body)
    await authService.resetPassword(token, password)
    return reply.send({ message: 'Senha redefinida com sucesso.' })
  })

  app.get('/me', { preHandler: authenticate }, async (request, reply) => {
    const user = await authService.getMe(request.user!.sub)
    return reply.send(user)
  })
}
