import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="border-b border-stone-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl font-semibold text-stone-800">
          Cursus
        </Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/orientation">Commencer</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/a-propos">À propos</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
