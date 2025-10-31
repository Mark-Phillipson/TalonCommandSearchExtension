# 🔍 Search Talon Commands - VS Code Extension

🎯 Search and browse 27,000+ Talon Voice commands and lists with lightning-fast performance, advanced filtering, and dedicated list search capabilities.

> **⚠️ AI Disclosure**: This extension was developed with assistance from AI tools (GitHub Copilot and Claude AI). While thoroughly tested and functional, users should be aware that AI-generated code was used in its creation. Please report any issues or concerns through the project's issue tracker.
>
> **🔒 File Access Policy**: This extension only **reads** your Talon files (.talon, .talon-list, .py). It never writes to, modifies, or deletes any of your Talon Voice files or Python scripts. All file access is read-only for indexing and search purposes only.

## ✨ Features

- **⚡ Lightning Fast JSON Storage**: Handles massive datasets (27k+ commands) with optimized in-memory search
- **🔎 Intelligent Search**: Instant search across commands, scripts, applications, and metadata
- **📑 Dedicated List Search**: Brand new tabbed interface with dedicated Talon list (.talon-list) search
  - 🎯 Separate "Commands" and "Lists" tabs for focused searching
  - 📊 Search across list names, spoken forms, values, and source files
  - 🎪 Grouped results by list name for better organization
  - 📝 Table format showing spoken form → list value mappings
  - 🔍 Collapsible available lists section with click-to-filter functionality
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
- **📂 File Integration**: Click any result to open source .talon or .talon-list files instantly
- **⌨️ Keyboard Shortcuts**: `Ctrl+Shift+T` (Windows/Linux) or `Cmd+Shift+T` (Mac)
- **📈 Real-time Stats**: Live command count, list count, and repository statistics
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

## � Dedicated List Search

The extension now includes a complete **List Search** interface for browsing and searching through your Talon list files (.talon-list).

### ✨ Key Features

- **📑 Separate Tab**: Dedicated "Lists" tab alongside "Commands" for focused searching
- **🔍 Multi-field Search**: Search across list names, spoken forms, values, and source files
- **🎪 Organized Results**: Results grouped by list name (e.g., user.emoji, user.keys) for better navigation
- **📝 Clean Display**: Table format showing "spoken form → list value" mappings
- **🎯 Click-to-Filter**: Click any available list name to filter results to that specific list
- **📋 Collapsible Interface**: Space-saving design with expandable available lists section
- **📂 File Integration**: Click source file names to open .talon-list files directly

### 🎯 How to Use List Search

1. **Open Search**: Use `Ctrl+Shift+T` or "Talon: Search Commands"
2. **Switch to Lists**: Click the "Lists" tab in the interface
3. **Search Lists**: Type in the search box to find specific list items
4. **Filter by List**: Click any list name in the "Available Lists" section to filter
5. **Open Files**: Click source file names to edit your .talon-list files

### 📊 Example Use Cases

- **Find Emoji**: Search "happy" to see all happy-related emojis in your emoji lists
- **Browse Keys**: Click "user.keys" to see all available key mappings
- **Check Snippets**: Search "print" to find all print-related code snippets
- **Verify Lists**: Quickly verify what values are available in specific lists

## �🚀 Quick Start

1. **📦 Install the extension**
2. **🎯 Open Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. **🔄 Run**: `Talon: Refresh Index` (first time only - imports your commands and lists)
4. **🔍 Search**: `Talon: Search Commands` or use `Ctrl+Shift+T`
5. **📊 Enjoy**: See your command breakdown and start searching instantly!
6. **📑 Try List Search**: Click the "Lists" tab to search through your Talon list files
7. **🧠 Try List Matching**: Search for values like "left", "chrome", or "happy" to see the magic!

## ⚙️ Configuration

```json
{
  "talonSearch.userFolderPath": "",           // 📁 Leave empty for auto-detection
  "talonSearch.enableAutoIndexing": true,     // 🔄 Auto-import on startup  
  "talonSearch.maxSearchResults": 500,        // 📊 Max results per search
  "talonSearch.searchDebounceMs": 3000        // ⏱️ Search delay in milliseconds (0-30000)
}
```

### 🔧 Configuration Details

