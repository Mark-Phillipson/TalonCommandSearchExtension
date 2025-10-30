import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { TalonVoiceCommand, SearchScope } from './types';
import { SqliteManager } from './database/sqliteManager';
import { TalonFileParser } from './parser/talonFileParser';

let searchPanel: vscode.WebviewPanel | undefined;
let db: SqliteManager;
const parser = new TalonFileParser();

export async function activate(context: vscode.ExtensionContext) {
    console.log('Talon Command Search extension is now active');

    // Initialize SQLite database
    try {
        const storagePath = context.globalStorageUri.fsPath;
        db = new SqliteManager(storagePath);
        db.initialize();
        console.log('SQLite database initialized at:', storagePath);
    } catch (err) {
        const error = err as Error;
        console.error('Failed to initialize SQLite:', error);
        vscode.window.showErrorMessage(`Talon Search: Failed to initialize database: ${error.message}`);
        // Create a dummy db to prevent crashes
        db = null as any;
    }

    // Register: Talon: Search Commands
    context.subscriptions.push(
        vscode.commands.registerCommand('talon.searchCommands', async () => {
            await showSearchPanel(context, SearchScope.All);
        })
    );

    // Register: Talon: Refresh Index
    context.subscriptions.push(
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
                    'Talon user folder not found. Please select manually or configure talonSearch.userFolderPath',
                    'Select Folder'
                );
                if (result === 'Select Folder') {
                    await vscode.commands.executeCommand('talon.openListExplorer');
                }
            }
        })
    );

    // Register: Talon: Browse Lists (currently opens folder picker for import)
    context.subscriptions.push(
        vscode.commands.registerCommand('talon.openListExplorer', async () => {
            const folderUri = await vscode.window.showOpenDialog({
                canSelectFolders: true,
                canSelectFiles: false,
                canSelectMany: false,
                title: 'Select Talon User Folder',
                openLabel: 'Import'
            });

            if (folderUri && folderUri[0]) {
                await importTalonFiles(context, folderUri[0].fsPath);
                vscode.window.showInformationMessage('Import complete');
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
            // Import in background without blocking activation
            importTalonFiles(context, talonPath).catch(err => {
                console.error('Background import failed:', err);
            });
        }
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
                        const results = db.searchCommands(
                            message.searchTerm || '',
                            message.searchScope || 2,
                            message.application,
                            message.mode,
                            message.repository,
                            message.maxResults || 500
                        );
                        searchPanel?.webview.postMessage({
                            command: 'searchResults',
                            results: results
                        });
                        break;
                    case 'getStats':
                        const count = db.getCommandCount();
                        const filters = db.getFilterValues();
                        searchPanel?.webview.postMessage({
                            command: 'stats',
                            totalCommands: count,
                            filters: filters
                        });
                        break;
                    case 'clearDatabase':
                        db.clearAllCommands();
                        searchPanel?.webview.postMessage({
                            command: 'stats',
                            totalCommands: 0,
                            filters: { applications: [], modes: [], repositories: [], operatingSystems: [] }
                        });
                        vscode.window.showInformationMessage('Database cleared');
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
                    case 'log':
                        console.log('[Webview]', message.text);
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
    const count = db.getCommandCount();
    const filters = db.getFilterValues();
    searchPanel.webview.postMessage({
        command: 'stats',
        totalCommands: count,
        filters: filters
    });
    searchPanel.webview.postMessage({ 
        command: 'setSearchScope', 
        scope: searchScope 
    });
}

async function importTalonFiles(context: vscode.ExtensionContext, rootFolder: string) {
    return vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Importing Talon files",
        cancellable: false
    }, async (progress) => {
        progress.report({ increment: 0, message: "Scanning files..." });

        const files = await getTalonFiles(rootFolder);
        
        progress.report({ increment: 30, message: `Found ${files.length} .talon files` });

        if (files.length === 0) {
            vscode.window.showWarningMessage('No .talon files found in selected folder');
            return;
        }

        // Parse all files
        let allCommands: Array<Omit<TalonVoiceCommand, 'id'>> = [];
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

        progress.report({ increment: 80, message: `Saving ${allCommands.length} commands to database...` });

        // Insert into SQLite
        db.insertCommandsBatch(allCommands);

        const totalCount = db.getCommandCount();
        progress.report({ increment: 100, message: "Import complete" });

        vscode.window.showInformationMessage(`Imported ${allCommands.length} commands. Total in database: ${totalCount}`);

        // Update webview if open
        if (searchPanel) {
            const filters = db.getFilterValues();
            searchPanel.webview.postMessage({
                command: 'stats',
                totalCommands: totalCount,
                filters: filters
            });
            searchPanel.webview.postMessage({
                command: 'importComplete',
                imported: allCommands.length,
                total: totalCount
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
        path.join(process.env.APPDATA || '', 'talon', 'user'),
        path.join(process.env.USERPROFILE || '', 'AppData', 'Roaming', 'talon', 'user')
    ] : isMac ? [
        path.join(process.env.HOME || '', '.talon', 'user')
    ] : [
        path.join(process.env.HOME || '', '.talon', 'user')
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
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${styleUri.toString().replace(/[^:]+:/, '')} 'unsafe-inline'; script-src ${scriptUri.toString().replace(/[^:]+:/, '')};">
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
        
        <div class="search-box">
            <input type="text" id="searchInput" placeholder="Search commands, scripts, or applications..." />
            <select id="searchScope">
                <option value="2">All (Commands + Scripts + Lists)</option>
                <option value="0">Command Names Only</option>
                <option value="1">Scripts Only</option>
            </select>
        </div>

        <div id="stats" class="stats"></div>
        
        <div id="results" class="results"></div>
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
}
