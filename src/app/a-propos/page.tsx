export default function AProposPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="font-serif text-4xl text-stone-900 mb-8">À propos d&apos;Atlas-IA</h1>

      <div className="space-y-6 text-stone-700">
        <p>
          Atlas-IA est un conseiller d&apos;orientation gratuit, construit pour aider les lycéens
          et les adultes en reconversion à trouver leur voie professionnelle.
        </p>

        <h2 className="font-serif text-2xl text-stone-900 mt-8">Sources des données</h2>
        <ul className="space-y-2 list-disc list-inside">
          <li><strong>ONISEP</strong> — Fiches métiers et formations officielles françaises</li>
          <li><strong>France Travail (ROME v4)</strong> — Référentiel des métiers, compétences et salaires</li>
          <li><strong>Modèle Holland RIASEC</strong> — Standard mondial de l&apos;orientation professionnelle</li>
        </ul>

        <h2 className="font-serif text-2xl text-stone-900 mt-8">Données et vie privée</h2>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
          <p className="font-medium mb-1">⚠️ Phase de développement — collecte de données active</p>
          <p>
            Les conversations avec Atlas-IA sont actuellement enregistrées de façon anonyme.
            Ces données servent uniquement à entraîner la future version du modèle Atlas-IA,
            qui tournera entièrement sur ton appareil (sans serveur, sans connexion).
          </p>
        </div>
        <ul className="space-y-2 list-disc list-inside mt-3">
          <li>Aucune donnée nominative n&apos;est collectée (pas de nom, pas d&apos;e-mail, pas de compte)</li>
          <li>Les conversations sont anonymisées et ne sont jamais revendues ni partagées</li>
          <li>Aucune inscription requise</li>
          <li>En Phase 2, le modèle fonctionnera entièrement en local — zéro donnée envoyée</li>
        </ul>

        <h2 className="font-serif text-2xl text-stone-900 mt-8">Intelligence artificielle</h2>
        <p>
          <strong>Phase 1 (actuelle) :</strong> L&apos;IA utilise Llama 3.1 via les serveurs de Groq.
          Tes messages transitent par leurs serveurs le temps de générer une réponse.
        </p>
        <p className="mt-2">
          <strong>Phase 2 (en développement) :</strong> Atlas-IA sera entraîné sur les conversations
          collectées ici, puis le modèle final tournera directement dans ton navigateur —
          aucune donnée ne quittera ton appareil.
        </p>
        <p className="mt-2">
          Les réponses sont basées sur des données officielles mais peuvent contenir
          des imprécisions — consulte toujours un conseiller d&apos;orientation pour les décisions importantes.
        </p>
      </div>
    </div>
  )
}
