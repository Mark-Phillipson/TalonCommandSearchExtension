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
        const scopeElement = document.getElementById('searchScope');
        const searchScope = scopeElement ? parseInt(scopeElement.value) : 2;
        const application = document.getElementById('filterApplication')?.value || undefined;
        const mode = document.getElementById('filterMode')?.value || undefined;
        const repository = document.getElementById('filterRepository')?.value || undefined;
        
        console.log('[Search] Performing search:', { searchTerm, searchScope, scopeValue: scopeElement?.value, application, mode, repository });
        
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
                ${cmd.repository ? `<span class="clickable-repo-label" data-repo="${escapeHtml(cmd.repository)}" title="Click to filter by ${escapeHtml(cmd.repository)}">📁 ${escapeHtml(cmd.repository)}</span>` : ''}
                ${cmd.mode ? `<span>🎯 ${escapeHtml(cmd.mode)}</span>` : ''}
            `;
            
            card.appendChild(headerDiv);
            card.appendChild(script);
            card.appendChild(footer);
            
            // Add click handler for opening file (but prevent on repository clicks)
            card.addEventListener('click', (e) => {
                // Don't open file if clicking on repository label
                if (!e.target.classList.contains('clickable-repo-label')) {
                    vscode.postMessage({ command: 'openFile', filePath: cmd.filePath });
                }
            });
            
            // Add click handler for repository labels in footer
            const repoLabel = footer.querySelector('.clickable-repo-label');
            if (repoLabel) {
                repoLabel.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent card click
                    const repoValue = repoLabel.getAttribute('data-repo');
                    filterByRepository(repoValue);
                });
            }
            
            resultsDiv.appendChild(card);
        });
    }

    function updateStats(total, repositoryBreakdown) {
        totalCommands = total;
        const statsDiv = document.getElementById('stats');
        if (statsDiv) {
            const currentRepoFilter = document.getElementById('filterRepository')?.value || '';
            let html = `<div class="stats-total">Total commands: ${total}</div>`;
            
            // Show active filter if any
            if (currentRepoFilter) {
                const filterName = currentRepoFilter || 'No Repository';
                html += `<div class="active-filter">
                    📌 Filtered by: <strong>${escapeHtml(filterName)}</strong>
                    <span class="clear-filter" onclick="clearRepositoryFilter()" title="Clear filter">✖</span>
                </div>`;
            }
            
            if (repositoryBreakdown && Object.keys(repositoryBreakdown).length > 0) {
                html += '<div class="stats-breakdown">';
                html += '<h4 title="Click on any repository below to filter results">Commands by Repository (click to filter):</h4>';
                html += '<div class="repo-stats-container">';
                
                // Sort repositories by command count (descending)
                const sortedRepos = Object.entries(repositoryBreakdown)
                    .sort((a, b) => b[1] - a[1]);
                
                sortedRepos.forEach(([repo, count]) => {
                    const repoName = repo || 'No Repository';
                    const repoValue = repo || '';
                    html += `<div class="repo-stat clickable-repo" data-repo="${escapeHtml(repoValue)}" title="Click to filter by ${escapeHtml(repoName)}">
                        <span class="repo-name">${escapeHtml(repoName)}:</span>
                        <span class="repo-count">${count}</span>
                    </div>`;
                });
                html += '</div></div>';
            }
            
            statsDiv.innerHTML = html;
            
            // Add click handlers for repository stats
            statsDiv.querySelectorAll('.clickable-repo').forEach(element => {
                element.addEventListener('click', () => {
                    const repoValue = element.getAttribute('data-repo');
                    filterByRepository(repoValue);
                });
            });
            
            // Maintain visual state for selected repository
            updateRepositoryHighlight(currentRepoFilter);
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
            // Sort applications alphabetically
            const sortedApplications = [...filters.applications].sort((a, b) => 
                a.toLowerCase().localeCompare(b.toLowerCase())
            );
            sortedApplications.forEach(app => {
                const option = document.createElement('option');
                option.value = app;
                option.textContent = app;
                appFilter.appendChild(option);
            });
        }
        
        if (modeFilter) {
            modeFilter.innerHTML = '<option value="">All Modes</option>';
            // Sort modes alphabetically
            const sortedModes = [...filters.modes].sort((a, b) => 
                a.toLowerCase().localeCompare(b.toLowerCase())
            );
            sortedModes.forEach(mode => {
                const option = document.createElement('option');
                option.value = mode;
                option.textContent = mode;
                modeFilter.appendChild(option);
            });
        }
        
        if (repoFilter) {
            repoFilter.innerHTML = '<option value="">All Repositories</option>';
            // Sort repositories alphabetically
            const sortedRepositories = [...filters.repositories].sort((a, b) => 
                a.toLowerCase().localeCompare(b.toLowerCase())
            );
            sortedRepositories.forEach(repo => {
                const option = document.createElement('option');
                option.value = repo;
                option.textContent = repo;
                repoFilter.appendChild(option);
            });
        }
    }

    function filterByRepository(repository) {
        console.log('[Filter] Filtering by repository:', repository);
        
        const repoFilter = document.getElementById('filterRepository');
        if (repoFilter) {
            // If clicking on the same repository that's already selected, clear the filter
            if (repoFilter.value === repository) {
                repoFilter.value = '';
                repository = '';
                console.log('[Filter] Clearing repository filter');
            } else {
                repoFilter.value = repository;
            }
            
            // Update the visual state in the stats
            updateRepositoryHighlight(repository);
            
            // Trigger search with the updated filter
            performSearch();
        }
    }

    function updateRepositoryHighlight(selectedRepository) {
        const statsDiv = document.getElementById('stats');
        if (statsDiv) {
            // Remove previous highlights
            statsDiv.querySelectorAll('.repo-stat').forEach(stat => {
                stat.classList.remove('selected-repo');
            });
            
            // Highlight the selected repository (if any)
            if (selectedRepository) {
                const selectedRepo = statsDiv.querySelector(`[data-repo="${selectedRepository}"]`);
                if (selectedRepo) {
                    selectedRepo.classList.add('selected-repo');
                }
            }
        }
    }

    // Make clearRepositoryFilter globally accessible
    window.clearRepositoryFilter = function() {
        const repoFilter = document.getElementById('filterRepository');
        if (repoFilter) {
            repoFilter.value = '';
            updateRepositoryHighlight('');
            performSearch();
        }
    };

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
    document.getElementById('filterRepository')?.addEventListener('change', (e) => {
        const selectedRepo = e.target.value;
        updateRepositoryHighlight(selectedRepo);
        performSearch();
    });

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
                updateStats(message.totalCommands, message.repositoryBreakdown);
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
