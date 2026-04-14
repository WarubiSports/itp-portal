import { supabase } from "@/lib/supabase";
import type { TrialProspect } from "@/lib/types";

/**
 * Resolves a URL id to a player record. The same id (UUID) may refer to:
 * 1. A trial prospect (`trial_prospects.id`) — pre-acceptance phase
 * 2. An in-program player's record (`players.id`) — post-acceptance, if they
 *    know their player id
 * 3. An in-program player whose `prospect_id` was preserved from the trial
 *    phase — this is the normal case: a prospect's link keeps working after
 *    they're accepted, because we saved the original prospect id on the player
 *    row during promotion.
 *
 * Lookup order: player by id → player by prospect_id → trial prospect.
 * Returns `{ source: 'player' | 'prospect', data }` or null.
 */
export type ResolvedPlayer =
  | { source: "player"; data: Record<string, unknown> }
  | { source: "prospect"; data: TrialProspect };

export async function resolvePlayer(id: string): Promise<ResolvedPlayer | null> {
  // 1. Direct player lookup (someone who was always a player, or knows player id)
  {
    const { data } = await supabase
      .from("players")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (data) return { source: "player", data: data as Record<string, unknown> };
  }

  // 2. Player by preserved prospect_id (normal post-promotion path)
  {
    const { data } = await supabase
      .from("players")
      .select("*")
      .eq("prospect_id", id)
      .maybeSingle();
    if (data) return { source: "player", data: data as Record<string, unknown> };
  }

  // 3. Trial prospect (pre-acceptance)
  {
    const { data } = await supabase
      .from("trial_prospects")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (data) return { source: "prospect", data: data as TrialProspect };
  }

  return null;
}
