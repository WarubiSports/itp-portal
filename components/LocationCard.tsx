import {
  Home,
  Dumbbell,
  Utensils,
  TreePine,
  MapPin,
  ExternalLink,
} from "lucide-react";
import type { ITPLocation, LocationCategory } from "@/lib/types";

const categoryConfig: Record<
  LocationCategory,
  { label: string; icon: React.ElementType }
> = {
  housing: { label: "Housing", icon: Home },
  training: { label: "Training Facility", icon: MapPin },
  gym: { label: "Gym", icon: Dumbbell },
  dining: { label: "Dining", icon: Utensils },
  leisure: { label: "Leisure", icon: TreePine },
};

export const LocationCard = ({ location }: { location: ITPLocation }) => {
  const config = categoryConfig[location.category];
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]">
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          {config.label}
        </p>
        <p className="font-medium text-[var(--color-text)]">
          {location.name}
        </p>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {location.address}
        </p>
        {location.maps_url && (
          <a
            href={location.maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-brand)] hover:underline"
          >
            Maps <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  );
};
