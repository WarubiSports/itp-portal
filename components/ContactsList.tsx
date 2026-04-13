"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type Contact = {
  name: string;
  role: string;
  organization?: string;
  photo_url?: string;
  nationality?: string;
};

const countryFlags: Record<string, string> = {
  DE: "\uD83C\uDDE9\uD83C\uDDEA", MX: "\uD83C\uDDF2\uD83C\uDDFD", US: "\uD83C\uDDFA\uD83C\uDDF8", GB: "\uD83C\uDDEC\uD83C\uDDE7", FR: "\uD83C\uDDEB\uD83C\uDDF7", ES: "\uD83C\uDDEA\uD83C\uDDF8",
  IT: "\uD83C\uDDEE\uD83C\uDDF9", BR: "\uD83C\uDDE7\uD83C\uDDF7", AR: "\uD83C\uDDE6\uD83C\uDDF7", NL: "\uD83C\uDDF3\uD83C\uDDF1", PT: "\uD83C\uDDF5\uD83C\uDDF9", JP: "\uD83C\uDDEF\uD83C\uDDF5",
  KR: "\uD83C\uDDF0\uD83C\uDDF7", AU: "\uD83C\uDDE6\uD83C\uDDFA", CA: "\uD83C\uDDE8\uD83C\uDDE6", AT: "\uD83C\uDDE6\uD83C\uDDF9", CH: "\uD83C\uDDE8\uD83C\uDDED", BE: "\uD83C\uDDE7\uD83C\uDDEA",
  CO: "\uD83C\uDDE8\uD83C\uDDF4", CL: "\uD83C\uDDE8\uD83C\uDDF1", PE: "\uD83C\uDDF5\uD83C\uDDEA", IE: "\uD83C\uDDEE\uD83C\uDDEA", NG: "\uD83C\uDDF3\uD83C\uDDEC", GH: "\uD83C\uDDEC\uD83C\uDDED",
};

export const ContactsList = ({ contacts }: { contacts: Contact[] }) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (contacts.length === 0) return null;

  return (
    <section className="px-4 pb-8">
      <h2 className="mb-4 text-lg font-bold text-[var(--color-text)] font-[family-name:var(--font-outfit)]">
        Your Contacts
      </h2>
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border)]">
        {contacts.map((c) => {
          const isExpanded = expanded === c.name;

          return (
            <div key={c.name}>
              <button
                type="button"
                onClick={() => setExpanded(isExpanded ? null : c.name)}
                className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-[var(--color-surface-elevated)] active:bg-[var(--color-surface-elevated)]"
              >
                {c.photo_url ? (
                  <div className="relative shrink-0">
                    <img
                      src={c.photo_url}
                      alt={c.name}
                      className="h-10 w-10 rounded-full object-cover object-top ring-2 ring-[var(--color-brand)]/20"
                    />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-glow)]">
                    <span className="text-sm font-semibold text-[var(--color-brand)]">
                      {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[var(--color-text)]">
                    {c.name} {c.nationality && countryFlags[c.nationality] ? countryFlags[c.nationality] : ""}
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {[c.role, c.organization].filter(Boolean).join(" \u00B7 ")}
                  </p>
                  {c.photo_url && !isExpanded && (
                    <p className="text-xs text-[var(--color-brand)]/60 mt-0.5">Tap to view photo</p>
                  )}
                </div>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-[var(--color-text-muted)] transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
              </button>

              {isExpanded && c.photo_url && (
                <div className="px-4 pb-4">
                  <img
                    src={c.photo_url}
                    alt={c.name}
                    className="w-full rounded-xl object-cover"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
