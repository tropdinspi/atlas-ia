import type { RiasecScores, RiasecType, ValeurType, QuizResult, Metier } from './types'
import questionsData from '../data/quiz-questions.json'
import metiersData from '../data/metiers.json'

// On caste les données JSON vers les types TypeScript définis
const questions = questionsData as Array<{ id: number; texte: string; type: RiasecType }>
const metiers = metiersData as Metier[]

/**
 * Calcule les scores RIASEC à partir des réponses du quiz.
 * Chaque réponse (valeur 1-5) s'additionne au score du type correspondant à la question.
 */
export function calculerScores(reponses: Record<number, number>): RiasecScores {
  const scores: RiasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }
  for (const q of questions) {
    // Si la question n'est pas répondue, on ajoute 0 (pas d'effet)
    scores[q.type] += reponses[q.id] ?? 0
  }
  return scores
}

/**
 * Détermine le profil RIASEC : les 3 types avec les scores les plus élevés,
 * triés du plus fort au plus faible.
 */
export function determinerProfil(scores: RiasecScores): RiasecType[] {
  return (Object.entries(scores) as [RiasecType, number][])
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([type]) => type)
}

/**
 * Suggère jusqu'à 10 métiers correspondant au profil RIASEC.
 * Filtre sur les 2 premiers types du profil, puis trie par nombre de types en commun.
 */
export function suggererMetiers(profil: RiasecType[]): Metier[] {
  const [type1, type2] = profil
  return metiers
    .filter(m => m.riasec.includes(type1) || m.riasec.includes(type2))
    .sort((a, b) => {
      // Plus un métier partage de types avec le profil, plus il remonte
      const scoreA = a.riasec.filter(t => profil.includes(t)).length
      const scoreB = b.riasec.filter(t => profil.includes(t)).length
      return scoreB - scoreA
    })
    .slice(0, 10)
}

/**
 * Fonction principale : traite toutes les réponses du quiz et retourne
 * un résultat complet (scores, profil, métiers suggérés).
 */
export function traiterQuiz(reponses: Record<number, number>): QuizResult {
  const scores = calculerScores(reponses)
  const profil = determinerProfil(scores)
  return { scores, profil, metiers: suggererMetiers(profil) }
}

/**
 * Suggère jusqu'à 10 métiers en combinant profil RIASEC et valeurs professionnelles.
 * Score = (types RIASEC en commun × 2) + (valeurs en commun × 1)
 * Filtre d'abord sur au moins un type RIASEC en commun.
 */
export function suggererMetiersCombines(
  profilRiasec: RiasecType[],
  profilValeurs: ValeurType[]
): Metier[] {
  const [type1, type2] = profilRiasec
  return metiers
    .filter(m => m.riasec.includes(type1) || m.riasec.includes(type2))
    .map(m => ({
      metier: m,
      score:
        m.riasec.filter(t => profilRiasec.includes(t)).length * 2 +
        m.valeurs.filter(v => profilValeurs.includes(v)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ metier }) => metier)
}
