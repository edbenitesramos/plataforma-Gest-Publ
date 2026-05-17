import { redis } from '../../config/redis'

const BASE_URL = 'https://pncp.gov.br/api/pncp/v1'
const CACHE_TTL = 3600 // 1 hora

interface PncpSearchParams {
  q?: string
  uf?: string
  valor_min?: number
  pagina?: number
}

async function cachedFetch(url: string, cacheKey: string, ttl = CACHE_TTL) {
  const cached = await redis.get(cacheKey)
  if (cached) {
    return { data: JSON.parse(cached), source: 'cache' }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)

    if (!response.ok) {
      throw new Error(`PNCP API error: ${response.status}`)
    }

    const data = await response.json()
    await redis.setex(cacheKey, ttl, JSON.stringify(data))
    return { data, source: 'api' }
  } catch (err) {
    clearTimeout(timeout)
    // Return mock data when offline
    return {
      data: getMockLicitacoes(),
      source: 'mock',
    }
  }
}

export async function fetchPncp(params: PncpSearchParams) {
  const today = new Date()
  const yesterday = new Date(today.getTime() - 86400000)
  const dataInicial = yesterday.toISOString().slice(0, 10).replace(/-/g, '')
  const dataFinal = today.toISOString().slice(0, 10).replace(/-/g, '')

  const urlParams = new URLSearchParams({
    dataInicial,
    dataFinal,
    pagina: String(params.pagina ?? 1),
    tamanhoPagina: '20',
  })
  if (params.uf) urlParams.set('uf', params.uf)

  const url = `${BASE_URL}/contratacoes/publicacao?${urlParams}`
  const cacheKey = `pncp:search:${urlParams.toString()}`

  return cachedFetch(url, cacheKey)
}

export async function fetchPncpToday() {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const url = `${BASE_URL}/contratacoes/publicacao?dataInicial=${today}&dataFinal=${today}&pagina=1&tamanhoPagina=100`
  const cacheKey = `pncp:today:${today}`
  return cachedFetch(url, cacheKey, 3600)
}

function getMockLicitacoes() {
  return {
    data: [
      {
        numeroControlePNCP: 'MOCK-2026-001',
        razaoSocialOrgao: 'Prefeitura Municipal de Florianópolis',
        uf: 'SC',
        objetoCompra: 'Aquisição de equipamentos de informática',
        valorTotalEstimado: 250000,
        modalidadeNome: 'Pregão Eletrônico',
        dataPublicacaoPncp: new Date().toISOString(),
      },
    ],
    totalRegistros: 1,
    _mock: true,
  }
}
