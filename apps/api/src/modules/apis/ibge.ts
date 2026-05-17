import { redis } from '../../config/redis'

const BASE_URL = 'https://servicodados.ibge.gov.br/api'
const CACHE_TTL = 86400 // 24 horas

async function ibgeFetch(path: string) {
  const cacheKey = `ibge:${path}`
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(`${BASE_URL}${path}`, { signal: controller.signal })
    clearTimeout(timeout)
    if (!response.ok) throw new Error(`IBGE error: ${response.status}`)
    const data = await response.json()
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(data))
    return data
  } catch {
    clearTimeout(timeout)
    return []
  }
}

export async function fetchEstados() {
  return ibgeFetch('/v1/localidades/estados?orderBy=nome')
}

export async function fetchMunicipios(uf?: string) {
  const path = uf
    ? `/v1/localidades/estados/${uf}/municipios?orderBy=nome`
    : '/v1/localidades/municipios?orderBy=nome'
  return ibgeFetch(path)
}

export async function fetchMalhaEstados() {
  return 'https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=image/svg+xml&qualidade=minima&divisoes=UF'
}
