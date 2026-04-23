'use client'
import { useState, useRef, useEffect } from 'react'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import type { Message } from '@/lib/types'

const MESSAGE_BIENVENUE: Message = {
  role: 'assistant',
  content: "Bonjour ! Je suis Atlas-IA, ton conseiller d'orientation. Pose-moi toutes tes questions sur les métiers, les études ou l'orientation professionnelle. Je suis là pour t'aider !"
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([MESSAGE_BIENVENUE])
  const [chargement, setChargement] = useState(false)
  const basRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    basRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const envoyerMessage = async (contenu: string) => {
    const userMsg: Message = { role: 'user', content: contenu }
    const nouveauxMessages = [...messages, userMsg]
    setMessages(nouveauxMessages)
    setChargement(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nouveauxMessages.slice(1),
          dernierMessage: contenu,
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reponse }])
    } catch (_e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Désolé, une erreur s'est produite. Réessaie dans un instant."
      }])
    } finally {
      setChargement(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
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
