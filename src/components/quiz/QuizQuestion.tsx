const OPTIONS = [
  { valeur: 1, label: 'Pas du tout' },
  { valeur: 2, label: 'Un peu' },
  { valeur: 3, label: 'Moyennement' },
  { valeur: 4, label: 'Beaucoup' },
  { valeur: 5, label: 'Tout à fait' },
]

interface QuizQuestionProps {
  texte: string
  onReponse: (valeur: number) => void
  disabled: boolean
}

export function QuizQuestion({ texte, onReponse, disabled }: QuizQuestionProps) {
  return (
    <div>
      <p className="font-serif text-2xl text-stone-900 mb-8 leading-snug">{texte}</p>
      <div className="grid grid-cols-5 gap-2">
        {OPTIONS.map(opt => (
          <button
            key={opt.valeur}
            onClick={() => onReponse(opt.valeur)}
            disabled={disabled}
            className="flex flex-col items-center gap-2 p-3 rounded-xl border border-stone-200 hover:border-emerald-400 hover:bg-emerald-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <span className="text-2xl font-semibold text-stone-700">{opt.valeur}</span>
            <span className="text-xs text-stone-500 text-center leading-tight">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
