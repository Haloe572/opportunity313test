import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Loading } from "@/components/auth-gate";
import { CategoryPill } from "@/components/opportunity-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { APPLICATION_STATUSES, CATEGORIES, CATEGORY_KEYS, labelFor } from "@/lib/constants";
import { formatDeadline } from "@/lib/data";

export const Route = createFileRoute("/admin/")({ component: AdminList });

function AdminList() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-opps"],
    queryFn: async () => {
      const { data, error } = await supabase.from("opportunities").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [pub, setPub] = useState("all");

  const rows = useMemo(() => (data ?? []).filter((o) =>
    (cat === "all" || o.category === cat) &&
    (pub === "all" || (pub === "yes") === o.published) &&
    (!q || `${o.title} ${o.organization}`.toLowerCase().includes(q.toLowerCase())),
  ), [data, q, cat, pub]);

  async function togglePublish(id: string, v: boolean) {
    await supabase.from("opportunities").update({ published: v }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-opps"] });
    qc.invalidateQueries({ queryKey: ["opportunities"] });
  }

  if (isLoading) return <Loading />;
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Pit Crew Portal</p>
          <h1 className="headline text-4xl">Opportunities</h1>
          <p className="text-sm text-muted-foreground">{data?.length ?? 0} total · {data?.filter((o) => o.published).length ?? 0} published</p>
        </div>
        <Button asChild variant="race"><Link to="/admin/new"><Plus /> Add opportunity</Link></Button>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search title or organization" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="h-9 rounded-md border bg-card px-3 text-sm" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="all">All categories</option>
          {CATEGORY_KEYS.map((k) => <option key={k} value={k}>{CATEGORIES[k].label}</option>)}
        </select>
        <select className="h-9 rounded-md border bg-card px-3 text-sm" value={pub} onChange={(e) => setPub(e.target.value)}>
          <option value="all">Any visibility</option><option value="yes">Published</option><option value="no">Unpublished</option>
        </select>
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead className="hidden md:table-cell">Deadline</TableHead><TableHead className="hidden md:table-cell">Status</TableHead><TableHead className="hidden lg:table-cell">Verified</TableHead><TableHead>Published</TableHead><TableHead /></TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((o) => (
              <TableRow key={o.id}>
                <TableCell><p className="font-semibold">{o.title}</p><p className="text-xs text-muted-foreground">{o.organization}</p></TableCell>
                <TableCell><CategoryPill category={o.category} /></TableCell>
                <TableCell className="hidden text-sm md:table-cell">{o.deadline ? formatDeadline(o.deadline) : "—"}</TableCell>
                <TableCell className="hidden text-sm md:table-cell">{labelFor(APPLICATION_STATUSES, o.application_status)}</TableCell>
                <TableCell className="hidden text-sm lg:table-cell">{o.last_verified ? formatDeadline(o.last_verified) : "—"}</TableCell>
                <TableCell><Switch checked={o.published} onCheckedChange={(v) => togglePublish(o.id, v)} /></TableCell>
                <TableCell><Button asChild variant="ghost" size="icon"><Link to="/admin/$id" params={{ id: o.id }} aria-label="Edit"><Pencil /></Link></Button></TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">No opportunities yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
