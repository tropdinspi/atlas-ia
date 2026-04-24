import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function OrientationPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="font-serif text-4xl text-stone-900 mb-4 text-center">
        Par où commencer ?
      </h1>
      <p className="text-stone-600 text-center mb-12">
        Trois façons de trouver ta voie avec Atlas-IA.
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-stone-200 bg-white hover:border-emerald-300 transition-colors">
          <CardContent className="pt-8 pb-6 flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-2xl">
              🎯
            </div>
            <div>
              <h2 className="font-serif text-2xl text-stone-900 mb-2">Quiz RIASEC</h2>
              <p className="text-stone-600 text-sm mb-4">
                30 questions · 8 min · Profil complet avec métiers adaptés
              </p>
            </div>
            <Button className="bg-stone-900 hover:bg-stone-700 text-white w-full" asChild>
              <Link href="/orientation/quiz">Commencer le quiz</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-stone-200 bg-white hover:border-emerald-300 transition-colors">
          <CardContent className="pt-8 pb-6 flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-2xl">
              💡
            </div>
            <div>
              <h2 className="font-serif text-2xl text-stone-900 mb-2">Quiz Valeurs</h2>
              <p className="text-stone-600 text-sm mb-4">
                15 questions pour identifier ce qui compte vraiment dans un métier pour toi — liberté, aide, créativité, salaire...
              </p>
            </div>
            <Button className="bg-stone-900 hover:bg-stone-700 text-white w-full" asChild>
              <Link href="/orientation/valeurs">Découvrir mes valeurs →</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-stone-200 bg-white hover:border-emerald-300 transition-colors">
          <CardContent className="pt-8 pb-6 flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-2xl">
              💬
            </div>
            <div>
              <h2 className="font-serif text-2xl text-stone-900 mb-2">Chat libre</h2>
              <p className="text-stone-600 text-sm mb-4">
                Pose tes questions · Réponses instantanées · Sources officielles
              </p>
            </div>
            <Button variant="outline" className="border-stone-300 w-full" asChild>
              <Link href="/orientation/chat">Ouvrir le chat</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
