'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

interface WellnessLog {
  sleep_hours: number
  sleep_quality: number
  energy_level: number
  muscle_soreness: number
  stress_level: number
  mood: string
  notes: string | null
}

export const WellnessForm = ({
  playerId,
  existingLog,
  isPrefillFromYesterday = false,
}: {
  playerId: string
  existingLog?: WellnessLog
  /** True when form values came from yesterday's log (not today) — shows a hint. */
  isPrefillFromYesterday?: boolean
}) => {
  const [sleepHours, setSleepHours] = useState(existingLog?.sleep_hours ?? 8)
  const [sleepQuality, setSleepQuality] = useState(existingLog?.sleep_quality ?? 3)
  const [energy, setEnergy] = useState(existingLog?.energy_level ?? 5)
  const [soreness, setSoreness] = useState(existingLog?.muscle_soreness ?? 5)
  const [stress, setStress] = useState(existingLog?.stress_level ?? 5)
  const [mood, setMood] = useState(existingLog?.mood ?? 'good')
  const [notes, setNotes] = useState(existingLog?.notes ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    setSuccess(false)

    const today = new Date().toISOString().split('T')[0]

    const res = await fetch('/api/wellness', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: playerId,
        date: today,
        sleep_hours: sleepHours,
        sleep_quality: sleepQuality,
        energy_level: energy,
        muscle_soreness: soreness,
        stress_level: stress,
        mood,
        notes: notes || null,
      }),
    })

    setSubmitting(false)
    if (res.ok) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  const moodOptions = [
    { value: 'excellent', label: 'Excellent', emoji: '🔥' },
    { value: 'good', label: 'Good', emoji: '😊' },
    { value: 'okay', label: 'Okay', emoji: '😐' },
    { value: 'tired', label: 'Tired', emoji: '😴' },
    { value: 'poor', label: 'Poor', emoji: '😞' },
  ]

  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
      <h2 className="text-lg font-bold font-[family-name:var(--font-outfit)] text-[var(--color-text)] mb-2">
        {existingLog && !isPrefillFromYesterday ? 'Update Today\'s Check-In' : 'Daily Check-In'}
      </h2>
      {isPrefillFromYesterday && (
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          Yesterday&apos;s values pre-filled. Adjust as needed for today.
        </p>
      )}

      <div className="space-y-5">
        {/* Sleep Hours */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            Sleep Hours
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={12}
              step={0.5}
              value={sleepHours}
              onChange={(e) => setSleepHours(parseFloat(e.target.value))}
              className="flex-1 h-2 accent-[var(--color-brand)]"
            />
            <span className="text-sm font-semibold text-[var(--color-text)] w-10 text-right">{sleepHours}h</span>
          </div>
        </div>

        {/* Sleep Quality - Stars */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            Sleep Quality
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setSleepQuality(star)}
                className="p-2 -m-1 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <Star
                  size={28}
                  fill={star <= sleepQuality ? '#ED1C24' : 'none'}
                  stroke={star <= sleepQuality ? '#ED1C24' : '#64748B'}
                  strokeWidth={1.5}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Energy Level */}
        <SliderField
          label="Energy Level"
          value={energy}
          onChange={setEnergy}
          lowLabel="Low"
          highLabel="High"
        />

        {/* Muscle Soreness */}
        <SliderField
          label="Muscle Soreness"
          value={soreness}
          onChange={setSoreness}
          lowLabel="None"
          highLabel="Very sore"
        />

        {/* Stress Level */}
        <SliderField
          label="Stress Level"
          value={stress}
          onChange={setStress}
          lowLabel="Relaxed"
          highLabel="Very stressed"
        />

        {/* Mood */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            Mood
          </label>
          <div className="grid grid-cols-5 gap-1">
            {moodOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMood(opt.value)}
                className={`flex flex-col items-center py-2 px-1 rounded-lg text-xs transition-all touch-manipulation min-h-[44px] justify-center ${
                  mood === opt.value
                    ? 'bg-[var(--color-brand-glow)] border-2 border-[var(--color-brand)] font-semibold text-[var(--color-text)]'
                    : 'bg-[var(--color-surface-elevated)] border-2 border-transparent text-[var(--color-text-secondary)]'
                }`}
              >
                <span className="text-lg mb-0.5">{opt.emoji}</span>
                <span className="truncate">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
            Notes <span className="text-[var(--color-text-muted)] font-normal">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything to flag? Injury, illness, personal..."
            rows={2}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent resize-none"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 rounded-xl font-semibold text-white bg-[var(--color-brand)] active:bg-[var(--color-brand-dark)] disabled:opacity-50 transition-all touch-manipulation hover:shadow-[0_0_20px_var(--color-brand-glow)]"
        >
          {submitting
            ? 'Saving...'
            : existingLog && !isPrefillFromYesterday
              ? 'Update Check-In'
              : 'Submit Check-In'}
        </button>

        {success && (
          <p className="text-center text-sm text-green-400 font-medium">
            Saved successfully!
          </p>
        )}
      </div>
    </div>
  )
}

const SliderField = ({
  label,
  value,
  onChange,
  lowLabel,
  highLabel,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  lowLabel: string
  highLabel: string
}) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <label className="text-sm font-medium text-[var(--color-text-secondary)]">{label}</label>
      <span className="text-sm font-semibold text-[var(--color-brand)]">{value}/10</span>
    </div>
    <input
      type="range"
      min={1}
      max={10}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full h-2 accent-[var(--color-brand)]"
    />
    <div className="flex justify-between text-xs text-[var(--color-text-muted)] mt-0.5">
      <span>{lowLabel}</span>
      <span>{highLabel}</span>
    </div>
  </div>
)
