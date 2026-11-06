# Security and code review

Reviewed 6 November 2026. Scope: the complete supplied project tree, source, configuration, dependency manifests, lockfile, and generated production output. The initial project contained 26 files, no hidden configuration, no dependency directory, and no Git repository. No Git history or remote repository was available to inspect.

## Security results

| Area | Finding and disposition |
| --- | --- |
| Secrets and credentials | No exposed API keys, access tokens, passwords, private keys, cloud credentials, or environment files found in the supplied files. No values required rotation based on this scan. Pattern scans and manual review cannot prove that every possible secret is absent. |
| Private information | No personal contact information, local user paths, private endpoints, or user data storage found in the app source. |
| Dependencies | Initial npm audit: two affected packages, one high (Vite) and one low (esbuild). Updated Vite 7.3.2 to 7.3.7 and esbuild 0.27.x to 0.28.2. Final install audit: zero known vulnerabilities. Results describe the registry database at review time, not a guarantee about future advisories. |
| Supply chain | Lockfile retains integrity hashes and public npm registry package URLs. Installation used `--ignore-scripts`. Declared the directly imported `three-stdlib` dependency rather than relying on Drei's transitive installation. Removed the unused single-file build plugin. |
| External requests | Removed Google Fonts stylesheet/preconnects. Fonts now use local fallbacks. Procedural geometry and environment lighting require no remote model assets. No application API requests, analytics, authentication, cookies, local storage, or server-side processing found. |
| Injection | No `eval`, `dangerouslySetInnerHTML`, HTML injection sinks, or dynamic remote script loading found in application code. React renders component text. |
| Deployment | Added a static Vite deployment configuration with CSP, framing protection, MIME protection, restrictive device permissions, referrer policy, and asset caching. Source maps are disabled. Inline styles remain allowed for React/Three positioning; executable inline scripts are disallowed. |
| Git hygiene | Added exclusions for dependencies, build output, environment files, credentials, private keys, deployment account metadata, editor settings, caches, and logs. `.vercelignore` excludes source-review artifacts and sensitive configuration from deployment uploads. |

Relevant advisory sources: [Vite Windows command execution](https://github.com/advisories/GHSA-587h-7wmj-h5pm), [esbuild Windows file read](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr). Deployment configuration follows [Vercel's configuration documentation](https://vercel.com/docs/project-configuration/vercel-json).

## Code changes

- Reset clipping axis and offset when switching sections. Previously, selecting Y/Z in Blueprint and then opening Structure left its explicitly labelled X cut operating on the previous axis.
- Clear stale hover state on section changes and clean the blueprint body class on unmount.
- Replace the untyped camera controller with its actual type; guard perspective-camera aspect access.
- Release empty object-registry entries and avoid allocating a discarded base material for every cached material variant.
- Limit device pixel ratio to 1.5 instead of 2, reducing high-density canvas rendering work.
- Keep the page in stacked layout below 1536px so side panels do not crowd the 3D view; allow a taller layout in short desktop windows.
- Label icon-only navigation, animation selection, and timeline/speed controls; expose pressed states, add focus outlines, and support Enter/Space on interactive schematic geometry.
- Add WebGL and JavaScript fallback messages.
- Keep scene-label HTML roots mounted while changing visibility. Browser testing reproduced a React DOM `removeChild` error during section navigation; this change removed the teardown race in the subsequent smoke test.
- Replace the inlined single-file production bundle with cacheable hashed JavaScript/CSS assets. Add strict typechecking to builds and procedural animation/artifact validation.

## Validation and limitations

- Clean locked dependency install completed with lifecycle scripts disabled.
- Strict TypeScript checking passed.
- Production build passed with Vite 7.3.7.
- Pose validation passed for eight modes at six timestamps, checking finite body/joint values and expected limb counts.
- Production artifact and deployment output checks passed.
- Production bundle: approximately 1.48 MB JavaScript (425 KB gzip) and 36 KB CSS (7 KB gzip). Vite's large-chunk warning remains; the Three.js runtime and continuous rendering are the principal performance costs. No benchmark on physical mobile GPUs was performed.

Headless Edge smoke testing exercised navigation through all six sections at 390×844, 768×1024, 1280×800, and 1920×1080. The canvas mounted and no horizontal document overflow was detected. Detailed checks exercised Blueprint Y-axis cutting followed by Structure X-axis cutting, manual animation selection, joint adjustment, pause, and timeline seek. The proposed Content Security Policy was injected into local HTTP responses for verification; no application exceptions or third-party requests were observed after the label fix. This is smoke coverage, not pixel-by-pixel visual or exhaustive interaction testing.

A hosted Vercel deployment has not been tested; local policy checks do not establish live header behavior. Touch gestures, assistive technology, all GPU drivers, and complete visual coverage need release testing.

## Publication boundary

A local Git repository was initialized on `main` during publication preparation. The 33 files in `COMMIT_FILES.txt` were rescanned and staged for review; publication and pushing require the user's explicit approval. No remote repository was created or deployment performed during preparation. `COMMIT_FILES.txt` is the exact initial source file set, relative to this project root. `node_modules/` and `dist/` are local generated directories and are excluded. Any future additions must be rescanned and the manifest regenerated before approval. Files outside this project folder are outside the proposed repository.

Do not commit secrets even when `.gitignore` exists; previously tracked files are not protected by ignore rules. All `VITE_*` values are public browser configuration and must never contain credentials. Keep npm's lockfile committed and re-run `npm audit` before publication.
