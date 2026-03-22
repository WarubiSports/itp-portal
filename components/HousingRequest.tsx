"use client";

import { useState } from "react";
import { Home, Check, Loader2, Clock, XCircle } from "lucide-react";

interface HousingAvailability {
  house_name: string;
  available: number;
  total_beds: number;
}

interface HousingRequestProps {
  prospectId: string;
  trialStart: string;
  trialEnd: string;
  availability: HousingAvailability[];
  totalAvailable: number;
  alreadyRequested: boolean;
  housingStatus?: string | null;
  accommodationNotes?: string | null;
}

export const HousingRequest = ({
  prospectId,
  trialStart,
  trialEnd,
  availability,
  totalAvailable,
  alreadyRequested,
  housingStatus,
  accommodationNotes,
}: HousingRequestProps) => {
  const [requested, setRequested] = useState(alreadyRequested);
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/housing-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId }),
      });
      if (res.ok) {
        setRequested(true);
      }
    } catch {
      // Silently fail — staff will see it anyway
    } finally {
      setLoading(false);
    }
  };

  const hasSpace = totalAvailable > 0;

  // Declined — houses are full
  if (housingStatus === "declined") {
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
          <div className="flex items-start gap-3">
            <XCircle size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Unfortunately, our houses are full for your dates
              </p>
              {accommodationNotes && (
                <p className="mt-1.5 text-sm text-amber-800 dark:text-amber-300">
                  {accommodationNotes}
                </p>
              )}
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                If you need help finding accommodation nearby, feel free to reach out to us.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Approved — waiting for room assignment
  if (housingStatus === "approved") {
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/40">
          <div className="flex items-center gap-2">
            <Check size={16} className="text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
              Housing confirmed — your room will be assigned shortly
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Availability info */}
      <div
        className={`rounded-xl border p-3 ${
          hasSpace
            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40"
            : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40"
        }`}
      >
        <p
          className={`text-sm font-semibold ${
            hasSpace
              ? "text-emerald-900 dark:text-emerald-200"
              : "text-amber-900 dark:text-amber-200"
          }`}
        >
          {hasSpace
            ? `${totalAvailable} bed${totalAvailable !== 1 ? "s" : ""} available during your trial`
            : "Houses are full during your trial dates"}
        </p>
        {hasSpace && (
          <div className="mt-1.5 flex flex-wrap gap-2">
            {availability
              .filter((h) => h.available > 0)
              .map((h) => (
                <span
                  key={h.house_name}
                  className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                >
                  {h.house_name}: {h.available}/{h.total_beds}
                </span>
              ))}
          </div>
        )}
      </div>

      {/* Pending or request button */}
      {requested || housingStatus === "pending" ? (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40">
          <Clock size={16} className="text-amber-600 dark:text-amber-400" />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Housing requested — waiting for staff confirmation
          </p>
        </div>
      ) : (
        <button
          onClick={handleRequest}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#ED1C24] bg-white px-4 py-3 text-sm font-semibold text-[#ED1C24] transition-colors hover:bg-red-50 disabled:opacity-50 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Home size={16} />
          )}
          {hasSpace ? "Request ITP Housing" : "Request Housing (Waitlist)"}
        </button>
      )}

      {!hasSpace && !requested && housingStatus !== "pending" && (
        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
          You can still request — staff may find availability or suggest alternatives.
        </p>
      )}
    </div>
  );
};
