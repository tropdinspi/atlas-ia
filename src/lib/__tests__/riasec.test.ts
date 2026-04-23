import { calculerScores, determinerProfil, suggererMetiers, traiterQuiz } from '../riasec'

describe('calculerScores', () => {
  it('retourne des scores à zéro si aucune réponse', () => {
    expect(calculerScores({})).toEqual({ R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 })
  })

  it('accumule correctement les scores par type RIASEC', () => {
    // Questions 1-5 sont de type R dans quiz-questions.json
    const reponses: Record<number, number> = { 1: 5, 2: 4, 3: 3, 4: 2, 5: 1 }
    const scores = calculerScores(reponses)
    expect(scores.R).toBe(15)
    expect(scores.I).toBe(0)
  })

  it('ignore les questions non répondues', () => {
    const reponses: Record<number, number> = { 1: 5 }
    const scores = calculerScores(reponses)
    expect(scores.R).toBe(5)
  })
})

describe('determinerProfil', () => {
  it('retourne les 3 types avec les scores les plus élevés dans le bon ordre', () => {
    const scores = { R: 20, I: 15, A: 25, S: 10, E: 18, C: 5 }
    expect(determinerProfil(scores)).toEqual(['A', 'R', 'E'])
  })

  it('retourne exactement 3 types', () => {
    const scores = { R: 5, I: 10, A: 15, S: 20, E: 25, C: 3 }
    expect(determinerProfil(scores)).toHaveLength(3)
  })
})

describe('suggererMetiers', () => {
  it('retourne au maximum 10 métiers', () => {
    const metiers = suggererMetiers(['S', 'I', 'A'])
    expect(metiers.length).toBeLessThanOrEqual(10)
  })

  it('retourne uniquement des métiers correspondant au profil principal', () => {
    const metiers = suggererMetiers(['S', 'I', 'A'])
    expect(metiers.every(m => m.riasec.includes('S') || m.riasec.includes('I'))).toBe(true)
  })

  it('trie les métiers par pertinence (plus de types en commun = priorité)', () => {
    const metiers = suggererMetiers(['S', 'I', 'A'])
    if (metiers.length >= 2) {
      const score0 = metiers[0].riasec.filter(t => ['S', 'I', 'A'].includes(t)).length
      const scoreLast = metiers[metiers.length - 1].riasec.filter(t => ['S', 'I', 'A'].includes(t)).length
      expect(score0).toBeGreaterThanOrEqual(scoreLast)
    }
  })
})

describe('traiterQuiz', () => {
  it('retourne un résultat complet avec scores, profil et métiers', () => {
    const reponses: Record<number, number> = {}
    for (let i = 16; i <= 20; i++) reponses[i] = 5
    const result = traiterQuiz(reponses)
    expect(result).toHaveProperty('scores')
    expect(result).toHaveProperty('profil')
    expect(result).toHaveProperty('metiers')
    expect(result.profil[0]).toBe('S')
  })
})
