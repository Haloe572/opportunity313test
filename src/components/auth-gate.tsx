import { useEffect, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import mascot from "@/assets/mascot.png";

export function Loading({ label = "Warming up the engine…" }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted-foreground">
      <img src={mascot} alt="" width={1024} height={768} className="h-16 w-auto idle-bob" />
      <p className="text-sm font-semibold">{label}</p>
    </div>
  );
}

export function RequireAuth({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const href = useRouterState({ select: (s) => s.location.href });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { next: href } });
  }, [loading, user, navigate, href]);

  if (loading || !user) return <Loading />;
  if (admin && !isAdmin) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <h1 className="headline text-4xl">Pit lane closed</h1>
        <p className="mt-3 text-muted-foreground">This area is for the Opportunity313 team only.</p>
      </div>
    );
  }
  return <>{children}</>;
}
