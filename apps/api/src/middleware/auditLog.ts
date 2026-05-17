import { FastifyRequest } from 'fastify'
import { prisma } from '../config/prisma'

export async function createAuditLog(
  request: FastifyRequest,
  action: string,
  entity: string,
  entityId?: string,
  payload?: unknown,
) {
  await prisma.auditLog.create({
    data: {
      userId: request.user?.sub,
      action,
      entity,
      entityId,
      payload: payload ? JSON.parse(JSON.stringify(payload)) : undefined,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    },
  })
}
