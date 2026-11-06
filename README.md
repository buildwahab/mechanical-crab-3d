# CR-01 Mechanical Crab

An interactive 3D engineering explorer built with React, TypeScript, and Three.js. Inspect a procedural mechanical crab through six sections: overview, internal structure, component explorer, movement simulation, exploded assembly, and technical blueprint.

The model and telemetry are illustrative simulations, not measurements from a physical robot.

## Local development

Use Node.js 22.12 or newer (Node 24 LTS recommended) and npm.

```sh
npm ci --ignore-scripts
npm run dev
```

Open the localhost address printed by Vite. The development and preview servers bind to `127.0.0.1`. No API keys, accounts, environment variables, backend, or downloaded model assets are required.

```sh
npm run typecheck  # strict TypeScript validation
npm run validate   # typecheck, production build, pose and artifact checks
npm audit          # current dependency advisories, including development tools
npm run preview    # serve the built dist directory locally
```

## Controls

- Drag to orbit; scroll or pinch to zoom. Click a part to inspect it; double-click to focus.
- Use camera presets or Reset to restore the view.
- Structure controls expose armor, system layers, and a cross-section plane.
- Systems selects and highlights individual components while ghosting the assembly.
- Animation supports eight procedural modes, manual joint adjustment, playback, speed, seeking, and stepping.
- Exploded View separates the assembly; Blueprint provides render styles, dimensions, and X/Y/Z section cuts.

Component lists and schematic controls provide keyboard alternatives to selecting geometry. The 3D viewer requires WebGL; a fallback message appears when it is unavailable.

## Architecture

| Location | Purpose |
| --- | --- |
| `src/App.tsx` | Page composition, section effects, camera transitions |
| `src/store.ts` | Zustand state and GSAP transitions |
| `src/scene/Viewer.tsx` | Canvas, lighting, camera, dimensions, render updates |
| `src/creatures/types.ts` | Shared creature definition types |
| `src/creatures/registry.ts` | Creature library; only the crab is available |
| `src/creatures/crab/data.ts` | Components, specifications, animations, camera presets |
| `src/creatures/crab/parts.tsx` | Procedural model geometry and rig |
| `src/creatures/crab/pose.ts` | Pose generation and interpolation |
| `src/creatures/crab/CrabModel.tsx` | Per-frame rig updates |
| `src/three/` | Shared geometry/material caches, selection, camera API, live state |
| `src/ui/` | Panels, diagrams, section controls, timeline, reusable controls |
| `src/utils/cn.ts` | Class-name composition |
| `src/index.css` | Tailwind theme and custom styles |
| `scripts/validate.mjs` | Procedural animation and production artifact checks |

Dependencies include React 19, React DOM, React Three Fiber 9, Drei 10, Three.js, three-stdlib, Zustand, GSAP, Lucide React, clsx, and tailwind-merge. Development uses Vite 7, TypeScript 5, Tailwind CSS 4, the React/Tailwind Vite plugins, and type packages. Exact resolutions are recorded in `package-lock.json`.

## Deployment preparation

`npm run build` produces a static `dist/` directory with hashed assets. `vercel.json` configures Vite, the build output, security headers, and immutable asset caching. There is no client-side URL router, so catch-all rewrites are unnecessary. For another static host, serve `dist/` and apply equivalent headers. Deployment under a subdirectory requires setting Vite's `base` and rebuilding.

The Content Security Policy permits local scripts, generated image/worker URLs, and inline styles needed by the 3D UI. Fonts use local system fallbacks; there are no intentional third-party requests. Build source maps are disabled. Keep development servers private and serve only the built output in production.

GitHub publication is being prepared locally. Review `SECURITY_AUDIT.md` and the exact source list in `COMMIT_FILES.txt` before publication. Vercel deployment requires separate approval.

## Limitations and ownership

The full 3D runtime is a substantial initial download, and the scene renders continuously. Mobile battery use and performance depend on the GPU; render resolution is capped at 1.5 device pixels per CSS pixel. Browser checks cannot establish performance across physical devices. Real GPU, touch, and production-host checks are still recommended before release.

No license was supplied with the project. Confirm ownership and choose a license before distributing it; dependency licenses remain applicable.
