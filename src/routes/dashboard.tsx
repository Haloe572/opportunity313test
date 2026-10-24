import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Bookmark, Eye, FileText, MapPin, User } from "lucide-react";
import { RequireAuth, Loading } from "@/components/auth-gate";
import { PageShell } from "@/components/brand";
import { OpportunityCard } from "@/components/opportunity-card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useSaved } from "@/hooks/use-saved";
import { profileCompletion, profileQuery, recentViewsQuery } from "@/lib/data";
import { CATEGORIES, EDUCATION_LEVELS, labelFor, toneClasses } from "@/lib/constants";
import { cn } from "@/lib/utils";
import mascot from "@/assets/mascot.png";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Opportunity313" },
      { name: "description", content: "Your saved opportunities, progress and recent activity." },
      { property: "og:title", content: "Dashboard — Opportunity313" },
      { property: "og:description", content: "Your garage of saved opportunities." },
    ],
  }),
  component: () => <RequireAuth><PageShell><Dashboard /></PageShell></RequireAuth>,
});

function Dashboard() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useQuery(profileQuery(user!.id));
  const { data: views } = useQuery(recentViewsQuery(user!.id));
  const { saved, ids, toggle } = useSaved();
  if (isLoading) return <Loading />;

  const pct = profileCompletion(profile);
  const applied = saved.filter((s) => s.status === "applied").length;
  const circ = 2 * Math.PI * 34;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="headline text-4xl sm:text-5xl normal-case">Welcome back{profile?.display_name ? `, ${profile.display_name}` : ""}!</h1>
          <p className="text-muted-foreground">Here's your progress and what's next.</p>
        </div>
        {profile && (
          <div className="rounded-2xl border bg-card px-4 py-2 text-sm">
            <p className="flex items-center gap-1.5 font-semibold"><User className="h-4 w-4" />{labelFor(EDUCATION_LEVELS, profile.education_level)}</p>
            <p className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="h-4 w-4" />{profile.city || profile.zip}</p>
          </div>
        )}
      </div>

      <div className="relative overflow-hidden rounded-[2rem] bg-victory p-6 sm:p-8">
        <div className="relative z-10 flex flex-wrap items-center gap-6">
          <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90">
            <circle cx="40" cy="40" r="34" fill="none" stroke="var(--cream)" strokeWidth="9" />
            <circle cx="40" cy="40" r="34" fill="none" stroke="var(--electric)" strokeWidth="9" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)} className="transition-all duration-1000" />
            <text x="40" y="46" textAnchor="middle" className="rotate-90 font-display text-lg" transform="rotate(90 40 40)" fill="var(--asphalt)">{pct}%</text>
          </svg>
          <div className="max-w-xs">
            <h2 className="text-2xl">Profile Completion</h2>
            <p className="text-sm">Complete your profile to get more personalized matches.</p>
            <Button asChild variant="dark" size="sm" className="mt-3"><Link to="/onboarding">{profile ? "Edit Profile" : "Build Profile"} <ArrowRight /></Link></Button>
          </div>
        </div>
        <img src={mascot} alt="" width={1024} height={768} className="drive-in absolute -bottom-4 right-2 hidden w-64 sm:block" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Bookmark, label: "Saved Opportunities", n: saved.length, to: "#saved", cta: "View saved", tone: "text-electric" },
          { icon: FileText, label: "Applications", n: applied, to: "/roadmap", cta: "Track applications", tone: "text-turbo" },
          { icon: Eye, label: "Recently explored", n: views?.length ?? 0, to: "#recent", cta: "See recent", tone: "text-asphalt" },
        ].map((s) => (
          <a key={s.label} href={s.to} className="card-lift rounded-3xl border bg-card p-5 shadow-card">
            <s.icon className={cn("h-8 w-8", s.tone)} />
            <p className="mt-2 text-sm font-semibold">{s.label}</p>
            <p className="font-display text-3xl">{s.n}</p>
            <p className="mt-1 text-xs font-bold text-secondary">{s.cta} →</p>
          </a>
        ))}
      </div>

      <section id="saved">
        <h2 className="text-2xl">Your garage</h2>
        <div className="mt-3 grid gap-4">
          {saved.map((s, i) => s.opportunity && <OpportunityCard key={s.id} o={s.opportunity} index={i} saved={ids.has(s.opportunity_id)} onToggleSave={() => toggle(s.opportunity_id)} />)}
          {saved.length === 0 && <p className="rounded-3xl border-2 border-dashed p-8 text-center text-muted-foreground">Nothing saved yet. Tap the bookmark on any opportunity.</p>}
        </div>
      </section>

      <section id="recent">
        <h2 className="text-2xl">Recently explored</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(views ?? []).map((v) => v.opportunity && (
            <Link key={v.opportunity.id} to="/opportunities/$id" params={{ id: v.opportunity.id }} className="card-lift rounded-2xl border bg-card p-4">
              <p className="font-semibold">{v.opportunity.title}</p>
              <p className="text-xs text-muted-foreground">{v.opportunity.organization}</p>
            </Link>
          ))}
          {!views?.length && <p className="text-sm text-muted-foreground">Opportunities you open will show up here.</p>}
        </div>
      </section>

      <section>
        <h2 className="text-2xl">Recommended lanes</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(profile?.opportunity_types.length ? profile.opportunity_types : ["scholarship", "internship", "job"]).slice(0, 3).map((k) => {
            const c = CATEGORIES[k as keyof typeof CATEGORIES];
            if (!c) return null;
            return (
              <Link key={k} to="/matches" search={{ category: k }} className={cn("card-lift flex items-center gap-3 rounded-2xl p-4", toneClasses[c.tone].bg)}>
                <c.icon className={cn("h-8 w-8", toneClasses[c.tone].fg)} />
                <div><p className="font-display">{c.plural}</p><p className="text-xs text-muted-foreground">{c.blurb}</p></div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
