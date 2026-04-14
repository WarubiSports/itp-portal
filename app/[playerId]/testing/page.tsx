import { supabase } from "@/lib/supabase";
import { resolvePlayer } from "@/lib/resolvePlayer";
import { Activity, Dumbbell, Footprints, Ruler, Target, Timer, Zap, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ playerId: string }>;
};

type PhysicalTest = {
  id: string;
  test_date: string;
  [key: string]: string | number | null;
};

type TestBenchmark = {
  test_key: string;
  display_name: string;
  unit: string;
  category: string;
  display_order: number;
  lower_is_better: boolean;
  poor_threshold: number;
  average_threshold: number;
  good_threshold: number;
  elite_threshold: number;
};

type Tier = "elite" | "good" | "average" | "poor";

const TIER_STYLE: Record<Tier, string> = {
  elite: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  good: "bg-green-500/15 text-green-300 border-green-500/30",
  average: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  poor: "bg-red-500/15 text-red-300 border-red-500/30",
};

const TIER_LABEL: Record<Tier, string> = {
  elite: "Elite",
  good: "Good",
  average: "Average",
  poor: "Poor",
};

const CATEGORY_ICON: Record<string, typeof Activity> = {
  jump: Zap,
  strength: Dumbbell,
  endurance: Timer,
  speed: Footprints,
  skill: Target,
  body_composition: Ruler,
};

function getAgeGroup(dob: string | null | undefined): "U17" | "U19" | "U21" {
  if (!dob) return "U19";
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  if (age <= 16) return "U17";
  if (age <= 18) return "U19";
  return "U21";
}

