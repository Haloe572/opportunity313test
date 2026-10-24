import { Link, useRouterState } from "@tanstack/react-router";
import { LogOut, Shield } from "lucide-react";
import mascot from "@/assets/mascot.png";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("group flex items-center gap-1.5", className)}>
      <img src={mascot} alt="" width={1024} height={768} className="h-9 w-auto transition-transform group-hover:-translate-x-0.5 group-hover:-rotate-3" />
      <span className="headline text-xl normal-case tracking-tight">
        Opportunity<span className="text-primary">313</span>
      </span>
    </Link>
  );
}

const studentLinks = [
  { to: "/matches", label: "Opportunities" },
  { to: "/roadmap", label: "My Plan" },
  { to: "/dashboard", label: "Saved" },
] as const;

export function SiteHeader() {
  const { user, isAdmin, signOut } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {(user ? studentLinks : ([{ to: "/", label: "Home" }, { to: "/matches", label: "Opportunities" }] as const)).map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "relative rounded-full px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground",
                path === l.to && "text-foreground after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded after:bg-primary",
              )}
            >
              {l.label}
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin" className="ml-1 inline-flex items-center gap-1 rounded-full bg-asphalt px-3 py-1.5 text-xs font-bold text-cream">
              <Shield className="h-3.5 w-3.5" /> Admin
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Button variant="ghost" size="sm" onClick={signOut} aria-label="Sign out">
              <LogOut /> <span className="hidden sm:inline">Sign out</span>
            </Button>
          ) : (
            <Button asChild variant="race" size="sm">
              <Link to="/auth">Get Started</Link>
            </Button>
          )}
        </div>
      </div>
      {user && (
        <nav className="flex justify-around border-t py-1.5 md:hidden">
          {studentLinks.map((l) => (
            <Link key={l.to} to={l.to} className={cn("px-2 text-xs font-semibold text-muted-foreground", path === l.to && "text-primary")}>
              {l.label}
            </Link>
          ))}
          {isAdmin && <Link to="/admin" className="px-2 text-xs font-semibold text-muted-foreground">Admin</Link>}
        </nav>
      )}
    </header>
  );
}

export function CheckerDivider({ className }: { className?: string }) {
  return <div aria-hidden className={cn("checker-fade h-5 w-full opacity-80", className)} />;
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 rise-in">{children}</main>
    </div>
  );
}
