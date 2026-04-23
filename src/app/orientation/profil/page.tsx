'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MetierCard } from '@/components/quiz/MetierCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import descriptionsData from '@/data/riasec-descriptions.json'
import type { QuizResult, RiasecDescription } from '@/lib/types'
import Link from 'next/link'

const descriptions = descriptionsData as RiasecDescription[]

export default function ProfilPage() {
  const [resultat, setResultat] = useState<QuizResult | null>(null)
  const router = useRouter()

  useEffect(() => {
    const data = sessionStorage.getItem('atlas-quiz-resultat')
    if (!data) {
      router.push('/orientation/quiz')
      return
    }
    try {
      setResultat(JSON.parse(data))
    } catch {
      router.push('/orientation/quiz')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!resultat) return null

  const descriptionsProfil = resultat.profil
    .map(type => descriptions.find(d => d.type === type))
    .filter(Boolean) as RiasecDescription[]

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <p className="text-sm text-emerald-700 font-medium uppercase tracking-widest mb-2">
        Ton profil RIASEC
      </p>
      <h1 className="font-serif text-4xl text-stone-900 mb-6">
        {descriptionsProfil.map(d => d.label).join(' · ')}
      </h1>

      {/* Types RIASEC */}
      <div className="grid gap-4 mb-10">
        {descriptionsProfil.map(d => (
          <div key={d.type} className="flex gap-4 p-4 bg-white border border-stone-200 rounded-xl">
            <Badge className="h-fit mt-1">{d.type}</Badge>
            <div>
              <p className="font-medium text-stone-900 mb-1">{d.label}</p>
              <p className="text-stone-600 text-sm">{d.description}</p>
              <p className="text-xs text-stone-400 mt-1">{d.mots_cles.join(' · ')}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Métiers suggérés */}
      <h2 className="font-serif text-2xl text-stone-900 mb-4">
        Métiers qui te correspondent
      </h2>
      <div className="grid gap-4 mb-10">
        {resultat.metiers.map(m => (
          <MetierCard key={m.id} metier={m} />
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button className="bg-stone-900 hover:bg-stone-700 text-white" asChild>
          <Link href="/orientation/chat">Explorer avec le chat →</Link>
        </Button>
        <Button variant="outline" className="border-stone-300" asChild>
          <Link href="/orientation/quiz">Refaire le quiz</Link>
        </Button>
      </div>
    </div>
  )
}
