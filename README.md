# 🔍 Search Talon Commands - VS Code Extension

🎯 Search and browse 27,000+ Talon Voice commands and lists with lightning-fast performance and advanced filtering.

## ✨ Features

- **⚡ Lightning Fast JSON Storage**: Handles massive datasets (27k+ commands) with optimized in-memory search
- **🔎 Intelligent Search**: Instant search across commands, scripts, applications, and metadata
- **🎛️ Advanced Filtering**: Filter by application, mode, repository with real-time results
- **📊 Repository Breakdown**: See command distribution across your repositories (community, personal, etc.)
- **🎯 Multiple Search Scopes**: 
  - 🎪 Command Names Only (exact matches + intelligent list matching)
  - 📝 Scripts Only (code content search)
  - 🌐 All (comprehensive search across everything + list matching)
- **🧠 Intelligent List Matching**: Search by list values to find commands that use them
  - 🔍 Search "left" → finds `game <user.arrow_key>` (because "left" is in the arrow_key list)
  - 🎭 Search "happy" → finds `insert <user.emoji>` (because "happy" is in the emoji list)
  - 🔗 Automatically maps command placeholders to actual Talon lists
  - ✨ Works with complex list naming structures and repository paths
- **🤖 Auto-Detection**: Automatically finds your Talon user folder on Windows/Mac/Linux
- **📂 File Integration**: Click any result to open the source .talon file instantly
- **⌨️ Keyboard Shortcuts**: `Ctrl+Shift+T` (Windows/Linux) or `Cmd+Shift+T` (Mac)
- **📈 Real-time Stats**: Live command count and repository statistics
- **🔧 Folder Management**: Set custom Talon user folder paths and import from any directory
- **🛠️ Database Tools**: Built-in database management with clear/check functionality

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

## 🧠 How List Matching Works

The **Intelligent List Matching** feature revolutionizes command discovery by letting you search for the values that commands accept, not just their names.

### ✨ Examples

| Search Term | Finds Commands | Why? |
|-------------|---------------|------|
| `"left"` | `game <user.arrow_key>` | "left" exists in the arrow_key list |
| `"chrome"` | `focus <user.running_applications>` | "chrome" is in the applications list |
| `"happy"` | `insert <user.emoji>` | "happy" is an emoji in the emoji list |
| `"enter"` | `press <user.keys>` | "enter" is in the keys list |

### 🔧 Technical Details

1. **🔍 Placeholder Detection**: Finds placeholders like `<user.arrow_key>` and `{user.emoji}` in commands
2. **🗺️ Smart Mapping**: Maps simplified names (`user.arrow_key`) to full database paths (`user.community/core/keys/arrow_key`)
3. **📊 List Lookup**: Searches through actual Talon list files (.talon-list) for matching values
4. **✅ Match Return**: Returns the command as a match if your search term exists in any referenced list

### 🎯 Search Scopes That Support List Matching

- **Command Names Only**: ✅ Includes list matching
- **Scripts Only**: ❌ No list matching (searches code content only)  
- **All**: ✅ Includes list matching + everything else

This feature makes it incredibly easy to discover commands when you know what you want to do but don't know the exact command name!

## 🚀 Quick Start

1. **📦 Install the extension**
2. **🎯 Open Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. **🔄 Run**: `Talon: Refresh Index` (first time only - imports your commands)
4. **🔍 Search**: `Talon: Search Commands` or use `Ctrl+Shift+T`
5. **📊 Enjoy**: See your command breakdown and start searching instantly!
6. **🧠 Try List Matching**: Search for values like "left", "chrome", or "happy" to see the magic!

## ⚙️ Configuration

```json
{
  "talonSearch.userFolderPath": "",           // 📁 Leave empty for auto-detection
  "talonSearch.enableAutoIndexing": true,     // 🔄 Auto-import on startup  
  "talonSearch.maxSearchResults": 500         // 📊 Max results per search
}
```

### 🔧 Configuration Details

- **User Folder Path**: Auto-detects standard Talon locations:
  - Windows: `%APPDATA%\talon\user` 
  - Mac: `~/.talon/user`
  - Linux: `~/.talon/user`
- **Auto Indexing**: Automatically imports commands on VS Code startup
- **Max Results**: Prevents UI slowdown with large result sets (default: 500)

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
- **🎨 Modern UI** (`webview/styles.css`): CSS Grid responsive layout with VS Code theming

**🔄 Evolution**: Started with SQLite → Tried IndexedDB → Perfected with JSON + In-Memory for optimal performance!

### 🏗️ Key Technical Improvements

- **Responsive Design**: CSS Grid automatically adapts to screen size (3/2/1 columns)
- **In-Memory Search**: All filtering and search operations run in memory for instant results
- **Repository Intelligence**: Smart path parsing extracts repository info from file paths
- **Additive Imports**: Support both full refresh and incremental folder imports
- **Database Isolation**: Commands stored in extension global storage, workspace-independent

## 🆕 Recent Updates (Latest)

