// Warubi Futures player evaluation — constants + view-model builder for the
// in-app evaluation page (app/[playerId]/evaluation). Mirrors the content of the
// PDF generated staff-side in ITP-Staff-App (src/lib/futures-evaluation.ts +
// api/family-report). Kept in sync by hand — both repos read the same
// trial_prospects / physical_tests / test_benchmarks rows.

export const FUTURES_CALENDLY_URL = "https://calendly.com/max-bisinger-warubi-sports/30min";

// Coach attribution shown on the evaluation. Confirmed by Max 2026-06-19.
export const FUTURES_COACH_LINE =
  "Marvin Zott · Lead Coach, Warubi Futures · UEFA B-licensed, formerly FC Magdeburg Academy";

// The five routes a Futures participant can be pointed toward. Keys persist in
// trial_report_data.recommended_pathways. ITP is one option among several.
export const FUTURES_PATHWAYS: { key: string; label: string; description: string; link?: string }[] = [
  {
    key: "itp",
    label: "1. FC Köln ITP",
    description:
      "A development pathway at 1. FC Köln after Futures: three, six, or ten months training day to day in a professional environment.",
    link: "https://brochures.warubi-sports.com/fckoeln-itp-men-2026.pdf",
  },
  {
    key: "college",
    label: "College Pathway",
    description:
      "A recruiting profile from his camp footage plus introductions into our US college coach network.",
  },
  {
    key: "semipro",
    label: "Semi-Pro Club",
    description: "A route into senior semi-professional football through a club in the Warubi network.",
  },
  {
    key: "loewi",
    label: "LöWi U19 (Widdersdorf-Lövenich)",
    description: "A placement with our partner club to keep developing inside the German youth system.",
  },
  {
    key: "return",
    label: "Return to Showcase / Camp",
    description:
      "A place at the next Warubi camp and continued tracking by our staff against the focus areas above.",
  },
];

export type Tier = "elite" | "good" | "average" | "poor";

export interface FuturesPhysicalMetric {
  label: string;
  value: number;
  unit: string;
  tier?: Tier;
}

export interface FuturesEvaluationData {
  firstName: string;
  lastName: string;
  position: string;
  ageLabel: string;
  nationality: string;
  currentLevel: string;
  ageGroup?: string;
  campDates: string;
  ratings: {
    technical?: number | null;
    tactical?: number | null;
    physical?: number | null;
    mental?: number | null;
    overall?: number | null;
  };
  narrative: string;
  coachLine: string;
  physicalGroups: { label: string; metrics: FuturesPhysicalMetric[] }[];
  benchmarkNote?: string;
  standout?: { title: string; description: string };
  focus?: { title: string; description: string };
  pathways: { key: string; label: string; description: string; recommended: boolean; link?: string }[];
  showCallCta: boolean;
  calendlyUrl: string;
}

/** Subset of the trial_report_data JSON the evaluation reads. */
export interface FuturesReportData {
  assessment?: string;
  strengths?: { title: string; description: string }[];
  areas?: { title: string; description: string }[];
  recommended_pathways?: string[];
  show_call_cta?: boolean;
  /** Set when staff send the evaluation to the family (Phase 4). Gates in-app visibility. */
  shared_at?: string | null;
}

/** The trial_prospects columns the evaluation needs. */
export interface FuturesProspectRow {
  first_name?: string | null;
  last_name?: string | null;
  position?: string | null;
  date_of_birth?: string | null;
  nationality?: string | null;
  current_club?: string | null;
  trial_start_date?: string | null;
  trial_end_date?: string | null;
  technical_rating?: number | null;
  tactical_rating?: number | null;
  physical_rating?: number | null;
  mental_rating?: number | null;
  coach_feedback?: string | null;
  trial_report_data?: FuturesReportData | null;
}

export interface FuturesBenchmarkRow {
  test_key: string;
  lower_is_better: boolean;
  elite_threshold: number;
  good_threshold: number;
  average_threshold: number;
}

/** Age in whole years from an ISO date string, relative to `now`. */
export function ageFromDob(dob: string | undefined | null, now: Date): string {
  if (!dob) return "";
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return "";
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return String(age);
}

/** Benchmark age group by birth year — matches the staff PDF + test_benchmarks rows. */
export function benchmarkAgeGroup(dob: string | undefined | null): "U-17" | "U-19" | "U-21" {
  if (!dob) return "U-21";
  const by = parseInt(String(dob).substring(0, 4));
  if (by >= 2009) return "U-17";
  if (by >= 2007) return "U-19";
  return "U-21";
}

// Nationalities are entered in mixed languages (German camp staff, intake forms).
// The evaluation is English, so map known non-English country/nationality names to
// English. Handles multi-value strings and leaves English/unknown values untouched.
const NATIONALITY_EN: Record<string, string> = {
  deutschland: "Germany", deutsch: "German", deutsche: "German",
  ungarn: "Hungary", ungarisch: "Hungarian",
  frankreich: "France", französisch: "French", franzoesisch: "French",
  spanien: "Spain", spanisch: "Spanish", españa: "Spain",
  italien: "Italy", italienisch: "Italian", italia: "Italy",
  niederlande: "Netherlands", niederländisch: "Dutch",
  österreich: "Austria", oesterreich: "Austria",
  schweiz: "Switzerland", belgien: "Belgium", polen: "Poland", polnisch: "Polish",
  griechenland: "Greece", türkei: "Turkey", tuerkei: "Turkey", türkisch: "Turkish",
  brasilien: "Brazil", kroatien: "Croatia", serbien: "Serbia",
  rumänien: "Romania", rumaenien: "Romania", tschechien: "Czechia",
  russland: "Russia", russisch: "Russian",
  "vereinigte staaten": "United States", "vereinigtes königreich": "United Kingdom",
  marokko: "Morocco", ägypten: "Egypt", aegypten: "Egypt",
};

