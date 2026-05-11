import { supabase } from "./supabase";
import type { CalendarEvent } from "./types";

type Phase = "trial" | "program";
type Program = "itp_men" | "itp_women" | "warubi_futures";

type Args = {
  startDate: string;
  endDate: string;
  phase: Phase;
  program?: Program | null;
  /**
   * The viewer's prospect or player ID — same UUID, matched against either
   * event_attendees.prospect_id (unpromoted) or event_attendees.player_id
   * (promoted). Required to suppress individual events scoped to other
   * people in the same program.
   */
  viewerId: string;
};

/**
 * Canonical query for events that should appear on a player's calendar.
 *
 * IMPORTANT — do not query the events table directly from a player-facing
 * page. Always go through this helper. The events table is shared across
 * players, visitors (parents, agents), and program scopes; without the
 * filters below, unrelated itineraries leak across pages.
 *
 * Filters applied:
 *   - visitor_id IS NULL    — excludes visitor itineraries (regression
 *                              fix Apr 2026: Junero's agent visit was
 *                              leaking onto Jadon's trial calendar)
 *   - program scope         — generic (NULL) events plus the player's own
 *                              program (itp_men, itp_women, or warubi_futures)
 *   - type exclusions       — language class, recovery, airport pickup
 *                              are never shown; program phase also
 *                              excludes trial-only event types
 *   - attendee scope        — events with no attendees are program-wide
 *                              (team training, group activities). Events
 *                              with attendees only show to listed
 *                              attendees. Without this, individual events
 *                              (e.g. "Trial Frechen (David)") leak to
 *                              every prospect in the same program — David
 *                              Climan saw David Okorie's trial schedule
 *                              May 11 2026 before this fix.
 *
 * Visitor pages have their own query in app/visitor/[visitorId]/page.tsx
 * that filters BY visitor_id — keep that one separate by design.
 */
export async function getPlayerEvents({
  startDate,
  endDate,
  phase,
  program,
  viewerId,
}: Args): Promise<CalendarEvent[]> {
  const excludes = [
    "language_class",
    "recovery",
    "airport_pickup",
    ...(phase === "program" ? ["trial", "prospect_trial"] : []),
  ];

  const programFilter = program
    ? `program.is.null,program.eq.${program}`
    : "program.is.null";

  const { data } = await supabase
    .from("events")
    .select("*, attendees:event_attendees(player_id, prospect_id)")
    .gte("date", startDate)
    .lte("date", endDate)
    .not("type", "in", `(${excludes.join(",")})`)
    .is("visitor_id", null)
    .or(programFilter)
    .order("date")
    .order("start_time");

  const rows = (data || []) as (CalendarEvent & {
    attendees?: { player_id: string | null; prospect_id: string | null }[];
  })[];

  return rows.filter((e) => {
    const attendees = e.attendees;
    if (!attendees || attendees.length === 0) return true; // program-wide
    return attendees.some(
      (a) => a.player_id === viewerId || a.prospect_id === viewerId,
    );
  });
}
