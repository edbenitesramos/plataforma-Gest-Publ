import { NextResponse } from 'next/server'

const BACKEND = 'https://plataforma-gest-publ-production.up.railway.app'

export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/api/auth/me`, {
      headers: { 'content-type': 'application/json' },
    })
    const text = await res.text()
    return NextResponse.json({ reachable: true, status: res.status, body: text.slice(0, 300) })
  } catch (e) {
    return NextResponse.json({ reachable: false, error: String(e) }, { status: 200 })
  }
}
