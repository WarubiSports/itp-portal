import Image from "next/image";
import type { PlayerRecord } from "@/lib/resolvePlayer";

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const getInitials = (first: string, last: string) =>
  `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();

interface WelcomeHeaderProps {
  player: PlayerRecord;
  scoutInfo?: { name: string; affiliation: string | null } | null;
  labelPrefix?: string;
}

export const WelcomeHeader = ({ player, scoutInfo, labelPrefix = "Trial" }: WelcomeHeaderProps) => {
  const range =
    player.start_date && player.end_date
      ? `${formatDate(player.start_date)} – ${formatDate(player.end_date)}`
      : player.start_date
      ? `Starting ${formatDate(player.start_date)}`
      : null;

  const initials = getInitials(player.first_name, player.last_name);

  return (
    <div className="relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand)] via-[#8B1118] to-[var(--color-bg)]" />

      {/* Diagonal stripe pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 10px,
            rgba(255,255,255,0.1) 10px,
            rgba(255,255,255,0.1) 12px
          )`,
        }}
      />

      {/* Content */}
      <div className="relative px-5 pt-8 pb-8">
        {/* Co-branded logo lockup — Warubi left, title center, FC Köln right */}
        <div className="flex items-center justify-between mb-6">
          <Image
            src="/warubi-sports-logo.png"
            alt="Warubi Sports"
            width={90}
            height={24}
            priority
            className="opacity-90 object-contain"
          />
          <div className="text-center">
            <p className="text-[9px] font-bold tracking-[3px] text-white/70 uppercase">
              International Talent Pathway
            </p>
          </div>
          <Image
            src="/fc-koln-crest.png"
            alt="1. FC Köln"
            width={36}
            height={44}
            priority
            className="opacity-90 object-contain"
          />
        </div>

        {/* Red accent bar */}
        <div className="h-[2px] bg-white/20 mb-5 rounded-full overflow-hidden">
          <div className="h-full w-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </div>

        {/* Player info */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-[var(--color-brand)] opacity-40 blur-md" />
            <div className="relative w-14 h-14 rounded-full bg-[var(--color-surface)] ring-2 ring-white/20 flex items-center justify-center text-white font-bold text-lg font-[family-name:var(--font-outfit)]">
              {initials}
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-[family-name:var(--font-outfit)] tracking-tight">
              Welcome, {player.first_name}
            </h1>
            <span className="inline-block mt-1 text-xs font-medium text-white/80 bg-white/10 backdrop-blur-sm rounded-full px-3 py-0.5">
              {range ? `${labelPrefix}: ${range}` : 'Dates to be confirmed'}
            </span>
            {scoutInfo && (
              <p className="text-xs text-white/50 mt-1">
                Referred by {scoutInfo.name}
                {scoutInfo.affiliation && ` (${scoutInfo.affiliation})`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom fade into page bg */}
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[var(--color-bg)] to-transparent" />
    </div>
  );
};
