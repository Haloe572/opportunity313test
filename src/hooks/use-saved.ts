import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { savedQuery } from "@/lib/data";
import { useAuth } from "./use-auth";

export function useSaved() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const q = useQuery({ ...savedQuery(user?.id ?? ""), enabled: !!user });
  const ids = new Set((q.data ?? []).map((s) => s.opportunity_id));

  async function toggle(opportunityId: string) {
    if (!user) { navigate({ to: "/auth" }); return; }
    if (ids.has(opportunityId)) {
      await supabase.from("saved_opportunities").delete().eq("user_id", user.id).eq("opportunity_id", opportunityId);
      toast("Removed from your garage");
    } else {
      const { error } = await supabase.from("saved_opportunities").insert({ user_id: user.id, opportunity_id: opportunityId });
      if (error) { toast.error(error.message); return; }
      toast.success("Saved! 🏁");
    }
    qc.invalidateQueries({ queryKey: ["saved", user.id] });
  }
  return { saved: q.data ?? [], ids, toggle, loading: q.isLoading };
}
