import { NextResponse } from 'next/server'

export function GET() {
  return NextResponse.json({ ok: true, proxy: 'vercel-api-routes-working' })
}
