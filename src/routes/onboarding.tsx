import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Flag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RequireAuth, Loading } from "@/components/auth-gate";
import { PageShell } from "@/components/brand";
import { LapProgress } from "@/components/lap-progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { profileQuery } from "@/lib/data";
import { CATEGORIES, CATEGORY_KEYS, EDUCATION_LEVELS, GOALS, INTERESTS, labelFor } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Build your route — Opportunity313" },
      { name: "description", content: "Tell us about yourself in 4 quick laps so we can match you with opportunities." },
      { property: "og:title", content: "Build your route — Opportunity313" },
      { property: "og:description", content: "Four quick laps to personalized matches." },
    ],
  }),
  component: () => <RequireAuth><PageShell><Onboarding /></PageShell></RequireAuth>,
});

const LAPS = ["Basic Info", "Education & Interests", "Goals", "Review"];

type Form = {
  display_name: string; age: string; city: string; zip: string; education_level: string;
  interests: string[]; goals: string[]; goals_note: string; opportunity_types: string[];
};

function Chips({ options, value, onChange, max }: { options: { value: string; label: string }[]; value: string[]; onChange: (v: string[]) => void; max?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button
            key={o.value} type="button"
            onClick={() => onChange(on ? value.filter((v) => v !== o.value) : max && value.length >= max ? value : [...value, o.value])}
            className={cn("rounded-full border-2 px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5", on ? "border-secondary bg-secondary text-secondary-foreground" : "border-border bg-card hover:border-foreground/30")}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Onboarding() {
  const { user } = useAuth();
  const uid = user!.id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: existing, isLoading } = useQuery(profileQuery(uid));
  const [lap, setLap] = useState(0);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState<Form>({ display_name: "", age: "", city: "Detroit, MI", zip: "", education_level: "", interests: [], goals: [], goals_note: "", opportunity_types: [] });

  useEffect(() => {
    if (existing) setF({
      display_name: existing.display_name ?? "", age: existing.age?.toString() ?? "", city: existing.city ?? "", zip: existing.zip ?? "",
      education_level: existing.education_level ?? "", interests: existing.interests, goals: existing.goals, goals_note: existing.goals_note ?? "", opportunity_types: existing.opportunity_types,
    });
  }, [existing]);

  if (isLoading) return <Loading />;
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));
  const ageNum = Number(f.age);
  const canNext = [
    !!f.display_name && ageNum >= 10 && ageNum <= 99 && (!!f.city || !!f.zip),
    !!f.education_level && f.interests.length > 0,
    f.goals.length > 0 && f.opportunity_types.length > 0,
    true,
  ][lap];

  async function finish() {
    setSaving(true);
    const { error } = await supabase.from("student_profiles").upsert({
      user_id: uid, display_name: f.display_name, age: ageNum, city: f.city || null, zip: f.zip || null,
      education_level: f.education_level, interests: f.interests, goals: f.goals, goals_note: f.goals_note || null, opportunity_types: f.opportunity_types,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["profile", uid] });
    toast.success("Green flag! Finding your matches…");
    navigate({ to: "/matches" });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <LapProgress laps={LAPS} current={lap} />
      <div key={lap} className="rise-in mt-10 rounded-[2rem] border bg-card p-6 shadow-card sm:p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Lap {lap + 1} of 4</p>
        {lap === 0 && (
          <>
            <h1 className="headline mt-1 text-4xl">Let's get you on track</h1>
            <p className="mt-1 text-muted-foreground">Tell us a bit about yourself so we can find the best opportunities for you.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label>First name</Label><Input className="mt-1 rounded-xl" value={f.display_name} onChange={(e) => set("display_name", e.target.value)} placeholder="Jordan" /></div>
              <div><Label>Your age</Label><Input className="mt-1 rounded-xl" type="number" min={10} max={99} value={f.age} onChange={(e) => set("age", e.target.value)} placeholder="17" /></div>
              <div><Label>ZIP code</Label><Input className="mt-1 rounded-xl" value={f.zip} onChange={(e) => set("zip", e.target.value)} placeholder="48201" /></div>
              <div className="sm:col-span-2"><Label>City</Label><Input className="mt-1 rounded-xl" value={f.city} onChange={(e) => set("city", e.target.value)} placeholder="Detroit, MI" /></div>
            </div>
          </>
        )}
        {lap === 1 && (
          <>
            <h1 className="headline mt-1 text-4xl">Education & interests</h1>
            <Label className="mt-6 block">Education level</Label>
            <div className="mt-2"><Chips options={EDUCATION_LEVELS} value={f.education_level ? [f.education_level] : []} onChange={(v) => set("education_level", v.at(-1) ?? "")} /></div>
            <Label className="mt-6 block">Your interests <span className="text-muted-foreground">(select up to 3)</span></Label>
            <div className="mt-2"><Chips options={INTERESTS} value={f.interests} onChange={(v) => set("interests", v)} max={3} /></div>
          </>
        )}
        {lap === 2 && (
          <>
            <h1 className="headline mt-1 text-4xl">Where are you headed?</h1>
            <Label className="mt-6 block">Your goals</Label>
            <div className="mt-2"><Chips options={GOALS} value={f.goals} onChange={(v) => set("goals", v)} /></div>
            <Label className="mt-6 block">Opportunity types you want</Label>
            <div className="mt-2"><Chips options={CATEGORY_KEYS.map((k) => ({ value: k, label: CATEGORIES[k].plural }))} value={f.opportunity_types} onChange={(v) => set("opportunity_types", v)} /></div>
            <Label className="mt-6 block">Anything else? <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea className="mt-2 rounded-xl" value={f.goals_note} onChange={(e) => set("goals_note", e.target.value)} placeholder="I want to study engineering at Wayne State…" />
          </>
        )}
        {lap === 3 && (
          <>
            <h1 className="headline mt-1 text-4xl">Ready to race?</h1>
            <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
              {[
                ["Name", f.display_name], ["Age", f.age], ["Location", [f.city, f.zip].filter(Boolean).join(" · ")],
                ["Education", labelFor(EDUCATION_LEVELS, f.education_level)],
                ["Interests", f.interests.map((i) => labelFor(INTERESTS, i)).join(", ")],
                ["Goals", f.goals.map((g) => labelFor(GOALS, g)).join(", ")],
                ["Looking for", f.opportunity_types.map((t) => CATEGORIES[t as keyof typeof CATEGORIES]?.plural).join(", ")],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-muted p-3"><dt className="text-xs font-bold uppercase text-muted-foreground">{k}</dt><dd className="mt-0.5 font-semibold">{v || "—"}</dd></div>
              ))}
            </dl>
          </>
        )}
        <div className="mt-8 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setLap((l) => l - 1)} disabled={lap === 0}><ArrowLeft /> Back</Button>
          {lap < 3 ? (
            <Button variant="race" size="lg" disabled={!canNext} onClick={() => setLap((l) => l + 1)}>Next: {LAPS[lap + 1]} <ArrowRight /></Button>
          ) : (
            <Button variant="race" size="lg" disabled={saving} onClick={finish}><Flag /> Start matching</Button>
          )}
        </div>
      </div>
    </div>
  );
}
