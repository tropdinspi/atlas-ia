export function Footer() {
  return (
    <footer className="border-t border-stone-200 py-8 mt-auto">
      <div className="max-w-5xl mx-auto px-4 text-center text-sm text-stone-500">
        <p>Cursus — Données issues de l&apos;ONISEP et France Travail (ROME)</p>
        <p className="mt-1">
          Phase 1 · Conversations anonymisées pour l&apos;entraînement du modèle ·{' '}
          <a href="/a-propos" className="underline underline-offset-2 hover:text-stone-700">En savoir plus</a>
        </p>
      </div>
    </footer>
  )
}
