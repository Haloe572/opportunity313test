import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Search } from "lucide-react";
import { PageShell } from "@/components/brand";
import { OpportunityCard } from "@/components/opportunity-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useSaved } from "@/hooks/use-saved";
import { profileQuery, publishedOpportunitiesQuery } from "@/lib/data";
import { CATEGORIES, CATEGORY_KEYS } from "@/lib/constants";
import { rankOpportunities } from "@/lib/matching";
import { cn } from "@/lib/utils";
import mascot from "@/assets/mascot.png";

export const Route = createFileRoute("/matches")({
  validateSearch: z.object({ category: z.string().optional() }),
  loader: ({ context }) => context.queryClient.ensureQueryData(publishedOpportunitiesQuery()),
  head: () => ({
    meta: [
      { title: "Your Matches — Opportunity313" },
      { name: "description", content: "Scholarships, grants, internships, jobs and training matched to your profile." },
      { property: "og:title", content: "Your Matches — Opportunity313" },
      { property: "og:description", content: "Opportunities that fit your interests and goals." },
    ],
  }),
  component: () => <PageShell><Matches /></PageShell>,
});

function Matches() {
  const { category: initialCat } = Route.useSearch();
  const { user } = useAuth();
  const { data: all } = useSuspenseQuery(publishedOpportunitiesQuery());
  const { data: profile } = useQuery({ ...profileQuery(user?.id ?? ""), enabled: !!user });
  const { ids, toggle } = useSaved();
  const [cat, setCat] = useState(initialCat ?? "all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"match" | "deadline">("match");
  const [showAll, setShowAll] = useState(false);

  const list = useMemo(() => {
    let rows: { o: (typeof all)[number]; reasons?: string[]; score: number }[];
    if (profile && !showAll) {
      rows = rankOpportunities(profile, all).map((r) => ({ o: r.opportunity, reasons: r.reasons, score: r.score }));
    } else {
      rows = all.map((o) => ({ o, score: 0 }));
    }
    if (cat !== "all") rows = rows.filter((r) => r.o.category === cat);
    if (q) {
      const s = q.toLowerCase();
      rows = rows.filter((r) => [r.o.title, r.o.organization, r.o.description, ...r.o.tags].join(" ").toLowerCase().includes(s));
    }
    if (sort === "deadline") rows = [...rows].sort((a, b) => (a.o.deadline ?? "9999").localeCompare(b.o.deadline ?? "9999"));
    return rows;
  }, [all, profile, cat, q, sort, showAll]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="headline text-4xl sm:text-5xl">{profile ? "Your Matches" : "Opportunities"}</h1>
          <p className="mt-1 text-muted-foreground">
            {profile ? "Based on your profile, here are opportunities that fit your interests and goals." : "Browse everything — or build your profile for personalized matches."}
          </p>
        </div>
        {!profile && <Button asChild variant="race"><Link to={user ? "/onboarding" : "/auth"}>Get matched</Link></Button>}
        {profile && (
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} className="accent-[var(--electric)]" /> Show all opportunities
          </label>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex flex-1 gap-2 overflow-x-auto pb-1">
          {["all", ...CATEGORY_KEYS].map((k) => (
            <button key={k} onClick={() => setCat(k)} className={cn("whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors", cat === k ? "bg-asphalt text-cream" : "bg-muted hover:bg-border")}>
              {k === "all" ? "All" : CATEGORIES[k].plural}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 md:w-56">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="rounded-full pl-9" />
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as "match" | "deadline")}>
            <SelectTrigger className="w-36 rounded-full"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="match">Best match</SelectItem><SelectItem value="deadline">Deadline</SelectItem></SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        {list.map((r, i) => (
          <OpportunityCard key={r.o.id} o={r.o} index={i} reasons={r.reasons} saved={ids.has(r.o.id)} onToggleSave={() => toggle(r.o.id)} />
        ))}
        {list.length === 0 && (
          <div className="rounded-3xl border-2 border-dashed p-12 text-center">
            <img src={mascot} alt="" width={1024} height={768} className="mx-auto h-20 w-auto idle-bob" />
            <h3 className="mt-3 text-xl">No matches on this stretch yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">New opportunities are added by our team regularly. Try another lane or check back soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
