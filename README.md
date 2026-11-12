# best-video-pipeline

Short-form 2D explainer videos from a narration script: script → scene plan → story → video.

## Making a video

```
npm run new -- my-topic            # projects/my-topic/ (vertical; --format horizontal, --pack <name>)
# write the narration into projects/my-topic/script.txt
npm run plan -- my-topic           # script -> plan.json (Claude; --mock for offline; --force to replace)
npm run build -- my-topic          # plan -> story.json, prints pacing (events/s, dead air)
npm run render -- my-topic         # story -> projects/my-topic/video.mp4
npm run studio                     # live preview of every project
```

`plan` is the only step that calls the model. Plans are meant to be edited by hand;
rerun `build` after an edit.

## Layout

- `projects/<name>/` — one folder per video: `project.json` (format, pack), `script.txt`,
  `plan.json`, `story.json`, `video.mp4` (not committed).
- `src/engine/` — shared by every video: timing, camera, captions, transitions,
  enter/exit/loop motion, and the pack contract (`pack.ts`). Changes here affect all projects.
- `src/packs/<pack>/` — a visual style: characters, props, backgrounds, and a `catalog.ts`
  that tells the planner what each asset means. Changes here affect only projects using it.
- `scripts/` — the plan / build / render CLI and the planner prompt.

## Adding a pack

Copy `src/packs/flat-basic/`, redraw the components, keep the character anchored at the head
center with feet ~340px below at scale 1, then register it in `src/packs/catalogs.ts` and
`src/packs/registry.ts`. Mood and gesture names are engine-wide and every pack must support them.

## 3D experiments (`src/experiments/`)

Hybrid 3D tests built with three.js through `@remotion/three` and `@react-three/fiber`, reusing the
engine's captions and word timing:

- `deneme-3d`: the CC0 RobotExpressive model over a 2D background.
- `kira-3d`: a 60-second tenant-rights explainer with 3D people over 2D backgrounds.
- `kira-sahne`: the opening lines played inside a 3D living room (`kira-3d/sets/Apartment.tsx`).

The people are one Ready Player Me avatar cloned per character, animated with Mixamo (Xbot) clips
baked onto it by `kira-3d/retarget.ts`. Those two models are not in the repository; fetch them
with `npm run models` and check their licences before publishing anything made with them.

```
npx remotion render src/index.ts kira-sahne out/kira-sahne.mp4
```
