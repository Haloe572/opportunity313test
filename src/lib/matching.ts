// Deterministic opportunity matching. No AI, no randomness.

export interface MatchProfile {
  age: number | null;
  city: string | null;
  zip: string | null;
  education_level: string | null;
  interests: string[];
  goals: string[];
  opportunity_types: string[];
}

export interface MatchOpportunity {
  id: string;
  category: string;
  min_age: number | null;
  max_age: number | null;
  eligible_areas: string[];
  education_levels: string[];
  tags: string[];
  application_status: string;
}

export interface MatchResult {
  eligible: boolean;
  score: number;
  reasons: string[];
}

const GOAL_CATEGORY: Record<string, string[]> = {
  pay_for_college: ["scholarship"],
  first_job: ["job", "internship"],
  experience: ["internship", "job", "program"],
  learn_skill: ["training", "program"],
  start_business: ["program"],
  explore: ["internship", "program", "training"],
};

const norm = (s: string) => s.trim().toLowerCase();

export function locationMatches(areas: string[], city: string | null, zip: string | null): boolean {
  if (areas.length === 0) return true;
  const a = areas.map(norm);
  if (a.some((x) => ["any", "anywhere", "nationwide", "online", "statewide", "michigan"].includes(x))) return true;
  if (zip && a.includes(norm(zip))) return true;
  if (city) {
    const c = norm(city).replace(/,.*$/, "");
    if (a.some((x) => x.replace(/,.*$/, "") === c)) return true;
  }
  return false;
}

export function scoreOpportunity(p: MatchProfile, o: MatchOpportunity): MatchResult {
  const reasons: string[] = [];

  if (p.age != null) {
    if (o.min_age != null && p.age < o.min_age) return { eligible: false, score: 0, reasons: ["Below minimum age"] };
    if (o.max_age != null && p.age > o.max_age) return { eligible: false, score: 0, reasons: ["Above maximum age"] };
  }
  if (!locationMatches(o.eligible_areas, p.city, p.zip)) {
    return { eligible: false, score: 0, reasons: ["Outside eligible area"] };
  }
  if (o.education_levels.length > 0 && p.education_level && !o.education_levels.includes(p.education_level)) {
    return { eligible: false, score: 0, reasons: ["Education level not eligible"] };
  }

  let score = 1;
  if (p.age != null && (o.min_age != null || o.max_age != null)) reasons.push("Fits your age");
  if (o.eligible_areas.length > 0) reasons.push("Available in your area");
  if (o.education_levels.length > 0) { score += 1; reasons.push("Matches your education level"); }

  if (p.opportunity_types.includes(o.category)) { score += 3; reasons.push("A type you're looking for"); }

  const overlap = o.tags.filter((t) => p.interests.includes(t));
  if (overlap.length) { score += overlap.length * 2; reasons.push(`Matches ${overlap.length} of your interests`); }

  if (p.goals.some((g) => GOAL_CATEGORY[g]?.includes(o.category))) { score += 1; reasons.push("Supports your goals"); }

  if (o.application_status === "closed") score -= 2;
  if (o.application_status === "open") score += 1;

  return { eligible: true, score, reasons };
}

export function rankOpportunities<T extends MatchOpportunity>(p: MatchProfile, list: T[]) {
  return list
    .map((o) => ({ opportunity: o, ...scoreOpportunity(p, o) }))
    .filter((r) => r.eligible)
    .sort((a, b) => b.score - a.score);
}
