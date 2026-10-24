<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Matching is deterministic in `src/lib/matching.ts` (tested); AI never selects or invents opportunities — it only explains stored rows.
- AI coach runs server-side in `src/lib/ai.functions.ts` via Groq using the `GROQ_API_KEY` secret; never call Groq from the browser.
- The Groq key's tier only serves `qwen/qwen3.8-27b` and `openai/gpt-oss-120b`; keep the coach on one of those (tested in `src/lib/ai-model.test.ts`) — other model names fail with `model_not_found`.
- Admin access is enforced by `has_role(uid,'admin')` in RLS; the first account ever created is auto-granted admin by a trigger.
- Student-only pages wrap content in `RequireAuth` (client session); public pages read published opportunities via route loaders.
