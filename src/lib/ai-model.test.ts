import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// The GROQ_API_KEY tier only serves these two models; anything else returns
// model_not_found and the coach silently stops answering.
const SUPPORTED = ["qwen/qwen3.8-27b", "openai/gpt-oss-120b"];

const source = readFileSync(resolve(__dirname, "ai.functions.ts"), "utf8");

describe("AI coach Groq model", () => {
  it("requests a model the Groq key can actually serve", () => {
    const requested = [...source.matchAll(/model:\s*"([^"]+)"/g)].map((m) => m[1]);
    expect(requested.length).toBeGreaterThan(0);
    for (const model of requested) expect(SUPPORTED).toContain(model);
  });

  it("never asks for the model the key rejected", () => {
    expect(source).not.toContain("llama-3.3-70b-versatile");
  });
});
