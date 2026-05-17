import { FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'

export interface JwtPayload {
  sub: string
  role: string
  plan: string
  iat?: number
  exp?: number
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Token de autenticação requerido' })
  }

  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload
    request.user = payload
  } catch {
    return reply.status(401).send({ error: 'Token inválido ou expirado' })
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload
  }
}
