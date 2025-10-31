// Data models ported from existing Blazor/C# implementation

export interface TalonVoiceCommand {
  id: number;
  command: string;              // max 200 chars
  script: string;               // max 2000 chars
  application?: string;         // max 200 chars, default "global"
  title?: string;               // max 200 chars
  mode?: string;                // max 300 chars (comma-separated)
  operatingSystem?: string;     // max 100 chars
  filePath: string;             // max 500 chars
  repository?: string;          // max 200 chars (e.g., "community", "knausj_talon")
  tags?: string;                // max 500 chars (comma-separated)
  codeLanguage?: string;        // max 100 chars
  language?: string;            // max 50 chars
  hostname?: string;            // max 100 chars
  createdAt?: string;           // ISO datetime
}

export interface TalonListItem {
  id: number;
  listName: string;             // max 100 chars (e.g., "user.emoji")
  spokenForm: string;           // max 100 chars (e.g., "angry")
  listValue: string;            // max 700 chars (e.g., "😠")
  sourceFile?: string;          // max 250 chars
  createdAt?: string;
  importedAt?: string;
}

export interface SearchOptions {
  searchTerm?: string;
  application?: string;
  mode?: string;
  operatingSystem?: string;
  repository?: string;
  tags?: string;
  title?: string;
  codeLanguage?: string;
  searchScope: SearchScope;
  maxResults?: number;          // default 500
  preferredApplications?: string[];
  excludedOperatingSystems?: string[];
}

export enum SearchScope {
  CommandNamesOnly = 0,  // Exact equality, case-insensitive
  ScriptOnly = 1,        // Search only in script content
  All = 2                // Search command, script, title, tags + list matching
}

export interface FilterValues {
  applications: string[];
  modes: string[];
  operatingSystems: string[];
  repositories: string[];
  tags: string[];
  titles: string[];
  codeLanguages: string[];
}

export interface ImportMessage {
  command: 'importFiles';
  files: Array<{ path: string; content: string }>;
}

export interface SearchMessage {
  command: 'search';
  options: SearchOptions;
}

export interface WebviewMessage {
  command: string;
  [key: string]: any;
}
