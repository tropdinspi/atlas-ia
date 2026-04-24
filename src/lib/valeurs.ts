import type { ValeurType, ValeurScores, ValeursResult } from './types'
import questionsData from '../data/valeurs-questions.json'

// On caste les données JSON vers les types TypeScript définis
const questions = questionsData as Array<{ id: number; texte: string; type: ValeurType }>

/**
 * Calcule les scores de valeurs à partir des réponses du quiz.
 * Chaque réponse (valeur 1-5) s'additionne au score de la dimension correspondante.
 */
export function calculerScoresValeurs(reponses: Record<number, number>): ValeurScores {
  const scores: ValeurScores = {
    autonomie: 0,
    aide: 0,
    creativite: 0,
    stabilite: 0,
    ambition: 0,
    remuneration: 0,
    intellect: 0,
    collectif: 0,
  }
  for (const q of questions) {
    // Si la question n'est pas répondue, on ajoute 0 (pas d'effet)
    scores[q.type] += reponses[q.id] ?? 0
  }
  return scores
}

/**
 * Détermine le profil de valeurs : les 3 dimensions avec les scores les plus élevés,
 * triées du plus fort au plus faible.
 */
export function determinerProfilValeurs(scores: ValeurScores): ValeurType[] {
  return (Object.entries(scores) as [ValeurType, number][])
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([type]) => type)
}

/**
 * Fonction principale : traite toutes les réponses du quiz Valeurs et retourne
 * un résultat complet (scores et profil des 3 valeurs dominantes).
 */
export function traiterValeursQuiz(reponses: Record<number, number>): ValeursResult {
  const scores = calculerScoresValeurs(reponses)
  const profil = determinerProfilValeurs(scores)
  return { scores, profil }
}
