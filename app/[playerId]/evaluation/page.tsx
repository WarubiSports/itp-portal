import { supabase } from "@/lib/supabase";
import { resolvePlayer } from "@/lib/resolvePlayer";
import {
  buildFuturesEvaluation,
  benchmarkAgeGroup,
  type FuturesProspectRow,
  type FuturesBenchmarkRow,
  type Tier,
} from "@/lib/futures-evaluation";
import { ClipboardList, Dumbbell, Compass, ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ playerId: string }>;
};

const TIER_STYLE: Record<Tier, string> = {
  elite: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  good: "bg-green-500/15 text-green-300 border-green-500/30",
  average: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  poor: "bg-red-500/15 text-red-300 border-red-500/30",
};
const TIER_LABEL: Record<Tier, string> = { elite: "Elite", good: "Good", average: "Average", poor: "Poor" };

const RATING_ROWS: { key: "technical" | "tactical" | "physical" | "mental" | "overall"; label: string }[] = [
  { key: "technical", label: "Technical" },
  { key: "tactical", label: "Tactical" },
  { key: "physical", label: "Physical" },
  { key: "mental", label: "Mental" },
  { key: "overall", label: "Overall" },
];

function NotReady() {
  return (
    <div className="py-4 px-4">
      <header className="mb-6">
        <h1 className="text-xl font-bold font-[family-name:var(--font-outfit)] text-[var(--color-text)]">
          Your Evaluation
        </h1>
      </header>
      <div className="text-center py-12">
        <ClipboardList size={40} className="mx-auto mb-3 text-[var(--color-text-muted)]" />
        <p className="text-[var(--color-text-secondary)] text-sm max-w-xs mx-auto">
          Your evaluation isn&apos;t ready yet. Once our coaches have finished it, you&apos;ll find it here.
        </p>
      </div>
    </div>
  );
}

