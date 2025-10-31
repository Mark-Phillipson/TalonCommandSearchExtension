import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { TalonVoiceCommand, TalonListItem, SearchScope } from './types';
import { DataManager } from './database/dataManager';
import { TalonFileParser } from './parser/talonFileParser';
import { TalonListParser } from './parser/talonListParser';

let searchPanel: vscode.WebviewPanel | undefined;

let db: DataManager;
const parser = new TalonFileParser();
const listParser = new TalonListParser();
let disposables: vscode.Disposable[] = [];

export async function activate(context: vscode.ExtensionContext) {
    // Initialize JSON database
    try {
        const storagePath = context.globalStorageUri.fsPath;
        db = new DataManager(storagePath);
        db.initialize();
    } catch (err) {
        const error = err as Error;
        console.error('Failed to initialize database:', error);
        vscode.window.showErrorMessage(`Talon Search: Failed to initialize database: ${error.message}`);
        // Create a dummy db to prevent crashes
        db = null as any;
    }


    // Store all command registrations in disposables array
    disposables.push(
        vscode.commands.registerCommand('talon.searchCommands', async () => {
            await showSearchPanel(context, SearchScope.All);
        })
    );

    disposables.push(
        vscode.commands.registerCommand('talon.refreshIndex', async () => {
            if (!db) {
                vscode.window.showErrorMessage('Database not initialized. Please reload the window.');
                return;
            }
            const config = vscode.workspace.getConfiguration('talonSearch');
            let talonPath = config.get<string>('userFolderPath');
            if (!talonPath) {
                talonPath = await autoDetectTalonPath();
            }
            if (talonPath) {
                await importTalonFiles(context, talonPath);
                vscode.window.showInformationMessage('Talon command index refreshed');
            } else {
                const result = await vscode.window.showErrorMessage(
                    `Talon user folder not found. Expected location: ${process.env.APPDATA}\\talon\\user\n\nPlease set your Talon user folder path manually.`,
                    'Set Talon Folder',
                    'Import from Other Folder'
                );
                if (result === 'Set Talon Folder') {
                    await vscode.commands.executeCommand('talon.setUserFolder');
                } else if (result === 'Import from Other Folder') {
                    await vscode.commands.executeCommand('talon.openListExplorer');
                }
            }
        })
    );

    disposables.push(
        vscode.commands.registerCommand('talon.openListExplorer', async () => {
            const defaultPath = await autoDetectTalonPath();
            const defaultUri = defaultPath ? vscode.Uri.file(defaultPath) : undefined;
            const folderUri = await vscode.window.showOpenDialog({
                canSelectFolders: true,
                canSelectFiles: false,
                canSelectMany: false,
                title: 'Select Talon User Folder',
                openLabel: 'Import',
                defaultUri: defaultUri
            });
            if (folderUri && folderUri[0]) {
                await importTalonFiles(context, folderUri[0].fsPath, false);
                vscode.window.showInformationMessage('Import complete');
            }
        })
    );

    disposables.push(
        vscode.commands.registerCommand('talon.setUserFolder', async () => {
            const currentPath = vscode.workspace.getConfiguration('talonSearch').get<string>('userFolderPath');
            const detectedPath = await autoDetectTalonPath();
            const folderUri = await vscode.window.showOpenDialog({
                canSelectFolders: true,
                canSelectFiles: false,
                canSelectMany: false,
                title: 'Select Your Talon User Folder',
                openLabel: 'Set as Talon User Folder',
                defaultUri: currentPath ? vscode.Uri.file(currentPath) : 
                           detectedPath ? vscode.Uri.file(detectedPath) : undefined
            });
            if (folderUri && folderUri[0]) {
                const selectedPath = folderUri[0].fsPath;
                const config = vscode.workspace.getConfiguration('talonSearch');
                await config.update('userFolderPath', selectedPath, vscode.ConfigurationTarget.Global);
                const result = await vscode.window.showInformationMessage(
                    `Talon user folder set to: ${selectedPath}\n\nWould you like to refresh the index now?`,
                    'Refresh Index',
                    'Later'
                );
                if (result === 'Refresh Index') {
                    await vscode.commands.executeCommand('talon.refreshIndex');
                }
            }
        })
    );

    // Auto-import on startup if enabled
    const config = vscode.workspace.getConfiguration('talonSearch');
    
    if (config.get<boolean>('enableAutoIndexing')) {
        let talonPath = config.get<string>('userFolderPath');
        if (!talonPath) {
            talonPath = await autoDetectTalonPath();
        }
        if (talonPath && fs.existsSync(talonPath)) {
            // Import in background without blocking activation (refresh = clear existing first)
            importTalonFiles(context, talonPath, true).catch(err => {
                console.error('Background import failed:', err);
                vscode.window.showErrorMessage(`Failed to import Talon files: ${err.message}`);
            });
        } else {
        }
    } else {
    }
}

