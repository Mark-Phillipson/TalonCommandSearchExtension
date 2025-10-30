import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { TalonVoiceCommand, TalonListItem } from '../types';

export class SqliteManager {
    private db: Database.Database | null = null;
    private dbPath: string;

    constructor(storagePath: string) {
        this.dbPath = path.join(storagePath, 'talon-commands.db');
    }

    public initialize(): void {
        // Ensure directory exists
        const dir = path.dirname(this.dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        this.db = new Database(this.dbPath);
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('synchronous = NORMAL');
        this.createTables();
    }

    private createTables(): void {
        if (!this.db) throw new Error('Database not initialized');

        // TalonVoiceCommand table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS talon_commands (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                command TEXT NOT NULL,
                script TEXT NOT NULL,
                application TEXT,
                title TEXT,
                mode TEXT,
                operating_system TEXT,
                file_path TEXT NOT NULL,
                repository TEXT,
                tags TEXT,
                code_language TEXT,
                language TEXT,
                hostname TEXT,
                created_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_command ON talon_commands(command);
            CREATE INDEX IF NOT EXISTS idx_application ON talon_commands(application);
            CREATE INDEX IF NOT EXISTS idx_repository ON talon_commands(repository);
            CREATE INDEX IF NOT EXISTS idx_mode ON talon_commands(mode);
            CREATE INDEX IF NOT EXISTS idx_file_path ON talon_commands(file_path);
        `);

        // TalonList table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS talon_lists (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                list_name TEXT NOT NULL,
                spoken_form TEXT NOT NULL,
                list_value TEXT NOT NULL,
                source_file TEXT,
                created_at TEXT NOT NULL,
                imported_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_list_name ON talon_lists(list_name);
            CREATE INDEX IF NOT EXISTS idx_spoken_form ON talon_lists(spoken_form);
        `);

        // FTS5 virtual table for full-text search on commands
        this.db.exec(`
            CREATE VIRTUAL TABLE IF NOT EXISTS talon_commands_fts USING fts5(
                command,
                script,
                application,
                title,
                tags,
                content='talon_commands',
                content_rowid='id'
            );

            -- Triggers to keep FTS in sync
            CREATE TRIGGER IF NOT EXISTS talon_commands_ai AFTER INSERT ON talon_commands BEGIN
                INSERT INTO talon_commands_fts(rowid, command, script, application, title, tags)
                VALUES (new.id, new.command, new.script, new.application, new.title, new.tags);
            END;

            CREATE TRIGGER IF NOT EXISTS talon_commands_ad AFTER DELETE ON talon_commands BEGIN
                DELETE FROM talon_commands_fts WHERE rowid = old.id;
            END;

            CREATE TRIGGER IF NOT EXISTS talon_commands_au AFTER UPDATE ON talon_commands BEGIN
                DELETE FROM talon_commands_fts WHERE rowid = old.id;
                INSERT INTO talon_commands_fts(rowid, command, script, application, title, tags)
                VALUES (new.id, new.command, new.script, new.application, new.title, new.tags);
            END;
        `);
    }

