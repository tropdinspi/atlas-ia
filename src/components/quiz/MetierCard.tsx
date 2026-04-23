import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Metier } from '@/lib/types'

export function MetierCard({ metier }: { metier: Metier }) {
  return (
    <Card className="border-stone-200 bg-white hover:border-emerald-300 transition-colors">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-serif text-lg text-stone-900 leading-tight">{metier.nom}</h3>
          <div className="flex gap-1 flex-shrink-0">
            {metier.riasec.map(t => (
              <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
            ))}
          </div>
        </div>
        <p className="text-stone-600 text-sm mb-3 leading-relaxed">{metier.description}</p>
        <div className="space-y-1 text-xs text-stone-500">
          <p>📚 {metier.etudes.diplome} — {metier.etudes.duree}</p>
          <p>💶 Débutant : {metier.marche.salaire_debutant}</p>
          <p>📈 {metier.marche.tendance}</p>
        </div>
        <a
          href={metier.lien_onisep}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Fiche ONISEP complète pour ${metier.nom} (ouvre un nouvel onglet)`}
          className="inline-block mt-3 text-xs text-emerald-700 hover:underline"
        >
          Fiche ONISEP complète →
        </a>
      </CardContent>
    </Card>
  )
}
