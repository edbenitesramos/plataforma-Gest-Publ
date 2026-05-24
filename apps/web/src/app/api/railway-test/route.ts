import { NextResponse } from 'next/server'

const BACKEND = 'https://plataforma-gest-publ-production.up.railway.app'

async function probe(path: string, options?: RequestInit) {
  try {
    const res = await fetch(`${BACKEND}${path}`, {
      headers: { 'content-type': 'application/json' },
      ...options,
    })
    const text = await res.text()
    return { status: res.status, body: text.slice(0, 400) }
  } catch (e) {
    return { status: null, error: String(e) }
  }
}

export async function GET() {
  const [health, me, login] = await Promise.all([
    probe('/health'),
    probe('/api/auth/me'),
    probe('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'demo@ebrconsultoria.com.br', password: 'Demo@2026' }),
    }),
  ])
  return NextResponse.json({ backend: BACKEND, health, me, login })
}
