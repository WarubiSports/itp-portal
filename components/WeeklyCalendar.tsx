"use client";

import type { CalendarEvent } from "@/lib/types";

type ContactInfo = {
  id: string;
  name: string;
  role?: string;
  organization?: string;
  photo_url?: string;
};

function fmtTime(time?: string): string {
  if (!time) return "";
  if (/^\d{2}:\d{2}/.test(time)) return time.substring(0, 5);
  const d = new Date(time);
  if (isNaN(d.getTime())) return time.substring(0, 5);
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
    hour12: false,
  });
}

const toDateStr = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatDayHeader = (dateStr: string): string => {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
};

const getDateRange = (start: string, end: string): string[] => {
  const dates: string[] = [];
  const current = new Date(start + "T12:00:00");
  const last = new Date(end + "T12:00:00");
  while (current <= last) {
    dates.push(toDateStr(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

const isToday = (dateStr: string): boolean => {
  return dateStr === toDateStr(new Date());
};

const typeIcons: Record<string, string> = {
  team_training: "\u26BD",
  training: "\u26BD",
  individual_training: "\uD83C\uDFCB\uFE0F",
  gym: "\uD83C\uDFCB\uFE0F",
  match: "\uD83C\uDFDF\uFE0F",
  tournament: "\uD83C\uDFDF\uFE0F",
  video_session: "\uD83C\uDFAC",
  medical: "\uD83C\uDFE5",
  airport_pickup: "\u2708\uFE0F",
  team_activity: "\uD83D\uDC65",
};

const getIcon = (type: string): string | null => typeIcons[type] || null;

export const WeeklyCalendar = ({
  events,
  startDate,
  endDate,
  contactLookup = {},
}: {
  events: CalendarEvent[];
  startDate: string;
  endDate: string;
  contactLookup?: Record<string, ContactInfo>;
}) => {
  if (!startDate || !endDate) {
    return (
      <section className="px-4 pb-8">
        <h2 className="mb-4 text-lg font-bold text-[var(--color-text)] font-[family-name:var(--font-outfit)]">
          Your Schedule
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Visit dates not yet confirmed.
        </p>
      </section>
    );
  }

  const dates = getDateRange(startDate, endDate);

  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const existing = eventsByDate.get(event.date) || [];
    existing.push(event);
    eventsByDate.set(event.date, existing);
  }
  for (const [, dayEvents] of eventsByDate) {
    dayEvents.sort((a, b) => {
      const timeA = fmtTime(a.start_time);
      const timeB = fmtTime(b.start_time);
      return timeA.localeCompare(timeB);
    });
  }

  const getEventContacts = (event: CalendarEvent): ContactInfo[] => {
    const ids = (event.contact_ids && Array.isArray(event.contact_ids) && event.contact_ids.length > 0)
      ? event.contact_ids
      : event.contact_id ? [event.contact_id] : [];
    return ids.map(id => contactLookup[id]).filter((c): c is ContactInfo => !!c);
  };

  return (
    <section className="px-4 pb-8">
      <h2 className="mb-4 text-lg font-bold text-[var(--color-text)] font-[family-name:var(--font-outfit)]">
        Your Schedule
      </h2>

      <div className="flex flex-col gap-4">
        {dates.map((dateStr) => {
          const dayEvents = eventsByDate.get(dateStr) || [];
          const today = isToday(dateStr);

          return (
            <div key={dateStr}>
              <div className="mb-2 flex items-center gap-2">
                <p
                  className={`text-sm font-semibold ${
                    today
                      ? "text-[var(--color-brand)]"
                      : "text-[var(--color-text)]"
                  }`}
                >
                  {formatDayHeader(dateStr)}
                </p>
                {today && (
                  <span className="rounded-full bg-[var(--color-brand)] px-2 py-0.5 text-[10px] font-semibold text-white">
                    Today
                  </span>
                )}
              </div>

              {dayEvents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-3">
                  <p className="text-sm text-[var(--color-text-muted)]">
                    No activities scheduled
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {dayEvents.map((event) => {
                    const contacts = getEventContacts(event);
                    const icon = getIcon(event.type);
                    const timeStr = fmtTime(event.start_time);
                    const endTimeStr = fmtTime(event.end_time);

                    return (
                      <div
                        key={event.id}
                        className={`rounded-xl border p-4 ${
                          today
                            ? "border-[var(--color-brand)]/20 bg-[var(--color-brand-glow)]"
                            : "border-[var(--color-border)] bg-[var(--color-surface)]"
                        }`}
                      >
                        <div className="flex gap-3">
                          {timeStr && (
                            <div className="flex w-12 shrink-0 flex-col items-center pt-0.5">
                              <span className="text-sm font-semibold text-[var(--color-text)]">
                                {timeStr}
                              </span>
                              {endTimeStr && (
                                <span className="text-xs text-[var(--color-text-muted)]">
                                  {endTimeStr}
                                </span>
                              )}
                            </div>
                          )}

                          {timeStr && (
                            <div className="w-px shrink-0 bg-[var(--color-border)]" />
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-2">
                              {icon && <span className="text-base">{icon}</span>}
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-[var(--color-text)]">
                                  {event.title}
                                </p>
                                {event.location && (
                                  <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
                                    {event.location}
                                  </p>
                                )}
                                {event.description && (
                                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                                    {event.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            {contacts.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {contacts.map((c) => (
                                  <div
                                    key={c.id}
                                    className="flex items-center gap-1.5 rounded-full bg-[var(--color-surface-elevated)] py-1 pl-1 pr-2.5"
                                  >
                                    {c.photo_url ? (
                                      <img
                                        src={c.photo_url}
                                        alt={c.name}
                                        className="h-5 w-5 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-brand-glow)]">
                                        <span className="text-[9px] font-semibold text-[var(--color-brand)]">
                                          {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                                        </span>
                                      </div>
                                    )}
                                    <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                                      {c.name.split(" ")[0]}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {contacts.length === 0 && event.contact_name && (
                              <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
                                with {event.contact_name}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
