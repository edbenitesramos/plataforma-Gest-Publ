import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/auth'
import { prisma } from '../../config/prisma'
import { z } from 'zod'
import { fetchPncp } from '../apis/pncp'

export async function licitacoesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  // Search licitações via PNCP
  app.get('/buscar', async (request, reply) => {
    const schema = z.object({
      q: z.string().optional(),
      uf: z.string().optional(),
      valor_min: z.coerce.number().optional(),
      pagina: z.coerce.number().default(1),
    })
    const params = schema.parse(request.query)
    const data = await fetchPncp(params)
    return reply.send(data)
  })

  // List user alerts
  app.get('/alertas', async (request, reply) => {
    const alerts = await prisma.alert.findMany({
      where: { userId: request.user!.sub },
      include: { matches: { orderBy: { createdAt: 'desc' }, take: 5 } },
      orderBy: { createdAt: 'desc' },
    })
    return reply.send(alerts)
  })

  // Create alert
  app.post('/alertas', async (request, reply) => {
    const schema = z.object({
      name: z.string().min(1),
      keywords: z.array(z.string()),
      states: z.array(z.string()).default([]),
      minValue: z.number().optional(),
      maxValue: z.number().optional(),
      modalities: z.array(z.string()).default([]),
    })
    const body = schema.parse(request.body)
    const alert = await prisma.alert.create({
      data: { ...body, userId: request.user!.sub },
    })
    return reply.status(201).send(alert)
  })

  // Update alert
  app.put('/alertas/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const schema = z.object({
      name: z.string().optional(),
      keywords: z.array(z.string()).optional(),
      states: z.array(z.string()).optional(),
      minValue: z.number().optional(),
      maxValue: z.number().optional(),
      modalities: z.array(z.string()).optional(),
      isActive: z.boolean().optional(),
    })
    const body = schema.parse(request.body)
    const updated = await prisma.alert.updateMany({
      where: { id, userId: request.user!.sub },
      data: body,
    })
    if (!updated.count) return reply.status(404).send({ error: 'Alerta não encontrado' })
    return reply.send({ message: 'Atualizado' })
  })

  // Delete alert
  app.delete('/alertas/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const deleted = await prisma.alert.deleteMany({
      where: { id, userId: request.user!.sub },
    })
    if (!deleted.count) return reply.status(404).send({ error: 'Alerta não encontrado' })
    return reply.send({ message: 'Excluído' })
  })

  // Alert matches
  app.get('/alertas/:id/matches', async (request, reply) => {
    const { id } = request.params as { id: string }
    const matches = await prisma.alertMatch.findMany({
      where: { alertId: id, alert: { userId: request.user!.sub } },
      orderBy: { createdAt: 'desc' },
    })
    return reply.send(matches)
  })
}
