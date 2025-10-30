import { TalonListItem } from '../types';
import * as path from 'path';

export class TalonListParser {
    
    /**
     * Parse a .talon-list file content and extract list items
     */
    public parseListFile(filePath: string, content: string): Array<Omit<TalonListItem, 'id'>> {
        const items: Array<Omit<TalonListItem, 'id'>> = [];
        const lines = content.split('\n');
        
        // Extract list name from file path
        // Example: user.emoji -> user.emoji
        // Example: apps/browser.talon-list -> apps/browser
        let listName = path.basename(filePath, '.talon-list');
        
        // If the file is in a subdirectory, include that context
        const pathParts = filePath.split(path.sep);
        const userIndex = pathParts.findIndex(part => part === 'user');
        if (userIndex >= 0 && userIndex < pathParts.length - 1) {
            // Get path relative to user folder
            const relativePath = pathParts.slice(userIndex + 1).join('/');
            listName = path.dirname(relativePath) !== '.' ? 
                `${path.dirname(relativePath)}/${path.basename(relativePath, '.talon-list')}` : 
                path.basename(relativePath, '.talon-list');
        }
        
        // Ensure list name starts with user. if it doesn't already
        if (!listName.startsWith('user.')) {
            listName = `user.${listName}`;
        }

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Skip empty lines and comments
            if (!line || line.startsWith('#') || line.startsWith('//')) {
                continue;
            }
            
            // Parse line format: "spoken_form: list_value"
            const colonIndex = line.indexOf(':');
            if (colonIndex === -1) {
                // Skip malformed lines
                continue;
            }
            
            const spokenForm = line.substring(0, colonIndex).trim();
            const listValue = line.substring(colonIndex + 1).trim();
            
            if (spokenForm && listValue) {
                items.push({
                    listName: listName,
                    spokenForm: this.truncateField(spokenForm, 100),
                    listValue: this.truncateField(listValue, 700),
                    sourceFile: filePath
                });
            }
        }
        
        return items;
    }
    
    /**
     * Parse CSV-style list content (like TalonLists.txt)
     */
    public parseCSVListContent(filePath: string, content: string): Array<Omit<TalonListItem, 'id'>> {
        const items: Array<Omit<TalonListItem, 'id'>> = [];
        const lines = content.split('\n');
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Skip empty lines and comments
            if (!trimmedLine || trimmedLine.startsWith('#')) {
                continue;
            }
            
            // Parse CSV format: listName,spokenForm,listValue
            const parts = this.parseCSVLine(trimmedLine);
            if (parts.length >= 3) {
                const [listName, spokenForm, listValue] = parts;
                
                items.push({
                    listName: this.truncateField(listName.trim(), 100),
                    spokenForm: this.truncateField(spokenForm.trim(), 100),
                    listValue: this.truncateField(listValue.trim(), 700),
                    sourceFile: filePath
                });
            }
        }
        
        return items;
    }
    
    /**
     * Parse a simple CSV line, handling quoted fields
     */
    private parseCSVLine(line: string): string[] {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    }
    
    /**
     * Truncate field to specified max length to match database constraints
     */
    private truncateField(value: string, maxLength: number): string {
        if (value.length <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength - 3) + '...';
    }
    
    /**
     * Extract repository name from file path
     */
    private extractRepositoryFromPath(filePath: string): string | undefined {
        const pathParts = filePath.split(path.sep);
        const userIndex = pathParts.findIndex(part => part === 'user');
        
        if (userIndex >= 0 && userIndex < pathParts.length - 1) {
            return pathParts[userIndex + 1];
        }
        
        return undefined;
    }
}