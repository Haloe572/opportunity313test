import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Trophy } from "lucide-react";
import { RequireAuth, Loading } from "@/components/auth-gate";
import { PageShell } from "@/components/brand";
import { CategoryPill } from "@/components/opportunity-card";
import { AiCoach } from "@/components/ai-coach";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useSaved } from "@/hooks/use-saved";
import { formatDeadline, profileCompletion, profileQuery } from "@/lib/data";
import { cn } from "@/lib/utils";
import mascot from "@/assets/mascot.png";

export const Route = createFileRoute("/roadmap")({
  head: () => ({
    meta: [
      { title: "Your Roadmap — Opportunity313" },
      { name: "description", content: "Your personalized race plan: checkpoints from eligibility to follow-up." },
      { property: "og:title", content: "Your Roadmap — Opportunity313" },
      { property: "og:description", content: "Follow your route to the finish line." },
    ],
  }),
  component: () => <RequireAuth><PageShell><Roadmap /></PageShell></RequireAuth>,
});

export const CHECKPOINTS = [
  { key: "eligibility", label: "Review eligibility" },
  { key: "materials", label: "Gather materials" },
  { key: "resume", label: "Prepare resume / essay" },
  { key: "apply", label: "Apply" },
  { key: "follow_up", label: "Follow up" },
] as const;

function Roadmap() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: profile, isLoading } = useQuery(profileQuery(user!.id));
  const { saved, loading } = useSaved();
  if (isLoading || loading) return <Loading />;

  const anyApplied = saved.some((s) => (s.checklist as Record<string, boolean>).apply);
  const allDone = saved.some((s) => (s.checklist as Record<string, boolean>).follow_up);
  const milestones = [
    { title: "Build your profile", done: profileCompletion(profile) >= 70, to: "/onboarding" as const },
    { title: "Explore opportunities", done: saved.length > 0, to: "/matches" as const },
    { title: "Apply & prepare", done: anyApplied, to: "/roadmap" as const },
    { title: "Track your progress", done: allDone, to: "/dashboard" as const },
  ];
  const current = milestones.findIndex((m) => !m.done);

  async function toggleStep(id: string, checklist: Record<string, boolean>, key: string) {
    const next = { ...checklist, [key]: !checklist[key] };
    await supabase.from("saved_opportunities").update({ checklist: next, status: next.apply ? "applied" : "saved" }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["saved", user!.id] });
  }

  return (
    <div>
      <h1 className="headline text-4xl sm:text-5xl">Your Roadmap</h1>
      <p className="mt-1 text-muted-foreground">A personalized action plan to help you reach your goals.</p>

      <div className="relative mt-10">
        <div aria-hidden className="road absolute bottom-6 left-7 top-6 w-3 rounded-full [background-image:repeating-linear-gradient(180deg,var(--victory)_0_18px,transparent_18px_36px)] [background-size:3px_100%] [background-position:50%_0]" />
        <ol className="relative space-y-6">
          {milestones.map((m, i) => {
            const state = m.done ? "Completed" : i === current ? "In Progress" : "Not Started";
            return (
              <li key={m.title} className="rise-in flex items-center gap-4" style={{ animationDelay: `${i * 100}ms` }}>
                <div className={cn("z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-background text-xl font-black shadow-pop",
                  m.done ? "bg-secondary text-secondary-foreground" : i === current ? "bg-victory text-asphalt" : i % 2 ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}>
                  {m.done ? <Check /> : i + 1}
                </div>
                <Link to={m.to} className="card-lift flex flex-1 items-center justify-between rounded-full border bg-card px-6 py-4 shadow-card">
                  <div>
                    <p className="font-display text-lg">{m.title}</p>
                    <p className={cn("text-xs font-semibold", m.done ? "text-success" : i === current ? "text-turbo" : "text-muted-foreground")}>{state}</p>
                  </div>
                  {i === current && <img src={mascot} alt="" width={1024} height={768} className="h-10 w-auto idle-bob" />}
                </Link>
              </li>
            );
          })}
        </ol>
      </div>

      <h2 className="headline mt-14 text-3xl">Race plans</h2>
      <p className="text-sm text-muted-foreground">Checkpoints for each saved opportunity.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {saved.map((s) => {
          const o = s.opportunity;
          if (!o) return null;
          const cl = s.checklist as Record<string, boolean>;
          const done = CHECKPOINTS.filter((c) => cl[c.key]).length;
          return (
            <div key={s.id} className="rounded-3xl border bg-card p-5 shadow-card">
              <CategoryPill category={o.category} />
              <Link to="/opportunities/$id" params={{ id: o.id }} className="mt-1 block font-display text-lg hover:text-primary">{o.title}</Link>
              <p className="text-xs text-muted-foreground">Deadline: {formatDeadline(o.deadline)}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-secondary transition-all duration-700" style={{ width: `${(done / CHECKPOINTS.length) * 100}%` }} /></div>
              <ul className="mt-3 space-y-1.5">
                {CHECKPOINTS.map((c) => (
                  <li key={c.key}>
                    <button onClick={() => toggleStep(s.id, cl, c.key)} className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm hover:bg-muted">
                      <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors", cl[c.key] ? "border-success bg-success text-primary-foreground" : "border-border")}>{cl[c.key] && <Check className="h-3 w-3" />}</span>
                      <span className={cn(cl[c.key] && "text-muted-foreground line-through")}>{c.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <details className="mt-3"><summary className="cursor-pointer text-sm font-semibold text-secondary">AI coach</summary><div className="mt-3"><AiCoach opportunityId={o.id} /></div></details>
            </div>
          );
        })}
        {saved.length === 0 && (
          <div className="rounded-3xl border-2 border-dashed p-8 text-center md:col-span-2">
            <p className="text-muted-foreground">Save an opportunity to start a race plan.</p>
            <Button asChild variant="race" className="mt-4"><Link to="/matches">Find opportunities</Link></Button>
          </div>
        )}
      </div>

      <div className="mt-10 flex items-center gap-4 rounded-3xl bg-victory-soft p-5">
        <Trophy className="h-10 w-10 text-turbo" />
        <div><p className="font-display text-xl">Keep going!</p><p className="text-sm text-muted-foreground">You're on your way to a brighter future.</p></div>
        <div aria-hidden className="checker-strip ml-auto hidden h-12 w-16 rounded-md sm:block" />
      </div>
    </div>
  );
}
