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

        <h2 className="font-serif text-2xl text-stone-900 mt-8">Vie privée</h2>
        <p>
          Atlas-IA ne collecte aucune donnée personnelle. Tes conversations ne sont pas
          enregistrées ni transmises à des tiers. Aucune inscription requise.
        </p>

        <h2 className="font-serif text-2xl text-stone-900 mt-8">Intelligence artificielle</h2>
        <p>
          L&apos;IA est alimentée par Llama 3.1, un modèle de langage open source.
          Les réponses sont basées sur des données officielles mais peuvent contenir
          des imprécisions — consulte toujours un conseiller d&apos;orientation pour les décisions importantes.
        </p>
      </div>
    </div>
  )
}