export default async function EvaluationPage({ params }: Props) {
  const { playerId: urlId } = await params;
  const resolved = await resolvePlayer(urlId);
  if (!resolved) notFound();

  // Futures-only page: the evaluation is a Warubi Futures artifact and lives on
  // the prospect row. Anything else (ITP players/prospects) doesn't have one.
  const isFuturesProspect =
    resolved.source === "prospect" && (resolved.data.program ?? null) === "warubi_futures";
  if (!isFuturesProspect) notFound();

  const prospect = resolved.raw as FuturesProspectRow;

  // Gate: only show once staff have shared it with the family (Phase 4 sets shared_at).
  const shared = !!prospect.trial_report_data?.shared_at;
  if (!shared) return <NotReady />;

  const subjectId = resolved.data.id;
  const ageGroup = benchmarkAgeGroup(prospect.date_of_birth);

  const [physRes, benchRes] = await Promise.all([
    supabase
      .from("physical_tests")
      .select("*")
      .eq("prospect_id", subjectId)
      .order("test_date", { ascending: false })
      .limit(1),
    supabase
      .from("test_benchmarks")
      .select("test_key, lower_is_better, elite_threshold, good_threshold, average_threshold")
      .eq("age_group", ageGroup),
  ]);

  const physicalLatest = (physRes.data?.[0] ?? undefined) as Record<string, number | null> | undefined;
  const benchmarks = (benchRes.data ?? []) as FuturesBenchmarkRow[];

  const data = buildFuturesEvaluation(prospect, physicalLatest, benchmarks, new Date());
  const ratingRows = RATING_ROWS.filter((r) => data.ratings[r.key] != null);

  return (
    <div className="py-4 px-4 space-y-6">
      <header>
        <p className="text-xs font-semibold tracking-[0.2em] text-[var(--color-brand)] uppercase mb-1">
          Camp Evaluation
        </p>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-outfit)] text-[var(--color-text)]">
          {`${data.firstName} ${data.lastName}`.trim()}
        </h1>
        {data.campDates && (
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">{data.campDates}</p>
        )}
        <div className="grid grid-cols-2 gap-2 mt-4">
          {[
            { k: "Position", v: data.position },
            { k: "Age", v: data.ageLabel },
            { k: "Nationality", v: data.nationality },
            { k: "Current Level", v: data.currentLevel },
          ].map(({ k, v }) => (
            <div key={k} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
              <div className="text-[10px] tracking-wider text-[var(--color-text-muted)] uppercase">{k}</div>
              <div className="text-sm font-semibold text-[var(--color-text)] mt-0.5">{v || "—"}</div>
            </div>
          ))}
        </div>
      </header>

      {/* 01 — Coach Assessment */}
      {ratingRows.length > 0 && (
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="text-base font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
            <ClipboardList size={16} /> Coach Assessment
          </h2>
          <div className="space-y-3">
            {ratingRows.map((r) => {
              const v = data.ratings[r.key] as number;
              return (
                <div key={r.key} className="flex items-center gap-3">
                  <span className="w-20 text-sm text-[var(--color-text-secondary)]">{r.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-[var(--color-surface-elevated)] overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-[var(--color-brand)]"
                      style={{ width: `${Math.max(0, Math.min(10, v)) * 10}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-sm font-semibold text-[var(--color-text)]">
                    {r.key === "overall" ? v.toFixed(1) : v}/10
                  </span>
                </div>
              );
            })}
          </div>
          {data.narrative && (
            <div className="mt-4 rounded-lg border-l-2 border-[var(--color-brand)] bg-[var(--color-surface-elevated)] p-4">
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)] whitespace-pre-line">
                {data.narrative}
              </p>
              <p className="mt-3 text-xs font-semibold text-[var(--color-brand)]">{data.coachLine}</p>
            </div>
          )}
        </section>
      )}

      {/* 02 — Physical Testing */}
      {data.physicalGroups.length > 0 && (
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h2 className="text-base font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
            <Dumbbell size={16} /> Physical Testing
          </h2>
          <div className="space-y-4">
            {data.physicalGroups.map((g) => (
              <div key={g.label}>
                <div className="text-[10px] font-semibold tracking-wider text-[var(--color-text-muted)] uppercase mb-2">
                  {g.label}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {g.metrics.map((m) => (
                    <div key={m.label} className="rounded-lg bg-[var(--color-surface-elevated)] px-3 py-2.5">
                      <div className="text-[10px] tracking-wider text-[var(--color-text-muted)] uppercase truncate">
                        {m.label}
                      </div>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-lg font-bold text-[var(--color-text)]">{m.value}</span>
                        <span className="text-xs text-[var(--color-text-muted)]">{m.unit}</span>
                      </div>
                      {m.tier && (
                        <span className={`mt-1.5 inline-block text-[10px] font-medium px-1.5 py-0.5 rounded border ${TIER_STYLE[m.tier]}`}>
                          {TIER_LABEL[m.tier]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {data.benchmarkNote && (
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">{data.benchmarkNote}</p>
          )}
        </section>
      )}

      {/* 03 — Standout & Focus */}
      {(data.standout || data.focus) && (
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.standout && (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div className="text-sm font-semibold text-[var(--color-text)]">What stood out</div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {data.standout.description || data.standout.title}
              </p>
            </div>
          )}
          {data.focus && (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div className="text-sm font-semibold text-[var(--color-text)]">What to develop</div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {data.focus.description || data.focus.title}
              </p>
            </div>
          )}
        </section>
      )}

      {/* 04 — Pathways Forward */}
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="text-base font-semibold text-[var(--color-text)] mb-1 flex items-center gap-2">
          <Compass size={16} /> Pathways Forward
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          Warubi opens several routes after a Futures camp. Based on what our staff saw, these are the ones
          that fit {data.firstName}. The highlighted routes are where we&apos;d focus first.
        </p>
        <div className="space-y-2">
          {data.pathways.map((pw, i) => (
            <div
              key={pw.key}
              className={`flex items-start gap-3 rounded-lg border p-3 ${
                pw.recommended
                  ? "border-[var(--color-brand)] bg-[var(--color-brand-glow)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface-elevated)]"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm font-bold ${
                  pw.recommended
                    ? "bg-[var(--color-brand)] text-white"
                    : "bg-[var(--color-surface)] text-[var(--color-brand)] border border-[var(--color-border)]"
                }`}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--color-text)]">{pw.label}</span>
                  {pw.recommended && (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-white bg-[var(--color-brand)] px-1.5 py-0.5 rounded">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm leading-snug text-[var(--color-text-secondary)]">{pw.description}</p>
                {pw.link && (
                  <a
                    href={pw.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-block text-xs font-semibold text-[var(--color-brand)]"
                  >
                    Learn more →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Next step CTA — gated to players with at least one recommended pathway */}
      {data.showCallCta && (
        <a
          href={data.calendlyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-3 rounded-xl bg-[var(--color-brand)] p-4 transition-opacity active:opacity-90"
        >
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/80">Next Step</div>
            <div className="mt-1 text-base font-bold text-white">Let&apos;s map {data.firstName}&apos;s route.</div>
            <p className="mt-1 text-xs text-white/85 leading-snug">
              A 30-minute call with Max Bisinger, Head of Recruitment, to talk through the options above.
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-[var(--color-brand-dark)]">
            Book a call <ArrowRight size={15} />
          </span>
        </a>
      )}

      <div className="pb-8 pt-2 text-center text-[10px] tracking-wider text-[var(--color-text-muted)] uppercase">
        Warubi Futures · A Warubi Sports Program · Confidential
      </div>
    </div>
  );
}
