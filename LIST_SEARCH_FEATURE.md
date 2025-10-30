# Talon List Search Feature

## Overview
Added comprehensive Talon list search functionality to the VS Code extension, similar to the web interface shown in the screenshot. The extension now supports searching both Talon commands and Talon lists in separate tabs.

## New Features Added

### 1. List File Parsing
- **File**: `src/parser/talonListParser.ts`
- Parses `.talon-list` files with format: `spoken_form: list_value`
- Supports CSV-style parsing for bulk imports
- Extracts list names from file paths
- Handles field length truncation (spoken form: 100 chars, list value: 700 chars)

### 2. Database Enhancement
- **File**: `src/database/sqliteManager.ts`
- Added list storage alongside commands
- Methods for inserting, searching, and managing list items
- Supports batch operations for performance
- List search across list name, spoken form, list value, and source file

### 3. Tabbed Interface
- **Files**: `webview/search.js`, `webview/styles.css`, `src/extension.ts`
- Added tabs for "Commands" and "Lists"
- Separate search interfaces for each type
- Independent filtering and display

### 4. List Search UI
- **Search Box**: Search across all list fields (name, spoken form, value, source file)
- **Grouped Results**: Results grouped by list name for better organization
- **Table Display**: Clean table format showing:
  - Spoken Form (what you say)
  - List Value (what gets inserted)
  - Source File (clickable to open file)
- **Statistics**: Shows total list items and available list names

### 5. Enhanced Import Process
- **File**: `src/extension.ts`
- Updated `importTalonFiles()` to scan for both `.talon` and `.talon-list` files
- Imports both commands and lists in a single operation
- Progress reporting includes both file types
- Database refresh clears and reloads both commands and lists

## Test Data Structure
Created test data in `test-data/user/`:
- `emoji.talon-list` - Emoji mappings (angry: 😠, happy: 😊, etc.)
- `keys.talon-list` - Key mappings (left: left, up: up, etc.)
- `snippets.talon-list` - Code snippets
- `vscode.talon` - Sample commands that reference the lists

## Usage Instructions

### 1. Import Data
1. Open Command Palette (`Ctrl+Shift+P`)
2. Run "Talon: Set User Folder" 
3. Select the `test-data` folder (or your actual Talon user folder)
4. Run "Talon: Refresh Index"

### 2. Search Lists
1. Open Command Palette and run "Talon: Search Commands"
2. Click the "Lists" tab
3. Type in the search box to find list items
4. Click on source files to open them
5. Results are grouped by list name for easy browsing

### 3. Search Commands
1. Stay on the "Commands" tab
2. Use the existing search functionality
3. Commands referencing lists (like `{user.emoji}`) will show up

## Implementation Details

### Data Model
```typescript
interface TalonListItem {
  id: number;
  listName: string;       // e.g., "user.emoji"
  spokenForm: string;     // e.g., "angry"
  listValue: string;      // e.g., "😠"
  sourceFile?: string;    // Path to .talon-list file
  createdAt?: string;
  importedAt?: string;
}
```

### Search Scope
- **List Search**: Searches across listName, spokenForm, listValue, and sourceFile
- **Case Insensitive**: All searches are case-insensitive
- **Partial Matching**: Finds partial matches in any field
- **Grouped Display**: Results grouped by list name for better organization

### File Format Support
1. **Standard .talon-list files**:
   ```
   spoken_form: list_value
   another_form: another_value
   ```

2. **CSV format** (for bulk imports):
   ```
   listName,spokenForm,listValue
   user.emoji,angry,😠
   user.emoji,happy,😊
   ```

### Performance Considerations
- Batch imports for large list files
- Chunked loading for UI responsiveness
- Separate storage and search for commands vs lists
- Indexed search across all list fields

## Future Enhancements
1. **List-aware command search**: Show which commands use specific lists
2. **List value preview**: Show first few values when browsing list names
3. **Export functionality**: Export lists to CSV or other formats
4. **List editing**: Inline editing of list items
5. **List statistics**: Show usage statistics per list

## Testing
Use the provided test data:
1. Import from `test-data` folder
2. Should import 3 list files with ~45 total list items
3. Test searching for "angry", "key", "print", etc.
4. Test clicking on source files to open them
5. Verify both tabs work independently

The feature is now fully integrated and provides a comprehensive list search experience similar to the web interface shown in the screenshot.