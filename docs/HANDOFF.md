# Handoff: read this first when you pick the project back up

## Latest: Sat 28 Nov 2026. All 30 bookmarked animations built and merged

All three lanes merged into main (see PROGRESS and D-120); the coordinator fixed the shared pill (no keyboard slide, no diagonal across wrapped lines) and Submit's chip width. Preview: push main to `preview` after each merge.
**Open for Chime (questions from the three lanes):** copy-link check vs the sheet closing at once; Figma for the slider ticks, AP meter, tooltip pill, widened search field and results panel; AP meter red or amber when short; the swipe's in-plane tilt vs D-117 (1); PlayStyle tooltip text or none; expand-card timing and wrapped names; Stance cards sliding on a linked load; All steps rows staggering while the sheet enters; "3 of 12" section counts on samples; letter-limit thresholds and screen-reader wording (Request 80 with a ring from 40; build name 40 with a ring from the first letter); Submit step progress as a bar in Figma or the number roll; the 450 ms hold before "Sent for listing"; the level slider's specialization tick on Submit; Your card's tap button being pointer-only.
**Next:** Chime's iPhone/iPad pass on the motion (L-01); mirror D-115/D-116 and the motion-only parts into Figma once approved; emil-design-eng, mobile-native and break-ui passes (Chime picked all three); remove the merged worktrees under .claude/worktrees/ with Chime's OK.

## Latest: Sat 28 Nov 2026. Refining phase started

Done and pushed: unslop pass (D-115), Builds fixes (D-116), share card flip drawn in Figma and built (D-117, D-118), 30 motion bookmarks with two PDFs (docs/design/motion-bookmarks.pdf, motion-placement.pdf). See PROGRESS for details.
**Next, in order:** (1) mirror D-115 and D-116 into Figma (lime use, copy, gold badge token as a variable) once Chime approves the renders; (2) emil-design-eng, then mobile-native, then break-ui (Chime picked all three); (3) the animation phase from the 30 bookmarks, one at a time, starting with Swipe deck.
**Open for Chime:** O-23 to O-27 and A-19 to A-23 (DECISIONS); the gate's types check races the build (ask to run types first in .claude/proof.json); BuildCard on archetype lists still shows "—" key stats for unrecorded builds and the story cards keep lime position chips (review notes); iPhone check of the flip, the gold badges (Safari mask) and the sticky column.
**Housekeeping:** Lane B's merged worktree `.claude/worktrees/agent-a1b6d2cc030aeba8c` can be removed; the local preview copy is served from the scratchpad on port 4180 while a session runs.

## Latest: Fri 27 Nov 2026 (evening). Every Figma frame built, by three agents

