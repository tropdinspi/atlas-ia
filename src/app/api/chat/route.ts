import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { getContextForQuery } from '@/lib/data-loader'
import { buildSystemPrompt } from '@/lib/system-prompt'
import type { Message } from '@/lib/types'

export async function POST(req: NextRequest) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  const { messages, dernierMessage } = await req.json() as {
    messages: Message[]
    dernierMessage: string
  }

  const context = getContextForQuery(dernierMessage)
  const systemPrompt = buildSystemPrompt(context)

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    max_tokens: 600,
    temperature: 0.7,
  })

  const reponse = completion.choices[0].message.content ?? ''
  return NextResponse.json({ reponse })
}
