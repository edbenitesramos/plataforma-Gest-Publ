import { FastifyRequest, FastifyReply } from 'fastify'
import { authenticate } from '../../middleware/auth'

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply)
  if (request.user?.role !== 'ADMIN' && request.user?.role !== 'SUPER_ADMIN') {
    return reply.status(403).send({ error: 'Acesso negado.' })
  }
}
