import { CreditCard, ExternalLink, CheckCircle2 } from 'lucide-react'

export const PaymentSection = ({
  paymentLink,
  paymentAmount,
  paymentStatus,
}: {
  paymentLink?: string | null
  paymentAmount?: string | null
  paymentStatus?: string | null
}) => {
  if (!paymentLink) return null

  const isPaid = paymentStatus === 'received'

  return (
    <section className="px-4 pb-6">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard size={18} className="text-[#ED1C24]" />
          <h3 className="text-sm font-bold text-[var(--color-text)]">Payment</h3>
        </div>

        {isPaid ? (
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="text-green-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-400">Payment received</p>
              {paymentAmount && (
                <p className="text-xs text-[var(--color-text-muted)]">{paymentAmount}</p>
              )}
            </div>
          </div>
        ) : (
          <div>
            {paymentAmount && (
              <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                Trial fee: <span className="font-semibold text-[var(--color-text)]">{paymentAmount}</span>
              </p>
            )}
            <a
              href={paymentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-brand)] text-white text-sm font-semibold hover:shadow-[0_0_20px_var(--color-brand-glow)] transition-shadow"
            >
              Pay via Wise
              <ExternalLink size={14} />
            </a>
            {paymentStatus === 'partial' && (
              <p className="text-xs text-amber-400 mt-2">
                Partial payment received — remaining balance due.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