async function showSearchPanel(context: vscode.ExtensionContext, searchScope: SearchScope) {
    if (!searchPanel) {
        searchPanel = vscode.window.createWebviewPanel(
            'talonSearch',
            'Talon Command Search',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(context.extensionUri, 'webview')
                ]
            }
        );

        searchPanel.onDidDispose(() => {
            searchPanel = undefined;
        }, null, context.subscriptions);

        // Generate webview HTML
        const scriptUri = searchPanel.webview.asWebviewUri(
            vscode.Uri.joinPath(context.extensionUri, 'webview', 'search.js')
        );
        const styleUri = searchPanel.webview.asWebviewUri(
            vscode.Uri.joinPath(context.extensionUri, 'webview', 'styles.css')
        );

        searchPanel.webview.html = getWebviewContent(scriptUri, styleUri);

        // Handle messages from webview
        searchPanel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'search':
                        if (!db) {
                            searchPanel?.webview.postMessage({
                                command: 'searchResults',
                                results: []
                            });
                            searchPanel?.webview.postMessage({
                                command: 'error',
                                message: 'Database not initialized. Please reload the window.'
                            });
                            break;
                        }
                        
                        // Ensure searchScope is a number - be careful with 0 being falsy
                        const searchScope = typeof message.searchScope === 'number' ? message.searchScope : 
                                          (message.searchScope !== undefined && message.searchScope !== null ? parseInt(message.searchScope) : 2);
                        
                        const results = db.searchCommands(
                            message.searchTerm || '',
                            searchScope,
                            message.application,
                            message.mode,
                            message.repository,
                            message.tags,
                            message.operatingSystem,
                            message.title,
                            message.maxResults || 500,
                            message.preferredApplications,
                            message.excludedOperatingSystems
                        );
                        searchPanel?.webview.postMessage({
                            command: 'searchResults',
                            results: results
                        });
                        break;
                    case 'searchLists':
                        if (!db) {
                            searchPanel?.webview.postMessage({
                                command: 'listSearchResults',
                                results: []
                            });
                            return;
                        }
                        const listResults = db.searchListItems(
                            message.searchTerm || '',
                            message.maxResults || 500
                        );
                        searchPanel?.webview.postMessage({
                            command: 'listSearchResults',
                            results: listResults
                        });
                        break;
                    case 'getStats':
                        if (!db) {
                            searchPanel?.webview.postMessage({
                                command: 'stats',
                                totalCommands: 0,
                                filters: { applications: [], modes: [], repositories: [], operatingSystems: [] }
                            });
                            searchPanel?.webview.postMessage({
                                command: 'error',
                                message: 'Database not initialized. Please reload the window.'
                            });
                            break;
                        }
                        const count = db.getCommandCount();
                        const listCount = db.getListCount();
                        const filters = db.getFilterValues();
                        const repositoryBreakdown = db.getRepositoryBreakdown();
                        const listNames = db.getListNames();
                        searchPanel?.webview.postMessage({
                            command: 'stats',
                            totalCommands: count,
                            totalLists: listCount,
                            filters: filters,
                            repositoryBreakdown: repositoryBreakdown,
                            listNames: listNames
                        });
                        break;
                        
                    case 'getConfig':
                        const config = vscode.workspace.getConfiguration('talonSearch');
                        const searchDebounceMs = config.get<number>('searchDebounceMs', 3000);
                        const defaultApplications = config.get<string[]>('defaultApplications') || [];
                        const excludedOperatingSystems = config.get<string[]>('excludedOperatingSystems') || [];
                        searchPanel?.webview.postMessage({
                            command: 'config',
                            config: {
                                searchDebounceMs: searchDebounceMs,
                                defaultApplications,
                                excludedOperatingSystems
                            }
                        });
                        break;

                    case 'openFile':
                        await openTalonFile(message.filePath);
                        break;
                    case 'copyText':
                        await vscode.env.clipboard.writeText(message.text);
                        vscode.window.showInformationMessage('Copied to clipboard');
                        break;
                    case 'triggerRefresh':
                        await vscode.commands.executeCommand('talon.refreshIndex');
                        break;
                    case 'showInfo':
                        vscode.window.showInformationMessage(message.message);
                        break;
                    case 'confirmClearDatabase':
                        const result = await vscode.window.showWarningMessage(
                            `Are you sure you want to clear all ${message.commandCount} imported commands? This cannot be undone.`,
                            { modal: true },
                            'Clear Database'
                        );
                        if (result === 'Clear Database') {
                            db.clearAllData();
                            searchPanel?.webview.postMessage({
                                command: 'databaseCleared'
                            });
                            
                            // Update stats after clearing
                            const count = db.getCommandCount();
                            const listCount = db.getListCount();
                            const filters = db.getFilterValues();
                            const repositoryBreakdown = db.getRepositoryBreakdown();
                            const listNames = db.getListNames();
                            searchPanel?.webview.postMessage({
                                command: 'stats',
                                totalCommands: count,
                                totalLists: listCount,
                                filters: filters,
                                repositoryBreakdown: repositoryBreakdown,
                                listNames: listNames
                            });
                            
                            vscode.window.showInformationMessage('Database cleared successfully');
                        }
                        break;
                    case 'log':
                        break;
                    case 'error':
                        console.error('[Webview Error]', message.text);
                        vscode.window.showErrorMessage(message.text);
                        break;
                }
            },
            undefined,
            context.subscriptions
        );
    }

    searchPanel.reveal();
    
    // Send initial data to webview
    if (db) {
        const count = db.getCommandCount();
        const listCount = db.getListCount();
        const filters = db.getFilterValues();
        const repositoryBreakdown = db.getRepositoryBreakdown();
        const listNames = db.getListNames();
        searchPanel.webview.postMessage({
            command: 'stats',
            totalCommands: count,
            totalLists: listCount,
            filters: filters,
            repositoryBreakdown: repositoryBreakdown,
            listNames: listNames
        });
        
        // Send initial configuration
        const config = vscode.workspace.getConfiguration('talonSearch');
        const searchDebounceMs = config.get<number>('searchDebounceMs', 3000);
        const defaultApplications = config.get<string[]>('defaultApplications') || [];
        const excludedOperatingSystems = config.get<string[]>('excludedOperatingSystems') || [];
        searchPanel.webview.postMessage({
            command: 'config',
            config: {
                searchDebounceMs: searchDebounceMs,
                defaultApplications,
                excludedOperatingSystems
            }
        });
    } else {
        searchPanel.webview.postMessage({
            command: 'stats',
            totalCommands: 0,
            totalLists: 0,
            filters: { applications: [], modes: [], repositories: [], operatingSystems: [] },
            repositoryBreakdown: {},
            listNames: []
        });
        searchPanel.webview.postMessage({
            command: 'error',
            message: 'Database not initialized. Please reload the window.'
        });
    }
    searchPanel.webview.postMessage({ 
        command: 'setSearchScope', 
        scope: searchScope 
    });
}