    public insertCommand(cmd: Omit<TalonVoiceCommand, 'id'>): number {
        if (!this.db) throw new Error('Database not initialized');

        const stmt = this.db.prepare(`
            INSERT INTO talon_commands (
                command, script, application, title, mode, operating_system,
                file_path, repository, tags, code_language, language, hostname, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            cmd.command,
            cmd.script,
            cmd.application || 'global',
            cmd.title || null,
            cmd.mode || null,
            cmd.operatingSystem || null,
            cmd.filePath,
            cmd.repository || null,
            cmd.tags || null,
            cmd.codeLanguage || null,
            cmd.language || null,
            cmd.hostname || null,
            cmd.createdAt || new Date().toISOString()
        );

        return result.lastInsertRowid as number;
    }

    public insertCommandsBatch(commands: Array<Omit<TalonVoiceCommand, 'id'>>): void {
        if (!this.db) throw new Error('Database not initialized');

        const insert = this.db.prepare(`
            INSERT INTO talon_commands (
                command, script, application, title, mode, operating_system,
                file_path, repository, tags, code_language, language, hostname, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const insertMany = this.db.transaction((cmds: Array<Omit<TalonVoiceCommand, 'id'>>) => {
            for (const cmd of cmds) {
                insert.run(
                    cmd.command,
                    cmd.script,
                    cmd.application || 'global',
                    cmd.title || null,
                    cmd.mode || null,
                    cmd.operatingSystem || null,
                    cmd.filePath,
                    cmd.repository || null,
                    cmd.tags || null,
                    cmd.codeLanguage || null,
                    cmd.language || null,
                    cmd.hostname || null,
                    cmd.createdAt || new Date().toISOString()
                );
            }
        });

        insertMany(commands);
    }

    public searchCommands(
        searchTerm: string,
        searchScope: number,
        application?: string,
        mode?: string,
        repository?: string,
        maxResults: number = 500
    ): TalonVoiceCommand[] {
        if (!this.db) throw new Error('Database not initialized');

        const conditions: string[] = [];
        const params: any[] = [];

        // Search scope logic
        if (searchTerm && searchTerm.trim().length > 0) {
            const term = searchTerm.trim();
            
            if (searchScope === 0) {
                // CommandNamesOnly - use LIKE for contains match
                conditions.push('command LIKE ?');
                params.push(`%${term}%`);
            } else if (searchScope === 1) {
                // ScriptOnly
                conditions.push('script LIKE ?');
                params.push(`%${term}%`);
            } else {
                // All - use FTS5 for full-text search
                const stmt = this.db.prepare(`
                    SELECT c.* FROM talon_commands c
                    INNER JOIN talon_commands_fts fts ON c.id = fts.rowid
                    WHERE talon_commands_fts MATCH ?
                    ${application ? 'AND c.application = ?' : ''}
                    ${mode ? 'AND c.mode LIKE ?' : ''}
                    ${repository ? 'AND c.repository = ?' : ''}
                    LIMIT ?
                `);

                const ftsParams: any[] = [term];
                if (application) ftsParams.push(application);
                if (mode) ftsParams.push(`%${mode}%`);
                if (repository) ftsParams.push(repository);
                ftsParams.push(maxResults);

                return stmt.all(...ftsParams).map(this.mapToCommand);
            }
        }

        // Additional filters
        if (application) {
            conditions.push('application = ?');
            params.push(application);
        }
        if (mode) {
            conditions.push('mode LIKE ?');
            params.push(`%${mode}%`);
        }
        if (repository) {
            conditions.push('repository = ?');
            params.push(repository);
        }

        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
        const sql = `
            SELECT * FROM talon_commands
            ${whereClause}
            LIMIT ?
        `;

        params.push(maxResults);

        const stmt = this.db.prepare(sql);
        return stmt.all(...params).map(this.mapToCommand);
    }

    public getCommandCount(): number {
        if (!this.db) throw new Error('Database not initialized');
        const result = this.db.prepare('SELECT COUNT(*) as count FROM talon_commands').get() as { count: number };
        return result.count;
    }

    public getFilterValues(): {
        applications: string[];
        modes: string[];
        repositories: string[];
        operatingSystems: string[];
    } {
        if (!this.db) throw new Error('Database not initialized');

        const applications = this.db.prepare(`
            SELECT DISTINCT application FROM talon_commands
            WHERE application IS NOT NULL
            ORDER BY application
        `).all().map((r: any) => r.application);

        const modes = this.db.prepare(`
            SELECT DISTINCT mode FROM talon_commands
            WHERE mode IS NOT NULL
            ORDER BY mode
        `).all().map((r: any) => r.mode);

        const repositories = this.db.prepare(`
            SELECT DISTINCT repository FROM talon_commands
            WHERE repository IS NOT NULL
            ORDER BY repository
        `).all().map((r: any) => r.repository);

        const operatingSystems = this.db.prepare(`
            SELECT DISTINCT operating_system FROM talon_commands
            WHERE operating_system IS NOT NULL
            ORDER BY operating_system
        `).all().map((r: any) => r.operating_system);

        return {
            applications,
            modes,
            repositories,
            operatingSystems
        };
    }

    public clearAllCommands(): void {
        if (!this.db) throw new Error('Database not initialized');
        this.db.exec('DELETE FROM talon_commands');
    }

    public close(): void {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }

    private mapToCommand(row: any): TalonVoiceCommand {
        return {
            id: row.id,
            command: row.command,
            script: row.script,
            application: row.application,
            title: row.title,
            mode: row.mode,
            operatingSystem: row.operating_system,
            filePath: row.file_path,
            repository: row.repository,
            tags: row.tags,
            codeLanguage: row.code_language,
            language: row.language,
            hostname: row.hostname,
            createdAt: row.created_at
        };
    }
}
