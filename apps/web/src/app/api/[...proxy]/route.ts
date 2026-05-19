import { NextRequest, NextResponse } from 'next/server'

const BACKEND = 'https://plataforma-gest-publ-production.up.railway.app'

async function proxy(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url)
  const target = `${BACKEND}${url.pathname}${url.search}`

  const headers = new Headers()
  const auth = request.headers.get('authorization')
  if (auth) headers.set('authorization', auth)
  headers.set('content-type', 'application/json')

  let body: string | undefined
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.text()
  }

  const res = await fetch(target, {
    method: request.method,
    headers,
    body,
  })

  const text = await res.text()
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': 'application/json' },
  })
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const DELETE = proxy
export const PATCH = proxy
