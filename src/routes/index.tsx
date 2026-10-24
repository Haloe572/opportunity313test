import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Flag, Route as RouteIcon, Sparkles, Target } from "lucide-react";
import hero from "@/assets/hero.jpg";
import mascot from "@/assets/mascot.png";
import { SiteHeader, CheckerDivider } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { CATEGORIES, CATEGORY_KEYS, toneClasses } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Opportunity313 — Your Future. Full Throttle." },
      { name: "description", content: "Detroit students ages 14–24: discover scholarships, grants, internships, jobs and training matched to you, with a clear plan to get there." },
      { property: "og:title", content: "Opportunity313 — Your Future. Full Throttle." },
      { property: "og:description", content: "Personalized opportunities and a race plan for Detroit students." },
    ],
  }),
  component: Index,
});

const steps = [
  { icon: Flag, title: "Start your engines", text: "Build your profile in 4 quick laps." },
  { icon: Target, title: "Get matched", text: "See opportunities that fit your age, area and goals." },
  { icon: RouteIcon, title: "Follow your route", text: "Check off each step until you cross the finish line." },
];

function Index() {
  const { user } = useAuth();
  const start = user ? "/onboarding" : "/auth";
  return (
    <div className="min-h-screen overflow-x-hidden">
      <SiteHeader />
      <section className="relative">
        <div className="relative mx-auto max-w-6xl px-4">
          <div className="relative mt-4 overflow-hidden rounded-[2rem] border-2 border-asphalt/10 shadow-card">
            <img src={hero} alt="Road winding toward the Detroit skyline" width={1600} height={1008} className="absolute inset-0 h-full w-full object-cover object-right" />
            <div className="absolute inset-0 bg-gradient-to-r from-cream via-cream/85 to-transparent md:via-cream/60" />
            <div className="relative grid min-h-[520px] items-center gap-6 p-6 md:grid-cols-2 md:p-12">
              <div className="rise-in">
                <span className="inline-flex items-center gap-2 rounded-full bg-asphalt px-3 py-1 text-xs font-bold uppercase tracking-widest text-cream">
                  <span className="checker-strip h-3 w-6 rounded-sm" /> Built for the 313
                </span>
                <h1 className="headline mt-5 text-5xl sm:text-6xl lg:text-7xl">
                  Your Future.
                  <br />
                  <span className="relative text-primary">
                    Full Throttle.
                    <svg aria-hidden viewBox="0 0 300 12" className="absolute -bottom-2 left-0 w-full text-victory"><path d="M2 8 Q150 -2 298 8" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" /></svg>
                  </span>
                </h1>
                <p className="mt-6 max-w-md text-base text-foreground/80 sm:text-lg">
                  Discover scholarships, internships, jobs and training programs that take you further. Opportunity313 helps Detroit students find the right fit — and a clear plan to reach their goals.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button asChild variant="race" size="xl"><Link to={start}>Start your engines <ArrowRight /></Link></Button>
                  <Button asChild variant="outline" size="xl"><Link to="/matches">Browse</Link></Button>
                </div>
              </div>
              <div className="relative hidden h-full md:block">
                <img src={mascot} alt="Opportunity313 race car mascot" width={1024} height={768} className="drive-in absolute bottom-0 right-0 w-[95%] drop-shadow-2xl" />
              </div>
            </div>
            <div className="road road-move relative h-8" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="headline text-3xl sm:text-4xl">Pick your lane</h2>
          <p className="hidden max-w-xs text-sm text-muted-foreground sm:block">Every kind of opportunity, all in one garage.</p>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {CATEGORY_KEYS.map((k, i) => {
            const c = CATEGORIES[k];
            const t = toneClasses[c.tone];
            return (
              <Link key={k} to="/matches" search={{ category: k }} className={cn("card-lift rise-in group rounded-3xl p-5 text-center", t.bg)} style={{ animationDelay: `${i * 70}ms` }}>
                <c.icon className={cn("mx-auto h-10 w-10 transition-transform group-hover:scale-110 group-hover:-rotate-6", t.fg)} strokeWidth={2.2} />
                <h3 className="mt-3 text-base">{c.plural}</h3>
                <p className="text-xs text-muted-foreground">{c.blurb}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <CheckerDivider />

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="headline text-center text-3xl sm:text-4xl">How the race works</h2>
        <div className="relative mt-10 grid gap-6 md:grid-cols-3">
          <div aria-hidden className="road absolute left-[16%] right-[16%] top-8 hidden h-2 rounded-full md:block" />
          {steps.map((s, i) => (
            <div key={s.title} className="rise-in relative text-center" style={{ animationDelay: `${i * 120}ms` }}>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-background bg-secondary text-secondary-foreground shadow-pop">
                <s.icon className="h-7 w-7" />
              </div>
              <p className="mt-2 text-xs font-bold uppercase tracking-widest text-primary">Lap {i + 1}</p>
              <h3 className="mt-1 text-xl">{s.title}</h3>
              <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="relative overflow-hidden rounded-[2rem] bg-asphalt p-8 text-cream md:p-12">
          <div aria-hidden className="checker-strip absolute right-0 top-0 h-full w-24 opacity-20" />
          <Sparkles className="h-8 w-8 text-victory" />
          <h2 className="headline mt-3 max-w-xl text-4xl">Your future has places to go.</h2>
          <p className="mt-3 max-w-lg text-cream/75">Free for students. Built in Detroit, for Detroit.</p>
          <Button asChild variant="race" size="lg" className="mt-6"><Link to={start}>Get on the track <ArrowRight /></Link></Button>
        </div>
      </section>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Opportunity313 · Made in the Motor City</footer>
    </div>
  );
}