async function importTalonFiles(context: vscode.ExtensionContext, rootFolder: string, isRefresh: boolean = true) {
    return vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Importing Talon files",
        cancellable: false
    }, async (progress) => {
        progress.report({ increment: 0, message: "Scanning files..." });

        const files = await getTalonFiles(rootFolder);
        const listFiles = await getTalonListFiles(rootFolder);
        
        progress.report({ increment: 30, message: `Found ${files.length} .talon files and ${listFiles.length} list files` });

        if (files.length === 0 && listFiles.length === 0) {
            vscode.window.showWarningMessage('No .talon or .talon-list files found in selected folder');
            return;
        }

        // Parse all command files
        let allCommands: Array<Omit<TalonVoiceCommand, 'id'>> = [];
        let allListItems: Array<Omit<TalonListItem, 'id'>> = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                const commands = parser.parseFile(file.path, file.content);
                allCommands = allCommands.concat(commands);
                
                if (i % 10 === 0) {
                    progress.report({ 
                        increment: (10 / files.length) * 50,
                        message: `Parsing ${i}/${files.length} files` 
                    });
                }
            } catch (err) {
                console.error(`Failed to parse ${file.path}:`, err);
            }
        }

        // Parse all list files
        for (let i = 0; i < listFiles.length; i++) {
            const file = listFiles[i];
            try {
                const listItems = listParser.parseListFile(file.path, file.content);
                allListItems = allListItems.concat(listItems);
                
                if (i % 10 === 0) {
                    progress.report({ 
                        increment: (10 / (files.length + listFiles.length)) * 50,
                        message: `Parsing list files ${i}/${listFiles.length}` 
                    });
                }
            } catch (err) {
                console.error(`Failed to parse list file ${file.path}:`, err);
            }
        }

        if (isRefresh) {
            progress.report({ increment: 80, message: `Refreshing database with ${allCommands.length} commands and ${allListItems.length} list items (clearing old ones)...` });

            // Clear existing data and insert new ones to avoid duplicates
            db.refreshCommandsBatch(allCommands);
            db.refreshListItemsBatch(allListItems);

            progress.report({ increment: 100, message: "Refresh complete" });

            vscode.window.showInformationMessage(`Refreshed index with ${allCommands.length} commands and ${allListItems.length} list items. Total in database: ${db.getCommandCount()} commands, ${db.getListCount()} list items`);
        } else {
            progress.report({ increment: 80, message: `Adding ${allCommands.length} commands and ${allListItems.length} list items to database...` });

            // Add items to existing ones
            db.insertCommandsBatch(allCommands);
            db.insertListItemsBatch(allListItems);

            progress.report({ increment: 100, message: "Import complete" });

            vscode.window.showInformationMessage(`Added ${allCommands.length} commands and ${allListItems.length} list items. Total in database: ${db.getCommandCount()} commands, ${db.getListCount()} list items`);
        }

        // Update webview if open
        if (searchPanel) {
            const totalCount = db.getCommandCount();
            const totalListCount = db.getListCount();
            const filters = db.getFilterValues();
            const repositoryBreakdown = db.getRepositoryBreakdown();
            const listNames = db.getListNames();
            searchPanel.webview.postMessage({
                command: 'stats',
                totalCommands: totalCount,
                totalLists: totalListCount,
                filters: filters,
                repositoryBreakdown: repositoryBreakdown,
                listNames: listNames
            });
            searchPanel.webview.postMessage({
                command: 'importComplete',
                importedCommands: allCommands.length,
                importedLists: allListItems.length,
                totalCommands: totalCount,
                totalLists: totalListCount
            });
        }
    });
}

