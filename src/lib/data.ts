import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Opportunity = Database["public"]["Tables"]["opportunities"]["Row"];
export type StudentProfile = Database["public"]["Tables"]["student_profiles"]["Row"];
export type SavedRow = Database["public"]["Tables"]["saved_opportunities"]["Row"];

export const publishedOpportunitiesQuery = () =>
  queryOptions({
    queryKey: ["opportunities", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities").select("*").eq("published", true).order("deadline", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });

export const opportunityQuery = (id: string) =>
  queryOptions({
    queryKey: ["opportunity", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("opportunities").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const profileQuery = (uid: string) =>
  queryOptions({
    queryKey: ["profile", uid],
    queryFn: async () => {
      const { data, error } = await supabase.from("student_profiles").select("*").eq("user_id", uid).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const savedQuery = (uid: string) =>
  queryOptions({
    queryKey: ["saved", uid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_opportunities").select("*, opportunity:opportunities(*)").eq("user_id", uid).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const recentViewsQuery = (uid: string) =>
  queryOptions({
    queryKey: ["views", uid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunity_views").select("viewed_at, opportunity:opportunities(*)").eq("user_id", uid)
        .order("viewed_at", { ascending: false }).limit(6);
      if (error) throw error;
      return data;
    },
  });

export function profileCompletion(p: StudentProfile | null | undefined) {
  if (!p) return 0;
  const checks = [p.age != null, !!p.city || !!p.zip, !!p.education_level, p.interests.length > 0, p.goals.length > 0, p.opportunity_types.length > 0, !!p.display_name];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function formatDeadline(d: string | null) {
  if (!d) return "Deadline needs verification";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
