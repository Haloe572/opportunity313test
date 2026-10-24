import { createFileRoute } from "@tanstack/react-router";
import { AdminForm } from "@/components/admin-form";

export const Route = createFileRoute("/admin/new")({
  component: () => (
    <div className="mx-auto max-w-3xl">
      <h1 className="headline mb-6 text-4xl">New opportunity</h1>
      <AdminForm />
    </div>
  ),
});
