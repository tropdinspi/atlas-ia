'use client'
import { useState, useRef, useEffect } from 'react'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import type { Message, QuizResult, ValeursResult } from '@/lib/types'
import type { ProfilType } from '@/lib/system-prompt'
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

// Construit le message de bienvenue selon le profil et le type d'utilisateur
function construireBienvenue(riasec: QuizResult | null, valeurs: ValeursResult | null, profilType: ProfilType): string {
  // Si l'utilisateur a fait un quiz, on utilise le message personnalisé peu importe le profilType
  if (riasec || valeurs) {
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

  // Pas de quiz — message adapté au type d'utilisateur
  if (profilType === 'etudiant') {
    return "Bonjour ! Je suis Atlas-IA. Je vais t'aider à y voir plus clair sur ton orientation. Pour commencer — dans quoi tu études en ce moment ?"
  }

  if (profilType === 'reconversion') {
    return "Bonjour ! Je suis Atlas-IA. Je vais t'aider à explorer ta reconversion. Pour mieux te conseiller — quel est ton métier actuel ?"
  }

  // lyceen par défaut
  return "Bonjour ! Je suis Atlas-IA, ton conseiller d'orientation. Pose-moi toutes tes questions sur les métiers, les études ou l'orientation professionnelle. Je suis là pour t'aider !"
}

// Libellé du type de profil affiché dans le bandeau
function libelleProfil(profilType: ProfilType): string | null {
  if (profilType === 'etudiant') return 'Étudiant en réorientation'
  if (profilType === 'reconversion') return 'Reconversion pro'
  return null // lyceen : rien à afficher
}

export function ChatInterface() {
  const [profilRiasec, setProfilRiasec] = useState<QuizResult | null>(null)
  const [profilValeurs, setProfilValeurs] = useState<ValeursResult | null>(null)
  const [profilType, setProfilType] = useState<ProfilType>('lyceen')
  const [messages, setMessages] = useState<Message[]>([])
  const [chargement, setChargement] = useState(false)
  const basRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Lecture du profil RIASEC/Valeurs depuis sessionStorage
    let riasec: QuizResult | null = null
    let valeurs: ValeursResult | null = null
    let profil: ProfilType = 'lyceen'

    try {
      const d = sessionStorage.getItem('atlas-quiz-resultat')
      if (d) riasec = JSON.parse(d)
    } catch { /* ignore */ }

    try {
      const d = sessionStorage.getItem('atlas-valeurs-resultat')
      if (d) valeurs = JSON.parse(d)
    } catch { /* ignore */ }

    try {
      const d = sessionStorage.getItem('atlas-profil') as ProfilType | null
      if (d && ['lyceen', 'etudiant', 'reconversion'].includes(d)) profil = d
    } catch { /* ignore */ }

    setProfilRiasec(riasec)
    setProfilValeurs(valeurs)
    setProfilType(profil)

    // Message de bienvenue adapté au profil et au type d'utilisateur
    setMessages([{
      role: 'assistant',
      content: construireBienvenue(riasec, valeurs, profil),
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

    // Résumé du profil à envoyer au serveur
    const profilUtilisateur = construireResumeProfilPourIA(profilRiasec, profilValeurs) || undefined

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nouveauxMessages.slice(1),
          dernierMessage: contenu,
          profilUtilisateur,
          profilType, // transmis à l'API pour adapter le comportement de l'IA
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
  const libelleType = libelleProfil(profilType)

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Bandeau profil chargé — affiché si quiz présent ou si profil non-lycéen */}
      {(aUnProfil || libelleType) && (
        <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 text-xs text-emerald-700 flex items-center gap-2 flex-wrap">
          <span className="font-medium">Profil chargé ·</span>
          {/* Type d'utilisateur (étudiant ou reconversion) */}
          {libelleType && (
            <span className="font-medium text-emerald-800">{libelleType}</span>
          )}
          {/* Résultats quiz RIASEC */}
          {aUnProfil && libelleType && <span>—</span>}
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
