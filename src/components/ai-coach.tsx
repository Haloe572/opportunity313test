import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { coachOpportunity } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const MODES = [
  { mode: "why", label: "Why it fits me" },
  { mode: "plan", label: "Build my action plan" },
  { mode: "tips", label: "Prep tips" },
] as const;

export function AiCoach({ opportunityId }: { opportunityId: string }) {
  const { user } = useAuth();
  const coach = useServerFn(coachOpportunity);
  const [text, setText] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  if (!user) return <p className="text-sm text-muted-foreground">Sign in to get personalized AI coaching.</p>;

  async function run(mode: (typeof MODES)[number]["mode"]) {
    setBusy(mode);
    try {
      const r = await coach({ data: { opportunityId, mode } });
      setText(r.text);
    } catch {
      setText("Couldn't reach the AI coach. Try again.");
    }
    setBusy(null);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <Button key={m.mode} variant="soft" size="sm" disabled={!!busy} onClick={() => run(m.mode)}>
            <Sparkles className={busy === m.mode ? "animate-spin" : ""} /> {m.label}
          </Button>
        ))}
      </div>
      {text && <div className="rise-in mt-4 whitespace-pre-wrap rounded-2xl bg-electric-soft p-4 text-sm leading-relaxed">{text}</div>}
      <p className="mt-2 text-[11px] text-muted-foreground">AI uses only the details listed here. Always confirm on the official website.</p>
    </div>
  );
}
