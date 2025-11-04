import * as path from 'path';
import * as fs from 'fs';
import { TalonVoiceCommand, TalonListItem } from '../types';

export class DataManager {
    private commands: TalonVoiceCommand[] = [];
    private lists: TalonListItem[] = [];
    private dbPath: string;
    private nextId: number = 1;
    private nextListId: number = 1;

    constructor(storagePath: string) {
        this.dbPath = path.join(storagePath, 'talon-commands.json');
    }

    public initialize(): void {
        // Ensure directory exists
        const dir = path.dirname(this.dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Load existing data
        this.loadFromFile();
    }

    private loadFromFile(): void {
        try {
            if (fs.existsSync(this.dbPath)) {
                const data = fs.readFileSync(this.dbPath, 'utf8');
                const parsed = JSON.parse(data);
                this.commands = parsed.commands || [];
                this.lists = parsed.lists || [];
                this.nextId = parsed.nextId || 1;
                this.nextListId = parsed.nextListId || 1;
                console.log(`Loaded ${this.commands.length} commands and ${this.lists.length} list items from file`);
            }
        } catch (err) {
            console.error('Error loading data from file:', err);
            this.commands = [];
            this.lists = [];
            this.nextId = 1;
            this.nextListId = 1;
        }
    }

    private saveToFile(): void {
        try {
            const data = {
                commands: this.commands,
                lists: this.lists,
                nextId: this.nextId,
                nextListId: this.nextListId
            };
            fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2));
            console.log(`Saved ${this.commands.length} commands and ${this.lists.length} list items to file`);
        } catch (err) {
            console.error('Error saving data to file:', err);
        }
    }

    public insertCommand(cmd: Omit<TalonVoiceCommand, 'id'>): number {
        const newCommand: TalonVoiceCommand = {
            ...cmd,
            id: this.nextId++,
            application: cmd.application || 'global',
            createdAt: cmd.createdAt || new Date().toISOString()
        };

        this.commands.push(newCommand);
        this.saveToFile();
        return newCommand.id;
    }

    public insertCommandsBatch(commands: Array<Omit<TalonVoiceCommand, 'id'>>): void {
        for (const cmd of commands) {
            const newCommand: TalonVoiceCommand = {
                ...cmd,
                id: this.nextId++,
                application: cmd.application || 'global',
                createdAt: cmd.createdAt || new Date().toISOString()
            };
            this.commands.push(newCommand);
        }
        this.saveToFile();
    }

    public refreshCommandsBatch(commands: Array<Omit<TalonVoiceCommand, 'id'>>): void {
        // Clear existing commands before inserting new ones to avoid duplicates
        console.log(`Clearing ${this.commands.length} existing commands before refresh`);
        this.commands = [];
        this.nextId = 1;
        
        // Insert new commands
        for (const cmd of commands) {
            const newCommand: TalonVoiceCommand = {
                ...cmd,
                id: this.nextId++,
                application: cmd.application || 'global',
                createdAt: cmd.createdAt || new Date().toISOString()
            };
            this.commands.push(newCommand);
        }
        this.saveToFile();
        console.log(`Refresh complete: imported ${commands.length} commands`);
    }

    public searchCommands(
        searchTerm: string,
        searchScope: number,
        application?: string,
        mode?: string,
        repository?: string,
        tags?: string,
        operatingSystem?: string,
        title?: string,
        maxResults: number = 500,
        preferredApplications?: string[],
        excludedOperatingSystems?: string[]
    ): TalonVoiceCommand[] {
        let results = [...this.commands];
        // Apply filters
        if (application) {
            results = results.filter(cmd => cmd.application === application);
        }
        if (mode) {
            results = results.filter(cmd => cmd.mode && cmd.mode.includes(mode));
        }
        if (repository) {
            results = results.filter(cmd => cmd.repository === repository);
        }
        if (tags) {
            results = results.filter(cmd => {
                if (!cmd.tags) return false;
                const commandTags = cmd.tags.split(',').map(tag => tag.trim());
                return commandTags.includes(tags);
            });
        }
        if (operatingSystem) {
            results = results.filter(cmd => cmd.operatingSystem === operatingSystem);
        }
        if (title) {
            results = results.filter(cmd => cmd.title === title);
        }
        const hasPreferredApps = !application && Array.isArray(preferredApplications) && preferredApplications.length > 0;
        const hasExcludedOperatingSystems = !operatingSystem && Array.isArray(excludedOperatingSystems) && excludedOperatingSystems.length > 0;
        if (hasPreferredApps) {
            const preferredAppSet = new Set(preferredApplications.map(app => app.toLowerCase()));
            results = results.filter(cmd => {
                const commandApp = (cmd.application || 'global').toLowerCase();
                if (commandApp === 'global') {
                    return true;
                }
                return preferredAppSet.has(commandApp);
            });
        }
        if (hasExcludedOperatingSystems) {
            const excludedOsSet = new Set(excludedOperatingSystems.map(os => os.toLowerCase()));
            results = results.filter(cmd => {
                if (!cmd.operatingSystem) {
                    return true;
                }
                return !excludedOsSet.has(cmd.operatingSystem.toLowerCase());
            });
        }
        // Apply search term
        if (searchTerm && searchTerm.trim().length > 0) {
            const term = searchTerm.trim().toLowerCase();
            if (searchScope === 0) {
                // CommandNamesOnly
                console.log(`[DataManager] Using CommandNamesOnly search scope`);
                const beforeCount = results.length;
                results = results.filter(cmd => {
                    const spoken = cmd.command.split(/<|\{|\(/)[0].trim().toLowerCase();
                    return spoken.includes(term);
                });
                console.log(`[DataManager] CommandNamesOnly: Filtered from ${beforeCount} to ${results.length} results`);
                if (results.length > 0) {
                    console.log(`[DataManager] First few CommandNamesOnly results:`,
                        results.slice(0, 3).map(cmd => ({ command: cmd.command, script: cmd.script.substring(0, 50) + '...' }))
                    );
                }
            } else if (searchScope === 1) {
                // ScriptOnly
                console.log(`[DataManager] Using ScriptOnly search scope`);
                results = results.filter(cmd =>
                    cmd.script.toLowerCase().includes(term)
                );
            } else if (searchScope === 3) {
                // Spoken Forms (Commands + Lists)
                console.log(`[DataManager] Using Spoken Forms (Commands + Lists) search scope`);
                const beforeCount = results.length;
                results = results.filter(cmd => {
                    const spoken = cmd.command.split(/<|\{|\(/)[0].trim().toLowerCase();
                    return spoken.includes(term) || this.commandMatchesListItem(cmd.command, term);
                });
                console.log(`[DataManager] Spoken Forms: Filtered from ${beforeCount} to ${results.length} results`);
            } else {
                // All
                console.log(`[DataManager] Using All search scope`);
                console.log(`[DataManager] Sample commands to search through:`,
                    results.slice(0, 5).map(cmd => ({ command: cmd.command, app: cmd.application }))
                );
                const testCommands = results.filter(cmd => cmd.command.includes('{')).slice(0, 3);
                console.log(`[DataManager] Testing list matching on sample commands:`, testCommands.map(cmd => cmd.command));
                testCommands.forEach(cmd => {
                    const matches = this.commandMatchesListItem(cmd.command, term);
                    console.log(`[DataManager] Command "${cmd.command}" matches search "${term}": ${matches}`);
                });
                results = results.filter(cmd =>
                    cmd.command.toLowerCase().includes(term) ||
                    cmd.script.toLowerCase().includes(term) ||
                    (cmd.application && cmd.application.toLowerCase().includes(term)) ||
                    (cmd.title && cmd.title.toLowerCase().includes(term)) ||
                    (cmd.tags && cmd.tags.toLowerCase().includes(term)) ||
                    this.commandMatchesListItem(cmd.command, term)
                );
            }
        }
        console.log(`[DataManager] Final result count: ${results.length}`);
        return results.slice(0, maxResults);
    }


    public getCommandCount(): number {
        return this.commands.length;
    }

    public getFilterValues(): {
        // ...existing code...
        applications: string[];
        modes: string[];
        repositories: string[];
        operatingSystems: string[];
        tags: string[];
        titles: string[];
    } {
        const applications = [...new Set(
            this.commands
                .flatMap(cmd => cmd.applications ? cmd.applications : [cmd.application])
                .filter((app): app is string => typeof app === 'string' && app.length > 0)
        )].sort();

        // Debug log for aggregated applications
        console.log('[DataManager] Aggregated applications for dropdown:', applications);
        const modes = [...new Set(this.commands.map(cmd => cmd.mode).filter(Boolean) as string[])].sort();
        const repositories = [...new Set(this.commands.map(cmd => cmd.repository).filter(Boolean) as string[])].sort();
        const operatingSystems = [...new Set(this.commands.map(cmd => cmd.operatingSystem).filter(Boolean) as string[])].sort();
        const titles = [...new Set(this.commands.map(cmd => cmd.title).filter(Boolean) as string[])].sort();
        
        // Extract individual tags from comma-separated tag strings
        const allTags = this.commands
            .map(cmd => cmd.tags)
            .filter(Boolean)
            .flatMap(tagString => tagString!.split(',').map(tag => tag.trim()))
            .filter(tag => tag.length > 0);
        const tags = [...new Set(allTags)].sort();

    console.log('[DataManager] Aggregated applications for dropdown:', applications);
    return {
            applications,
            modes,
            repositories,
            operatingSystems,
            tags,
            titles
        };
    }

    public getRepositoryBreakdown(): { [repository: string]: number } {
        const breakdown: { [repository: string]: number } = {};
        
        this.commands.forEach(cmd => {
            const repo = cmd.repository || 'No Repository';
            breakdown[repo] = (breakdown[repo] || 0) + 1;
        });
        
        return breakdown;
    }

    // List management methods
    public insertListItem(item: Omit<TalonListItem, 'id'>): number {
        const newItem: TalonListItem = {
            ...item,
            id: this.nextListId++,
            createdAt: item.createdAt || new Date().toISOString(),
            importedAt: item.importedAt || new Date().toISOString()
        };

        this.lists.push(newItem);
        this.saveToFile();
        return newItem.id;
    }

    public insertListItemsBatch(items: Array<Omit<TalonListItem, 'id'>>): void {
        for (const item of items) {
            const newItem: TalonListItem = {
                ...item,
                id: this.nextListId++,
                createdAt: item.createdAt || new Date().toISOString(),
                importedAt: item.importedAt || new Date().toISOString()
            };
            this.lists.push(newItem);
        }
        this.saveToFile();
    }

    public refreshListItemsBatch(items: Array<Omit<TalonListItem, 'id'>>): void {
        // Clear existing lists before inserting new ones
        console.log(`Clearing ${this.lists.length} existing list items before refresh`);
        this.lists = [];
        this.nextListId = 1;
        
        // Insert new list items
        for (const item of items) {
            const newItem: TalonListItem = {
                ...item,
                id: this.nextListId++,
                createdAt: item.createdAt || new Date().toISOString(),
                importedAt: item.importedAt || new Date().toISOString()
            };
            this.lists.push(newItem);
        }
        this.saveToFile();
        console.log(`List refresh complete: imported ${items.length} list items`);
    }

    public searchListItems(
        searchTerm: string,
        maxResults: number = 500
    ): TalonListItem[] {
        console.log(`[DataManager] List search called with: term="${searchTerm}"`);
        
        let results = [...this.lists];

        // Apply search term
        if (searchTerm && searchTerm.trim().length > 0) {
            const term = searchTerm.trim().toLowerCase();
            console.log(`[DataManager] Searching lists for term: "${term}"`);
            
            results = results.filter(item => 
                item.listName.toLowerCase().includes(term) ||
                item.spokenForm.toLowerCase().includes(term) ||
                item.listValue.toLowerCase().includes(term) ||
                (item.sourceFile && item.sourceFile.toLowerCase().includes(term))
            );
        }

        console.log(`[DataManager] Final list result count: ${results.length}`);
        return results.slice(0, maxResults);
    }

    public getListCount(): number {
        return this.lists.length;
    }

    public getListNames(): string[] {
        return [...new Set(this.lists.map(item => item.listName))].sort();
    }

    public getListItemsByName(listName: string): TalonListItem[] {
        return this.lists.filter(item => item.listName === listName);
    }

    public clearAllCommands(): void {
        this.commands = [];
        this.nextId = 1;
        this.saveToFile();
    }

    public clearAllLists(): void {
        this.lists = [];
        this.nextListId = 1;
        this.saveToFile();
    }

    public clearAllData(): void {
        this.commands = [];
        this.lists = [];
        this.nextId = 1;
        this.nextListId = 1;
        this.saveToFile();
    }

    public close(): void {
        // Nothing to close for JSON-based storage
    }

    /**
     * Check if a command that contains list placeholders (e.g., {user.emoji} or <user.arrow_key>) 
     * matches a search term that could be a list item value.
     * For example, searching for "left" should match "game <user.arrow_key>" 
     * if "left" is in the user.arrow_key list.
     * Also handles multi-word searches like "insert happy" by checking individual words.
     */
    private commandMatchesListItem(command: string, searchTerm: string): boolean {
        // Find all list placeholders in the command - both {user.emoji} and <user.arrow_key> formats
        const listPlaceholderRegex = /[{<]([^}>]+)[}>]/g;
        const matches = command.match(listPlaceholderRegex);
        
        console.log(`[commandMatchesListItem] Checking command: "${command}" for search: "${searchTerm}"`);
        console.log(`[commandMatchesListItem] Found placeholders:`, matches);
        
        if (!matches) {
            return false;
        }

        // Extract list names from placeholders (e.g., "user.arrow_key" from "<user.arrow_key>" or "{user.emoji}")
        const extractedListNames = matches.map(match => match.slice(1, -1)); // Remove brackets/braces
        
        // Get all actual list names from the database
        const actualListNames = [...new Set(this.lists.map(item => item.listName))];
        console.log(`[commandMatchesListItem] Available list names in database:`, actualListNames.slice(0, 5), `... (${actualListNames.length} total)`);
        
        // Map extracted list names to actual list names in the database
        // This handles cases where the database has "user.community/core/keys/arrow_key" 
        // but the command has "<user.arrow_key>"
        const listNames: string[] = [];
        
        for (const extractedName of extractedListNames) {
            // First try exact match
            if (actualListNames.includes(extractedName)) {
                listNames.push(extractedName);
                continue;
            }
            
            // Extract the base name from the extracted name (e.g., "arrow_key" from "user.arrow_key")
            const baseName = extractedName.split('.').pop();
            if (!baseName) continue;
            
            // Find lists that end with this base name
            // e.g., "arrow_key" should match "user.community/core/keys/arrow_key"
            const matchingLists = actualListNames.filter(actualName => {
                const actualBaseName = actualName.split('/').pop()?.split('.').pop();
                return actualBaseName === baseName;
            });
            
            if (matchingLists.length > 0) {
                console.log(`[commandMatchesListItem] Found matching list: "${extractedName}" -> "${matchingLists[0]}"`);
                listNames.push(matchingLists[0]);
            } else {
                console.log(`[commandMatchesListItem] No matching list found for: "${extractedName}" (base: "${baseName}")`);
            }
        }
        
        console.log(`[commandMatchesListItem] List names to check (filtered):`, listNames);
        
        if (listNames.length === 0) {
            return false;
        }
        
        // Split search term into individual words to handle multi-word searches
        const searchWords = searchTerm.toLowerCase().split(/\s+/).filter(word => word.length > 0);
        
        // Check if any word in the search term matches any spoken form or list value in the referenced lists
        for (const listName of listNames) {
            const listItems = this.lists.filter(item => item.listName === listName);
            console.log(`[commandMatchesListItem] Found ${listItems.length} items for list "${listName}"`);
            if (listItems.length > 0) {
                console.log(`[commandMatchesListItem] Sample items:`, listItems.slice(0, 3).map(item => `${item.spokenForm} -> ${item.listValue}`));
            }
            
            for (const item of listItems) {
                const spokenForm = item.spokenForm.toLowerCase();
                const listValue = item.listValue.toLowerCase();
                
                // Check if any search word matches the spoken form or is contained in the list value
                for (const word of searchWords) {
                    if (spokenForm === word || 
                        spokenForm.includes(word) ||
                        listValue.includes(word) ||
                        // Handle multi-word spoken forms (e.g., "hello world" matches "hello world")
                        (spokenForm.includes(' ') && searchTerm === spokenForm)) {
                        console.log(`[DataManager] Found list match: "${word}" (from "${searchTerm}") matches list item "${item.spokenForm}" -> "${item.listValue}" in list "${listName}"`);
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
}