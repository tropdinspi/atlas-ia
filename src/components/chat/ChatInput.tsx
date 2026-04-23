'use client'
import { useState, type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ChatInputProps {
  onEnvoi: (message: string) => void
  disabled: boolean
}

export function ChatInput({ onEnvoi, disabled }: ChatInputProps) {
  const [valeur, setValeur] = useState('')

  const envoyer = () => {
    const msg = valeur.trim()
    if (!msg || disabled) return
    onEnvoi(msg)
    setValeur('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      envoyer()
    }
  }

  return (
    <div className="flex gap-2 p-4 border-t border-stone-200 bg-white">
      <Input
        value={valeur}
        onChange={e => setValeur(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Pose ta question sur les métiers, les études..."
        disabled={disabled}
        className="flex-1 border-stone-200"
      />
      <Button
        onClick={envoyer}
        disabled={disabled || !valeur.trim()}
        className="bg-stone-900 hover:bg-stone-700 text-white"
      >
        Envoyer
      </Button>
    </div>
  )
}
