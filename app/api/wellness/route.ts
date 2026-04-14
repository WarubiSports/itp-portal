import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()

  const { error } = await supabase
    .from('wellness_logs')
    .upsert(
      {
        player_id: body.player_id,
        date: body.date,
        sleep_hours: body.sleep_hours,
        sleep_quality: body.sleep_quality,
        energy_level: body.energy_level,
        muscle_soreness: body.muscle_soreness,
        stress_level: body.stress_level,
        mood: body.mood,
        notes: body.notes,
      },
      { onConflict: 'player_id,date' }
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
