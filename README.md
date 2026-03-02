# wakanda-kanban

Super-simple high-level Kanban board for Daniel.

## What it is

- Static app (HTML/CSS/JS)
- 3 columns: **TODO**, **IN PROGRESS**, **DONE**
- Data source: `data/board.json`
- No build step required

## Update the board

1. Open `data/board.json`
2. Add/edit cards in the `cards` array.
3. For each card, use this shape:

```json
{
  "title": "Project name",
  "column": "TODO",
  "status": "Short current status",
  "pendingTasks": [
    "Task 1",
    "Task 2"
  ]
}
```

### Allowed column values

- `TODO`
- `IN PROGRESS`
- `DONE`

## Local preview

Because the app fetches JSON, run a local server (don't open via `file://`).

```bash
# From repo root
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy (GitHub Pages)

This repo is designed to publish from branch `main` and folder `/ (root)`.

> Note: GitHub Pages availability depends on plan/repo visibility. If private-repo Pages is unavailable, make the repo public and keep using the same Pages settings.
