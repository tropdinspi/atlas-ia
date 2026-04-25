'use client'
import { useState, useRef, useEffect } from 'react'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import type { Message, QuizResult, ValeursResult } from '@/lib/types'
import riasecDescriptionsData from '@/data/riasec-descriptions.json'
import valeursDescriptionsData from '@/data/valeurs-descriptions.json'

// Construit un résumé texte du profil à envoyer au système
function construireResumeProfilPourIA(riasec: QuizResult | null, valeurs: ValeursResult | null): string {
  const lignes: string[] = []

  if (riasec) {
    const labels = riasec.profil.map(type => {
      const desc = (riasecDescriptionsData as Array<{ type: string; label: string }>).find(d => d.type === type)
      return desc ? `${desc.label} (${type})` : type
    })
    lignes.push(`- Types RIASEC dominants : ${labels.join(', ')}`)
  }

  if (valeurs) {
    const labels = valeurs.profil.map(type => {
      const desc = (valeursDescriptionsData as Array<{ type: string; label: string }>).find(d => d.type === type)
      return desc ? desc.label : type
    })
    lignes.push(`- Valeurs professionnelles prioritaires : ${labels.join(', ')}`)
  }

  return lignes.join('\n')
}

// Construit le message de bienvenue selon le profil disponible
function construireBienvenue(riasec: QuizResult | null, valeurs: ValeursResult | null): string {
  if (!riasec && !valeurs) {
    return "Bonjour ! Je suis Atlas-IA, ton conseiller d'orientation. Pose-moi toutes tes questions sur les métiers, les études ou l'orientation professionnelle. Je suis là pour t'aider !"
  }

  const parties: string[] = []

  if (riasec) {
    const labels = riasec.profil.slice(0, 2).map(type => {
      const desc = (riasecDescriptionsData as Array<{ type: string; label: string }>).find(d => d.type === type)
      return desc?.label ?? type
    })
    parties.push(`profil RIASEC ${labels.join(' · ')}`)
  }

  if (valeurs) {
    const labels = valeurs.profil.slice(0, 2).map(type => {
      const desc = (valeursDescriptionsData as Array<{ type: string; label: string }>).find(d => d.type === type)
      return desc?.label ?? type
    })
    parties.push(`valeurs ${labels.join(' · ')}`)
  }

  return `Bonjour ! J'ai bien reçu ton ${parties.join(' et ton ')}. Pose-moi tes questions sur les métiers ou les études — je vais te répondre en tenant compte de ton profil !`
}

export function ChatInterface() {
  const [profilRiasec, setProfilRiasec] = useState<QuizResult | null>(null)
  const [profilValeurs, setProfilValeurs] = useState<ValeursResult | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [chargement, setChargement] = useState(false)
  const basRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Lecture du profil depuis sessionStorage
    let riasec: QuizResult | null = null
    let valeurs: ValeursResult | null = null

    try {
      const d = sessionStorage.getItem('atlas-quiz-resultat')
      if (d) riasec = JSON.parse(d)
    } catch { /* ignore */ }

    try {
      const d = sessionStorage.getItem('atlas-valeurs-resultat')
      if (d) valeurs = JSON.parse(d)
    } catch { /* ignore */ }

    setProfilRiasec(riasec)
    setProfilValeurs(valeurs)

    // Message de bienvenue personnalisé
    setMessages([{
      role: 'assistant',
      content: construireBienvenue(riasec, valeurs),
    }])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    basRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const envoyerMessage = async (contenu: string) => {
    const userMsg: Message = { role: 'user', content: contenu }
    const nouveauxMessages = [...messages, userMsg]
    setMessages(nouveauxMessages)
    setChargement(true)

    // Résumé du profil à envoyer au serveur (recalculé à chaque message pour être à jour)
    const profilUtilisateur = construireResumeProfilPourIA(profilRiasec, profilValeurs) || undefined

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nouveauxMessages.slice(1),
          dernierMessage: contenu,
          profilUtilisateur,
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reponse }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Désolé, une erreur s'est produite. Réessaie dans un instant."
      }])
    } finally {
      setChargement(false)
    }
  }

  const aUnProfil = profilRiasec !== null || profilValeurs !== null

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Bandeau profil chargé */}
      {aUnProfil && (
        <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 text-xs text-emerald-700 flex items-center gap-2">
          <span className="font-medium">Profil chargé ·</span>
          {profilRiasec && (
            <span>RIASEC : {profilRiasec.profil.join(' · ')}</span>
          )}
          {profilRiasec && profilValeurs && <span>—</span>}
          {profilValeurs && (
            <span>Valeurs : {profilValeurs.profil.slice(0, 2).map(v => {
              const desc = (valeursDescriptionsData as Array<{ type: string; label: string }>).find(d => d.type === v)
              return desc?.label ?? v
            }).join(' · ')}</span>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {chargement && (
          <div className="flex justify-start">
            <div className="bg-white border border-stone-200 rounded-2xl rounded-bl-sm px-4 py-3">
              <span className="text-stone-400 text-sm">Atlas-IA réfléchit...</span>
            </div>
          </div>
        )}
        <div ref={basRef} />
      </div>
      <ChatInput onEnvoi={envoyerMessage} disabled={chargement} />
    </div>
  )
}