### 🧠 Revolutionary List Matching (NEW!)
- **🎯 Intelligent List Value Search**: Find commands by searching for the values they accept
- **🔍 Smart Placeholder Mapping**: Automatically maps `<user.arrow_key>` to actual lists like `user.community/core/keys/arrow_key`  
- **✨ Enhanced Command Discovery**: Search "left" to find all commands that use arrow keys
- **🚫 No False Positives**: Only matches actual Talon lists, not code captures
- **🏃‍♂️ Performance Optimized**: Debounced search with race condition prevention
- **📊 Works Across All Scopes**: List matching available in Command Names Only and All search scopes

### 🎨 Enhanced UI & User Experience
- **CSS Grid Layout**: Modern responsive design with automatic 3-column layout
- **Improved Results Display**: Cards now use optimal grid spacing for better readability
- **Interactive Repository Stats**: Click on any repository in the breakdown to instantly filter results
- **Visual Filter Feedback**: Selected repositories are visually highlighted in the stats
- **🔄 Stable Results**: Fixed issue where search results would sometimes disappear

### 🛠️ Database Management Tools
- **Check Database**: New toolbar button to inspect database status and location
- **Clear Database**: Safe database clearing with confirmation dialogs
- **Better Error Handling**: Improved feedback when database isn't initialized

### 📁 Flexible Folder Management
- **Set User Folder**: New command to configure your Talon user folder path
- **Import from Folder**: Import commands from any directory (additive to existing commands)
- **Refresh vs Import**: Clear distinction between refreshing (replace all) and importing (add to existing)

### 📦 Publishing & Distribution
- **Complete Publishing Guide**: Step-by-step marketplace publishing documentation
- **VSCE Integration**: Ready-to-publish package with proper configuration
- **Professional Documentation**: Comprehensive setup and usage instructions

## 🚀 Quick Start

## 🎮 Available Commands

- **🔍 `Talon: Search Commands`** - Open the powerful search panel
- **🔄 `Talon: Refresh Index`** - Re-import all .talon files (with progress indicator)
- **📁 `Talon: Import from Folder`** - Import commands from a custom folder (additive)
- **⚙️ `Talon: Set User Folder Path`** - Configure your Talon user folder location

## 🗺️ Roadmap & Future Features

- [x] **✅ Repository Breakdown** - See command distribution across repositories
- [x] **✅ Horizontal Stats Layout** - Space-efficient command statistics  
- [x] **✅ JSON Storage Migration** - Solved native module compilation issues
- [x] **✅ Real-time Search** - Lightning-fast search with 27k+ commands
- [x] **✅ CSS Grid Layout** - Responsive 3-column results layout
- [x] **✅ Database Management** - Built-in tools for clearing and checking database
- [x] **✅ Folder Management** - Custom folder selection and import workflows
- [x] **✅ Enhanced Filtering** - Clickable repository stats and dynamic filtering
- [x] **✅ Publishing Ready** - Complete publishing guide and marketplace preparation
- [x] **✅ List Parsing & Matching** - Full support for Talon list files (.talon-list) with intelligent command matching
- [ ] **🌳 TreeView** - Hierarchical browsing of results
- [ ] **🧠 Semantic Search** - AI-powered command discovery
- [ ] **👀 File Watcher** - Auto-refresh when .talon files change
- [ ] **📈 Usage Analytics** - Track most-used commands

## 🎉 What's New in This Version

- **🚀 Performance Revolution**: Migrated from SQLite to optimized JSON storage
- **📊 Repository Insights**: See exactly where your commands come from with clickable stats
- **🎨 Modern UI**: CSS Grid layout with responsive 3-column design
- **🛠️ Database Tools**: Built-in database management (check/clear with confirmation dialogs)
- **📁 Flexible Imports**: New commands for setting user folder and importing from any directory
- **⚡ Zero Dependencies**: No more native module compilation issues
- **🔧 Windows Compatible**: Solved all the pesky Node.js version conflicts
- **📈 Scalable**: Tested with 27,000+ commands and counting!
- **📦 Publishing Ready**: Complete marketplace publishing guide included

## � Publishing & Distribution

This extension is ready for VS Code Marketplace publication! A comprehensive publishing guide is included:

- **📋 Complete Setup**: Step-by-step Azure DevOps and Personal Access Token configuration
- **🔧 VSCE Integration**: All package.json settings configured for publishing
- **📝 Documentation**: Professional README and marketplace-ready descriptions
- **🚀 One-Command Publishing**: `vsce publish patch` for streamlined releases
- **🔒 Security Best Practices**: Token management and security guidelines included

See [`PUBLISHING.md`](./PUBLISHING.md) for the complete publishing guide.

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **🍴 Fork** the repository
2. **🔧 Setup**: Run `npm install` and `npm run compile`
3. **🧪 Test**: Press F5 to launch extension development host
4. **✨ Develop**: Make your changes and test thoroughly
5. **📤 Submit**: Create a pull request with your improvements

## �📝 License

MIT - Feel free to contribute and make Talon Voice even better! 🎯
