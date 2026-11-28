# Content formats, v1

Every piece of content is one UTF-8 JSON file in `content/`. The site, the build check and the submit builder all read and write these shapes (A-02). `validate.ts` enforces them; one bad file fails the build. Change a shape only with a new `schemaVersion` and a decision.

## Shared parts

**Status.** `"draft"` (never built or listed), `"published"`, `"withdrawn"` (never built, listed or linked; D-10).

**Placeholder.** The string `"PLACEHOLDER"` may stand in for any value Chime hasn't recorded. A file containing it must be `"draft"`. The validator fails a `"published"` file that contains it anywhere.

**Example marker.** A draft may carry `"_example": "<why this file exists>"`. The validator fails a `"published"` file that has it.

**Version tag** (D-05). Every build and face has one.

```json
{ "game": "fc27", "season": 2, "verifiedOn": "2026-11-19", "verifiedBy": "Chime", "platform": "TODO" }
```

- `game`: `"fc27"`. `season`: integer. `verifiedOn`: ISO date or `null`. `verifiedBy`: name or `null`. `platform`: `"ps5"`, `"xbox"`, `"pc"` or `null` (O-09).
- Wording (one function, A-08): verified gives "FC 27 · Season 2 · verified 19 Nov 2026"; `verifiedOn: null` gives "FC 27 · Season 2 · Not yet checked in game". A season older than the current one adds: "Made for Season 2. Values may have changed since."

**Credit** (D-08).

```json
{ "role": "tutorial", "name": "Creator name", "url": "https://www.youtube.com/watch?v=…", "creatorId": "creator-slug" }
```

- `role`: `"made-by"`, `"tutorial"` (a video Chime followed), `"submitted-by"`, `"reference"`. Every build and face has at least one `"made-by"`.
- `creatorId` points into `content/creators.json`, or `null`.

**Source.** Facts cite where they came from.

```json
{ "title": "EA, The Grounds developer archetypes update", "url": "https://ea.com/…", "accessed": "2026-11-18" }
```

**Value** (D-13). Stored the way the game shows it. Day 0 decides which kinds recipes use (O-03).

Kinds follow what the FC 27 editor shows (RESEARCH §9, A-09).

| kind | Shape | The game shows |
| --- | --- | --- |
| `item` | `{ "kind": "item", "number": 116 }` | a numbered catalogue choice, "Nose 116"; integer from 1 |
| `named` | `{ "kind": "named", "name": "Warm Black" }` | a choice shown by name: a colour, "None", an eyebrow shape, a hairstyle category |
| `slider` | `{ "kind": "slider", "low": "Down", "high": "Up", "value": 45 }` | a Sculpt slider: integer 0 to 100, with the labels at its two ends as the game prints them |
| `position` | `{ "kind": "position", "percent": 38 }` | a slider with no number (Skin Tone): the knob's place along the track, 0 at the far left, 100 at the far right, measured from Chime's screenshot and shown on the site as a drawn track, never as a game number |

## Archetype (`content/archetypes/fc27.json`)

One file per game. Unverified fields are `null`, never guessed.

```json
{
  "schemaVersion": 1,
  "game": "fc27",
  "updated": "2026-11-19",
  "archetypes": [
    {
      "id": "finisher",
      "name": "Finisher",
      "positionGroup": "attacker",
      "signaturePlayStyles": [
        { "name": "Low Driven Shot", "since": "launch", "sourceIds": ["dexerto-archetypes"] },
        { "name": "First Touch", "since": "season-2", "sourceIds": ["pchq-archetype-changes"] }
      ],
      "masteryAttributes": { "attributes": ["Finishing", "Composure"], "sourceIds": ["ea-grounds-deep-dive"] },
      "apCostChange20261022": { "up": 6, "down": 4, "sourceIds": ["ea-archetypes-update"] },
      "specializations": [
        { "name": "Hunter", "playStyle": "Gamechanger", "targets": [ { "attribute": "Balance", "value": null } ], "sourceIds": ["…"] }
      ],
      "typicalPositions": null
    }
  ],
  "sources": [ { "id": "ea-archetypes-update", "title": "…", "url": "…", "accessed": "2026-11-18" } ]
}
```

