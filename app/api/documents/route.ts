import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const playerId = request.nextUrl.searchParams.get('player_id')

  if (!playerId) {
    return NextResponse.json({ error: 'player_id required' }, { status: 400 })
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(playerId)) {
    return NextResponse.json({ error: 'invalid player_id' }, { status: 400 })
  }

  // Caller passes a prospect.id OR a player.id — match either. Prospect
  // signatures live under player_documents.prospect_id (player_id is NULL
  // until promotion), so .eq('player_id', ...) misses them entirely.
  const { data, error } = await supabase
    .from('player_documents')
    .select('document_type, document_title, signed_at, signer_name')
    .or(`prospect_id.eq.${playerId},player_id.eq.${playerId}`)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}
