import { CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { DOCUMENT_CONTENT } from '@/lib/documents'

const REQUIRED_DOCS = Object.entries(DOCUMENT_CONTENT).map(([type, doc]) => ({
  type,
  title: doc.title,
}))

export const DocumentStatus = ({
  signedDocs,
  playerId,
}: {
  signedDocs: { document_type: string; signed_at: string }[]
  playerId: string
}) => {
  const signedSet = new Set(signedDocs.map((d) => d.document_type))
  const signedCount = REQUIRED_DOCS.filter((d) => signedSet.has(d.type)).length
  const total = REQUIRED_DOCS.length
  const allSigned = signedCount === total

  return (
    <section className="px-4 pb-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Documents
          </h3>
          <span className={`text-xs font-semibold ${allSigned ? 'text-green-500' : 'text-amber-500'}`}>
            {signedCount}/{total} signed
          </span>
        </div>

        <div className="space-y-2">
          {REQUIRED_DOCS.map((doc) => {
            const signed = signedSet.has(doc.type)
            return (
              <div key={doc.type} className="flex items-center gap-2">
                {signed ? (
                  <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                ) : (
                  <AlertCircle size={16} className="text-amber-400 shrink-0" />
                )}
                <span className={`text-sm ${signed ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                  {doc.title}
                </span>
              </div>
            )
          })}
        </div>

        {!allSigned && (
          <Link
            href={`/${playerId}/onboarding`}
            className="mt-3 block text-center text-sm font-semibold text-[#ED1C24] hover:underline"
          >
            Complete signing →
          </Link>
        )}
      </div>
    </section>
  )
}