- **User Folder Path**: Auto-detects standard Talon locations:
  - Windows: `%APPDATA%\talon\user` 
  - Mac: `~/.talon/user`
  - Linux: `~/.talon/user`
- **Auto Indexing**: Automatically imports commands on VS Code startup
- **Max Results**: Prevents UI slowdown with large result sets (default: 500)
- **Search Debounce**: Configurable delay before performing search (default: 3000ms)
  - ⏱️ Prevents searches on every keystroke for better performance
  - 🎯 Adjustable from 0ms (instant) to 30 seconds via VS Code settings
  - 🎨 Visual feedback with orange pending indicator and countdown
  - 💡 Recommended: 1000-3000ms for optimal user experience
  - 🚀 Includes race condition prevention for smooth search experience

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
- **💾 Database Manager** (`src/database/dataManager.ts`): JSON storage, in-memory search, repository breakdown
- **📝 Parser** (`src/parser/talonFileParser.ts`): Advanced Talon file parsing (headers, commands, scripts)
- **🖥️ Webview UI** (`webview/`): Modern search interface with real-time filtering and stats
- **📊 Data Models** (`src/types.ts`): TypeScript interfaces ensuring type safety
- **🎨 Modern UI** (`webview/styles.css`): CSS Grid responsive layout with VS Code theming

**🔄 Evolution**: Started with SQLite → Tried IndexedDB → Perfected with JSON + In-Memory for optimal performance!

### 🏗️ Key Technical Improvements

- **Smart Focus Management**: Automatic focus handling for optimal voice user experience  
- **Configurable Search Debounce**: Performance-tuned search delays with visual feedback system
- **Advanced Filtering Architecture**: Multi-dimensional filtering (tags, OS, repos) with persistent state
- **Responsive Design**: CSS Grid automatically adapts to screen size (3/2/1 columns)
- **In-Memory Search**: All filtering and search operations run in memory for instant results
- **Repository Intelligence**: Smart path parsing extracts repository info from file paths
- **Additive Imports**: Support both full refresh and incremental folder imports
- **Database Isolation**: Commands stored in extension global storage, workspace-independent

## 🆕 Recent Updates (Latest)

### 🎯 Enhanced User Experience (NEW!)
- **⌨️ Smart Focus Management**: Automatic focus on search inputs when switching between Commands and Lists tabs
- **🎨 Improved Tab Navigation**: Seamless switching with immediate focus for voice users
- **🚀 Enhanced Search Performance**: Intelligent search triggers only when tab switching with available data
- **📱 Touch-Friendly Interface**: Better click targets and responsive design elements
- **🎭 Voice-Optimized UX**: Minimal navigation required for efficient voice command usage

### ⏱️ Configurable Search Debounce (NEW!)
- **🎯 Smart Search Timing**: Configurable delay prevents searches on every keystroke
- **⚙️ Fully Customizable**: Adjust delay from 0ms (instant) to 30 seconds via VS Code settings  
- **🎨 Visual Feedback**: Orange pending indicator shows search will start with countdown
- **🚀 Performance Optimized**: Reduces server load while maintaining responsive feel
- **💡 Smart Defaults**: 3-second default delay balances performance and usability

### 🔍 Advanced Filtering System (NEW!)
- **🏷️ Tags Filter**: Filter commands by tags for better organization
- **💻 Operating System Filter**: Filter commands by OS (Windows, Mac, Linux)
- **📊 Enhanced Repository Stats**: More detailed breakdown with visual indicators
- **🎯 Smart Filter Combinations**: Multiple filters work together for precise results
- **🔄 Persistent Filter State**: Filters maintain state across searches

### 📑 Revolutionary Talon List Search (NEW!)
- **🎯 Dedicated List Search Tab**: Complete separate interface for searching Talon lists (.talon-list files)
- **📊 Comprehensive List Parsing**: Full support for parsing .talon-list files with spoken_form: list_value format
- **🎪 Grouped Results Display**: Search results organized by list name for better navigation
- **📝 Table Format**: Clean display showing spoken form → list value mappings
- **🔍 Multi-field Search**: Search across list names, spoken forms, values, and source files
- **🎯 Click-to-Filter**: Click any list name to instantly filter results to that specific list
- **📋 Collapsible Lists Section**: Space-saving UI with expandable available lists section
- **🧠 Voice-Friendly Design**: Optimized for voice users with minimal scrolling required

