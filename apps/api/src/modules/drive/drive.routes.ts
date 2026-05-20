import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/auth'
import { env } from '../../config/env'
import {
  getAuthUrl,
  handleCallback,
  listFiles,
  attachFile,
  uploadFile,
  getFilesForCase,
  disconnect,
  isConnected,
} from './drive.service'

function checkGoogleConfig(reply: Parameters<typeof authenticate>[1]) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REDIRECT_URI) {
    reply.status(503).send({ error: 'Google Drive não configurado' })
    return false
  }
  return true
}

export async function driveRoutes(app: FastifyInstance) {
  // GET /auth-url — returns OAuth URL
  app.get('/auth-url', { preHandler: [authenticate] }, async (request, reply) => {
    if (!checkGoogleConfig(reply)) return
    const userId = request.user!.sub
    const url = getAuthUrl(userId)
    return { url }
  })

  // GET /callback?code=&state= — OAuth callback (no auth required)
  app.get('/callback', async (request, reply) => {
    if (!checkGoogleConfig(reply)) return
    const { code, state } = request.query as { code?: string; state?: string }

    if (!code || !state) {
      return reply.status(400).send({ error: 'Parâmetros inválidos' })
    }

    try {
      await handleCallback(code, state)
    } catch (err) {
      app.log.error(err)
      return reply.redirect(`${env.APP_URL}/dashboard/configuracoes?drive=error`)
    }

    return reply.redirect(`${env.APP_URL}/dashboard/configuracoes?drive=connected`)
  })

  // DELETE /disconnect
  app.delete('/disconnect', { preHandler: [authenticate] }, async (request, reply) => {
    if (!checkGoogleConfig(reply)) return
    const userId = request.user!.sub
    try {
      await disconnect(userId)
      return { ok: true }
    } catch (err) {
      app.log.error(err)
      return reply.status(500).send({ error: 'Erro ao desconectar Drive' })
    }
  })

  // GET /status
  app.get('/status', { preHandler: [authenticate] }, async (request, reply) => {
    if (!checkGoogleConfig(reply)) return reply.send({ connected: false })
    const userId = request.user!.sub
    const connected = await isConnected(userId)
    return { connected }
  })

  // GET /files?q=&pageToken=
  app.get('/files', { preHandler: [authenticate] }, async (request, reply) => {
    if (!checkGoogleConfig(reply)) return
    const userId = request.user!.sub
    const { q, pageToken } = request.query as { q?: string; pageToken?: string }

    try {
      const result = await listFiles(userId, q, pageToken)
      return result
    } catch (err) {
      app.log.error(err)
      return reply.status(400).send({ error: err instanceof Error ? err.message : 'Erro ao listar arquivos' })
    }
  })

  // POST /attach — body: { caseId, fileId }
  app.post('/attach', { preHandler: [authenticate] }, async (request, reply) => {
    if (!checkGoogleConfig(reply)) return
    const userId = request.user!.sub
    const { caseId, fileId } = request.body as { caseId: string; fileId: string }

    if (!caseId || !fileId) {
      return reply.status(400).send({ error: 'caseId e fileId são obrigatórios' })
    }

    try {
      const driveFile = await attachFile(userId, caseId, fileId)
      return driveFile
    } catch (err) {
      app.log.error(err)
      return reply.status(400).send({ error: err instanceof Error ? err.message : 'Erro ao anexar arquivo' })
    }
  })

  // POST /upload — multipart
  app.post('/upload', { preHandler: [authenticate] }, async (request, reply) => {
    if (!checkGoogleConfig(reply)) return
    const userId = request.user!.sub

    try {
      const data = await request.file()
      if (!data) {
        return reply.status(400).send({ error: 'Arquivo não encontrado no upload' })
      }

      const caseId = (data.fields?.caseId as { value?: string } | undefined)?.value

      const chunks: Buffer[] = []
      for await (const chunk of data.file) {
        chunks.push(chunk as Buffer)
      }
      const buffer = Buffer.concat(chunks)

      const result = await uploadFile(
        userId,
        caseId,
        data.filename,
        data.mimetype,
        buffer,
      )

      return result
    } catch (err) {
      app.log.error(err)
      return reply.status(400).send({ error: err instanceof Error ? err.message : 'Erro no upload' })
    }
  })

  // GET /cases/:caseId/files
  app.get('/cases/:caseId/files', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = request.user!.sub
    const { caseId } = request.params as { caseId: string }

    try {
      const files = await getFilesForCase(userId, caseId)
      // Convert BigInt to string for JSON serialization
      return files.map((f) => ({
        ...f,
        size: f.size !== null ? f.size.toString() : null,
      }))
    } catch (err) {
      app.log.error(err)
      return reply.status(400).send({ error: err instanceof Error ? err.message : 'Erro ao buscar arquivos' })
    }
  })
}
