import { NextResponse } from 'next/server'
import { initSocketServer } from '@/lib/socketServer'

export const dynamic = 'force-dynamic'

export async function GET() {
  initSocketServer()
  return NextResponse.json({ ok: true })
}