### 🧠 Enhanced List Matching Intelligence
- **🎯 Intelligent List Value Search**: Find commands by searching for the values they accept
- **🔍 Smart Placeholder Mapping**: Automatically maps `<user.arrow_key>` to actual lists like `user.community/core/keys/arrow_key`  
- **✨ Enhanced Command Discovery**: Search "left" to find all commands that use arrow keys
- **🚫 No False Positives**: Only matches actual Talon lists, not code captures
- **🏃‍♂️ Performance Optimized**: Debounced search with race condition prevention
- **📊 Works Across All Scopes**: List matching available in Command Names Only and All search scopes

### 🎨 Enhanced UI & User Experience
- **📑 Tabbed Interface**: Separate "Commands" and "Lists" tabs for focused searching
- **CSS Grid Layout**: Modern responsive design with automatic 3-column layout
- **Improved Results Display**: Cards now use optimal grid spacing for better readability
- **Interactive Repository Stats**: Click on any repository in the breakdown to instantly filter results
- **Visual Filter Feedback**: Selected repositories are visually highlighted in the stats
- **🔄 Stable Results**: Fixed issue where search results would sometimes disappear
- **✖️ Clear Search Button**: Quick search reset functionality for both tabs

### 🛠️ Database Management Tools
- **Check Database**: New toolbar button to inspect database status and location
- **Clear Database**: Safe database clearing with confirmation dialogs
- **Better Error Handling**: Improved feedback when database isn't initialized
- **📊 Enhanced Import Process**: Now imports both .talon and .talon-list files in single operation

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

- **🔍 `Talon: Search Commands`** - Open the powerful search panel with Commands and Lists tabs
- **🔄 `Talon: Refresh Index`** - Re-import all .talon and .talon-list files (with progress indicator)
- **📁 `Talon: Import from Folder`** - Import commands and lists from a custom folder (additive)
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
- [x] **✅ Dedicated List Search** - Complete tabbed interface with separate list search functionality
- [x] **✅ Collapsible UI** - Space-saving interface optimized for voice users
- [x] **✅ Click-to-Filter Lists** - Interactive list name filtering for focused searching
- [ ] **🌳 TreeView** - Hierarchical browsing of results
- [ ] **🧠 Semantic Search** - AI-powered command discovery
- [ ] **👀 File Watcher** - Auto-refresh when .talon files change
- [ ] **📈 Usage Analytics** - Track most-used commands
- [ ] **🔗 Cross-Reference Search** - Show which commands use specific lists
- [ ] **✏️ Inline List Editing** - Edit list items directly in the interface

## 🎉 What's New in This Version

- **🎯 Enhanced User Experience**: Smart focus management with automatic search input focus when switching tabs
- **⏱️ Configurable Search Debounce**: Customizable search delay (0-30s) with visual feedback and performance optimization  
- **🔍 Advanced Filtering System**: New tags and operating system filters with enhanced repository breakdown
- **📑 Revolutionary List Search**: Complete tabbed interface with dedicated Talon list search functionality
- **🎯 Intelligent List Parsing**: Full support for .talon-list files with comprehensive search capabilities
- **🎪 Organized Results**: Grouped list results by list name with clean table formatting
- **🔍 Enhanced Filtering**: Click-to-filter list names with collapsible interface design
- **🚀 Performance Revolution**: Migrated from SQLite to optimized JSON storage
- **📊 Repository Insights**: See exactly where your commands come from with clickable stats
- **🎨 Modern UI**: CSS Grid layout with responsive 3-column design and tabbed navigation
- **🛠️ Database Tools**: Built-in database management (check/clear with confirmation dialogs)
- **📁 Flexible Imports**: New commands for setting user folder and importing from any directory
- **⚡ Zero Dependencies**: No more native module compilation issues
- **🔧 Windows Compatible**: Solved all the pesky Node.js version conflicts
- **📈 Scalable**: Tested with 27,000+ commands and thousands of list items!
- **🗣️ Voice-Optimized**: UI designed specifically for voice users with minimal scrolling required
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