Chime: "implement every single thing on Figma… one to one." Done in three lanes, each screen measured per section against Figma at 393/834/1440, audited in `docs/design/*-audit.md`, code-reviewed, committed and pushed:
- **Lane A** (1e34640…b0debd9): Builds + archetype pages (Tall/Quick Finisher samples), Build page states re-checked, D-114 (Save images toasts, light and level-32 cards, tinted PlayStyle icons), shared build `/b/` + "link doesn't work" on `src/lib/supabase/client.ts`, next/og link previews.
- **Lane B** (d119712…6b96888): face page (5 states), Home, `/search`, theme switch A, shell re-audit, face link preview.
- **Lane C** (fe5630b, d4641f3, 4afd8fa): Submit a build (all 27 frames), Request a face (all 18), Changelog/About/Takedown/404 re-audit (About's six drawn questions added, preview only).
- **Coordinator:** `spark-2008-winger` title set to Figma's "2008 Winger"; the title assertions in 4 unit tests and 1 e2e file changed from "PLACEHOLDER" to it (flagged to Chime).

**Recorded:** PROGRESS entry; the agents' proposals as A-19 to A-23 and the questions as O-23 to O-27 in DECISIONS (for Chime); PLAN phase 2 lines note "built to Figma on the preview". `features.json` is unchanged on purpose: P2 criteria need live content, the iPhone, X/WhatsApp checks, or still describe the superseded GitHub-issue Submit (P2-7, D-83/D-99), so none is marked passing yet. `main` is pushed to `preview`. The audit files hold each screen's differences.
**Next:** Chime answers O-23 to O-27 and A-19 to A-23, checks the preview on the iPhone; then corrections, the motion pass (motion skills, L-10) and refinement. Supabase switch-on steps: `docs/supabase-schema.sql` header and lane C's report (create project, run the SQL, set NEXT_PUBLIC_SUPABASE_URL/ANON_KEY in Cloudflare, rename `src/app/{b,faces/request}/page.preview.tsx` to `page.tsx`; Submit waits on O-14).
**Top open issues:** light-mode lime on cream is nearly invisible (face page section bar 1.03:1, 404 "4"s 1.15:1); bottom nav 18 vs 24 px; Quick Finisher card 254 vs 268 px; votes can be stuffed with fresh voter ids; nothing checked on Chime's iPhone (rule 10). Lane B's worktree `.claude/worktrees/agent-a1b6d2cc030aeba8c` is merged and can be removed.

## Latest: Thu 26 – Fri 27 Nov 2026. Making every built screen match Figma, with Figma's sample data

Nothing is running. Preview: https://preview.probuilds.pages.dev (branch `preview` = `main` at 6e95925). Session transcripts: the root `2026-11-2*.txt` files (untracked).

### The rule Chime set this session (D-107, in CLAUDE.md and memory)
Chime: "Look at the Figma and implement what is on the Figma… stop putting placeholder value… Put sample data." Every coded screen must match its Figma frame exactly: every section, state, line and value. Missing content is filled with **Figma's own sample data** in draft files marked `"sample"` (preview only, never probuilds.club). No "–", no empty slots, no left-out sections, no own wording. Any difference needs Chime's OK. Sample content shows Figma's sample marker instead of the Draft tag (D-113). Acceptance: per-section pixel diff vs Figma ≈3 or below at 393/834/1440, side-by-side images, audit file in `docs/design/*-audit.md`.

### Done and pushed (26 Nov)
- **Build page** matches Figma with the Meta Finisher sample (192429f; audit `docs/design/build-page-audit.md`): level section, key stats, gauges, share sheet cards. AcceleRATE has the game's 7 types. Stars drawn as shapes (fd5c391).
- **Save images** works (0b3145e): html-to-image 1.11.13 (D-111), 1080×1920 PNGs; phone share sheet → Photos, else downloads. Not tried on a real iPhone (risk: iOS may expire the tap before the ~1 s render and fall back to download).
- **Faces library** matches Figma with its five sample faces and Figma's stand-in pictures (8b4a7a5; D-108; audit `docs/design/faces-library-audit.md`). D-68/D-69 format changes applied (same lines as Sharon's PR #9). `scripts/strip-samples.mjs` keeps `out/sample/` off the live build.
- **Dark by default** on every device (1129297, D-112); light only via the switch (not built yet).
- Chip focus rings unclipped (547cbf6); 11 PlayStyle badges (1cabe40).

### Designed in Figma, approved, NOT built yet (D-114) — next after the Builds unit
1. **Theme switch option A**: sun/moon button beside search in the top bar, every page (Figma row 499:10586, component "Theme switch" 497:976). Sets `data-theme="light"` on `<html>`, remembered per browser (set before paint to avoid a flash). B and C are on Archive (section 506:18178).
2. **Save images toasts** (cream Toast): "Making your images…" (button spinner), "Both cards saved to your photos." (phone, tablet) / "…to your downloads." (desktop), "Couldn't save the images. Try again." (Figma 493:9624 → 493:15977).
3. **Light story cards** 489:10199, 489:10276 (saved images follow the user's mode, D-112 (2)); **cards at the chosen level** 492:9586, 492:9695 (only the level changes, D-114 (3)).
4. **EA PlayStyle icons tinted dark in light mode** (text/primary), cards and Build page.

### In progress when the session stopped (uncommitted in the working tree)
The **Builds page + archetype page** Figma unit was cut off by the weekly usage limit (resets Fri 27 Nov 6pm Lagos). Its last note: "Builds page: rail fixed (5.5 → 1.7); phone differences isolated to Figma's Phone type mode. Writing the Builds part of the audit." Uncommitted: `content/archetypes/fc27.json` (adds mastery attributes to archetypes that had none, citing `ea-grounds-deep-dive` — **verify against that source before committing; never invent**), `ArchetypeFacts.tsx`, `EmblemRail.tsx`, tests, and the untracked `docs/design/builds-audit.md`. Decisions given to that agent: (a) sample archetype cards follow Figma (no version tag, credit or Draft tag; "Sample values: not real builds yet" shown once), (b) real builds keep the version tag and credit (rules 4, 5; no Figma frame for a real-build card — ask Chime whether to draw one); keep D-62 (3) shared header height and fix Figma 290:1084's Quick Finisher card to 268 px. Still to do: Tall and Quick Finisher as sample drafts from the frames, the archetype page audit, measure, review, commit. To resume: read the audit file and `git diff`, finish, run every check, `/code-review --fix` medium, commit, push.

### Queue after that (one unit at a time, same method)
Changelog, About, Takedown, 404, shell (top bar, bottom nav, footer). Then the face page (`/faces/[slug]`), Home, Submit, Request a face.

### Open for Chime
- Whether to draw a real (non-sample) build card in Figma (rules 4 and 5).
- Try Save images on the iPhone (Photos vs download fallback).
- Earlier opens still stand: O-14 attribute prices, O-22 copy, Sharon's PRs #7 and #8 (#9 is now duplicated on main), the Request a face page waits on Supabase.

### Working notes
- Memory is tight: proof refuses runs over 85%. Two agents must not build into `out/` at once. Brave and Dia hold the most memory; ask Chime to close them when runs are refused.
- The commit gate refuses a command that changes files and commits in one step: change files first, then `git add … && git commit …` alone.

## Earlier: Wed 25 Nov 2026. All five design phases drawn; what's left before code

Nothing is running (no dev server or watcher). Figma file: https://www.figma.com/design/hyFx4Audhn4F9KxL9bRCLD (page "Design screens", one section per phase; rejected work on "Archive").

### Where things stand
- **Phases 1–5 are designed at phone 390, tablet 834 and desktop 1440**, one row per screen. Decisions D-66 to D-95 cover this session; DESIGN.md holds the rules Chime set (type roles §Type, weight beside height, cream-pill toast, lime-tab nav).
- **Changed shape this session:** Submit is "Submit a build" only; faces are requested and voted on (D-83, D-84). The build editor fills AP from the level, sets attributes by slider, typing or − / +, limits PlayStyle+ to the archetype's own (D-85 to D-88), records height and weight (D-90), and shares the player's card with a default mannequin face (D-89). About and Takedown are option C (D-91). The 404 is the replay card, no faces row and no search (D-93, D-95).
- **Toast and bottom nav picked** (D-94): changed in the components, so every screen uses them. **Supabase approved** for face requests (D-96).
- **Deadline:** Season 3 on Thu 3 Dec (D-25). Launch is on Season 2, before then.

### Design status
Designed and checked: every screen and state at phone, tablet and desktop, link previews, components for the new parts (D-97), and the shared build page with its not-found state and the Supabase failure states (D-100). Design is complete pending Chime's approval. Drawn copies were swapped for instances where the content carries over (90 PlayStyle chips, 6 slots, 45 request rows, and on phone the AP counter, height-and-weight card and replay card). Attribute rows stay drawn: each slider's position follows its value, which code drives. The mannequin is redrawn and is the default face of every build (D-98).

### Decisions
All of Chime's open decisions are made (D-96, D-99): Supabase for face requests, listings and short share links; A-18 approved; first faces and builds named; tagline kept. A-16's test clip arrived (25 Nov): 36 frames centred on the turning axis, 729 KB, viewer at `reference/in-game/2026-11-25/turn/viewer.html`; Chime to judge it, then the 3D comparison (D-35).

### Needs checking in game (blocks the editor's rules, not the design)
- Done 25 Nov from Chime's video: all 39 specializations (PlayStyle+, targets, perks; §10.4 and the archetype file) and every archetype's height and weight range (§10.3).
- Still open: attribute effects at the height and weight maximums, the AcceleRATE cut-offs (§10.3, sources disagree on Lengthy), and whether keeper "Positioning" is GK Positioning.
- PS5 to USB copies arrive as empty files; the PS App route works but is slow. Next try: the read-only recovery script (`reference/tools/recover_exfat.py`, git-ignored) on one copied clip, to see whether the video is on the stick.
- Attribute prices per archetype (O-14), before the live "AP left" counter turns on (D-85).

### Pull requests waiting on Chime
- #7 level engine ported from the prototype (Sharon), #8 six key stats and GK Kicking (Sharon; GK Kicking now seen in game, and main already has the same list line), #9 athlete faces and plain face titles (Sharon, D-68, D-69).

### Before code, in order
1. Chime answers the decisions above and approves each phase (rule 10: on the iPhone next to the TV).
2. Claude swaps the drawn copies for component instances.
3. Done 25 Nov: UI-BRIEF §1–3, `tokens.css` generated from the Figma snapshot (`npm run tokens`, D-101), CLAUDE.md points at hyFx4Audhn4F9KxL9bRCLD. Open for Chime: O-20 (input borders), O-21 (hover fill).
4. Building (25 Nov): the app shell (D-102), /about and /takedown are done; type is one size everywhere (D-103). Blocked: Builds needs shippable archetype emblems (D-39: today's are Pro Clubs HQ tracings) and PlayStyle icon files; Home and Faces need published content, face pictures and a face-of-the-week rule; Changelog's three entries are drafts. The 404 and /changelog are done (the changelog lists only published entries; all three are drafts until Chime approves their wording). Everything left needs Chime: Builds (shippable emblems, the Progressor stance), Home and Faces (published content, face pictures, a face-of-the-week rule), Submit and Request a face (Supabase project, attribute prices O-14), About's six answers and the copy in O-22. Each screen: read its Figma frame with get_design_context, e2e test first, render compared with the Figma screenshot at 393, 834 and 1440, verifier and code review, then commit. Sharon's PRs are on hold (Chime, 25 Nov).

### How to work with Chime on design (learned)
- Show work in Figma, never a new file; rejected work goes to Archive, never deleted.
- Three options per new screen when asked; Chime picks; then tablet and desktop (D-58).
- One type style per role (DESIGN.md §Type); check renders up close before showing; never invent values (samples are labelled).
