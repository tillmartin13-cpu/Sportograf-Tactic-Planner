# Sportograf Tactic Planner

Web-based planning tool for Sportograf team leaders.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build (Netlify)

```bash
npm run build
```

Publish directory: `dist`

## Current features

- Event list + create/delete
- Team CSV import (`Acronym`, optional `EventId` / `EventName`)
- Infofile import (spots + assignments, MAWI1/LS/DRONE rules)
- GPX track overlay
- Drag photographers onto spots
- Time conflict warnings
- JSON export (draft format)
- Planning Hub layout (info-first, map collapsible to fullscreen)

## Legacy TacMap

The field/briefing PWA remains in `../spotinfo-netlify/` until features are merged.
