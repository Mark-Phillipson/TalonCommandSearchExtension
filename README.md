# 🔍 Search Talon Commands - VS Code Extension

🎯 Search and browse 27,000+ Talon Voice commands and lists with lightning-fast performance and advanced filtering.

## ✨ Features

- **⚡ Lightning Fast JSON Storage**: Handles massive datasets (27k+ commands) with optimized in-memory search
- **🔎 Intelligent Search**: Instant search across commands, scripts, applications, and metadata
- **🎛️ Advanced Filtering**: Filter by application, mode, repository with real-time results
- **📊 Repository Breakdown**: See command distribution across your repositories (community, personal, etc.)
- **🎯 Multiple Search Scopes**: 
  - 🎪 Command Names Only (exact matches)
  - 📝 Scripts Only (code content search)
  - 🌐 All (comprehensive search across everything)
- **🤖 Auto-Detection**: Automatically finds your Talon user folder on Windows/Mac/Linux
- **📂 File Integration**: Click any result to open the source .talon file instantly
- **⌨️ Keyboard Shortcuts**: `Ctrl+Shift+T` (Windows/Linux) or `Cmd+Shift+T` (Mac)
- **📈 Real-time Stats**: Live command count and repository statistics

## 🏗️ Architecture & Performance

**💾 Database**: Optimized JSON storage with in-memory processing
- 🚀 Lightning-fast search through 27k+ commands
- 💼 Stored in extension global storage (workspace-independent)
- 🔍 Intelligent filtering without database complexity
- 📊 Real-time repository breakdown and statistics
- ✅ Proven to handle massive Talon command datasets

**🔄 Migration Journey**: 
- ❌ **SQLite Issues**: Native module compilation problems on Windows
- ❌ **IndexedDB**: Too slow for large datasets (cursor-based iteration)
- ✅ **JSON + In-Memory**: Perfect balance of speed, simplicity, and reliability

## 🚀 Quick Start

1. **📦 Install the extension**
2. **🎯 Open Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. **🔄 Run**: `Talon: Refresh Index` (first time only - imports your commands)
4. **🔍 Search**: `Talon: Search Commands` or use `Ctrl+Shift+T`
5. **📊 Enjoy**: See your command breakdown and start searching instantly!

## ⚙️ Configuration

```json
{
  "talonSearch.userFolderPath": "",           // 📁 Leave empty for auto-detection
  "talonSearch.enableAutoIndexing": true,     // 🔄 Auto-import on startup
  "talonSearch.maxSearchResults": 500         // 📊 Max results per search
}
```

## 👨‍💻 Development

```bash
# 📦 Install dependencies
npm install

# 🔨 Compile TypeScript
npm run compile

# 👀 Watch mode for development
npm run watch

# 🚀 Run extension (press F5 in VS Code)
```

## 🏛️ Technical Architecture

- **🎯 Extension Host** (`src/extension.ts`): VS Code integration, command registration, file scanning
- **💾 Database Manager** (`src/database/sqliteManager.ts`): JSON storage, in-memory search, repository breakdown
- **📝 Parser** (`src/parser/talonFileParser.ts`): Advanced Talon file parsing (headers, commands, scripts)
- **🖥️ Webview UI** (`webview/`): Modern search interface with real-time filtering and stats
- **📊 Data Models** (`src/types.ts`): TypeScript interfaces ensuring type safety

**🔄 Evolution**: Started with SQLite → Tried IndexedDB → Perfected with JSON + In-Memory for optimal performance!

## 🎮 Available Commands

- **🔍 `Talon: Search Commands`** - Open the powerful search panel
- **🔄 `Talon: Refresh Index`** - Re-import all .talon files (with progress indicator)
- **📁 `Talon: Browse Lists`** - Import commands from a custom folder

## 🗺️ Roadmap & Future Features

- [x] **✅ Repository Breakdown** - See command distribution across repositories
- [x] **✅ Horizontal Stats Layout** - Space-efficient command statistics
- [x] **✅ JSON Storage Migration** - Solved native module compilation issues
- [x] **✅ Real-time Search** - Lightning-fast search with 27k+ commands
- [ ] **🔮 List Parsing** - Support for Talon list files (.talon-list)
- [ ] **🌳 TreeView** - Hierarchical browsing of results
- [ ] **🧠 Semantic Search** - AI-powered command discovery
- [ ] **🎨 Enhanced UI** - More filtering options and better UX
- [ ] **👀 File Watcher** - Auto-refresh when .talon files change
- [ ] **📈 Usage Analytics** - Track most-used commands

## 🎉 What's New in This Version

- **🚀 Performance Revolution**: Migrated from SQLite to optimized JSON storage
- **📊 Repository Insights**: See exactly where your commands come from
- **🎨 Space-Efficient UI**: Horizontal repository breakdown saves screen space
- **⚡ Zero Dependencies**: No more native module compilation issues
- **🔧 Windows Compatible**: Solved all the pesky Node.js version conflicts
- **📈 Scalable**: Tested with 27,000+ commands and counting!

## 📝 License

MIT - Feel free to contribute and make Talon Voice even better! 🎯
