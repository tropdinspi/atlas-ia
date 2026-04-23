import { ChatInterface } from '@/components/chat/ChatInterface'

export const metadata = {
  title: 'Chat orientation — Atlas-IA',
}

export default function ChatPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 pt-6">
      <h1 className="font-serif text-2xl text-stone-900 mb-1">Chat orientation</h1>
      <p className="text-stone-500 text-sm mb-4">
        Pose toutes tes questions sur les métiers et les études
      </p>
      <ChatInterface />
    </div>
  )
}
