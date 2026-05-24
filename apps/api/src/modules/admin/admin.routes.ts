import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { requireAdmin } from './admin.middleware'
import * as adminService from './admin.service'

const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(['ANALYST', 'VIEWER', 'ADMIN']).default('ANALYST'),
  plan: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']).default('FREE'),
})

function adminError(reply: any, err: unknown) {
  const msg = err instanceof Error ? err.message : 'Erro interno do servidor'
  if (msg.includes('já possui conta') || msg.includes('já cadastrado')) return reply.status(409).send({ error: msg })
  throw err
}

export async function adminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAdmin)

  app.get('/users', async () => {
    return adminService.listUsers()
  })

  app.patch('/users/:id/toggle', async (request, reply) => {
    const { id } = request.params as { id: string }
    return adminService.toggleUserActive(id)
  })

  app.post('/invite', async (request, reply) => {
    try {
      const body = inviteSchema.parse(request.body)
      await adminService.inviteUser(body, request.user!.sub)
      return reply.status(201).send({ message: 'Convite enviado com sucesso.' })
    } catch (err) { return adminError(reply, err) }
  })

  app.get('/invites', async () => {
    return adminService.listInvites()
  })

  app.delete('/invites/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    await adminService.cancelInvite(id)
    return reply.send({ message: 'Convite cancelado.' })
  })
}
