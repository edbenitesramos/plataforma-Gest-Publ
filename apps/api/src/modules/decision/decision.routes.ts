import { FastifyInstance } from 'fastify'
import { Prisma } from '@prisma/client'
import { authenticate } from '../../middleware/auth'
import { createAuditLog } from '../../middleware/auditLog'
import { prisma } from '../../config/prisma'
import { z } from 'zod'

export async function decisionRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  // List cases
  app.get('/', async (request, reply) => {
    const { status, classification, page = 1, limit = 20 } = request.query as Record<string, unknown>
    const where: Record<string, unknown> = { userId: request.user!.sub }
    if (status) where.status = status
    if (classification) where.classification = classification

    const [cases, total] = await Promise.all([
      prisma.decisionCase.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          f1Problem: { select: { id: true } },
          f2DataCollection: { select: { id: true } },
          f3Alternatives: { select: { id: true } },
          f4Voting: { select: { id: true } },
          f5Register: { select: { id: true } },
          f6Review: { select: { id: true } },
        },
      }),
      prisma.decisionCase.count({ where }),
    ])

    return reply.send({ cases, total, page: Number(page), limit: Number(limit) })
  })

  // Create case
  app.post('/', async (request, reply) => {
    const schema = z.object({
      title: z.string().min(1),
      institution: z.string().optional(),
      sector: z.string().optional(),
      classification: z.enum(['STRATEGIC', 'OPERATIONAL', 'TACTICAL']).default('OPERATIONAL'),
    })
    const body = schema.parse(request.body)
    const decisionCase = await prisma.decisionCase.create({
      data: { ...body, userId: request.user!.sub },
    })
    await createAuditLog(request, 'CREATE', 'DecisionCase', decisionCase.id)
    return reply.status(201).send(decisionCase)
  })

  // Get single case
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const decisionCase = await prisma.decisionCase.findFirst({
      where: { id, userId: request.user!.sub },
      include: {
        f1Problem: true,
        f2DataCollection: true,
        f3Alternatives: { orderBy: { sortOrder: 'asc' } },
        f4Voting: true,
        f5Register: true,
        f6Review: true,
      },
    })
    if (!decisionCase) return reply.status(404).send({ error: 'Caso não encontrado' })
    return reply.send(decisionCase)
  })

  // Update case metadata
  app.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const schema = z.object({
      title: z.string().optional(),
      institution: z.string().optional(),
      sector: z.string().optional(),
      classification: z.enum(['STRATEGIC', 'OPERATIONAL', 'TACTICAL']).optional(),
      status: z.enum(['DRAFT', 'IN_PROGRESS', 'DECIDED', 'IMPLEMENTING', 'REVIEWING', 'CLOSED']).optional(),
    })
    const body = schema.parse(request.body)
    const updated = await prisma.decisionCase.updateMany({
      where: { id, userId: request.user!.sub },
      data: body,
    })
    if (!updated.count) return reply.status(404).send({ error: 'Caso não encontrado' })
    await createAuditLog(request, 'UPDATE', 'DecisionCase', id, body)
    return reply.send({ message: 'Atualizado' })
  })

  // Delete case
  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const deleted = await prisma.decisionCase.deleteMany({
      where: { id, userId: request.user!.sub },
    })
    if (!deleted.count) return reply.status(404).send({ error: 'Caso não encontrado' })
    await createAuditLog(request, 'DELETE', 'DecisionCase', id)
    return reply.send({ message: 'Excluído' })
  })

  // ── F1 — Definição do Problema ──────────────────────────────────
  app.put('/:id/f1', async (request, reply) => {
    const { id } = request.params as { id: string }
    const schema = z.object({
      decisionDate: z.string().optional(),
      deadline: z.string().optional(),
      decider: z.string().optional(),
      advisor: z.string().optional(),
      decisionType: z.array(z.string()).optional(),
      whatDecision: z.string().optional(),
      context: z.string().optional(),
      errorImpact: z.string().optional(),
      constraints: z.string().optional(),
      effortLevel: z.string().optional(),
    })
    const body = schema.parse(request.body)

    const existing = await prisma.decisionCase.findFirst({ where: { id, userId: request.user!.sub } })
    if (!existing) return reply.status(404).send({ error: 'Caso não encontrado' })

    const data = {
      ...body,
      decisionDate: body.decisionDate ? new Date(body.decisionDate) : undefined,
    }

    const f1 = await prisma.f1Problem.upsert({
      where: { caseId: id },
      create: { caseId: id, ...data },
      update: data,
    })

    await prisma.decisionCase.update({
      where: { id },
      data: { status: 'IN_PROGRESS', updatedAt: new Date() },
    })

    return reply.send(f1)
  })

  // ── F2 — Coleta de Dados ────────────────────────────────────────
  app.put('/:id/f2', async (request, reply) => {
    const { id } = request.params as { id: string }
    const schema = z.object({
      sources: z.array(z.record(z.unknown())).optional(),
      checklist: z.record(z.boolean()).optional(),
      gaps: z.string().optional(),
      synthesis: z.string().optional(),
    })
    const body = schema.parse(request.body)

    const existing = await prisma.decisionCase.findFirst({ where: { id, userId: request.user!.sub } })
    if (!existing) return reply.status(404).send({ error: 'Caso não encontrado' })

    const f2Data = {
      ...body,
      sources: body.sources as unknown as Prisma.InputJsonValue | undefined,
    }
    const f2 = await prisma.f2DataCollection.upsert({
      where: { caseId: id },
      create: { caseId: id, ...f2Data },
      update: f2Data,
    })

    return reply.send(f2)
  })

  // ── F3 — Alternativas ───────────────────────────────────────────
  app.put('/:id/f3', async (request, reply) => {
    const { id } = request.params as { id: string }
    const schema = z.object({
      alternatives: z.array(z.object({
        id: z.string().optional(),
        label: z.string(),
        description: z.string().optional(),
        pros: z.string().optional(),
        cons: z.string().optional(),
        risk: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
        cost: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
        note: z.number().min(1).max(5).optional(),
        isRecommended: z.boolean().optional(),
        sortOrder: z.number().optional(),
      })),
    })
    const { alternatives } = schema.parse(request.body)

    const existing = await prisma.decisionCase.findFirst({ where: { id, userId: request.user!.sub } })
    if (!existing) return reply.status(404).send({ error: 'Caso não encontrado' })

    await prisma.f3Alternative.deleteMany({ where: { caseId: id } })
    const created = await prisma.f3Alternative.createMany({
      data: alternatives.map((a, i) => ({
        caseId: id,
        label: a.label,
        description: a.description,
        pros: a.pros,
        cons: a.cons,
        risk: a.risk,
        cost: a.cost,
        note: a.note,
        isRecommended: a.isRecommended ?? false,
        sortOrder: a.sortOrder ?? i,
      })),
    })

    return reply.send({ count: created.count })
  })

  // ── F4 — Votação ────────────────────────────────────────────────
  app.put('/:id/f4', async (request, reply) => {
    const { id } = request.params as { id: string }
    const schema = z.object({
      criteria: z.array(z.record(z.unknown())).optional(),
      advisorRecommendation: z.string().optional(),
      chosenAlternativeId: z.string().optional(),
      divergedFromRec: z.boolean().optional(),
      deciderJustification: z.string().optional(),
      deciderSignature: z.string().optional(),
      decidedAt: z.string().optional(),
    })
    const body = schema.parse(request.body)

    const existing = await prisma.decisionCase.findFirst({ where: { id, userId: request.user!.sub } })
    if (!existing) return reply.status(404).send({ error: 'Caso não encontrado' })

    const data = {
      ...body,
      decidedAt: body.decidedAt ? new Date(body.decidedAt) : undefined,
      criteria: body.criteria as unknown as Prisma.InputJsonValue | undefined,
    }

    const f4 = await prisma.f4Voting.upsert({
      where: { caseId: id },
      create: { caseId: id, ...data },
      update: data,
    })

    if (body.chosenAlternativeId) {
      await prisma.decisionCase.update({ where: { id }, data: { status: 'DECIDED' } })
    }

    return reply.send(f4)
  })

  // ── F5 — Registro ───────────────────────────────────────────────
  app.put('/:id/f5', async (request, reply) => {
    const { id } = request.params as { id: string }
    const schema = z.object({
      reference: z.string().optional(),
      decisionSummary: z.string().optional(),
      implementedAlternative: z.string().optional(),
      implementationDeadline: z.string().optional(),
      reviewDeadline: z.string().optional(),
      communicationChannels: z.array(z.string()).optional(),
      w5h2: z.record(z.string()).optional(),
      stakeholders: z.array(z.record(z.unknown())).optional(),
    })
    const body = schema.parse(request.body)

    const existing = await prisma.decisionCase.findFirst({ where: { id, userId: request.user!.sub } })
    if (!existing) return reply.status(404).send({ error: 'Caso não encontrado' })

    const f5Data = {
      ...body,
      w5h2: body.w5h2 as Prisma.InputJsonValue | undefined,
      stakeholders: body.stakeholders as unknown as Prisma.InputJsonValue | undefined,
    }
    const f5 = await prisma.f5Register.upsert({
      where: { caseId: id },
      create: { caseId: id, ...f5Data },
      update: f5Data,
    })

    await prisma.decisionCase.update({ where: { id }, data: { status: 'IMPLEMENTING' } })

    return reply.send(f5)
  })

  // ── F6 — Revisão ────────────────────────────────────────────────
  app.put('/:id/f6', async (request, reply) => {
    const { id } = request.params as { id: string }
    const schema = z.object({
      reviewDate: z.string().optional(),
      participants: z.string().optional(),
      f5Reference: z.string().optional(),
      reviewAnswers: z.array(z.record(z.unknown())).optional(),
      goalAchieved: z.string().optional(),
      satisfactionLevel: z.number().min(1).max(5).optional(),
      advisorAdequate: z.string().optional(),
      whatWorked: z.string().optional(),
      whatToImprove: z.string().optional(),
      futureRecs: z.string().optional(),
      archivedAt: z.string().optional(),
      reviewerSignature: z.string().optional(),
    })
    const body = schema.parse(request.body)

    const existing = await prisma.decisionCase.findFirst({ where: { id, userId: request.user!.sub } })
    if (!existing) return reply.status(404).send({ error: 'Caso não encontrado' })

    const data = {
      ...body,
      reviewDate: body.reviewDate ? new Date(body.reviewDate) : undefined,
      reviewAnswers: body.reviewAnswers as unknown as Prisma.InputJsonValue | undefined,
    }

    const f6 = await prisma.f6Review.upsert({
      where: { caseId: id },
      create: { caseId: id, ...data },
      update: data,
    })

    await prisma.decisionCase.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date() },
    })

    return reply.send(f6)
  })

  // Report data endpoint
  app.get('/:id/report', async (request, reply) => {
    const { id } = request.params as { id: string }
    const decisionCase = await prisma.decisionCase.findFirst({
      where: { id, userId: request.user!.sub },
      include: {
        f1Problem: true,
        f2DataCollection: true,
        f3Alternatives: { orderBy: { sortOrder: 'asc' } },
        f4Voting: true,
        f5Register: true,
        f6Review: true,
        user: { select: { name: true, organization: true } },
      },
    })
    if (!decisionCase) return reply.status(404).send({ error: 'Caso não encontrado' })
    return reply.send(decisionCase)
  })
}
