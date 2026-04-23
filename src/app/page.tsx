import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <section className="text-center mb-20">
        <p className="text-sm font-medium text-emerald-700 uppercase tracking-widest mb-4">
          Orientation professionnelle
        </p>
        <h1 className="font-serif text-5xl md:text-6xl text-stone-900 leading-tight mb-6">
          Trouve ta voie<br />avec l&apos;intelligence artificielle
        </h1>
        <p className="text-lg text-stone-600 max-w-xl mx-auto mb-8">
          Atlas-IA t&apos;aide à découvrir les métiers qui correspondent vraiment à ta personnalité.
          Quiz RIASEC et chat personnalisé — entièrement gratuit.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" className="bg-stone-900 hover:bg-stone-700 text-white" asChild>
            <Link href="/orientation/quiz">Faire le quiz RIASEC</Link>
          </Button>
          <Button size="lg" variant="outline" className="border-stone-300" asChild>
            <Link href="/orientation/chat">Poser une question</Link>
          </Button>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6 mb-20">
        {[
          {
            titre: 'Quiz RIASEC',
            texte: '30 questions pour identifier ta personnalité professionnelle et découvrir les métiers qui te correspondent.',
          },
          {
            titre: 'Chat libre',
            texte: "Pose toutes tes questions sur les études, les salaires, les débouchés. L'IA répond 24h/24.",
          },
          {
            titre: 'Données officielles',
            texte: "Toutes les informations viennent de l'ONISEP et de France Travail. Fiables et à jour.",
          },
        ].map((item) => (
          <Card key={item.titre} className="border-stone-200 bg-white">
            <CardContent className="pt-6">
              <h3 className="font-serif text-xl text-stone-900 mb-2">{item.titre}</h3>
              <p className="text-stone-600 text-sm leading-relaxed">{item.texte}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="text-center">
        <p className="text-stone-500 text-sm">
          Aucune inscription requise · Aucune donnée personnelle collectée
        </p>
      </section>
    </div>
  )
}
