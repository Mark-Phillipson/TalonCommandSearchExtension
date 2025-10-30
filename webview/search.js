// Talon Command Search - Webview UI (communicates with SQLite backend via extension host)

(function() {
    const vscode = acquireVsCodeApi();
    let currentFilters = {
        applications: [],
        modes: [],
        repositories: [],
        operatingSystems: []
    };
    let totalCommands = 0;

    // Request search from extension host (SQLite backend)
    function performSearch() {
        const searchTerm = document.getElementById('searchInput')?.value.trim() || '';
        const searchScope = parseInt(document.getElementById('searchScope')?.value || '2');
        const application = document.getElementById('filterApplication')?.value || undefined;
        const mode = document.getElementById('filterMode')?.value || undefined;
        const repository = document.getElementById('filterRepository')?.value || undefined;
        
        console.log('[Search] Performing search:', { searchTerm, searchScope, application, mode, repository });
        
        vscode.postMessage({
            command: 'search',
            searchTerm: searchTerm,
            searchScope: searchScope,
            application: application === '' ? undefined : application,
            mode: mode === '' ? undefined : mode,
            repository: repository === '' ? undefined : repository,
            maxResults: 500
        });
    }

    // Display results in UI
    function displayResults(results) {
        const resultsDiv = document.getElementById('results');
        if (!resultsDiv) return;
        
        resultsDiv.innerHTML = '';
        
        if (results.length === 0) {
            resultsDiv.innerHTML = '<p class="no-results">No commands found. Try importing your Talon files first (Talon: Refresh Index)</p>';
            return;
        }
        
        // Add result count header
        const header = document.createElement('div');
        header.className = 'results-header';
        header.textContent = `Found ${results.length} command${results.length !== 1 ? 's' : ''}`;
        resultsDiv.appendChild(header);
        
        results.forEach(cmd => {
            const card = document.createElement('div');
            card.className = 'command-card';
            
            const headerDiv = document.createElement('div');
            headerDiv.className = 'command-header';
            headerDiv.innerHTML = `
                <strong>${escapeHtml(cmd.command)}</strong>
                <span class="app-badge">${escapeHtml(cmd.application || 'global')}</span>
            `;
            
            const script = document.createElement('pre');
            script.className = 'command-script';
            script.textContent = cmd.script;
            
            const footer = document.createElement('div');
            footer.className = 'command-footer';
            footer.innerHTML = `
                ${cmd.repository ? `<span>📁 ${escapeHtml(cmd.repository)}</span>` : ''}
                ${cmd.mode ? `<span>🎯 ${escapeHtml(cmd.mode)}</span>` : ''}
            `;
            
            card.appendChild(headerDiv);
            card.appendChild(script);
            card.appendChild(footer);
            
            card.addEventListener('click', () => {
                vscode.postMessage({ command: 'openFile', filePath: cmd.filePath });
            });
            
            resultsDiv.appendChild(card);
        });
    }

    function updateStats(total) {
        totalCommands = total;
        const statsDiv = document.getElementById('stats');
        if (statsDiv) {
            statsDiv.textContent = `Total commands: ${total}`;
        }
    }

    function updateFilters(filters) {
        currentFilters = filters;
        
        // Update filter dropdowns if they exist
        const appFilter = document.getElementById('filterApplication');
        const modeFilter = document.getElementById('filterMode');
        const repoFilter = document.getElementById('filterRepository');
        
        if (appFilter) {
            appFilter.innerHTML = '<option value="">All Applications</option>';
            filters.applications.forEach(app => {
                const option = document.createElement('option');
                option.value = app;
                option.textContent = app;
                appFilter.appendChild(option);
            });
        }
        
        if (modeFilter) {
            modeFilter.innerHTML = '<option value="">All Modes</option>';
            filters.modes.forEach(mode => {
                const option = document.createElement('option');
                option.value = mode;
                option.textContent = mode;
                modeFilter.appendChild(option);
            });
        }
        
        if (repoFilter) {
            repoFilter.innerHTML = '<option value="">All Repositories</option>';
            filters.repositories.forEach(repo => {
                const option = document.createElement('option');
                option.value = repo;
                option.textContent = repo;
                repoFilter.appendChild(option);
            });
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initialize UI
    function init() {
        console.log('[Init] Initializing webview...');
        
        // Request initial stats
        vscode.postMessage({ command: 'getStats' });
        
        // Perform initial search if we have commands
        setTimeout(() => {
            if (totalCommands > 0) {
                performSearch();
            }
        }, 500);
    }

    // Event listeners
    document.getElementById('searchInput')?.addEventListener('input', performSearch);
    
    document.getElementById('searchScope')?.addEventListener('change', performSearch);
    
    document.getElementById('filterApplication')?.addEventListener('change', performSearch);
    document.getElementById('filterMode')?.addEventListener('change', performSearch);
    document.getElementById('filterRepository')?.addEventListener('change', performSearch);

    // Toolbar button handlers
    document.getElementById('checkDbBtn')?.addEventListener('click', () => {
        alert(`Database contains ${totalCommands} commands.\n\nDatabase: SQLite (better-sqlite3)\nLocation: Extension global storage`);
    });

    document.getElementById('clearDbBtn')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all imported commands? This cannot be undone.')) {
            vscode.postMessage({ command: 'clearDatabase' });
        }
    });

    document.getElementById('refreshBtn')?.addEventListener('click', () => {
        vscode.postMessage({ command: 'triggerRefresh' });
    });

    // Handle messages from extension
    window.addEventListener('message', (event) => {
        const message = event.data;
        console.log('[Webview] Received message:', message.command);
        
        switch (message.command) {
            case 'searchResults':
                console.log('[Webview] Displaying', message.results.length, 'results');
                displayResults(message.results);
                break;
                
            case 'stats':
                console.log('[Webview] Stats:', message.totalCommands, 'commands');
                updateStats(message.totalCommands);
                updateFilters(message.filters);
                if (message.totalCommands > 0) {
                    performSearch();
                }
                break;
                
            case 'importComplete':
                console.log('[Webview] Import complete:', message.imported, 'commands');
                vscode.postMessage({ command: 'getStats' });
                break;
                
            case 'setSearchScope':
                const scopeSelect = document.getElementById('searchScope');
                if (scopeSelect) {
                    scopeSelect.value = message.scope.toString();
                }
                break;
                
            case 'error':
                console.error('[Webview] Error from extension:', message.message);
                const resultsDiv = document.getElementById('results');
                if (resultsDiv) {
                    resultsDiv.innerHTML = `<p class="error-message">⚠️ ${message.message}</p>`;
                }
                break;
        }
    });

    // Initialize on load
    init();
})();
