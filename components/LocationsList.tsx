"use client";

import { useState, useMemo } from "react";
import { Home, Dumbbell, Utensils, TreePine, MapPin, LayoutGrid } from "lucide-react";
import type { ITPLocation, LocationCategory } from "@/lib/types";
import { LocationCard } from "./LocationCard";

const categoryOrder: LocationCategory[] = [
  "housing",
  "training",
  "gym",
  "dining",
  "leisure",
];

const tabConfig: Record<LocationCategory, { label: string; icon: React.ElementType }> = {
  housing: { label: "Housing", icon: Home },
  training: { label: "Training", icon: MapPin },
  gym: { label: "Gym", icon: Dumbbell },
  dining: { label: "Dining", icon: Utensils },
  leisure: { label: "Leisure", icon: TreePine },
};

type TabValue = "all" | LocationCategory;

export const LocationsList = ({ locations }: { locations: ITPLocation[] }) => {
  const [activeTab, setActiveTab] = useState<TabValue>("all");

  // Group by category with counts
  const grouped = useMemo(() => {
    const map: Record<LocationCategory, ITPLocation[]> = {
      housing: [],
      training: [],
      gym: [],
      dining: [],
      leisure: [],
    };
    for (const loc of locations) {
      map[loc.category]?.push(loc);
    }
    return map;
  }, [locations]);

  // Tabs — only show ones with items
  const availableTabs = categoryOrder.filter((cat) => grouped[cat].length > 0);

  if (locations.length === 0) return null;

  const showAll = activeTab === "all";
  const visibleCategories = showAll
    ? availableTabs
    : availableTabs.filter((c) => c === activeTab);

  return (
    <section className="px-4 pb-12">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--color-text)] font-[family-name:var(--font-outfit)]">
          Key Locations
        </h2>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-all
            ${
              activeTab === "all"
                ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            }`}
        >
          <LayoutGrid size={12} />
          All ({locations.length})
        </button>
        {availableTabs.map((cat) => {
          const cfg = tabConfig[cat];
          const Icon = cfg.icon;
          const isActive = activeTab === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-all
                ${
                  isActive
                    ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                }`}
            >
              <Icon size={12} />
              {cfg.label} ({grouped[cat].length})
            </button>
          );
        })}
      </div>

      {/* Grouped sections */}
      <div className="flex flex-col gap-5">
        {visibleCategories.map((cat) => {
          const items = grouped[cat];
          const cfg = tabConfig[cat];
          const Icon = cfg.icon;
          return (
            <div key={cat}>
              {showAll && (
                <div className="mb-2 flex items-center gap-2">
                  <Icon size={14} className="text-[var(--color-text-muted)]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                    {cfg.label}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    · {items.length}
                  </span>
                  <div className="ml-2 h-px flex-1 bg-[var(--color-border)]" />
                </div>
              )}
              <div className="flex flex-col gap-2.5">
                {items.map((location) => (
                  <LocationCard key={location.id} location={location} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
