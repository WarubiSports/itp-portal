import { supabase } from '@/lib/supabase'

export const TRAVEL_PACKET_TYPE_PREFIX = 'travel_packet_'

export type TravelPacketDocumentRow = {
  id: string
  name: string | null
  document_title: string | null
  document_type: string | null
  file_path: string | null
  file_type: string | null
  file_size: number | null
  description: string | null
  created_at: string | null
}

export type TravelPacketDocument = TravelPacketDocumentRow & {
  signed_url: string | null
}

export function isTravelPacketDocument(doc: Pick<TravelPacketDocumentRow, 'document_type' | 'file_path'>): boolean {
  return Boolean(
    doc.file_path &&
    doc.document_type?.startsWith(TRAVEL_PACKET_TYPE_PREFIX)
  )
}

export async function getTravelPacketDocuments(subjectId: string): Promise<TravelPacketDocument[]> {
  const { data, error } = await supabase
    .from('player_documents')
    .select('id, name, document_title, document_type, file_path, file_type, file_size, description, created_at')
    .or(`prospect_id.eq.${subjectId},player_id.eq.${subjectId}`)
    .not('file_path', 'is', null)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  const rows = (data as TravelPacketDocumentRow[]).filter(isTravelPacketDocument)

  return Promise.all(rows.map(async (doc) => {
    if (!doc.file_path) return { ...doc, signed_url: null }
    const { data: signed } = await supabase.storage
      .from('player-documents')
      .createSignedUrl(doc.file_path, 60 * 60)
    return { ...doc, signed_url: signed?.signedUrl ?? null }
  }))
}
