import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Opportunity } from "@/lib/data";
import { APPLICATION_STATUSES, CATEGORIES, CATEGORY_KEYS, EDUCATION_LEVELS, INTERESTS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type Draft = Omit<Opportunity, "id" | "created_at" | "updated_at">;

const empty: Draft = {
  title: "", organization: "", category: "scholarship", description: "", min_age: null, max_age: null,
  eligible_areas: [], education_levels: [], tags: [], deadline: null, application_status: "unknown",
  official_url: null, notes: null, prep_tips: null, image_url: null, last_verified: null, published: false, is_placeholder: false,
};

const list = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

function Toggles({ options, value, onChange }: { options: { value: string; label: string }[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="mt-1 flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button key={o.value} type="button" onClick={() => onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value])}
            className={cn("rounded-full border px-3 py-1 text-xs font-semibold", on ? "border-secondary bg-secondary text-secondary-foreground" : "bg-card")}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function AdminForm({ initial }: { initial?: Opportunity }) {
  const [d, setD] = useState<Draft>(initial ? { ...initial } : empty);
  const [areas, setAreas] = useState((initial?.eligible_areas ?? []).join(", "));
  const [extraTags, setExtraTags] = useState((initial?.tags ?? []).filter((t) => !INTERESTS.some((i) => i.value === t)).join(", "));
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));
  const num = (s: string) => (s === "" ? null : Number(s));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const interestTags = d.tags.filter((t) => INTERESTS.some((i) => i.value === t));
    const payload = { ...d, eligible_areas: list(areas), tags: [...interestTags, ...list(extraTags)], official_url: d.official_url || null };
    const { error } = initial
      ? await supabase.from("opportunities").update(payload).eq("id", initial.id)
      : await supabase.from("opportunities").insert(payload);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["opportunities"] });
    qc.invalidateQueries({ queryKey: ["admin-opps"] });
    if (initial) qc.invalidateQueries({ queryKey: ["opportunity", initial.id] });
    navigate({ to: "/admin" });
  }

  async function remove() {
    if (!initial || !confirm("Delete this opportunity permanently?")) return;
    const { error } = await supabase.from("opportunities").delete().eq("id", initial.id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["admin-opps"] });
    qc.invalidateQueries({ queryKey: ["opportunities"] });
    navigate({ to: "/admin" });
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <section className="grid gap-4 rounded-3xl border bg-card p-5 sm:grid-cols-2">
        <div className="sm:col-span-2"><Label>Title *</Label><Input required className="mt-1" value={d.title} onChange={(e) => set("title", e.target.value)} /></div>
        <div><Label>Organization *</Label><Input required className="mt-1" value={d.organization} onChange={(e) => set("organization", e.target.value)} /></div>
        <div>
          <Label>Category</Label>
          <select className="mt-1 h-9 w-full rounded-md border bg-card px-3 text-sm" value={d.category} onChange={(e) => set("category", e.target.value)}>
            {CATEGORY_KEYS.map((k) => <option key={k} value={k}>{CATEGORIES[k].label}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2"><Label>Description</Label><Textarea rows={4} className="mt-1" value={d.description} onChange={(e) => set("description", e.target.value)} /></div>
        <div className="sm:col-span-2"><Label>Official URL</Label><Input type="url" className="mt-1" value={d.official_url ?? ""} onChange={(e) => set("official_url", e.target.value)} placeholder="https://" /></div>
        <div className="sm:col-span-2"><Label>Image URL (optional)</Label><Input type="url" className="mt-1" value={d.image_url ?? ""} onChange={(e) => set("image_url", e.target.value || null)} /></div>
      </section>

      <section className="grid gap-4 rounded-3xl border bg-card p-5 sm:grid-cols-2">
        <h3 className="sm:col-span-2">Eligibility</h3>
        <div><Label>Min age</Label><Input type="number" className="mt-1" value={d.min_age ?? ""} onChange={(e) => set("min_age", num(e.target.value))} /></div>
        <div><Label>Max age</Label><Input type="number" className="mt-1" value={d.max_age ?? ""} onChange={(e) => set("max_age", num(e.target.value))} /></div>
        <div className="sm:col-span-2"><Label>Eligible areas (comma-separated cities / ZIPs; blank = anywhere)</Label><Input className="mt-1" value={areas} onChange={(e) => setAreas(e.target.value)} placeholder="Detroit, 48201, Michigan" /></div>
        <div className="sm:col-span-2"><Label>Education requirements (none selected = any)</Label><Toggles options={EDUCATION_LEVELS} value={d.education_levels} onChange={(v) => set("education_levels", v)} /></div>
        <div className="sm:col-span-2"><Label>Interest tags</Label><Toggles options={INTERESTS} value={d.tags} onChange={(v) => set("tags", v)} /></div>
        <div className="sm:col-span-2"><Label>Extra tags (comma-separated)</Label><Input className="mt-1" value={extraTags} onChange={(e) => setExtraTags(e.target.value)} /></div>
      </section>

      <section className="grid gap-4 rounded-3xl border bg-card p-5 sm:grid-cols-3">
        <h3 className="sm:col-span-3">Status</h3>
        <div><Label>Deadline</Label><Input type="date" className="mt-1" value={d.deadline ?? ""} onChange={(e) => set("deadline", e.target.value || null)} /></div>
        <div>
          <Label>Application status</Label>
          <select className="mt-1 h-9 w-full rounded-md border bg-card px-3 text-sm" value={d.application_status} onChange={(e) => set("application_status", e.target.value)}>
            {APPLICATION_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div><Label>Last verified</Label><Input type="date" className="mt-1" value={d.last_verified ?? ""} onChange={(e) => set("last_verified", e.target.value || null)} /></div>
        <div className="sm:col-span-3"><Label>Notes</Label><Textarea className="mt-1" value={d.notes ?? ""} onChange={(e) => set("notes", e.target.value || null)} /></div>
        <div className="sm:col-span-3"><Label>Preparation tips</Label><Textarea className="mt-1" value={d.prep_tips ?? ""} onChange={(e) => set("prep_tips", e.target.value || null)} /></div>
        <label className="flex items-center gap-2 text-sm font-semibold"><Switch checked={d.published} onCheckedChange={(v) => set("published", v)} /> Published</label>
        <label className="flex items-center gap-2 text-sm font-semibold"><Switch checked={d.is_placeholder} onCheckedChange={(v) => set("is_placeholder", v)} /> Placeholder</label>
      </section>

      <div className="flex flex-wrap justify-between gap-2">
        {initial ? <Button type="button" variant="destructive" onClick={remove}>Delete</Button> : <span />}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/admin" })}>Cancel</Button>
          <Button type="submit" disabled={busy}>{initial ? "Save changes" : "Create opportunity"}</Button>
        </div>
      </div>
    </form>
  );
}
