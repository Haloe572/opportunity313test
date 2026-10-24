import { describe, expect, it } from "vitest";
import { rankOpportunities, scoreOpportunity, type MatchOpportunity, type MatchProfile } from "./matching";

const profile: MatchProfile = {
  age: 17, city: "Detroit, MI", zip: "48201", education_level: "high_school",
  interests: ["technology"], goals: ["pay_for_college"], opportunity_types: ["scholarship"],
};
const base: MatchOpportunity = {
  id: "1", category: "scholarship", min_age: null, max_age: null,
  eligible_areas: [], education_levels: [], tags: [], application_status: "unknown",
};

describe("matching", () => {
  it("excludes students below the minimum age", () => {
    expect(scoreOpportunity(profile, { ...base, min_age: 18 }).eligible).toBe(false);
  });
  it("excludes students above the maximum age", () => {
    expect(scoreOpportunity(profile, { ...base, max_age: 16 }).eligible).toBe(false);
  });
  it("excludes opportunities outside the student's area", () => {
    expect(scoreOpportunity(profile, { ...base, eligible_areas: ["Flint"] }).eligible).toBe(false);
  });
  it("accepts a city match ignoring state suffix", () => {
    expect(scoreOpportunity(profile, { ...base, eligible_areas: ["Detroit"] }).eligible).toBe(true);
  });
  it("excludes a mismatched education level", () => {
    expect(scoreOpportunity(profile, { ...base, education_levels: ["college"] }).eligible).toBe(false);
  });
  it("ranks preferred type with matching interests above others", () => {
    const ranked = rankOpportunities(profile, [
      { ...base, id: "job", category: "job" },
      { ...base, id: "sch", tags: ["technology"] },
    ]);
    expect(ranked[0]?.opportunity.id).toBe("sch");
  });
});