- File-level `note` (string) explains what is and isn't sourced. Each archetype also has `verifiedInGame` (boolean, false until Chime checks it) and `notes` (string or `null`).
- `positionGroup`: `"goalkeeper"`, `"defender"`, `"midfielder"`, `"attacker"` (EA's grouping).
- `sourceIds` point into the file's `sources`.
- `specializations` (A-18): `null` until recorded. `playStyle` is the PlayStyle+ it gives. `targets` is `null` when nobody has read them; a target's `value` is `null` when only its attribute is known (RESEARCH §10.4). Once an archetype has a list, its builds may only name a specialization in it.

## Build (`content/builds/<slug>.json`)

```json
{
  "schemaVersion": 1,
  "id": "spark-2008-winger",
  "slug": "spark-2008-winger",
  "status": "draft",
  "title": "PLACEHOLDER",
  "archetype": "spark",
  "positions": ["RW", "LW"],
  "summary": "PLACEHOLDER",
  "badge": null,
  "level": "PLACEHOLDER",
  "picture": null,
  "body": { "heightCm": "PLACEHOLDER", "weightKg": "PLACEHOLDER", "accelerate": "PLACEHOLDER" },
  "attributes": [ { "name": "Acceleration", "value": "PLACEHOLDER" } ],
  "playStyles": { "signature": ["Trickster", "Rapid"], "plus": ["PLACEHOLDER"], "regular": ["PLACEHOLDER"] },
  "specialization": "PLACEHOLDER",
  "skillMoves": "PLACEHOLDER",
  "weakFoot": "PLACEHOLDER",
  "spend": null,
  "version": 1,
  "versionTag": { "game": "fc27", "season": 2, "verifiedOn": null, "verifiedBy": null, "platform": null },
  "credits": [ { "role": "made-by", "name": "Chime", "url": null, "creatorId": null } ],
  "sources": [],
  "history": [ { "version": 1, "date": "2026-11-19", "note": "Example file with placeholder values." } ],
  "createdAt": "2026-11-19",
  "updatedAt": "2026-11-19"
}
```

- `archetype` must match an id in `content/archetypes/fc27.json`.
- `positions` from: `GK CB LB RB LWB RWB CDM CM CAM LM RM LW RW CF ST`.
- `accelerate`: one of the game's seven AcceleRATE types, `"explosive"`, `"mostly-explosive"`, `"controlled-explosive"`, `"controlled"`, `"controlled-lengthy"`, `"mostly-lengthy"`, `"lengthy"`, or `null`.
- `level` and attribute values are integers once recorded. Attribute `name` must be in `ATTRIBUTE_GROUPS` (`src/lib/content/attributes.ts`), once each, with a value from 0 to 99. The names still need checking against the game's own screen.
- `badge` (A-18, D-34, D-62): `"meta"` (Meta pick), `"recommended"` or `null`. A published Meta pick needs a `verifiedOn` date (D-30). "Most copied" is counted later, so it isn't stored here.
- `picture` (A-18, D-41, D-42): `{ "file": "builds/<slug>.webp", "alt": "…", "by": "Chime" }`, our own in-game face, or `null` for the empty slot.
- `spend` (A-18, D-43): the order the build was made in, or `null` (the page then has no level switch). Attribute and star values, raised step by step from the archetype's starting values:
  `{ "start": [ { "name": "Finishing", "value": 70 } ], "startStars": { "skillMoves": 3, "weakFoot": 3 }, "steps": [ { "raise": "Finishing", "to": 85 }, { "raise": "Weak Foot", "to": 4 } ] }`
  Every step raises its value, and walking the steps must end on the build's own `attributes`, `skillMoves` and `weakFoot`.
- `sample` (D-107, optional): Figma's sample figures, for the sample build drawn in the Build frames. Only a `"draft"` may have it (a published file with `sample` fails), so it shows on the preview only. It holds what no recorded build can give yet:
  `{ "keyStats": { "PAC": 88, "SHO": 80, "PAS": 58, "DRI": 84, "DEF": 38, "PHY": 66 }, "levels": [ { "level": 55, "ap": 1419, "spent": 1410, "apShort": null }, { "level": 32, "ap": 724, "spent": 724, "apShort": 695 } ], "specialization": { "note": "Targets …", "target": 92, "reachedFrom": 50 } }`
  `keyStats`: all six, 0 to 99 (also the attribute groups' gauges). `levels`: the levels the design draws, each once, 1 to 55, including the build's own `level` (empty for a sample drawn only as an archetype card, such as Tall and Quick Finisher, whose page then has no level switch, and whose `specialization` is then `null`); `spent` is at most `ap`; `apShort` is how far short of the whole build that level is, or `null`. `specialization`: the note under the card, the one target value the sample counts, and the level it is reached from; or `null`.
- Bump `version` and add a `history` line whenever a value changes.

## Face recipe (`content/faces/<slug>.json`)

```json
{
  "schemaVersion": 1,
  "id": "cristiano-ronaldo-2008",
  "slug": "cristiano-ronaldo-2008",
  "status": "draft",
  "subject": { "name": "Cristiano Ronaldo", "kind": "footballer", "living": true },
  "era": { "label": "2008", "note": "PLACEHOLDER" },
  "title": "2008 Ronaldo",
  "target": { "look": "matchday" },
  "timeMinutes": "PLACEHOLDER",
  "preset": { "number": "PLACEHOLDER" },
  "parts": [
    { "tab": "skin", "steps": [ { "control": "complexion", "label": "Complexion", "value": { "kind": "item", "number": "PLACEHOLDER" }, "tip": null } ] },
    { "tab": "head", "steps": [ { "control": "jaw", "label": "Jaw", "value": { "kind": "item", "number": "PLACEHOLDER" }, "tip": null } ] },
    { "tab": "face", "steps": [ { "control": "nose", "label": "Nose", "value": { "kind": "item", "number": "PLACEHOLDER" }, "tip": null } ] },
    { "tab": "hair", "steps": [ { "control": "hair-colour", "label": "Hair colour", "value": { "kind": "named", "name": "PLACEHOLDER" }, "tip": null } ] }
  ],
  "sculpt": {
    "symmetry": true,
    "steps": [
      { "mode": "shape", "layer": "skeletal", "region": "Chin", "subRegion": "Chin",
        "sliders": [ { "kind": "slider", "low": "Narrow", "high": "Widen", "value": "PLACEHOLDER" } ], "tip": null }
    ]
  },
  "visualAge": null,
  "limits": ["PLACEHOLDER"],
  "pairedBuild": "spark-2008-winger",
  "screenshots": [],
  "turn": null,
  "embeds": [],
  "version": 1,
  "versionTag": { "game": "fc27", "season": 2, "verifiedOn": null, "verifiedBy": null, "platform": null },
  "credits": [ { "role": "made-by", "name": "Chime", "url": null, "creatorId": null } ],
  "history": [ { "version": 1, "date": "2026-11-19", "note": "Example file with placeholder values." } ],
  "createdAt": "2026-11-19",
  "updatedAt": "2026-11-19"
}
```

- `subject.kind`: `"footballer"`, `"athlete"` (another sport's star) or `"musician"` (D-10, D-68). `living: false` fails validation unless a decision allows that subject by exact name (D-10, D-26: Michael Jackson).
- `title` is the plain name, era or look included ("2008 Ronaldo"), never "official" (D-69).
- Order of work: preset, then `parts`, then `sculpt`, then `visualAge`. Sculpting a region turns its part into "Custom <part>" in the game, so parts come first (inferred from the editor; confirm on PS5).
- `preset.number`: the photo preset's place counted among photo presets only, left to right, top to bottom, under the "All" filter. Never the screen row: the grid starts with each player's own saved heads, so rows differ between players (RESEARCH §9).
- `parts[].tab`: `"skin"`, `"head"`, `"face"`, `"hair"`, in that order. A step's `label` is the section name as the game prints it ("Facial Hair"); `control` is that label in kebab-case (`facial-hair`). Part values are `item` or `named`. List only sections changed from the preset.
- `sculpt.symmetry`: the Symmetry toggle while sculpting. Recipes assume Free Sculpt off. `mode`: `"shape"`, `"weight"`, `"definition"`. `layer`: `"skeletal"`, `"flesh"`, `"fat"`. `region` and `subRegion` are the game's labels ("Brow Ridge", "Eyelid Upper"). `sliders` are that sub-region's sliders in screen order, top to bottom, each a `slider` value; list a sub-region only if one of its sliders changed, with all its sliders.
- `visualAge`: `null` (left as the preset has it) or `{ "toward": "older" | "younger", "percent": 0–100 }`: how far the knob was pushed from the centre toward that end, 100 meaning the game shows "LIMIT REACHED". Measured from Chime's screenshot. Save when the game asks.
- Skin Tone, when changed, is the first `skin` step: `{ "control": "skin-tone", "label": "Skin Tone", "value": { "kind": "position", "percent": … } }`.
- `sculpt` may be `null`: a quick face uses only the preset, parts and Visual Age (RESEARCH §9, "Quick faces").
- `limits`: what the game can't do for this look ("No 2008 hairstyle; nearest is …").
- `pairedBuild` must match a build id.
- `screenshots`: `{ "file": "faces/<slug>-1.webp", "alt": "Chime's Pro in FC 27, front view", "by": "Chime" }`. Only Chime's own in-game captures of their recreation (D-10). The face's link preview (next/og) can't draw WebP: a .jpg or .png of the same name beside the first picture is used for it (`faces/<slug>-1.jpg`), else the preview has no picture.
- `sample` (D-107, D-108, optional): `{ "place": 1 }` marks one of Figma's sample faces, the demo faces drawn in the Faces library; `place` is where the library draws it (from 1), and the library lists samples in that order, before other faces. Only a `"draft"` may have it (a published file with `sample` fails), so it shows on the preview only. A sample's screenshot may be Figma's stand-in picture, kept under `sample/faces/` (`"by"` names the creator whose video it is from); no other face may use that folder. Two samples may not share a place. The library shows the demo note instead of the Draft tag on a sample's card (D-113). A build without drafts deletes `sample/` from `out/`.
- `sample.recipe` (D-107, optional): Figma's sample recipe from the face page frames: `{ "sections": [ { "name": "Preset", "values": 1, "screens": 1 }, … ], "screens": [ { "step": 1, "where": "Head › Presets", "title": "Pick the preset", "values": [ { "label": "Preset", "value": "147" } ], "hint": "…", "next": "Customize › Skin · 4 values" } ] }`. `sections` are Preset, Skin, Head, Face, Hair, Sculpt, Visual Age (each at most once, in that order) with how many values and game screens each has (screens at most values). `screens` holds only the screens a frame draws, by step number (from 1 to the total of screens, ascending), each with at least one value and no more than its section has; `next` is the "Next:" line as drawn, or `null`. The face page then walks those screens, from one drawn screen to the next, instead of the face's parts.
- `turn` (A-18, D-35): `{ "folder": "faces/<slug>/turn", "frames": 36, "by": "Chime" }`, numbered frames cut from the maker's own turn clip, 12 to 72 of them; `null` until the clip exists.
- `embeds`: `{ "provider": "youtube", "videoId": "…", "title": "…", "channel": "…", "creatorId": "…" }`. Loaded on tap (A-05). Every embed has a matching `"tutorial"` credit.
- Step ticks are stored under `face:<id>:v<version>` (A-07).

## Changelog entry (`content/changelog/<yyyy-mm-dd>-<slug>.json`)

```json
{
  "schemaVersion": 1,
  "id": "2026-10-22-archetype-update",
  "status": "draft",
  "date": "2026-10-22",
  "kind": "archetype-update",
  "game": "fc27",
  "season": 2,
  "title": "Archetype costs re-priced, every build reset",
  "changes": ["…"],
  "source": { "title": "…", "url": "…", "accessed": "2026-11-18" },
  "affects": { "builds": [], "faces": [] },
  "siteNote": null
}
```

- `kind`: `"season"`, `"title-update"`, `"archetype-update"`, `"site"`.
- `changes` restate EA's facts in our words; never paste EA's text.
- `affects` lists build and face ids that changed because of it.

## Creators (`content/creators.json`)

```json
{
  "schemaVersion": 1,
  "creators": [
    { "id": "creator-slug", "name": "…", "url": "…", "platform": "youtube", "permission": "not-asked", "featured": false, "notes": "…" }
  ]
}
```

- `permission`: `"not-asked"`, `"asked"`, `"yes"`, `"no"`. A full slider list from a creator is published only with `"yes"` (D-08).

## PlayStyles (`content/playstyles.json`)

What each PlayStyle and PlayStyle+ does, for the info sheet every badge opens (D-121 (4)). Unlike changelog lines, these are EA's own published words, quoted exactly and credited to the EA page they were read from; never another site's text (rule 9).

```json
{
  "schemaVersion": 1,
  "game": "fc27",
  "updated": "2026-11-28",
  "note": "…",
  "sources": [ { "id": "ea-what-are-playstyles", "title": "EA, PlayStyles: Everything You Need to Know (FC 27, 25 Sep 2026)", "url": "https://www.ea.com/…", "accessed": "2026-11-28" } ],
  "playStyles": [
    {
      "name": "Chip Shot",
      "playStyle": { "text": "Performs chip shots faster and with greater accuracy.", "sourceId": "ea-what-are-playstyles" },
      "plus": { "text": "Performs chip shots more quickly with exceptional accuracy.", "sourceId": "ea-what-are-playstyles" },
      "notes": null
    }
  ]
}
```

- `name` is the PlayStyle's name as the rest of content writes it; each name appears once. Every name an archetype, a specialization or a build uses must have an entry, or the build fails.
- `playStyle` and `plus` are `{ text, sourceId }`, or `null` when EA's wording hasn't been found: the site then shows "To check in game".
- `sourceId` points into the file's `sources`, which are EA pages only (ea.com, help.ea.com).
- `notes` (string or `null`) is for whoever edits the file, such as EA contradicting itself; it is never shown.
- `caveat` (optional, object or `null`) is shown under the description: `{ text, sourceIds }`, when EA's own pages disagree about a PlayStyle (Low Driven Shot), reporting what each says with at least one `sourceId` from `sources` (D-122).
