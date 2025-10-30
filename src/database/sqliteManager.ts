import * as path from 'path';
import * as fs from 'fs';
import { TalonVoiceCommand, TalonListItem } from '../types';

export class SqliteManager {
    private commands: TalonVoiceCommand[] = [];
    private dbPath: string;
    private nextId: number = 1;

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
                this.nextId = parsed.nextId || 1;
                console.log(`Loaded ${this.commands.length} commands from file`);
            }
        } catch (err) {
            console.error('Error loading commands from file:', err);
            this.commands = [];
            this.nextId = 1;
        }
    }

    private saveToFile(): void {
        try {
            const data = {
                commands: this.commands,
                nextId: this.nextId
            };
            fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2));
            console.log(`Saved ${this.commands.length} commands to file`);
        } catch (err) {
            console.error('Error saving commands to file:', err);
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

    public searchCommands(
        searchTerm: string,
        searchScope: number,
        application?: string,
        mode?: string,
        repository?: string,
        maxResults: number = 500
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

        // Apply search term
        if (searchTerm && searchTerm.trim().length > 0) {
            const term = searchTerm.trim().toLowerCase();
            
            if (searchScope === 0) {
                // CommandNamesOnly
                results = results.filter(cmd => 
                    cmd.command.toLowerCase().includes(term)
                );
            } else if (searchScope === 1) {
                // ScriptOnly
                results = results.filter(cmd => 
                    cmd.script.toLowerCase().includes(term)
                );
            } else {
                // All - search in command, script, and application
                results = results.filter(cmd => 
                    cmd.command.toLowerCase().includes(term) ||
                    cmd.script.toLowerCase().includes(term) ||
                    (cmd.application && cmd.application.toLowerCase().includes(term)) ||
                    (cmd.title && cmd.title.toLowerCase().includes(term)) ||
                    (cmd.tags && cmd.tags.toLowerCase().includes(term))
                );
            }
        }

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

    public clearAllCommands(): void {
        this.commands = [];
        this.nextId = 1;
        this.saveToFile();
    }

    public close(): void {
        // Nothing to close for JSON-based storage
    }
}
