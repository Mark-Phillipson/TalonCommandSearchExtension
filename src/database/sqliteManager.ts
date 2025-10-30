import * as path from 'path';
import * as fs from 'fs';
import { TalonVoiceCommand, TalonListItem } from '../types';

export class SqliteManager {
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
        maxResults: number = 500
    ): TalonVoiceCommand[] {
        console.log(`[SqliteManager] Search called with: term="${searchTerm}", scope=${searchScope}, app="${application}", mode="${mode}", repo="${repository}"`);
        
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

        // Apply search term
        if (searchTerm && searchTerm.trim().length > 0) {
            const term = searchTerm.trim().toLowerCase();
            console.log(`[SqliteManager] Searching for term: "${term}"`);
            
            if (searchScope === 0) {
                // CommandNamesOnly
                console.log(`[SqliteManager] Using CommandNamesOnly search scope`);
                const beforeCount = results.length;
                results = results.filter(cmd => 
                    cmd.command.toLowerCase().includes(term)
                );
                console.log(`[SqliteManager] CommandNamesOnly: Filtered from ${beforeCount} to ${results.length} results`);
                
                // Log first few results for debugging
                if (results.length > 0) {
                    console.log(`[SqliteManager] First few CommandNamesOnly results:`, 
                        results.slice(0, 3).map(cmd => ({ command: cmd.command, script: cmd.script.substring(0, 50) + '...' }))
                    );
                }
            } else if (searchScope === 1) {
                // ScriptOnly
                console.log(`[SqliteManager] Using ScriptOnly search scope`);
                results = results.filter(cmd => 
                    cmd.script.toLowerCase().includes(term)
                );
            } else {
                // All - search in command, script, and application
                console.log(`[SqliteManager] Using All search scope`);
                results = results.filter(cmd => 
                    cmd.command.toLowerCase().includes(term) ||
                    cmd.script.toLowerCase().includes(term) ||
                    (cmd.application && cmd.application.toLowerCase().includes(term)) ||
                    (cmd.title && cmd.title.toLowerCase().includes(term)) ||
                    (cmd.tags && cmd.tags.toLowerCase().includes(term))
                );
            }
        }

        console.log(`[SqliteManager] Final result count: ${results.length}`);
        return results.slice(0, maxResults);
    }

    public getCommandCount(): number {
        return this.commands.length;
    }

    public getFilterValues(): {
        applications: string[];
        modes: string[];
        repositories: string[];
        operatingSystems: string[];
    } {
        const applications = [...new Set(this.commands.map(cmd => cmd.application).filter(Boolean) as string[])].sort();
        const modes = [...new Set(this.commands.map(cmd => cmd.mode).filter(Boolean) as string[])].sort();
        const repositories = [...new Set(this.commands.map(cmd => cmd.repository).filter(Boolean) as string[])].sort();
        const operatingSystems = [...new Set(this.commands.map(cmd => cmd.operatingSystem).filter(Boolean) as string[])].sort();

        return {
            applications,
            modes,
            repositories,
            operatingSystems
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
        console.log(`[SqliteManager] List search called with: term="${searchTerm}"`);
        
        let results = [...this.lists];

        // Apply search term
        if (searchTerm && searchTerm.trim().length > 0) {
            const term = searchTerm.trim().toLowerCase();
            console.log(`[SqliteManager] Searching lists for term: "${term}"`);
            
            results = results.filter(item => 
                item.listName.toLowerCase().includes(term) ||
                item.spokenForm.toLowerCase().includes(term) ||
                item.listValue.toLowerCase().includes(term) ||
                (item.sourceFile && item.sourceFile.toLowerCase().includes(term))
            );
        }

        console.log(`[SqliteManager] Final list result count: ${results.length}`);
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
}
