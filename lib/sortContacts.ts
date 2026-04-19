/**
 * Preferred staff contact order for the player-facing views.
 * Karoline (FC Köln PM / Coach) first — she's the day-to-day point of contact.
 * Then Jorge (Head of Methodology), Thomas (Warubi PM), Iker (Head of
 * Player Development). Anyone else falls through to the end.
 */
const ORDER: Record<string, number> = {
  "Karoline Heinze": 0,
  "Jorge Arcila Cáceres": 1,
  "Thomas Ellinger": 2,
  "Iker Casanova": 3,
};

type Contactish = { name: string };

export function sortContacts<T extends Contactish>(contacts: readonly T[]): T[] {
  return [...contacts].sort((a, b) => {
    const ao = ORDER[a.name] ?? 99;
    const bo = ORDER[b.name] ?? 99;
    return ao - bo;
  });
}

/**
 * Staff-only working locations that shouldn't appear in player-facing location lists.
 */
export const STAFF_LOCATION_NAMES = ["Warubi Office", "1. FC Köln Office"] as const;
