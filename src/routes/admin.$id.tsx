import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminForm } from "@/components/admin-form";
import { Loading } from "@/components/auth-gate";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/$id")({ component: EditOpp });

function EditOpp() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-opp", id],
    queryFn: async () => (await supabase.from("opportunities").select("*").eq("id", id).maybeSingle()).data,
  });
  if (isLoading) return <Loading />;
  if (!data) return <p>Not found.</p>;
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="headline mb-6 text-4xl">Edit opportunity</h1>
      <AdminForm initial={data} />
    </div>
  );
}
