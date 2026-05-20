import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import multipart from '@fastify/multipart'
import { env } from './config/env'
import { redis } from './config/redis'
import { authRoutes } from './modules/auth/auth.routes'
import { decisionRoutes } from './modules/decision/decision.routes'
import { licitacoesRoutes } from './modules/licitacoes/licitacoes.routes'
import { transparenciaRoutes } from './modules/transparencia/transparencia.routes'
import { driveRoutes } from './modules/drive/drive.routes'
import { startAlertJob } from './jobs/alertsJob'

const app = Fastify({
  logger: {
    level: env.LOG_LEVEL,
    transport: env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
  },
})

async function bootstrap() {
  // Accept multiple origins: local dev + Vercel preview/prod URLs
  const allowedOrigins = [
    env.APP_URL,
    /\.vercel\.app$/,
    /localhost:\d+$/,
  ]

  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true) // non-browser clients
      const allowed = allowedOrigins.some((o) =>
        typeof o === 'string' ? o === origin : o.test(origin),
      )
      cb(null, allowed)
    },
    credentials: true,
  })

  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })

  await app.register(rateLimit, {
    redis,
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
  })

  await app.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50 MB
    },
  })

  // Routes
  app.register(authRoutes, { prefix: '/api/auth' })
  app.register(decisionRoutes, { prefix: '/api/decision' })
  app.register(licitacoesRoutes, { prefix: '/api/licitacoes' })
  app.register(transparenciaRoutes, { prefix: '/api/transparencia' })
  app.register(driveRoutes, { prefix: '/api/drive' })

  // Health + metrics
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  app.get('/metrics', async () => ({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    env: env.NODE_ENV,
  }))

  // Error handler
  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error)
    const statusCode = error.statusCode ?? 500
    const message = statusCode < 500 ? error.message : 'Erro interno do servidor'
    reply.status(statusCode).send({ error: message })
  })

  // Start jobs
  if (env.NODE_ENV !== 'test') {
    startAlertJob()
  }

  await app.listen({ port: env.PORT, host: '0.0.0.0' })
  app.log.info(`EBR API running on port ${env.PORT}`)
}

bootstrap().catch((err) => {
  console.error(err)
  process.exit(1)
})
