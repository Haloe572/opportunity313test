import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, CalendarDays, ExternalLink, GraduationCap, MapPin, ShieldCheck, User } from "lucide-react";
import { PageShell } from "@/components/brand";
import { CategoryPill, ageLabel } from "@/components/opportunity-card";
import { AiCoach } from "@/components/ai-coach";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useSaved } from "@/hooks/use-saved";
import { opportunityQuery, formatDeadline } from "@/lib/data";
import { APPLICATION_STATUSES, EDUCATION_LEVELS, categoryMeta, labelFor, toneClasses } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/opportunities/$id")({
  loader: async ({ context, params }) => {
    const o = await context.queryClient.ensureQueryData(opportunityQuery(params.id));
    if (!o) throw notFound();
    return { title: o.title, description: o.description };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.title} — Opportunity313` : "Opportunity — Opportunity313" },
      { name: "description", content: loaderData?.description.slice(0, 155) ?? "Opportunity details" },
      { property: "og:title", content: loaderData?.title ?? "Opportunity313" },
      { property: "og:description", content: loaderData?.description.slice(0, 155) ?? "Opportunity details" },
    ],
  }),
  component: () => <PageShell><Detail /></PageShell>,
});

function Detail() {
  const { id } = Route.useParams();
  const { data: o } = useSuspenseQuery(opportunityQuery(id));
  const { user } = useAuth();
  const { ids, toggle } = useSaved();

  useEffect(() => {
    if (user && o) supabase.from("opportunity_views").upsert({ user_id: user.id, opportunity_id: o.id, viewed_at: new Date().toISOString() }).then(() => {});
  }, [user, o]);

  if (!o) return null;
  const m = categoryMeta(o.category);
  const saved = ids.has(o.id);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <Link to="/matches" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to Opportunities</Link>
        <Button variant="outline" size="sm" onClick={() => toggle(o.id)}>{saved ? <BookmarkCheck className="text-primary" /> : <Bookmark />}{saved ? "Saved" : "Save"}</Button>
      </div>

      <div className="mt-4 overflow-hidden rounded-[2rem] border bg-card shadow-card">
        <div className={cn("relative flex h-48 items-center justify-center sm:h-64", toneClasses[m.tone].bg)}>
          {o.image_url ? <img src={o.image_url} alt="" className="h-full w-full object-cover" /> : <m.icon className={cn("h-24 w-24 idle-bob", toneClasses[m.tone].fg)} />}
          <div aria-hidden className="checker-strip absolute bottom-0 left-0 h-3 w-full opacity-70" />
        </div>
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap gap-2">
            <CategoryPill category={o.category} />
            {o.is_placeholder && <span className="rounded-full bg-victory px-2 py-0.5 text-xs font-bold">PLACEHOLDER — not a real opportunity</span>}
          </div>
          <h1 className="mt-2 text-3xl sm:text-4xl">{o.title}</h1>
          <p className="text-muted-foreground">{o.organization}</p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-1.5"><User className="h-4 w-4" />{ageLabel(o)}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{o.eligible_areas.length ? o.eligible_areas.join(", ") : "Any location"}</span>
            <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{formatDeadline(o.deadline)}</span>
            <span className="inline-flex items-center gap-1.5 font-semibold">{labelFor(APPLICATION_STATUSES, o.application_status)}</span>
          </div>

          <Tabs defaultValue="overview" className="mt-6">
            <TabsList className="h-auto flex-wrap rounded-full bg-muted p-1">
              {["overview", "eligibility", "prepare", "coach"].map((t) => (
                <TabsTrigger key={t} value={t} className="rounded-full px-4 capitalize data-[state=active]:bg-asphalt data-[state=active]:text-cream">{t === "coach" ? "AI Coach" : t}</TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="overview" className="rise-in pt-4">
              <h2 className="text-lg">About</h2>
              <p className="mt-1 whitespace-pre-wrap text-foreground/85">{o.description || "Details need verification."}</p>
              {o.notes && <><h2 className="mt-5 text-lg">Notes</h2><p className="mt-1 whitespace-pre-wrap text-foreground/85">{o.notes}</p></>}
            </TabsContent>
            <TabsContent value="eligibility" className="rise-in pt-4">
              <ul className="grid gap-2 sm:grid-cols-2">
                <li className="rounded-2xl bg-muted p-4"><User className="mb-1 h-5 w-5 text-primary" /><b>Age:</b> {ageLabel(o)}</li>
                <li className="rounded-2xl bg-muted p-4"><MapPin className="mb-1 h-5 w-5 text-primary" /><b>Area:</b> {o.eligible_areas.join(", ") || "Not restricted / needs verification"}</li>
                <li className="rounded-2xl bg-muted p-4"><GraduationCap className="mb-1 h-5 w-5 text-primary" /><b>Education:</b> {o.education_levels.map((e) => labelFor(EDUCATION_LEVELS, e)).join(", ") || "Any / needs verification"}</li>
                <li className="rounded-2xl bg-muted p-4"><CalendarDays className="mb-1 h-5 w-5 text-primary" /><b>Deadline:</b> {formatDeadline(o.deadline)}</li>
              </ul>
            </TabsContent>
            <TabsContent value="prepare" className="rise-in pt-4">
              <p className="whitespace-pre-wrap text-foreground/85">{o.prep_tips || "No prep tips added yet. Try the AI Coach tab for ideas."}</p>
            </TabsContent>
            <TabsContent value="coach" className="rise-in pt-4"><AiCoach opportunityId={o.id} /></TabsContent>
          </Tabs>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {o.official_url ? (
              <Button asChild variant="race" size="lg" className="flex-1"><a href={o.official_url} target="_blank" rel="noreferrer">Apply on official site <ExternalLink /></a></Button>
            ) : (
              <Button variant="race" size="lg" className="flex-1" disabled>Official link needs verification</Button>
            )}
            <Button asChild variant="outline" size="lg" className="flex-1"><Link to="/roadmap">Add to my race plan <ArrowRight /></Link></Button>
          </div>
          <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-success" />
            {o.last_verified ? `Last verified ${formatDeadline(o.last_verified)}` : "Not yet verified by our team"}
          </p>
        </div>
      </div>
    </div>
  );
}
