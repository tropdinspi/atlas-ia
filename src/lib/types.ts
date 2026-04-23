export type RiasecType = 'R' | 'I' | 'A' | 'S' | 'E' | 'C'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface Metier {
  id: string
  nom: string
  description: string
  riasec: RiasecType[]
  etudes: {
    diplome: string
    duree: string
    acces: string
    bacs_conseilles: string[]
  }
  marche: {
    salaire_debutant: string
    salaire_experimente: string
    debouches: string[]
    tendance: string
  }
  lien_onisep: string
}

export interface QuizQuestion {
  id: number
  texte: string
  type: RiasecType
}

export interface RiasecScores {
  R: number
  I: number
  A: number
  S: number
  E: number
  C: number
}

export interface QuizResult {
  scores: RiasecScores
  profil: RiasecType[]
  metiers: Metier[]
}

export interface RiasecDescription {
  type: RiasecType
  label: string
  description: string
  mots_cles: string[]
}
