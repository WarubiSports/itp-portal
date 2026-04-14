'use client'

interface WellnessLog {
  id: string
  date: string
  sleep_hours: number
  sleep_quality: number
  energy_level: number
  muscle_soreness: number
  stress_level: number
  mood: string
  notes: string | null
}

const calcScore = (log: WellnessLog): number =>
  (log.sleep_quality / 5) * 25 +
  (log.energy_level / 10) * 25 +
  ((10 - log.muscle_soreness) / 10) * 25 +
  ((10 - log.stress_level) / 10) * 25

const getScoreInfo = (score: number) => {
  if (score >= 75) return { label: 'Ready', color: 'bg-green-500', textColor: 'text-green-400', bgColor: 'bg-green-500/10 border-green-500/20' }
  if (score >= 50) return { label: 'Moderate', color: 'bg-yellow-500', textColor: 'text-yellow-400', bgColor: 'bg-yellow-500/10 border-yellow-500/20' }
  return { label: 'Fatigued', color: 'bg-red-500', textColor: 'text-red-400', bgColor: 'bg-red-500/10 border-red-500/20' }
}

const formatDate = (dateStr: string): string => {
  const today = new Date().toISOString().split('T')[0]
  if (dateStr === today) return 'Today'

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday'

  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

const moodEmoji: Record<string, string> = {
  excellent: '🔥',
  good: '😊',
  okay: '😐',
  tired: '😴',
  poor: '😞',
}

export const WellnessHistory = ({ logs }: { logs: WellnessLog[] }) => {
  if (logs.length === 0) {
    return (
      <div className="text-center text-[var(--color-text-muted)] text-sm py-6">
        No wellness logs yet. Complete your first check-in above.
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-bold font-[family-name:var(--font-outfit)] text-[var(--color-text)] mb-3">Recent Check-Ins</h2>
      <div className="space-y-2">
        {logs.map((log) => {
          const score = Math.round(calcScore(log))
          const info = getScoreInfo(score)

          return (
            <div
              key={log.id}
              className={`rounded-xl p-3 border ${info.bgColor}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                  {formatDate(log.date)}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${info.textColor}`}>
                    {info.label}
                  </span>
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-bold ${info.color}`}
                  >
                    {score}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                <span>{log.sleep_hours}h sleep</span>
                <span>{'★'.repeat(log.sleep_quality)}{'☆'.repeat(5 - log.sleep_quality)}</span>
                <span>Energy {log.energy_level}</span>
                <span>{moodEmoji[log.mood] || ''}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