function getTier(value: number | null, benchmark: TestBenchmark): Tier | null {
  if (value == null) return null;
  const { lower_is_better, poor_threshold, average_threshold, good_threshold, elite_threshold } = benchmark;
  if (lower_is_better) {
    if (value <= elite_threshold) return "elite";
    if (value <= good_threshold) return "good";
    if (value <= average_threshold) return "average";
    return "poor";
  }
  if (value >= elite_threshold) return "elite";
  if (value >= good_threshold) return "good";
  if (value >= average_threshold) return "average";
  // poor_threshold kept for threshold calibration; tier is simply "poor" below average
  void poor_threshold;
  return "poor";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

function Sparkline({ values, lowerIsBetter }: { values: number[]; lowerIsBetter: boolean }) {
  if (values.length < 2) return null;
  const width = 72;
  const height = 24;
  const pad = 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values
    .map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (width - pad * 2);
      const y = pad + (1 - (v - min) / range) * (height - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const first = values[0];
  const last = values[values.length - 1];
  const improved = lowerIsBetter ? last < first : last > first;
  const worsened = lowerIsBetter ? last > first : last < first;
  const color = improved ? "#22c55e" : worsened ? "#ef4444" : "#888";

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

function DeltaBadge({ current, previous, lowerIsBetter }: { current: number | null; previous: number | null; lowerIsBetter: boolean }) {
  if (current == null || previous == null) return null;
  const diff = current - previous;
  if (diff === 0) return <span className="inline-flex items-center gap-0.5 text-[var(--color-text-muted)] text-xs"><Minus size={10} /> 0</span>;
  const improved = lowerIsBetter ? diff < 0 : diff > 0;
  const sign = diff > 0 ? "+" : "";
  const formatted = (sign + diff.toFixed(2)).replace(/\.?0+$/, "");
  const Icon = improved ? TrendingUp : TrendingDown;
  const color = improved ? "text-green-400" : "text-red-400";
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs ${color}`}>
      <Icon size={10} /> {formatted}
    </span>
  );
}

export default async function TestingPage({ params }: Props) {
  const { playerId: urlId } = await params;
  const resolved = await resolvePlayer(urlId);

  if (!resolved) notFound();

  // Alumni land on their info page — testing history isn't a thing they actively use.
  if (resolved.source === "player" && (resolved.raw as { status?: string }).status === "alumni") {
    const { redirect } = await import("next/navigation");
    redirect(`/${urlId}`);
  }

  // Testing is only a real tab for in-program players. Prospects/committed players go back.
  if (resolved.source !== "player") {
    return (
      <div className="py-12 px-4 text-center">
        <Activity size={40} className="mx-auto mb-3 text-[var(--color-text-muted)]" />
        <p className="text-[var(--color-text-secondary)] text-sm mb-4">
          Physical testing results appear once you&apos;re in the program.
        </p>
        <Link href={`/${urlId}`} className="text-sm font-semibold text-[var(--color-brand)] hover:underline">
          Back to your info →
        </Link>
      </div>
    );
  }

  const playerId = resolved.data.id;
  const ageGroup = getAgeGroup(resolved.data.date_of_birth);

  const [testsRes, benchmarksRes] = await Promise.all([
    supabase.from("physical_tests").select("*").eq("player_id", playerId).order("test_date", { ascending: false }),
    supabase.from("test_benchmarks").select("*").eq("age_group", ageGroup).order("display_order", { ascending: true }),
  ]);

  const tests = (testsRes.data || []) as PhysicalTest[];
  const benchmarks = (benchmarksRes.data || []) as TestBenchmark[];

  if (tests.length === 0) {
    return (
      <div className="py-4 px-4">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold font-[family-name:var(--font-outfit)] text-[var(--color-text)]">Physical Testing</h1>
          <span className="px-2 py-1 text-xs font-semibold rounded-md bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]">{ageGroup}</span>
        </header>
        <div className="text-center py-12">
          <Activity size={40} className="mx-auto mb-3 text-[var(--color-text-muted)]" />
          <p className="text-[var(--color-text-secondary)] text-sm">
            Your test results will appear here once recorded.
          </p>
        </div>
      </div>
    );
  }

  const latest = tests[0];
  const previous = tests[1] ?? null;

  const benchmarkMap = new Map(benchmarks.map((b) => [b.test_key, b]));

  const bodyFields: { key: string; label: string; unit: string }[] = [
    { key: "height_cm", label: "Height", unit: "cm" },
    { key: "body_weight", label: "Weight", unit: "kg" },
    { key: "body_fat_pct", label: "Body Fat", unit: "%" },
    { key: "muscle_rate", label: "Muscle Rate", unit: "%" },
    { key: "bmi", label: "BMI", unit: "" },
  ];

  // Group non-body-composition benchmarks by category
  const categories: { category: string; tests: TestBenchmark[] }[] = [];
  const byCategory = new Map<string, TestBenchmark[]>();
  for (const b of benchmarks) {
    if (b.category === "body_composition") continue;
    if (!byCategory.has(b.category)) byCategory.set(b.category, []);
    byCategory.get(b.category)!.push(b);
  }
  for (const [category, list] of byCategory) {
    categories.push({ category, tests: list });
  }

  return (
    <div className="py-4 px-4 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-[family-name:var(--font-outfit)] text-[var(--color-text)]">Physical Testing</h1>
        <span className="px-2 py-1 text-xs font-semibold rounded-md bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]">
          {ageGroup}
        </span>
      </header>

      {/* Body Composition */}
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-base font-semibold text-[var(--color-text)]">Body Composition</h2>
          <span className="text-xs text-[var(--color-text-muted)]">{formatDate(latest.test_date)}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {bodyFields.map(({ key, label, unit }) => {
            const value = latest[key] as number | null;
            if (value == null) return null;
            const bm = benchmarkMap.get(key);
            const tier = bm ? getTier(value, bm) : null;
            return (
              <div key={key} className="flex items-center justify-between rounded-lg bg-[var(--color-surface-elevated)] px-3 py-2">
                <div>
                  <div className="text-xs text-[var(--color-text-muted)]">{label}</div>
                  <div className="text-sm font-semibold text-[var(--color-text)]">
                    {value}
                    {unit && <span className="text-[var(--color-text-muted)] font-normal"> {unit}</span>}
                  </div>
                </div>
                {tier && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded border ${TIER_STYLE[tier]}`}>
                    {TIER_LABEL[tier]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Test categories */}
      {categories.map(({ category, tests: categoryBenchmarks }) => {
        const Icon = CATEGORY_ICON[category] || Activity;
        const categoryLabel = category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        return (
          <section key={category} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
              <Icon size={16} />
              {categoryLabel}
            </h2>
            <div className="space-y-2">
              {categoryBenchmarks.map((bm) => {
                const current = latest[bm.test_key] as number | null;
                if (current == null) return null;
                const prev = (previous?.[bm.test_key] as number | null) ?? null;
                const tier = getTier(current, bm);
                const history = [...tests]
                  .reverse()
                  .map((t) => t[bm.test_key] as number | null)
                  .filter((v): v is number => v != null);

                return (
                  <div
                    key={bm.test_key}
                    className="flex items-center justify-between gap-3 rounded-lg bg-[var(--color-surface-elevated)] px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--color-text)] truncate">{bm.display_name}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">{bm.unit}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Sparkline values={history} lowerIsBetter={bm.lower_is_better} />
                      <div className="flex flex-col items-end">
                        <div className="text-sm font-semibold text-[var(--color-text)]">{current}</div>
                        <DeltaBadge current={current} previous={prev} lowerIsBetter={bm.lower_is_better} />
                      </div>
                      {tier && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded border ${TIER_STYLE[tier]}`}>
                          {TIER_LABEL[tier]}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Session history */}
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">Session History</h2>
        <div className="space-y-2">
          {tests.map((test) => {
            const recordedFields = benchmarks.filter((b) => test[b.test_key] != null);
            return (
              <details key={test.id} className="rounded-lg bg-[var(--color-surface-elevated)] overflow-hidden">
                <summary className="flex items-center justify-between px-3 py-2 cursor-pointer list-none">
                  <span className="text-sm font-medium text-[var(--color-text)]">{formatDate(test.test_date)}</span>
                  <span className="text-xs text-[var(--color-text-muted)]">{recordedFields.length} tests</span>
                </summary>
                <div className="px-3 pb-3 pt-1 space-y-1 border-t border-[var(--color-border)]">
                  {recordedFields.map((bm) => (
                    <div key={bm.test_key} className="flex items-center justify-between text-xs">
                      <span className="text-[var(--color-text-secondary)]">{bm.display_name}</span>
                      <span className="text-[var(--color-text)] font-medium">
                        {String(test[bm.test_key])} <span className="text-[var(--color-text-muted)] font-normal">{bm.unit}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      </section>
    </div>
  );
}
