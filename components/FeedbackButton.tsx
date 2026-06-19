'use client'

import { useState } from 'react'
import { MessageSquarePlus, X, Loader2, Check } from 'lucide-react'

type Status = 'idle' | 'sending' | 'done' | 'error'

// Floating feedback / bug-report button shown on every player surface.
// Posts to /api/bug-report, which writes to the shared bug_reports table
// that the Hermes auto-fix loop watches. Auto-themes via --color-brand.
export function FeedbackButton({ reporterName }: { reporterName?: string }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  const close = () => {
    if (status === 'sending') return
    setOpen(false)
    setTitle('')
    setDescription('')
    setStatus('idle')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setStatus('sending')
    try {
      const res = await fetch('/api/bug-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          page_url: typeof window !== 'undefined' ? window.location.href : null,
          reporter_name: reporterName || null,
        }),
      })
      if (!res.ok) throw new Error('submit failed')
      setStatus('done')
      setTimeout(close, 1500)
    } catch {
      setStatus('error')
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Report a problem or send feedback"
        className="fixed bottom-24 right-4 z-50 flex items-center gap-2 rounded-full bg-[var(--color-brand)] px-4 py-3 text-sm font-medium text-white shadow-lg shadow-black/30 transition-transform active:scale-95 lg:right-[max(1rem,calc(50%-270px+1rem))]"
      >
        <MessageSquarePlus className="h-5 w-5" />
        <span className="hidden sm:inline">Feedback</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[var(--color-text)]">Report a problem</h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {status === 'done' ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <Check className="h-8 w-8 text-[var(--color-brand)]" />
                <p className="text-sm text-[var(--color-text)]">Thanks, we got it.</p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What's wrong, or what would help?"
                  maxLength={200}
                  required
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand)] focus:outline-none"
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Any details? (optional)"
                  rows={3}
                  maxLength={4000}
                  className="w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand)] focus:outline-none"
                />
                {status === 'error' && (
                  <p className="text-xs text-red-400">Could not send. Please try again.</p>
                )}
                <button
                  type="submit"
                  disabled={status === 'sending' || !title.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-brand)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  {status === 'sending' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                    </>
                  ) : (
                    'Send'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
