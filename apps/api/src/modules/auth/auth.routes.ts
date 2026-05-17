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

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body)
    const result = await authService.register(body, request.ip)
    return reply.status(201).send(result)
  })

  app.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body)
    const result = await authService.login(body, request.ip)
    await createAuditLog(request, 'LOGIN', 'User', result.user.id)
    return reply.send(result)
  })

  app.post('/refresh', async (request, reply) => {
    const { refreshToken } = refreshSchema.parse(request.body)
    const result = await authService.refresh(refreshToken)
    return reply.send(result)
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
