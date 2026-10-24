import { Briefcase, GraduationCap, Users, Wrench, Sparkles, type LucideIcon } from "lucide-react";

export type CategoryKey = "scholarship" | "internship" | "job" | "training" | "program";

export const CATEGORIES: Record<
  CategoryKey,
  { label: string; plural: string; blurb: string; icon: LucideIcon; tone: "turbo" | "electric" | "victory" | "asphalt" }
> = {
  scholarship: { label: "Scholarship", plural: "Scholarships", blurb: "Fund your future", icon: GraduationCap, tone: "turbo" },
  internship: { label: "Internship", plural: "Internships", blurb: "Gain experience", icon: Briefcase, tone: "electric" },
  job: { label: "Job", plural: "Jobs", blurb: "Explore careers", icon: Users, tone: "victory" },
  training: { label: "Training", plural: "Training", blurb: "Build new skills", icon: Wrench, tone: "asphalt" },
  program: { label: "Program", plural: "Programs", blurb: "Youth programs", icon: Sparkles, tone: "electric" },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as CategoryKey[];

export const toneClasses = {
  turbo: { bg: "bg-turbo-soft", fg: "text-turbo", pill: "bg-turbo text-primary-foreground" },
  electric: { bg: "bg-electric-soft", fg: "text-electric", pill: "bg-electric text-secondary-foreground" },
  victory: { bg: "bg-victory-soft", fg: "text-asphalt", pill: "bg-victory text-asphalt" },
  asphalt: { bg: "bg-muted", fg: "text-asphalt", pill: "bg-asphalt text-cream" },
} as const;

export function categoryMeta(key: string) {
  return CATEGORIES[(key as CategoryKey)] ?? CATEGORIES.program;
}

export const EDUCATION_LEVELS = [
  { value: "middle_school", label: "Middle School" },
  { value: "high_school", label: "High School (9–12)" },
  { value: "ged", label: "GED / Adult Ed" },
  { value: "college", label: "College / Community College" },
  { value: "trade_school", label: "Trade School" },
  { value: "graduated", label: "Graduated / Not in School" },
];

export const INTERESTS = [
  { value: "technology", label: "Technology" },
  { value: "healthcare", label: "Healthcare" },
  { value: "business", label: "Business" },
  { value: "education", label: "Education" },
  { value: "skilled_trades", label: "Skilled Trades" },
  { value: "arts_design", label: "Arts & Design" },
  { value: "automotive", label: "Automotive" },
  { value: "science", label: "Science" },
  { value: "community", label: "Community Service" },
  { value: "sports", label: "Sports" },
  { value: "other", label: "Other" },
];

export const GOALS = [
  { value: "pay_for_college", label: "Pay for college" },
  { value: "first_job", label: "Land my first job" },
  { value: "experience", label: "Gain work experience" },
  { value: "learn_skill", label: "Learn a new skill" },
  { value: "start_business", label: "Start a business" },
  { value: "explore", label: "Explore career paths" },
];

export const APPLICATION_STATUSES = [
  { value: "open", label: "Open Now" },
  { value: "rolling", label: "Rolling" },
  { value: "upcoming", label: "Opening Soon" },
  { value: "closed", label: "Closed" },
  { value: "unknown", label: "Needs Verification" },
];

export function labelFor(list: { value: string; label: string }[], v: string | null | undefined) {
  return list.find((x) => x.value === v)?.label ?? v ?? "";
}
