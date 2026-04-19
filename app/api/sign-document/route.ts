import { supabase } from '@/lib/supabase'
import { logError } from '@/lib/logError'
import { NextResponse } from 'next/server'

const ROUTE = '/api/sign-document'

export async function POST(request: Request) {
  let playerId: string | null = null
  let documentType: string | null = null

  try {
    const formData = await request.formData()
    const signature = formData.get('signature') as File
    playerId = formData.get('player_id') as string
    documentType = formData.get('document_type') as string
    const documentTitle = formData.get('document_title') as string
    const signerName = formData.get('signer_name') as string
    const parentSignature = formData.get('parent_signature') as File | null
    const parentSignerName = formData.get('parent_signer_name') as string | null

    const path = `${playerId}/${documentType}_${Date.now()}.png`
    const buffer = Buffer.from(await signature.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from('signatures')
      .upload(path, buffer, { contentType: 'image/png' })

    if (uploadError) {
      await logError({
        route: ROUTE,
        error: uploadError,
        context: { stage: 'player_signature_upload', playerId, documentType },
      })
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    let parentPath: string | null = null
    if (parentSignature && parentSignerName) {
      parentPath = `${playerId}/${documentType}_parent_${Date.now()}.png`
      const parentBuffer = Buffer.from(await parentSignature.arrayBuffer())

      const { error: parentUploadError } = await supabase.storage
        .from('signatures')
        .upload(parentPath, parentBuffer, { contentType: 'image/png' })

      if (parentUploadError) {
        await logError({
          route: ROUTE,
          error: parentUploadError,
          context: { stage: 'parent_signature_upload', playerId, documentType },
        })
        return NextResponse.json({ error: 'Parent signature upload failed' }, { status: 500 })
      }
    }

    const record: Record<string, unknown> = {
      player_id: playerId,
      document_type: documentType,
      document_title: documentTitle,
      signature_image_path: path,
      signed_at: new Date().toISOString(),
      signer_name: signerName,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
    }

    if (parentPath && parentSignerName) {
      record.parent_signer_name = parentSignerName
      record.parent_signature_image_path = parentPath
      record.parent_signed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('player_documents')
      .upsert(record, { onConflict: 'player_id,document_type' })

    if (error) {
      await logError({
        route: ROUTE,
        error,
        context: { stage: 'player_documents_upsert', playerId, documentType },
      })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    await logError({
      route: ROUTE,
      error: err,
      context: { stage: 'unexpected', playerId, documentType },
    })
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