async function getTalonFiles(rootFolder: string): Promise<Array<{path: string, content: string}>> {
    const files: Array<{path: string, content: string}> = [];
    
    async function scanDirectory(dir: string) {
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                if (entry.isDirectory()) {
                    await scanDirectory(fullPath);
                } else if (entry.name.endsWith('.talon')) {
                    try {
                        const content = fs.readFileSync(fullPath, 'utf8');
                        files.push({ path: fullPath, content });
                    } catch (err) {
                        console.error(`Failed to read ${fullPath}:`, err);
                    }
                }
            }
        } catch (err) {
            console.error(`Failed to scan directory ${dir}:`, err);
        }
    }

    await scanDirectory(rootFolder);
    return files;
}

async function getTalonListFiles(rootFolder: string): Promise<Array<{path: string, content: string}>> {
    const files: Array<{path: string, content: string}> = [];
    
    async function scanDirectory(dir: string) {
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                if (entry.isDirectory()) {
                    await scanDirectory(fullPath);
                } else if (entry.name.endsWith('.talon-list')) {
                    try {
                        const content = fs.readFileSync(fullPath, 'utf8');
                        files.push({ path: fullPath, content });
                    } catch (err) {
                        console.error(`Failed to read list file ${fullPath}:`, err);
                    }
                }
            }
        } catch (err) {
            console.error(`Failed to scan directory ${dir}:`, err);
        }
    }

    await scanDirectory(rootFolder);
    return files;
}

async function openTalonFile(filePath: string) {
    try {
        const uri = vscode.Uri.file(filePath);
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc);
    } catch (error) {
        vscode.window.showErrorMessage(`Could not open file: ${filePath}`);
    }
}

async function autoDetectTalonPath(): Promise<string | undefined> {
    const isWindows = process.platform === 'win32';
    const isMac = process.platform === 'darwin';
    
    const possiblePaths = isWindows ? [
        // Primary Windows path using APPDATA
        path.join(process.env.APPDATA || '', 'talon', 'user'),
        // Alternative Windows path using USERPROFILE
        path.join(process.env.USERPROFILE || '', 'AppData', 'Roaming', 'talon', 'user'),
        // Legacy paths (in case someone has older installations)
        path.join(process.env.USERPROFILE || '', '.talon', 'user')
    ] : isMac ? [
        path.join(process.env.HOME || '', '.talon', 'user'),
        path.join(process.env.HOME || '', 'talon', 'user')
    ] : [
        // Linux paths
        path.join(process.env.HOME || '', '.talon', 'user'),
        path.join(process.env.HOME || '', 'talon', 'user')
    ];

    for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
            return testPath;
        }
    }

    return undefined;
}

