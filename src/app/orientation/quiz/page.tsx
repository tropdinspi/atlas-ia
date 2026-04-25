'use client'
import { useQuiz } from './useQuiz'
import { QuizProgress } from '@/components/quiz/QuizProgress'
import { QuizQuestion } from '@/components/quiz/QuizQuestion'

export default function QuizPage() {
  const { question, indexCourant, total, progression, repondre, chargement } = useQuiz()

  if (chargement) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <p className="font-serif text-2xl text-stone-700">Cursus analyse ton profil...</p>
        <p className="text-stone-500 mt-2">Quelques secondes</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <QuizProgress indexCourant={indexCourant} total={total} progression={progression} />
      <QuizQuestion texte={question.texte} onReponse={repondre} disabled={chargement} />
      <p className="text-center text-xs text-stone-400 mt-8">
        Clique sur une valeur de 1 (pas du tout) à 5 (tout à fait)
      </p>
    </div>
  )
}
