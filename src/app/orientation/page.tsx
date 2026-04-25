'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// Définition des 3 profils disponibles
const PROFILS = [
  {
    id: 'lyceen',
    label: 'Lycéen / Collégien',
    description: 'Tu es au collège ou au lycée et tu explores ton orientation.',
  },
  {
    id: 'etudiant',
    label: 'Étudiant en questionnement',
    description: 'Tu es dans des études mais tu doutes ou tu veux te réorienter.',
  },
  {
    id: 'reconversion',
    label: 'En reconversion professionnelle',
    description: 'Tu travailles déjà et tu veux changer de métier ou de secteur.',
  },
] as const

type ProfilId = typeof PROFILS[number]['id']

export default function OrientationPage() {
  // Profil sélectionné — lycéen par défaut
  const [profilActif, setProfilActif] = useState<ProfilId>('lyceen')

  // Sauvegarder le profil dans sessionStorage à chaque changement
  const choisirProfil = (id: ProfilId) => {
    setProfilActif(id)
    try {
      sessionStorage.setItem('atlas-profil', id)
    } catch { /* ignore si sessionStorage indisponible */ }
  }

  // Lire le profil sauvegardé au montage (si l'utilisateur revient)
  useEffect(() => {
    try {
      const sauvegarde = sessionStorage.getItem('atlas-profil') as ProfilId | null
      if (sauvegarde && PROFILS.some(p => p.id === sauvegarde)) {
        setProfilActif(sauvegarde)
      }
    } catch { /* ignore */ }
  }, [])

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="font-serif text-4xl text-stone-900 mb-4 text-center">
        Par où commencer ?
      </h1>
      <p className="text-stone-600 text-center mb-12">
        Dis-nous d&apos;abord qui tu es — Atlas-IA s&apos;adapte à ta situation.
      </p>

      {/* Section A — Sélecteur de profil */}
      <div className="mb-10">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-4 text-center">
          Mon profil
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {PROFILS.map(profil => {
            const estActif = profilActif === profil.id
            return (
              <button
                key={profil.id}
                onClick={() => choisirProfil(profil.id)}
                className={`text-left rounded-xl border-2 p-5 transition-all cursor-pointer ${
                  estActif
                    ? 'border-emerald-400 bg-emerald-50 shadow-sm'
                    : 'border-stone-200 bg-white hover:border-emerald-200'
                }`}
              >
                <p className={`font-serif text-lg mb-1 ${estActif ? 'text-emerald-800' : 'text-stone-900'}`}>
                  {profil.label}
                </p>
                <p className={`text-sm ${estActif ? 'text-emerald-700' : 'text-stone-500'}`}>
                  {profil.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Section B — Actions selon le profil */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-4 text-center">
          Par où commencer
        </h2>

        {/* Profil lycéen — 3 cartes comme avant */}
        {profilActif === 'lyceen' && (
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-stone-200 bg-white hover:border-emerald-300 transition-colors">
              <CardContent className="pt-8 pb-6 flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-2xl">
                  🎯
                </div>
                <div>
                  <h3 className="font-serif text-2xl text-stone-900 mb-2">Quiz RIASEC</h3>
                  <p className="text-stone-600 text-sm mb-4">
                    30 questions · 8 min · Profil complet avec métiers adaptés
                  </p>
                </div>
                <Button className="bg-stone-900 hover:bg-stone-700 text-white w-full" asChild>
                  <Link href="/orientation/quiz">Commencer le quiz</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-stone-200 bg-white hover:border-emerald-300 transition-colors">
              <CardContent className="pt-8 pb-6 flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-2xl">
                  💡
                </div>
                <div>
                  <h3 className="font-serif text-2xl text-stone-900 mb-2">Quiz Valeurs</h3>
                  <p className="text-stone-600 text-sm mb-4">
                    15 questions pour identifier ce qui compte vraiment dans un métier pour toi — liberté, aide, créativité, salaire...
                  </p>
                </div>
                <Button className="bg-stone-900 hover:bg-stone-700 text-white w-full" asChild>
                  <Link href="/orientation/valeurs">Découvrir mes valeurs →</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-stone-200 bg-white hover:border-emerald-300 transition-colors">
              <CardContent className="pt-8 pb-6 flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-2xl">
                  💬
                </div>
                <div>
                  <h3 className="font-serif text-2xl text-stone-900 mb-2">Chat libre</h3>
                  <p className="text-stone-600 text-sm mb-4">
                    Pose tes questions · Réponses instantanées · Sources officielles
                  </p>
                </div>
                <Button variant="outline" className="border-stone-300 w-full" asChild>
                  <Link href="/orientation/chat">Ouvrir le chat</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Profil étudiant ou reconversion — une seule carte vers le chat */}
        {(profilActif === 'etudiant' || profilActif === 'reconversion') && (
          <div className="flex justify-center">
            <Card className="border-emerald-200 bg-white hover:border-emerald-400 transition-colors max-w-md w-full">
              <CardContent className="pt-8 pb-6 flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-2xl">
                  💬
                </div>
                <div>
                  <h3 className="font-serif text-2xl text-stone-900 mb-2">Parler à Atlas-IA</h3>
                  <p className="text-stone-600 text-sm mb-4">
                    {profilActif === 'etudiant'
                      ? "L'IA va t'aider à comprendre ce qui ne va pas dans tes études et explorer des pistes de réorientation."
                      : "L'IA va analyser ta situation professionnelle et te proposer des voies de reconversion réalistes."}
                  </p>
                </div>
                <Button className="bg-stone-900 hover:bg-stone-700 text-white w-full" asChild>
                  <Link href="/orientation/chat">Commencer la conversation →</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
