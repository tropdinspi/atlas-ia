import { Progress } from '@/components/ui/progress'

interface QuizProgressProps {
  indexCourant: number
  total: number
  progression: number
}

export function QuizProgress({ indexCourant, total, progression }: QuizProgressProps) {
  return (
    <div className="mb-8">
      <div className="flex justify-between text-sm text-stone-500 mb-2">
        <span>Question {indexCourant + 1} sur {total}</span>
        <span>{Math.round(progression)}%</span>
      </div>
      <Progress value={progression} className="h-2" />
    </div>
  )
}
