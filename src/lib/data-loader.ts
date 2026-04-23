import type { Metier } from './types'
import metiersData from '../data/metiers.json'

const metiers = metiersData as Metier[]

export function rechercherMetiers(query: string): Metier[] {
  const q = query.toLowerCase().trim()
  if (!q) return []
  return metiers.filter(m =>
    m.nom.toLowerCase().includes(q) ||
    m.description.toLowerCase().includes(q) ||
    m.etudes.diplome.toLowerCase().includes(q) ||
    m.marche.debouches.some(d => d.toLowerCase().includes(q))
  )
}

export function getMetierById(id: string): Metier | null {
  return metiers.find(m => m.id === id) ?? null
}

export function getContextForQuery(query: string): string {
  const resultats = rechercherMetiers(query)
  if (resultats.length === 0) return ''
  return resultats
    .slice(0, 3)
    .map(m => `
Métier : ${m.nom}
Description : ${m.description}
Études : ${m.etudes.diplome} — ${m.etudes.duree} — Accès : ${m.etudes.acces}
Bacs conseillés : ${m.etudes.bacs_conseilles.join(', ')}
Salaire débutant : ${m.marche.salaire_debutant} / Expérimenté : ${m.marche.salaire_experimente}
Débouchés : ${m.marche.debouches.join(', ')}
Tendance : ${m.marche.tendance}
    `.trim())
    .join('\n\n---\n\n')
}
