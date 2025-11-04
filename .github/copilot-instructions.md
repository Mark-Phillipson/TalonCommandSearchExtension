# 🧑‍💻 Copilot Instructions for Talon Command Search Extension

```markdown
# 🧑‍💻 Copilot instructions — Talon Command Search

Short, actionable notes to get an AI coding agent productive in this repo.

1) Big picture (what this extension does)
  - Purpose: index and search Talon Voice commands (.talon) and lists (.talon-list) locally and present results in a WebView UI.
  - Design: file scanner → parser(s) → in-memory JSON-backed DB (DataManager) → WebView client. Parsing and search are local; no external services.

2) Core files to inspect (use these as touchpoints)
  - `src/extension.ts` — activation, commands, webview wiring, import flow and auto-detect logic.
  - `src/database/dataManager.ts` — where search, filters, and repository breakdown live (add filters and change scoring here).
  - `src/parser/talonFileParser.ts` & `src/parser/talonListParser.ts` — Talon parsing rules; mirror Talon syntax here.
  - `webview/search.js` & `webview/styles.css` — client-side UI, message handling, and filter controls.
  - `test-data/` and `test-db/` — sample Talon files and a serialized DB you can use for fast development.

3) Exact extension commands and config you can call or automate
  - Commands (contributed in package.json):
    - `talon.searchCommands` (Talon: Search Commands)
    - `talon.refreshIndex` (Talon: Refresh Index)
    - `talon.openListExplorer` (Talon: Import from Folder)
    - `talon.setUserFolder` (Talon: Set User Folder Path)
  - Relevant settings (namespace `talonSearch`): `userFolderPath`, `enableAutoIndexing`, `maxSearchResults`, `searchDebounceMs` (default 3000), `defaultApplications`, `excludedOperatingSystems`.

4) Webview message contract (observed in `extension.ts`)
  - Incoming messages from webview: `search`, `searchLists`, `getStats`, `getConfig`, `openFile`, `copyText`, `triggerRefresh`, `confirmClearDatabase`, `log`, `error`.
  - Outgoing messages sent to webview: `searchResults`, `listSearchResults`, `stats`, `config`, `importComplete`, `databaseCleared`, `error`, `setSearchScope`.

5) Developer workflows (concrete commands)
  - Install and build: `npm install` then `npm run compile`.
  - Live development: `npm run watch` + press F5 in VS Code to launch Extension Dev Host.
  - Tests: `npm test` (runs the compiled test runner under `out/test` if present).

6) Project conventions and gotchas
  - Read-only by design: the extension reads Talon files; it never modifies user Talon files — DB lives in extension global storage (DataManager uses the global storage path).
  - Auto-indexing: enabled when `talonSearch.enableAutoIndexing` is true; `autoDetectTalonPath()` tries common OS-specific locations (APPDATA/~/.talon/user).
  - Large indexes: imports parse files in batches and call `db.refreshCommandsBatch` / `db.refreshListItemsBatch` to avoid duplicates — be careful when modifying batch APIs.
  - UI scope values: search scope is an enum used across the codebase — prefer changing/reading the enum in `src/types.ts` for correctness.

7) Where to make common edits
  - Add a filter: update `dataManager.ts` search logic → add new UI control in `webview/search.js` → ensure `extension.ts` forwards the new field from messages to DataManager.
  - Change parsing: edit `parser/talonFileParser.ts` or `parser/talonListParser.ts` and use `test-data/` examples to validate.

8) Quick examples
  - Trigger a full reindex programmatically: execute command `talon.refreshIndex` (or click Refresh Index in the WebView toolbar).
  - Get runtime config sent to webview: webview sends `getConfig`; extension replies with `config` including `searchDebounceMs`.

9) Troubleshooting hints
  - If webview shows "Database not initialized", check activation logs and ensure DataManager initialized with a valid global storage path (see `activate()` in `src/extension.ts`).
  - Parsing failures are logged to console; look for `Failed to parse` messages with the file path.

If anything here is incomplete or you'd like more examples (message payload shapes, enum values, or a short dev checklist), tell me what to expand and I'll iterate.

```
## Example: Adding a New Search Filter
