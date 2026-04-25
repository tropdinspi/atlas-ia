'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MetierCard } from '@/components/quiz/MetierCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { suggererMetiers, suggererMetiersCombines } from '@/lib/riasec'
import riasecData from '@/data/riasec-descriptions.json'
import valeursData from '@/data/valeurs-descriptions.json'
import type { QuizResult, ValeursResult, RiasecDescription, ValeurDescription } from '@/lib/types'
import Link from 'next/link'

const riasecDescriptions = riasecData as RiasecDescription[]
const valeursDescriptions = valeursData as ValeurDescription[]

export default function ProfilPage() {
  const [riasec, setRiasec] = useState<QuizResult | null>(null)
  const [valeurs, setValeurs] = useState<ValeursResult | null>(null)
  const router = useRouter()

  useEffect(() => {
    const dataRiasec = sessionStorage.getItem('atlas-quiz-resultat')
    const dataValeurs = sessionStorage.getItem('atlas-valeurs-resultat')

    if (!dataRiasec && !dataValeurs) {
      router.push('/orientation')
      return
    }

    try {
      if (dataRiasec) setRiasec(JSON.parse(dataRiasec))
    } catch {
      // données corrompues, on ignore
    }

    try {
      if (dataValeurs) setValeurs(JSON.parse(dataValeurs))
    } catch {
      // données corrompues, on ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!riasec && !valeurs) return null

  // Métiers suggérés : combinés si les deux tests sont faits, sinon RIASEC seul
  const metiersAffiches = riasec && valeurs
    ? suggererMetiersCombines(riasec.profil, valeurs.profil)
    : riasec
    ? riasec.metiers
    : []

  const descRiasec = riasec?.profil
    .map(type => riasecDescriptions.find(d => d.type === type))
    .filter(Boolean) as RiasecDescription[] | undefined

  const descValeurs = valeurs?.profil
    .map(type => valeursDescriptions.find(d => d.type === type))
    .filter(Boolean) as ValeurDescription[] | undefined

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">

      {/* En-tête */}
      <p className="text-sm text-emerald-700 font-medium uppercase tracking-widest mb-2">
        Ton profil d&apos;orientation
      </p>
      <h1 className="font-serif text-4xl text-stone-900 mb-2">
        {riasec && valeurs
          ? 'Analyse complète'
          : riasec
          ? 'Profil RIASEC'
          : 'Valeurs professionnelles'}
      </h1>
      {riasec && valeurs && (
        <p className="text-stone-500 text-sm mb-8">
          Basée sur tes deux quiz — les métiers suggérés correspondent à la fois à tes activités préférées et à ce qui compte pour toi.
        </p>
      )}

      {/* Section RIASEC */}
      {riasec && descRiasec && (
        <section className="mb-10">
          <h2 className="font-serif text-2xl text-stone-900 mb-1">
            Activités — {descRiasec.map(d => d.label).join(' · ')}
          </h2>
          <p className="text-stone-500 text-xs mb-4 uppercase tracking-wider">Quiz RIASEC</p>
          <div className="grid gap-3">
            {descRiasec.map(d => (
              <div key={d.type} className="flex gap-4 p-4 bg-white border border-stone-200 rounded-xl">
                <Badge className="h-fit mt-1 shrink-0">{d.type}</Badge>
                <div>
                  <p className="font-medium text-stone-900 mb-1">{d.label}</p>
                  <p className="text-stone-600 text-sm">{d.description}</p>
                  <p className="text-xs text-stone-400 mt-1">{d.mots_cles.join(' · ')}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section Valeurs */}
      {valeurs && descValeurs && (
        <section className="mb-10">
          <h2 className="font-serif text-2xl text-stone-900 mb-1">
            Valeurs — {descValeurs.map(d => d.label).join(' · ')}
          </h2>
          <p className="text-stone-500 text-xs mb-4 uppercase tracking-wider">Quiz Valeurs professionnelles</p>
          <div className="grid gap-3">
            {descValeurs.map(d => (
              <div key={d.type} className="flex gap-4 p-4 bg-white border border-emerald-100 rounded-xl bg-emerald-50/30">
                <Badge variant="secondary" className="h-fit mt-1 shrink-0 bg-emerald-100 text-emerald-800">{d.label}</Badge>
                <div>
                  <p className="font-medium text-stone-900 mb-1">{d.label}</p>
                  <p className="text-stone-600 text-sm">{d.description}</p>
                  <p className="text-xs text-stone-400 mt-1">{d.mots_cles.join(' · ')}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA quiz manquant */}
      {(riasec && !valeurs) && (
        <div className="mb-10 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-stone-900 text-sm">Affine tes résultats</p>
            <p className="text-stone-500 text-xs mt-0.5">Fais le quiz Valeurs pour voir des métiers encore mieux ciblés.</p>
          </div>
          <Button size="sm" variant="outline" className="shrink-0 border-emerald-300 text-emerald-800" asChild>
            <Link href="/orientation/valeurs">Quiz Valeurs →</Link>
          </Button>
        </div>
      )}

      {/* Métiers suggérés */}
      {metiersAffiches.length > 0 && (
        <section className="mb-10">
          <h2 className="font-serif text-2xl text-stone-900 mb-1">
            Métiers qui te correspondent
          </h2>
          <p className="text-stone-500 text-xs mb-4 uppercase tracking-wider">
            {riasec && valeurs ? 'Sélectionnés selon tes activités et tes valeurs' : 'Sélectionnés selon ton profil RIASEC'}
          </p>
          <div className="grid gap-4">
            {metiersAffiches.map(m => (
              <MetierCard key={m.id} metier={m} />
            ))}
          </div>
        </section>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button className="bg-stone-900 hover:bg-stone-700 text-white" asChild>
          <Link href="/orientation/chat">Explorer avec le chat →</Link>
        </Button>
        {riasec && (
          <Button variant="outline" className="border-stone-300" asChild>
            <Link href="/orientation/quiz">Refaire le RIASEC</Link>
          </Button>
        )}
        {valeurs && (
          <Button variant="outline" className="border-stone-300" asChild>
            <Link href="/orientation/valeurs">Refaire les Valeurs</Link>
          </Button>
        )}
      </div>
    </div>
  )
}
