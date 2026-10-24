import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SYSTEM = `You are the Opportunity313 pit-crew coach for Detroit students ages 14-24.
Rules:
- Use ONLY the opportunity data and student profile provided. Never invent opportunities, organizations, deadlines, amounts, contacts, or application statuses.
- If a detail is missing or blank, say it "needs verification on the official website".
- Be upbeat, short, and concrete. Use plain language a teenager understands. Light racing metaphors are welcome.
- Output plain text with short bullet points using "- ". No markdown headings.`;

export const coachOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ opportunityId: z.string().uuid(), mode: z.enum(["why", "plan", "tips"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const key = process.env["GROQ_API_KEY"];
    if (!key) return { ok: false as const, text: "AI coach isn't connected yet. An admin needs to add the Groq key." };

    const { supabase, userId } = context;
    const [{ data: opp }, { data: profile }] = await Promise.all([
      supabase.from("opportunities").select("title, organization, category, description, min_age, max_age, eligible_areas, education_levels, tags, deadline, application_status, official_url, notes, prep_tips, last_verified").eq("id", data.opportunityId).maybeSingle(),
      supabase.from("student_profiles").select("age, city, zip, education_level, interests, goals, goals_note, opportunity_types").eq("user_id", userId).maybeSingle(),
    ]);
    if (!opp) return { ok: false as const, text: "Opportunity not found." };

    const ask = {
      why: "In 3-4 bullets, explain why this opportunity may fit this student, and flag any eligibility details that need verification.",
      plan: "Create a 5-checkpoint action plan (Review eligibility, Gather materials, Prepare resume/essay, Apply, Follow up) tailored to this opportunity. One bullet per checkpoint, each with 1 concrete step.",
      tips: "Give 4 short preparation tips for applying to this opportunity.",
    }[data.mode];

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen/qwen3.8-27b",
        temperature: 0.4,
        max_tokens: 500,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `OPPORTUNITY DATA:\n${JSON.stringify(opp)}\n\nSTUDENT PROFILE:\n${JSON.stringify(profile ?? "not provided")}\n\nTASK: ${ask}` },
        ],
      }),
    });
    if (!res.ok) {
      console.error("Groq error", res.status, await res.text());
      return { ok: false as const, text: "The AI coach is in the pit right now. Try again in a moment." };
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return { ok: true as const, text: json.choices?.[0]?.message?.content?.trim() ?? "" };
  });
