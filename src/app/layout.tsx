import type { Metadata } from 'next'
import { Instrument_Serif, Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-serif',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Atlas-IA — Trouve ta voie',
  description: "Conseiller d'orientation IA gratuit pour lycéens et adultes en reconversion. Quiz RIASEC et chat personnalisé.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${instrumentSerif.variable} ${inter.variable} font-sans bg-stone-50 min-h-screen flex flex-col`}>
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
