export type RiasecType = 'R' | 'I' | 'A' | 'S' | 'E' | 'C'

export type ValeurType =
  | 'autonomie'
  | 'aide'
  | 'creativite'
  | 'stabilite'
  | 'ambition'
  | 'remuneration'
  | 'intellect'
  | 'collectif'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface Metier {
  id: string
  nom: string
  description: string
  riasec: RiasecType[]
  valeurs: ValeurType[]
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

export interface ValeurQuestion {
  id: number
  texte: string
  type: ValeurType
}

export interface ValeurScores {
  autonomie: number
  aide: number
  creativite: number
  stabilite: number
  ambition: number
  remuneration: number
  intellect: number
  collectif: number
}

export interface ValeurDescription {
  type: ValeurType
  label: string
  description: string
  mots_cles: string[]
}

export interface ValeursResult {
  scores: ValeurScores
  profil: ValeurType[]
}
