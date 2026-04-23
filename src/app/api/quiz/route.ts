import { NextRequest, NextResponse } from 'next/server'
import { traiterQuiz } from '@/lib/riasec'

export async function POST(req: NextRequest) {
  const { reponses } = await req.json() as { reponses: Record<number, number> }
  const resultat = traiterQuiz(reponses)
  return NextResponse.json(resultat)
}
