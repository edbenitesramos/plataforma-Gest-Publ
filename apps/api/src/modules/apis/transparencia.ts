import { redis } from '../../config/redis'
import { env } from '../../config/env'

const BASE_URL = 'https://api.portaldatransparencia.gov.br/api-de-dados'
const CACHE_TTL = 21600 // 6 horas

async function transparenciaFetch(path: string, params?: Record<string, string>) {
  const cacheKey = `transparencia:${path}:${JSON.stringify(params ?? {})}`
  const cached = await redis.get(cacheKey)
  if (cached) return { data: JSON.parse(cached), source: 'cache' }

  if (!env.CGU_API_KEY) {
    return { data: getMockGastos(), source: 'mock' }
  }

  const urlParams = new URLSearchParams(params ?? {})
  const url = `${BASE_URL}${path}?${urlParams}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'chave-api-dados': env.CGU_API_KEY! },
    })
    clearTimeout(timeout)

    if (!response.ok) throw new Error(`CGU API error: ${response.status}`)

    const data = await response.json()
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(data))
    return { data, source: 'api' }
  } catch {
    clearTimeout(timeout)
    return { data: getMockGastos(), source: 'mock' }
  }
}

export async function fetchGastosPorOrgao(ano?: string) {
  return transparenciaFetch('/despesas/por-orgao', ano ? { ano } : {})
}

export async function fetchContratos(params?: Record<string, string>) {
  return transparenciaFetch('/contratos', params)
}

function getMockGastos() {
  return [
    { orgao: 'Ministério da Saúde', valor: 92000000000, _mock: true },
    { orgao: 'Ministério da Educação', valor: 45000000000, _mock: true },
    { orgao: 'Ministério da Defesa', valor: 38000000000, _mock: true },
  ]
}
