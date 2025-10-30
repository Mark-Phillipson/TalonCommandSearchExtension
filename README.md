# Search Talon Commands - VS Code Extension

Search and browse 10,000+ Talon Voice commands and lists with advanced filtering.

## Features

- **Fast SQLite Storage**: Handles large datasets (10k+ commands) with native SQL queries
- **Full-Text Search**: FTS5 engine for instant search across commands, scripts, and metadata
- **Advanced Filtering**: Filter by application, mode, repository with SQL performance
- **Multiple Search Scopes**: 
  - Command Names Only (contains match)
  - Scripts Only
  - All (full-text search across everything)
- **Auto-Detection**: Automatically finds your Talon user folder on Windows/Mac/Linux
- **File Integration**: Click any result to open the source .talon file
- **Keyboard Shortcuts**: `Ctrl+Shift+T` (Windows/Linux) or `Cmd+Shift+T` (Mac)

## Architecture

**Database**: SQLite3 via `better-sqlite3` (synchronous, fast, reliable)
- Stored in extension global storage (workspace-independent)
- FTS5 full-text search for instant results
- Indexed columns for fast filtering
- Proven to handle 10k+ commands efficiently

**Why SQLite over IndexedDB?**
- IndexedDB cursor-based iteration too slow for 10k+ records
- SQL queries allow complex filtering without loading all data
- Synchronous API simpler than async IndexedDB
- Better performance for large datasets

## Quick Start

1. **Install the extension**
2. **Open Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. **Run**: `Talon: Refresh Index` (first time only)
4. **Search**: `Talon: Search Commands` or use `Ctrl+Shift+T`

## Configuration

```json
{
  "talonSearch.userFolderPath": "",           // Leave empty for auto-detection
  "talonSearch.enableAutoIndexing": true,     // Auto-import on startup
  "talonSearch.maxSearchResults": 500         // Max results per search
}
```

## Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode
npm run watch

# Run extension (press F5 in VS Code)
```

## Architecture

- **Extension Host** (`src/extension.ts`): VS Code command registration, file scanning, SQLite initialization
- **Database** (`src/database/sqliteManager.ts`): SQLite3 connection, schema, queries with FTS5
- **Parser** (`src/parser/talonFileParser.ts`): Talon file parsing logic (headers, commands, scripts)
- **Webview** (`webview/`): Search UI that communicates with extension host via postMessage
- **Data Models** (`src/types.ts`): TypeScript interfaces for commands and lists

Migrated from IndexedDB to SQLite for superior performance with 10k+ records.

## Commands

- `Talon: Search Commands` - Open search panel
- `Talon: Refresh Index` - Re-import all .talon files
- `Talon: Browse Lists` - Import from custom folder

## Roadmap

- [ ] List parsing and expansion
- [ ] TreeView for browsing results
- [ ] Semantic search integration
- [ ] Multi-filter UI (application, mode, OS, repository, tags)
- [ ] Command analytics and breakdown
- [ ] File watcher for live updates

## License

MIT
