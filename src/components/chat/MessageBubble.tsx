import { cn } from '@/lib/utils'
import type { Message } from '@/lib/types'

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
        isUser
          ? 'bg-stone-900 text-white rounded-br-sm'
          : 'bg-white border border-stone-200 text-stone-800 rounded-bl-sm'
      )}>
        {message.content}
      </div>
    </div>
  )
}
