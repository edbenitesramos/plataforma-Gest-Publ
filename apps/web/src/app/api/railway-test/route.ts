import { NextResponse } from 'next/server'

const BACKEND = 'https://plataforma-gest-publ-production.up.railway.app'

async function probe(path: string) {
  try {
    const res = await fetch(`${BACKEND}${path}`, {
      headers: { 'content-type': 'application/json' },
    })
    const text = await res.text()
    return { status: res.status, body: text.slice(0, 300) }
  } catch (e) {
    return { status: null, error: String(e) }
  }
}

export async function GET() {
  const [health, me] = await Promise.all([probe('/health'), probe('/api/auth/me')])
  return NextResponse.json({ backend: BACKEND, health, me })
}
