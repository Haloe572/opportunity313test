import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import "@lovable.dev/cloud-auth-js/styles.css";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import mascot from "@/assets/mascot.png";

const search = z.object({ next: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Sign in — Opportunity313" },
      { name: "description", content: "Sign in or create your Opportunity313 account to get matched with opportunities." },
      { property: "og:title", content: "Sign in — Opportunity313" },
      { property: "og:description", content: "Join Opportunity313 and start your race." },
    ],
  }),
  component: AuthPage,
});

function safeNext(n?: string) {
  return n && n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard";
}

function AuthPage() {
  const { next } = Route.useSearch();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ href: safeNext(next) });
  }, [user, next, navigate]);

  const pwProblem =
    mode === "up" && password.length > 0
      ? password.length < 8
        ? "Use at least 8 characters."
        : !/[0-9]/.test(password) || !/[a-zA-Z]/.test(password)
          ? "Mix letters and at least one number."
          : null
      : null;

  function friendly(err: { message: string; code?: string | undefined; name?: string | undefined }) {
    if (err.code === "weak_password" || /weak|easy to guess/i.test(err.message))
      return "That password is too common. Try something longer and unique, like a short phrase with a number.";
    if (err.code === "user_already_exists" || /already registered/i.test(err.message))
      return "An account with this email already exists. Sign in instead (or use Continue with Lovable/Google if that's how you joined).";
    if (err.code === "invalid_credentials") return "Wrong email or password.";
    if (err.code === "email_not_confirmed") return "Please confirm your email first — check your inbox.";
    if (err.name === "AuthRetryableFetchError" || /load failed|failed to fetch|network/i.test(err.message))
      return "Couldn't reach the server. Check your internet connection and try again.";
    return err.message;
  }

  async function withRetry<T extends { error: { name?: string; message: string } | null }>(fn: () => Promise<T>): Promise<T> {
    const r = await fn();
    if (r.error && (r.error.name === "AuthRetryableFetchError" || /load failed|failed to fetch/i.test(r.error.message))) {
      await new Promise((res) => setTimeout(res, 800));
      return fn();
    }
    return r;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pwProblem) { toast.error(pwProblem); return; }
    setBusy(true);
    try {
      if (mode === "up") {
        const { data, error } = await withRetry(() =>
          supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/onboarding" } }),
        );
        if (error) toast.error(friendly(error));
        else if (data.user && data.user.identities?.length === 0)
          toast.error(friendly({ message: "already registered", code: "user_already_exists" }));
        else if (data.session) toast.success("Account created! 🏁");
        else toast.success("Account created! Check your email to confirm, then sign in.");
      } else {
        const { error } = await withRetry(() => supabase.auth.signInWithPassword({ email, password }));
        if (error) toast.error(friendly(error));
      }
    } catch (err) {
      toast.error(friendly(err instanceof Error ? err : { message: String(err) }));
    } finally {
      setBusy(false);
    }
  }

  async function oauth(p: "google" | "lovable") {
    const r = await lovable.auth.signInWithOAuth(p, { redirect_uri: window.location.origin });
    if (r.error) toast.error(r.error.message);
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-asphalt p-10 text-cream md:flex">
        <div aria-hidden className="checker-strip absolute -right-8 top-0 h-full w-20 rotate-3 opacity-25" />
        <Link to="/" className="headline relative z-10 w-fit text-2xl normal-case transition-opacity hover:opacity-80">Opportunity<span className="text-primary">313</span></Link>
        <img src={mascot} alt="" width={1024} height={768} className="drive-in w-4/5" />
        <div>
          <h2 className="headline text-5xl">Let's get you<br /><span className="text-victory">on track.</span></h2>
          <div className="road road-move mt-6 h-3 rounded-full" />
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm rise-in">
          <Logo className="md:hidden" />
          <h1 className="headline mt-6 text-4xl">{mode === "up" ? "Join the race" : "Welcome back"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{mode === "up" ? "Create your free account." : "Sign in to your garage."}</p>
          <div className="mt-6 space-y-2">
            <Button variant="outline" className="w-full" onClick={() => oauth("google")}>Continue with Google</Button>
            <button type="button" className="lovable-auth-button w-full" onClick={() => oauth("lovable")}>Continue with Lovable</button>
          </div>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />or<div className="h-px flex-1 bg-border" /></div>
          <form onSubmit={submit} className="space-y-3">
            <div><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 rounded-xl" /></div>
            <div>
              <Label htmlFor="pw">Password</Label>
              <Input id="pw" type="password" required minLength={mode === "up" ? 8 : 1} autoComplete={mode === "up" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 rounded-xl" />
              {mode === "up" && (
                <p className={`mt-1 text-xs ${pwProblem ? "text-destructive" : "text-muted-foreground"}`}>
                  {pwProblem ?? "At least 8 characters with a number. Avoid common words like \"Monday\" or \"password\"."}
                </p>
              )}
            </div>
            <Button type="submit" variant="race" className="w-full" size="lg" disabled={busy}>{busy ? "Working…" : mode === "up" ? "Create account" : "Sign in"}</Button>
          </form>
          <button className="mt-4 w-full text-center text-sm text-secondary hover:underline" onClick={() => setMode(mode === "up" ? "in" : "up")}>
            {mode === "up" ? "Already have an account? Sign in" : "New here? Create an account"}
          </button>
        </div>
      </div>
    </div>
  );
}
