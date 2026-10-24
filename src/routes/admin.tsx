import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RequireAuth } from "@/components/auth-gate";
import { PageShell } from "@/components/brand";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Opportunity313" },
      { name: "description", content: "Opportunity313 team portal." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin — Opportunity313" },
      { property: "og:description", content: "Team portal." },
    ],
  }),
  component: () => (
    <RequireAuth admin>
      <PageShell><Outlet /></PageShell>
    </RequireAuth>
  ),
});