/** Render a nationality field in English, value-by-value; unknown/English values pass through. */
export function normalizeNationality(raw?: string | null): string {
  if (!raw) return "";
  return raw
    .split(/\s*[,/&]\s*/)
    .map((part) => {
      const t = part.trim();
      if (!t) return "";
      return NATIONALITY_EN[t.toLowerCase()] ?? t;
    })
    .filter(Boolean)
    .join(", ");
}

/** "12 to 22 May 2026" style range; falls back gracefully when dates are missing. */
export function formatCampDates(start?: string | null, end?: string | null): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  if (start && end) {
    const s = new Date(start);
    const e = new Date(end);
    if (!Number.isNaN(s.getTime()) && !Number.isNaN(e.getTime())) {
      if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
        return `${s.getDate()} to ${e.getDate()} ${e.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`;
      }
      return `${fmt(start)} to ${fmt(end)}`;
    }
  }
  if (start) return fmt(start);
  return "";
}

/**
 * Builds the evaluation view-model from the raw rows. Ports the data logic from
 * the staff-side generateFuturesEvaluation so the in-app page matches the PDF.
 */
export function buildFuturesEvaluation(
  prospect: FuturesProspectRow,
  physicalLatest: Record<string, number | null> | undefined,
  benchmarks: FuturesBenchmarkRow[],
  now: Date
): FuturesEvaluationData {
  const report = prospect.trial_report_data ?? {};
  const recommended = report.recommended_pathways ?? [];

  const bm = new Map(benchmarks.map((b) => [b.test_key, b]));
  const tierFor = (key: string, value: number): Tier | undefined => {
    const b = bm.get(key);
    if (!b) return undefined;
    const elite = Number(b.elite_threshold),
      good = Number(b.good_threshold),
      avg = Number(b.average_threshold);
    if (b.lower_is_better) return value <= elite ? "elite" : value <= good ? "good" : value <= avg ? "average" : "poor";
    return value >= elite ? "elite" : value >= good ? "good" : value >= avg ? "average" : "poor";
  };

  // Speed (sprints, 20m omitted) and Power/Agility/Endurance (broad jump, 505
  // agility — no benchmark, 30-15 IFT). No vertical/CMJ (never measured in Futures).
  const speed: FuturesPhysicalMetric[] = [];
  const power: FuturesPhysicalMetric[] = [];
  const p = physicalLatest;
  if (p) {
    if (p.sprint_5m != null) speed.push({ label: "Sprint 5m", value: p.sprint_5m, unit: "s", tier: tierFor("sprint_5m", p.sprint_5m) });
    if (p.sprint_30m != null) speed.push({ label: "Sprint 30m", value: p.sprint_30m, unit: "s", tier: tierFor("sprint_30m", p.sprint_30m) });
    if (p.sprint_40_yards != null) speed.push({ label: "Sprint 40yd", value: p.sprint_40_yards, unit: "s", tier: tierFor("sprint_40_yards", p.sprint_40_yards) });
    if (p.broad_jump != null) power.push({ label: "Broad Jump", value: p.broad_jump, unit: "cm", tier: tierFor("broad_jump", p.broad_jump) });
    if (p.agility_505 != null) power.push({ label: "505 Agility", value: p.agility_505, unit: "s" });
    if (p.endurance_30_15_ift != null) power.push({ label: "30-15 IFT", value: p.endurance_30_15_ift, unit: "km/h", tier: tierFor("endurance_30_15_ift", p.endurance_30_15_ift) });
  }
  const physicalGroups: FuturesEvaluationData["physicalGroups"] = [];
  if (speed.length) physicalGroups.push({ label: "Speed", metrics: speed });
  if (power.length) physicalGroups.push({ label: "Power, Agility & Endurance", metrics: power });
  const ageGroup = benchmarkAgeGroup(prospect.date_of_birth);
  const benchmarkNote = [...speed, ...power].some((m) => m.tier)
    ? `Ratings and physical tiers are benchmarked against European academy standards for the ${ageGroup} age group.`
    : undefined;

  // Overall is the average of the four category ratings (read-only on profile + report).
  const fourRatings = [prospect.technical_rating, prospect.tactical_rating, prospect.physical_rating, prospect.mental_rating]
    .filter((v) => v != null)
    .map(Number);
  const overallAvg = fourRatings.length
    ? Math.round((fourRatings.reduce((a, b) => a + b, 0) / fourRatings.length) * 10) / 10
    : null;

  return {
    firstName: prospect.first_name ?? "",
    lastName: prospect.last_name ?? "",
    position: prospect.position ?? "",
    ageLabel: ageFromDob(prospect.date_of_birth, now),
    nationality: normalizeNationality(prospect.nationality),
    currentLevel: prospect.current_club ?? "",
    ageGroup,
    campDates: formatCampDates(prospect.trial_start_date, prospect.trial_end_date),
    ratings: {
      technical: prospect.technical_rating,
      tactical: prospect.tactical_rating,
      physical: prospect.physical_rating,
      mental: prospect.mental_rating,
      overall: overallAvg,
    },
    narrative: report.assessment || prospect.coach_feedback || "",
    coachLine: FUTURES_COACH_LINE,
    physicalGroups,
    benchmarkNote,
    standout: report.strengths?.[0],
    focus: report.areas?.[0],
    pathways: FUTURES_PATHWAYS.map((pw) => ({ ...pw, recommended: recommended.includes(pw.key) })),
    showCallCta: !!report.show_call_cta && recommended.length > 0,
    calendlyUrl: FUTURES_CALENDLY_URL,
  };
}
