import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/auth'
import { fetchGastosPorOrgao, fetchContratos } from '../apis/transparencia'
import { fetchEstados, fetchMunicipios } from '../apis/ibge'

export async function transparenciaRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  app.get('/gastos', async (request, reply) => {
    const { ano } = request.query as { ano?: string }
    const result = await fetchGastosPorOrgao(ano)
    const header = (result as { source: string }).source === 'mock' ? 'mock' : 'api'
    return reply.header('X-Data-Source', header).send(result)
  })

  app.get('/contratos', async (request, reply) => {
    const params = request.query as Record<string, string>
    const result = await fetchContratos(params)
    return reply.send(result)
  })

  app.get('/estados', async (_request, reply) => {
    const estados = await fetchEstados()
    return reply.send(estados)
  })

  app.get('/municipios', async (request, reply) => {
    const { uf } = request.query as { uf?: string }
    const municipios = await fetchMunicipios(uf)
    return reply.send(municipios)
  })
}
