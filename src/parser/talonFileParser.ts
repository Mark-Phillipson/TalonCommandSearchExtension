import { TalonVoiceCommand } from '../types';
import * as path from 'path';

export class TalonFileParser {
    public parseFile(filePath: string, content: string): Array<Omit<TalonVoiceCommand, 'id'>> {
            // ...existing code...
        const commands: Array<Omit<TalonVoiceCommand, 'id'>> = [];
        const lines = content.split('\n');
        
    // Parse headers (before delimiter line)
    let applications: string[] = [];
        let mode: string | undefined;
        let os: string | undefined;
        let tags: string | undefined;
        let title: string | undefined;
        let codeLanguage: string | undefined;
        let language: string | undefined;
        let hostname: string | undefined;
        const repository = this.extractRepository(filePath);
        
        let inHeader = true;
        let currentCommand: string | null = null;
        let currentScript: string[] = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            
            // Check for header delimiter
            if (inHeader && trimmed === '-') {
                inHeader = false;
                continue;
            }
            
            // Parse headers
            if (inHeader) {
                if (trimmed.startsWith('app:') || trimmed.startsWith('app.') || trimmed.startsWith('app.name:') || trimmed.startsWith('app.exe:')) {
                    const appVal = this.parseApplication(trimmed);
                    if (appVal && !applications.includes(appVal)) {
                        applications.push(appVal);
                    }
                } else if (trimmed.startsWith('mode:')) {
                    mode = trimmed.substring(5).trim();
                } else if (trimmed.startsWith('os:')) {
                    os = trimmed.substring(3).trim();
                } else if (trimmed.startsWith('tag:')) {
                    tags = trimmed.substring(4).trim();
                } else if (trimmed.startsWith('title:')) {
                    title = trimmed.substring(6).trim();
                } else if (trimmed.startsWith('code.language:')) {
                    codeLanguage = trimmed.substring(14).trim();
                } else if (trimmed.startsWith('language:')) {
                    language = trimmed.substring(9).trim();
                } else if (trimmed.startsWith('hostname:')) {
                    hostname = trimmed.substring(9).trim();
                }
                continue;
            }
            
            // Parse commands (after headers)
            if (trimmed.length === 0 || trimmed.startsWith('#')) {
                continue;
            }
            
            // Check for command line (contains colon and not indented)
            if (trimmed.includes(':') && !line.startsWith(' ') && !line.startsWith('\t')) {
                // Save previous command
                if (currentCommand) {
                    commands.push({
                        command: currentCommand.substring(0, 200),
                        script: currentScript.join('\n').substring(0, 2000),
                        application: applications.length > 0 ? applications[0].substring(0, 200) : 'global',
                        applications: applications.map(a => a.substring(0, 200)),
                        title: title?.substring(0, 200),
                        mode: mode?.substring(0, 300),
                        operatingSystem: os?.substring(0, 100),
                        filePath: filePath.substring(0, 500),
                        repository: repository?.substring(0, 200),
                        tags: tags?.substring(0, 500),
                        codeLanguage: codeLanguage?.substring(0, 100),
                        language: language?.substring(0, 50),
                        hostname: hostname?.substring(0, 100),
                        createdAt: new Date().toISOString()
                    });
                }
                
                // Start new command
                const colonIndex = trimmed.indexOf(':');
                currentCommand = trimmed.substring(0, colonIndex).trim();
                currentScript = [];
                
                // Check if script starts on same line
                const scriptPart = trimmed.substring(colonIndex + 1).trim();
                if (scriptPart.length > 0) {
                    currentScript.push(scriptPart);
                }
            } else if (currentCommand && (line.startsWith(' ') || line.startsWith('\t'))) {
                // Continuation of script
                currentScript.push(trimmed);
            }
        }
        
        // Save last command
        if (currentCommand) {
            commands.push({
                command: currentCommand.substring(0, 200),
                script: currentScript.join('\n').substring(0, 2000),
                application: applications.length > 0 ? applications[0].substring(0, 200) : 'global',
                applications: applications.map(a => a.substring(0, 200)),
                title: title?.substring(0, 200),
                mode: mode?.substring(0, 300),
                operatingSystem: os?.substring(0, 100),
                filePath: filePath.substring(0, 500),
                repository: repository?.substring(0, 200),
                tags: tags?.substring(0, 500),
                codeLanguage: codeLanguage?.substring(0, 100),
                language: language?.substring(0, 50),
                hostname: hostname?.substring(0, 100),
                createdAt: new Date().toISOString()
            });
        }
        
        console.log(`[TalonFileParser] Applications detected for file ${filePath}:`, applications);
        return commands;
    }

    private parseApplication(line: string): string {
    const originalLine = line;
        // Handle: app: chrome, app.name: visual studio, app.exe: code.exe
        let appValue = '';
        if (line.startsWith('app.name:')) {
            appValue = line.substring(9).trim();
        } else if (line.startsWith('app.exe:')) {
            appValue = line.substring(8).trim().replace('.exe', '');
        } else if (line.startsWith('app:')) {
            appValue = line.substring(4).trim();
        } else {
            return 'global';
        }

        // Normalize PowerShell and Terminal variants
        const lowerApp = appValue.toLowerCase();
        let normalized = appValue;
        if (lowerApp.includes('powershell')) {
            normalized = 'powershell';
        } else if (lowerApp.includes('windows_terminal') || lowerApp.includes('terminal')) {
            normalized = 'windows_terminal';
        }
        console.log(`[parseApplication] Header line: '${originalLine}' | Normalized: '${normalized}'`);
        return normalized;
    }

    private extractRepository(filePath: string): string | undefined {
        // Extract repository name from path (e.g., C:/Users/.../talon/user/community/file.talon -> "community")
        const normalized = filePath.replace(/\\/g, '/');
        const userIndex = normalized.toLowerCase().indexOf('/user/');
        if (userIndex === -1) return undefined;
        
        const afterUser = normalized.substring(userIndex + 6);
        const nextSlash = afterUser.indexOf('/');
        if (nextSlash === -1) return undefined;
        
        return afterUser.substring(0, nextSlash);
    }
}