function getWebviewContent(scriptUri: vscode.Uri, styleUri: vscode.Uri): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' vscode-resource:; script-src vscode-resource: 'unsafe-eval';">
    <link href="${styleUri}" rel="stylesheet">
    <title>Talon Command Search</title>
</head>
<body>
    <div class="container">
        <h1>Talon Command Search</h1>
        
        <div class="toolbar">
            <button id="checkDbBtn" class="toolbar-btn">Check Database</button>
            <button id="clearDbBtn" class="toolbar-btn">Clear Database</button>
            <button id="refreshBtn" class="toolbar-btn">Refresh Index</button>
        </div>
        
        <div class="tabs">
            <button class="tab-button active" data-tab="commands">Commands</button>
            <button class="tab-button" data-tab="lists">Lists</button>
            <button class="tab-button" data-tab="captures">Captures & Lists</button>
        </div>
        
        <div id="commandsTab" class="tab-content active">
            <div class="search-box">
                <input type="text" id="searchInput" placeholder="Search commands, scripts, or applications..." />
                <select id="searchScope">
                    <option value="2">All (Commands + Scripts + Lists)</option>
                    <option value="0">Command Names Only</option>
                    <option value="1">Scripts Only</option>
                </select>
            </div>

            <div class="filters">
                <select id="filterApplication">
                    <option value="">All Applications</option>
                </select>
                <select id="filterMode">
                    <option value="">All Modes</option>
                </select>
                <select id="filterRepository">
                    <option value="">All Repositories</option>
                </select>
                <select id="filterTags">
                    <option value="">All Tags</option>
                </select>
                <select id="filterTitle">
                    <option value="">All Titles</option>
                </select>
                <select id="filterOperatingSystem">
                    <option value="">All Operating Systems</option>
                </select>
            </div>

            <div id="stats" class="stats"></div>
            
            <div id="searchSpinner" class="search-spinner">
                <div class="spinner"></div>
                <span class="spinner-text">Searching commands...</span>
            </div>
            
            <div id="results" class="results"></div>
        </div>
        
        <div id="listsTab" class="tab-content">
            <div class="search-box">
                <input type="text" id="listSearchInput" placeholder="Search list names, spoken forms, values, or source files..." />
                <button id="clearListSearch" class="clear-search-btn" title="Clear search">✖</button>
            </div>
            
            <div id="listStats" class="stats"></div>
            
            <div id="listSearchSpinner" class="search-spinner">
                <div class="spinner"></div>
                <span class="spinner-text">Searching lists...</span>
            </div>
            
            <div id="listResults" class="results"></div>
        </div>
        
        <div id="capturesTab" class="tab-content">
            <div class="search-box">
                <input type="text" id="captureSearchInput" placeholder="Search capture/list names, spoken forms, or descriptions..." />
                <button id="clearCaptureSearch" class="clear-search-btn" title="Clear search">✖</button>
            </div>
            
            <div id="captureStats" class="stats">
                <div class="stats-total">Common Talon Captures & Lists Reference</div>
               monty  <p style="color: var(--vscode-descriptionForeground); font-size: 12px; margin: 8px 0;">
                    This tab shows commonly used Talon captures and lists with their available spoken forms. 
                    Use these in your voice commands like "snap left" or "system tray".
                </p>
                <div class="capture-legend" style="display: flex; gap: 16px; margin: 8px 0; font-size: 11px;">
                    <span style="display: flex; align-items: center; gap: 4px;">
                        <span class="capture-type-badge capture-type-capture">capture</span>
                        <span style="color: var(--vscode-descriptionForeground);">Dynamic patterns</span>
                    </span>
                    <span style="display: flex; align-items: center; gap: 4px;">
                        <span class="capture-type-badge capture-type-list">list</span>
                        <span style="color: var(--vscode-descriptionForeground);">Fixed value sets</span>
                    </span>
                </div>
            </div>
            
            <div id="captureResults" class="results"></div>
        </div>
    </div>

    <script src="${scriptUri}"></script>
</body>
</html>`;
}

export function deactivate() {
    if (searchPanel) {
        searchPanel.dispose();
    }
    if (db) {
        db.close();
    }
    // Dispose all command registrations
    if (disposables && disposables.length > 0) {
        disposables.forEach(d => {
            try { d.dispose(); } catch (e) { }
        });
        disposables = [];
    }
}
