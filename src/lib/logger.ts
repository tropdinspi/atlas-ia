import { Redis } from '@upstash/redis'

// Logging silencieux — ne bloque jamais la réponse principale
export async function logConversation(question: string, reponse: string): Promise<void> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return

  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })

    const exemple = {
      instruction: question,
      input: '',
      output: reponse,
      ts: new Date().toISOString(),
    }

    await redis.lpush('atlas:conversations', JSON.stringify(exemple))
  } catch {
    // Logging non critique — on ignore silencieusement
  }
}
