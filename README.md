# room-planner

A drag-and-drop room planner that runs entirely in the browser. Draw rooms, place
furniture, add doors, measure, and export the plan as JSON. No account, no backend: plans
persist in `localStorage`.

Live: <https://room-planner-puce.vercel.app>

## Features

- Rooms and furniture pieces with real dimensions (cm), a scale bar, and a measure tool
- Doors, grouping / ungrouping, duplicate, delete
- Snap-to-grid, undo / redo, reset view
- Multiple named plans; JSON export and import with versioned migration

## Stack

Next 16 (App Router), React 19, TypeScript strict, Tailwind v4, and
[react-konva](https://github.com/konvajs/react-konva) for the canvas.

One thing worth knowing if you touch the canvas: Konva does not resolve CSS `var()` in
`fill` / `stroke`, so canvas colours are literal hex values, not theme tokens.

## Develop

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # vitest: geometry, snapping, doors, grouping, units, storage
npx playwright test  # e2e against a production build
npm run build
```
