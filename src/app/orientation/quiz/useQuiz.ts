'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { traiterQuiz } from '@/lib/riasec'
import questionsData from '@/data/quiz-questions.json'
import type { QuizQuestion } from '@/lib/types'

const QUESTIONS = questionsData as QuizQuestion[]

export function useQuiz() {
  const [indexCourant, setIndexCourant] = useState(0)
  const [reponses, setReponses] = useState<Record<number, number>>({})
  const [chargement, setChargement] = useState(false)
  const router = useRouter()

  const question = QUESTIONS[indexCourant]
  const progression = (indexCourant / QUESTIONS.length) * 100
  const estDerniere = indexCourant === QUESTIONS.length - 1

  const repondre = (valeur: number) => {
    const nouvellesReponses = { ...reponses, [question.id]: valeur }
    setReponses(nouvellesReponses)

    if (estDerniere) {
      setChargement(true)
      const resultat = traiterQuiz(nouvellesReponses)
      sessionStorage.setItem('atlas-quiz-resultat', JSON.stringify(resultat))
      router.push('/orientation/profil')
    } else {
      setIndexCourant(i => i + 1)
    }
  }

  return { question, indexCourant, total: QUESTIONS.length, progression, repondre, chargement }
}
