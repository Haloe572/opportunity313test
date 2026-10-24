import { Link } from "@tanstack/react-router";
import { ArrowRight, Bookmark, BookmarkCheck, CalendarDays, MapPin, User } from "lucide-react";
import { categoryMeta, toneClasses, APPLICATION_STATUSES, labelFor } from "@/lib/constants";
import { formatDeadline, type Opportunity } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CategoryPill({ category, className }: { category: string; className?: string }) {
  const m = categoryMeta(category);
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold", toneClasses[m.tone].pill, className)}>
      {m.label}
    </span>
  );
}

export function ageLabel(o: Pick<Opportunity, "min_age" | "max_age">) {
  if (o.min_age != null && o.max_age != null) return `Ages ${o.min_age}–${o.max_age}`;
  if (o.min_age != null) return `Ages ${o.min_age}+`;
  if (o.max_age != null) return `Up to age ${o.max_age}`;
  return "All ages";
}

export function OpportunityCard({
  o, saved, onToggleSave, reasons, index = 0,
}: {
  o: Opportunity; saved?: boolean; onToggleSave?: () => void; reasons?: string[] | undefined; index?: number;
}) {
  const m = categoryMeta(o.category);
  const Icon = m.icon;
  return (
    <article
      className="card-lift rise-in relative flex flex-col gap-4 overflow-hidden rounded-3xl border bg-card p-4 shadow-card sm:flex-row"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className={cn("flex h-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl sm:h-auto sm:w-32", toneClasses[m.tone].bg)}>
        {o.image_url ? (
          <img src={o.image_url} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <Icon className={cn("h-12 w-12", toneClasses[m.tone].fg)} strokeWidth={2.2} />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <CategoryPill category={o.category} />
              {o.is_placeholder && <span className="rounded-full bg-victory px-2 py-0.5 text-[10px] font-bold uppercase">Placeholder</span>}
            </div>
            <h3 className="mt-1.5 text-lg leading-tight">{o.title}</h3>
            <p className="text-sm text-muted-foreground">{o.organization}</p>
          </div>
          {onToggleSave && (
            <button onClick={onToggleSave} aria-label={saved ? "Remove from saved" : "Save"} className="rounded-full p-2 transition-transform hover:scale-110 hover:bg-muted">
              {saved ? <BookmarkCheck className="h-5 w-5 text-primary" /> : <Bookmark className="h-5 w-5" />}
            </button>
          )}
        </div>
        <p className="mt-1 line-clamp-2 text-sm">{o.description}</p>
        {reasons && reasons.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {reasons.slice(0, 3).map((r) => (
              <span key={r} className="rounded-full bg-electric-soft px-2 py-0.5 text-[11px] font-semibold text-electric">✓ {r}</span>
            ))}
          </div>
        )}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><User className="h-3.5 w-3.5" />{ageLabel(o)}</span>
            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{o.eligible_areas.length ? o.eligible_areas.join(", ") : "Any location"}</span>
            <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{formatDeadline(o.deadline)} · {labelFor(APPLICATION_STATUSES, o.application_status)}</span>
          </div>
          <div className="flex gap-2">
            {o.official_url && (
              <Button asChild variant="outline" size="sm"><a href={o.official_url} target="_blank" rel="noreferrer">Official site</a></Button>
            )}
            <Button asChild variant="soft" size="sm">
              <Link to="/opportunities/$id" params={{ id: o.id }}>View Details <ArrowRight /></Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
