# AGENTS.md

## Repo Summary

This repository contains `@ronradtke/react-native-markdown-display`, a React Native markdown renderer.

The library:

- parses markdown with `markdown-it`
- normalizes the token stream
- converts tokens into an internal AST
- renders that AST with native React Native components, not a WebView

The source of truth is TypeScript in `src/`.
Build output is generated into `dist/`.

Do not hand-edit generated files in `dist/` unless the user explicitly asks for generated output changes only. Make source changes in `src/` and rebuild.

## Important Paths

- `src/index.tsx`: public entrypoint and exports
- `src/lib/parser.ts`: markdown string -> token cleanup -> AST pipeline
- `src/lib/AstRenderer.ts`: AST traversal and render dispatch
- `src/lib/renderRules.tsx`: default React Native rendering rules
- `src/lib/styles.ts`: default style map
- `src/lib/types.ts`: shared public/internal TypeScript types
- `src/lib/util/*`: token, AST, style, and helper utilities
- `__tests__/`: Jest test suite
- `dist/`: generated JS and declaration output

## Working Rules

- Keep implementation in TypeScript.
- Keep typings strict.
- Do not introduce `any` or `unknown` types.
- Prefer React Native types and library-provided types over local placeholder types.
- If a third-party boundary is awkward, narrow it with explicit unions or helper functions instead of falling back to `any`/`unknown`.
- Preserve the current parser/renderer architecture unless the task explicitly requires architectural change.
- Keep public API compatibility in mind. This library is consumed by external apps.

## Build And Verification

Run these after meaningful changes:

- `npm run typecheck`
- `npm run lint`
- `npm test -- --runInBand`

If public exports or package output changed, also run:

- `npm run build`

## TypeScript Expectations

- Source types should generate the package declarations. Do not reintroduce handwritten `.d.ts` files for source modules.
- Prefer explicit interfaces/types for AST nodes, render rules, and helper boundaries.
- Use React/React Native types for components, props, styles, and nodes where available.
- Keep optionality exact. This repo uses strict TypeScript settings.

## Testing Guidance

- Tests are written in TypeScript.
- Prefer focused tests on parser behavior, AST shape, renderer behavior, and public component behavior.
- When fixing bugs in token normalization or rendering, add or update a Jest test that proves the behavior.

## Style And Editing Notes

- Keep changes minimal and local when possible.
- Avoid broad refactors unless they materially improve correctness or maintainability.
- Preserve existing public names unless the user asks for a breaking API change.
- When changing style or render-rule behavior, consider React Native platform behavior and existing tests.

## Generated Output

- `package.json` points `main` and `types` at `dist/index.js` and `dist/index.d.ts`.
- After source changes, regenerate `dist/` with `npm run build`.
- If `src/` changes and `dist/` is committed in the repo, keep them in sync.
