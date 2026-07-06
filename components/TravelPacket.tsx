import { Download, FileText, MessageCircle } from 'lucide-react'
import type { TravelPacketDocument } from '@/lib/travelPacket'

function documentLabel(doc: TravelPacketDocument): string {
  return doc.document_title || doc.name || 'Travel document'
}

function formatFileSize(size: number | null): string | null {
  if (!size) return null
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function TravelPacket({
  travelArrangements,
  documents,
}: {
  travelArrangements?: string | null
  documents: TravelPacketDocument[]
}) {
  if (!travelArrangements && documents.length === 0) return null

  return (
    <section className="px-4 pb-6">
      <div className="overflow-hidden rounded-xl border border-amber-700/30 bg-amber-900/20">
        <div className="border-b border-amber-700/20 p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-lg">🎫</span>
            <div>
              <p className="text-sm font-semibold text-amber-200">Your Travel Packet</p>
              <p className="text-xs text-amber-300/80">
                Tickets, pick-up instructions, and documents for your trip.
              </p>
            </div>
          </div>
        </div>

        {travelArrangements && (
          <div className="border-b border-amber-700/20 p-4">
            <div className="flex items-start gap-3">
              <MessageCircle size={16} className="mt-0.5 shrink-0 text-amber-300" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-300/80">
                  Pick-up / travel note
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-amber-200">
                  {travelArrangements}
                </p>
              </div>
            </div>
          </div>
        )}

        {documents.length > 0 && (
          <div className="divide-y divide-amber-700/20">
            {documents.map((doc) => {
              const fileSize = formatFileSize(doc.file_size)
              return (
                <div key={doc.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <FileText size={18} className="mt-0.5 shrink-0 text-amber-300" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--color-text)]">
                        {documentLabel(doc)}
                      </p>
                      {doc.description && (
                        <p className="mt-1 whitespace-pre-wrap text-xs text-[var(--color-text-secondary)]">
                          {doc.description}
                        </p>
                      )}
                      {fileSize && (
                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                          {fileSize}
                        </p>
                      )}
                    </div>
                    {doc.signed_url && (
                      <a
                        href={doc.signed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[var(--color-brand)] px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        <Download size={14} />
                        Open
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
