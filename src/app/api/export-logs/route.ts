import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

export async function GET(req: NextRequest) {
  // Vérification du token admin
  const token = req.headers.get('x-admin-token')
  if (token !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return NextResponse.json({ error: 'Redis non configuré' }, { status: 503 })
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })

  const total = await redis.llen('atlas:conversations')
  const items = await redis.lrange('atlas:conversations', 0, total - 1)

  const jsonl = items.map(item =>
    typeof item === 'string' ? item : JSON.stringify(item)
  ).join('\n')

  return new NextResponse(jsonl, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': 'attachment; filename="conversations.jsonl"',
    },
  })
}
