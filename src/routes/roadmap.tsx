import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, Flag, MapPin, Trophy, Zap } from "lucide-react";
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
import track from "@/assets/road-track.png";

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

// Where each milestone node sits on the track artwork (percent of container).
const NODE_POS = [
  { x: 7, y: 62 },
  { x: 34, y: 22 },
  { x: 60, y: 60 },
  { x: 88, y: 30 },
];

function Roadmap() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: profile, isLoading } = useQuery(profileQuery(user!.id));
  const { saved, loading } = useSaved();
  if (isLoading || loading) return <Loading />;

  const anyApplied = saved.some((s) => (s.checklist as Record<string, boolean>)['apply']);
  const allDone = saved.some((s) => (s.checklist as Record<string, boolean>)['follow_up']);
  const milestones = [
    { title: "Build your profile", blurb: "Tell us about yourself, your interests, and your goals.", done: profileCompletion(profile) >= 70, to: "/onboarding" as const, cta: "View Profile" },
    { title: "Explore opportunities", blurb: "Discover internships, scholarships, programs and more in Detroit and beyond.", done: saved.length > 0, to: "/matches" as const, cta: "Explore Opportunities" },
    { title: "Apply & prepare", blurb: "Get ready, submit your applications, and use our resources to stand out.", done: anyApplied, to: "/matches" as const, cta: "View Resources" },
    { title: "Track your progress", blurb: "See your applications, celebrate wins, and keep moving forward.", done: allDone, to: "/dashboard" as const, cta: "View Dashboard" },
  ];
  const currentIdx = milestones.findIndex((m) => !m.done);
  const current = currentIdx === -1 ? milestones.length - 1 : currentIdx;
  const lapsDone = milestones.filter((m) => m.done).length;
  const pct = Math.round((lapsDone / milestones.length) * 100);

  async function toggleStep(id: string, checklist: Record<string, boolean>, key: string) {
    const next = { ...checklist, [key]: !checklist[key] };
    await supabase.from("saved_opportunities").update({ checklist: next, status: next['apply'] ? "applied" : "saved" }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["saved", user!.id] });
  }

  const nodeStyle = (i: number) =>
    cn("flex h-12 w-12 items-center justify-center rounded-full border-4 border-background font-display text-xl shadow-pop transition-transform",
      milestones[i]!.done ? "bg-success text-primary-foreground" : i === current ? "bg-victory text-asphalt scale-110 ring-4 ring-victory/40" : "bg-asphalt text-primary-foreground");

  return (
    <div>
      {/* Hero */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-sm uppercase tracking-[0.25em] text-turbo">Detroit drives opportunity</p>
          <h1 className="headline mt-1 text-5xl sm:text-6xl">
            Your <span className="text-primary">Roadmap</span>
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">A personalized action plan to help you explore opportunities, build your future, and cross the finish line.</p>
        </div>
        <div aria-hidden className="checker-strip hidden h-12 w-24 rounded-lg shadow-pop sm:block" />
      </div>

      {/* Track map */}
      <div className="relative mt-10 hidden overflow-visible md:block">
        <img src={track} alt="" width={1920} height={768} loading="lazy" className="w-full select-none" draggable={false} />
        {/* "You are here" car */}
        <div
          className="absolute z-20 -translate-x-1/2 -translate-y-full"
          style={{ left: `${NODE_POS[current]!.x}%`, top: `${NODE_POS[current]!.y}%` }}
        >
          <div className="flex flex-col items-center">
            <span className="mb-1 whitespace-nowrap rounded-full bg-asphalt px-3 py-1 font-display text-[10px] uppercase tracking-widest text-victory shadow-pop">You are here!</span>
            <img src={mascot} alt="" width={1024} height={768} className="idle-bob h-14 w-auto drop-shadow-xl" />
          </div>
        </div>
        {milestones.map((m, i) => (
          <div key={m.title} className="absolute z-10 -translate-x-1/2 -translate-y-1/2" style={{ left: `${NODE_POS[i]!.x}%`, top: `${NODE_POS[i]!.y}%` }}>
            <div className={nodeStyle(i)}>{m.done ? <Check className="h-6 w-6" /> : i + 1}</div>
          </div>
        ))}
      </div>

      {/* Milestone cards */}
      <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {milestones.map((m, i) => {
          const state = m.done ? "Completed" : i === current ? "In Progress" : "Upcoming";
          return (
            <li key={m.title} className="rise-in" style={{ animationDelay: `${i * 90}ms` }}>
              <Link to={m.to} className={cn("card-lift flex h-full flex-col rounded-3xl border bg-card p-5 shadow-card", i === current && "border-victory ring-2 ring-victory/50")}>
                <div className="flex items-center justify-between">
                  <div className={cn(nodeStyle(i), "h-10 w-10 text-base shadow-none")}>{m.done ? <Check className="h-5 w-5" /> : i + 1}</div>
                  <span className={cn("rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide",
                    m.done ? "bg-success/15 text-success" : i === current ? "bg-victory/40 text-asphalt" : "bg-muted text-muted-foreground")}>{state}</span>
                </div>
                <p className="mt-3 font-display text-lg leading-tight">{m.title}</p>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{m.blurb}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-secondary">{m.cta} <ArrowRight className="h-4 w-4" /></span>
              </Link>
            </li>
          );
        })}
      </ol>

      {/* Progress bar with car */}
      <div className="mt-10 rounded-3xl border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between gap-4">
          <p className="font-display text-xl"><Flag className="mr-2 inline h-5 w-5 text-turbo" />Your progress</p>
          <p className="text-sm font-semibold text-muted-foreground">{lapsDone} of {milestones.length} laps completed · <span className="font-display text-lg text-asphalt">{pct}%</span></p>
        </div>
        <div className="relative mt-6 pb-1">
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-secondary transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <img src={mascot} alt="" width={1024} height={768} className="absolute -top-5 h-10 w-auto -translate-x-1/2 transition-all duration-700" style={{ left: `max(2rem, ${pct}%)` }} />
        </div>
        <div className="mt-5 flex items-center gap-4 rounded-2xl bg-victory-soft p-4">
          <Trophy className="h-8 w-8 shrink-0 text-turbo" />
          <div>
            <p className="font-display text-lg leading-tight">You're on your way!</p>
            <p className="text-sm text-muted-foreground">{pct === 100 ? "Finish line crossed — keep an eye on your dashboard for what's next." : "Great start! Keep going — big opportunities are ahead."}</p>
          </div>
        </div>
      </div>

      {/* Race plans */}
      <div className="mt-12 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-pop"><Zap className="h-5 w-5" /></div>
        <div>
          <h2 className="headline text-3xl">Race plans</h2>
          <p className="text-sm text-muted-foreground">Checkpoints for each saved opportunity.</p>
        </div>
      </div>
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
              <div className="mt-3 flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-secondary transition-all duration-700" style={{ width: `${(done / CHECKPOINTS.length) * 100}%` }} /></div>
                <span className="text-xs font-bold text-muted-foreground">{done}/{CHECKPOINTS.length}</span>
              </div>
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
            <MapPin className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">Save an opportunity to start a race plan.</p>
            <Button asChild variant="race" className="mt-4"><Link to="/matches">Find opportunities</Link></Button>
          </div>
        )}
      </div>
    </div>
  );
}
