# 🧑‍💻 Copilot Instructions for Talon Command Search Extension

## Big Picture Architecture
- **Purpose:** Search, filter, and browse Talon Voice commands and lists (.talon, .talon-list) with advanced UI and instant results.
- **Core Components:**
  - `src/extension.ts`: VS Code integration, command registration, file scanning, and webview setup.
  - `src/database/dataManager.ts`: JSON-based database, in-memory search, repository breakdown, stats.
  - `src/parser/talonFileParser.ts` & `src/parser/talonListParser.ts`: Parse Talon command and list files.
  - `webview/`: UI logic (`search.js`) and styles (`styles.css`) for the search interface.
  - `src/types.ts`: TypeScript interfaces for commands, lists, and search scopes.

## Data Flow & Service Boundaries
- **Import Workflow:**
  - User triggers `Talon: Refresh Index` or auto-indexing on startup.
  - Extension scans user folder for `.talon` and `.talon-list` files (see auto-detection logic in `extension.ts`).
  - Files are parsed and loaded into the in-memory JSON database.
  - Search/filter operations are performed in-memory for speed.
- **Webview Communication:**
  - Webview sends search/filter/config requests via `postMessage`.
  - Extension responds with results, stats, config, and file open actions.

## Developer Workflows
- **Build:**
  - `npm install` to install dependencies.
  - `npm run compile` to build TypeScript.
  - `npm run watch` for live development.
  - Press F5 in VS Code to launch extension dev host.
- **Database Management:**
  - Use toolbar buttons in the webview to check/clear the database.
  - All data is stored in extension global storage, not workspace.
- **Publishing:**
  - Follow `PUBLISHING.md` for step-by-step VSCE/Marketplace release.
  - `.vscodeignore` excludes test/example data from published package.

## Project-Specific Patterns & Conventions
- **File Access:** Only reads Talon files; never writes or deletes user data.
- **Search Debounce:** Configurable delay (default 3000ms) for performance, set via VS Code settings.
- **Filtering:** Multi-dimensional filters (application, mode, repository, tags, OS, title) with persistent state.
- **List Matching:** Commands referencing lists (e.g., `<user.arrow_key>`) are mapped to actual list values for search.
- **UI:** Modern, responsive CSS Grid layout; tabbed interface for commands/lists/captures.
- **Stats:** Real-time command/list/repository breakdowns sent to webview.

## Integration Points
- **VS Code API:** Uses commands, configuration, clipboard, file open dialogs, and webview messaging.
- **No external services:** All search and parsing is local; no remote calls except for publishing.

## Key Files & Examples
- `src/extension.ts`: Main entry, command registration, webview setup, file import logic.
- `src/database/dataManager.ts`: Database structure, search/filter logic, stats.
- `src/parser/talonFileParser.ts`: Command file parsing.
- `src/parser/talonListParser.ts`: List file parsing.
- `webview/search.js`: UI logic for search/filter/stats.
- `webview/styles.css`: Responsive UI design.
- `.vscodeignore`: Ensures only essential files are published.
- `PUBLISHING.md`: Marketplace publishing workflow.

## Example: Adding a New Search Filter
- Update filter logic in `src/database/dataManager.ts`.
- Add filter UI in `webview/search.js` and `styles.css`.
- Update message handling in `src/extension.ts` to support new filter.

---

**If any section is unclear or missing, please provide feedback so instructions can be improved for future AI agents.**
