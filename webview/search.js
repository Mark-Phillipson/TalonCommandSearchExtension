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
    let totalLists = 0;
    let listNames = [];
    let currentTab = 'commands';

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

    // Request list search from extension host
    function performListSearch() {
        const searchTerm = document.getElementById('listSearchInput')?.value.trim() || '';
        
        console.log('[ListSearch] Performing list search:', { searchTerm });
        
        vscode.postMessage({
            command: 'searchLists',
            searchTerm: searchTerm,
            maxResults: 500
        });
    }

    // Display list results in UI
    function displayListResults(results) {
        const resultsDiv = document.getElementById('listResults');
        if (!resultsDiv) return;
        
        resultsDiv.innerHTML = '';
        
        if (results.length === 0) {
            resultsDiv.innerHTML = '<p class="no-results">No list items found. Try importing your Talon files first (Talon: Refresh Index)</p>';
            return;
        }
        
        // Add result count header
        const header = document.createElement('div');
        header.className = 'results-header';
        header.textContent = `Found ${results.length} list item${results.length !== 1 ? 's' : ''}`;
        resultsDiv.appendChild(header);
        
        // Group results by list name
        const groupedResults = {};
        results.forEach(item => {
            if (!groupedResults[item.listName]) {
                groupedResults[item.listName] = [];
            }
            groupedResults[item.listName].push(item);
        });
        
        // Display grouped results
        Object.keys(groupedResults).sort().forEach(listName => {
            const items = groupedResults[listName];
            
            // Create list group header
            const groupHeader = document.createElement('div');
            groupHeader.className = 'list-group-header';
            groupHeader.innerHTML = `
                <h3>${escapeHtml(listName)}</h3>
                <span class="list-count">${items.length} item${items.length !== 1 ? 's' : ''}</span>
            `;
            resultsDiv.appendChild(groupHeader);
            
            // Create compact list container instead of table
            const listContainer = document.createElement('div');
            listContainer.className = 'list-items-container';
            
            items.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'list-item-compact';
                
                // Create compact single line format: "spoken_form → list_value (source)"
                const spokenSpan = document.createElement('span');
                spokenSpan.className = 'spoken-form-compact';
                spokenSpan.textContent = item.spokenForm;
                
                const arrowSpan = document.createElement('span');
                arrowSpan.className = 'arrow';
                arrowSpan.textContent = ' → ';
                
                const valueSpan = document.createElement('span');
                valueSpan.className = 'list-value-compact';
                valueSpan.textContent = item.listValue;
                
                const sourceSpan = document.createElement('span');
                sourceSpan.className = 'source-compact';
                if (item.sourceFile) {
                    const fileName = item.sourceFile.split(/[\\/]/).pop() || item.sourceFile;
                    sourceSpan.textContent = ` (${fileName})`;
                    sourceSpan.title = item.sourceFile;
                    sourceSpan.classList.add('clickable');
                    sourceSpan.addEventListener('click', (e) => {
                        e.stopPropagation();
                        vscode.postMessage({ command: 'openFile', filePath: item.sourceFile });
                    });
                } else {
                    sourceSpan.textContent = '';
                }
                
                itemDiv.appendChild(spokenSpan);
                itemDiv.appendChild(arrowSpan);
                itemDiv.appendChild(valueSpan);
                itemDiv.appendChild(sourceSpan);
                
                listContainer.appendChild(itemDiv);
            });
            
            resultsDiv.appendChild(listContainer);
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

    // Tab switching functionality
    function switchTab(tabName) {
        currentTab = tabName;
        
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-tab') === tabName) {
                btn.classList.add('active');
            }
        });
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const targetTab = document.getElementById(tabName + 'Tab');
        if (targetTab) {
            targetTab.classList.add('active');
        }
        
        // Trigger appropriate search based on current tab
        if (tabName === 'commands') {
            performSearch();
        } else if (tabName === 'lists') {
            performListSearch();
        }
    }

    function updateStats(total, repositoryBreakdown, listCount, listNamesList) {
        totalCommands = total;
        totalLists = listCount || 0;
        listNames = listNamesList || [];
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
        
        // Update list stats
        const listStatsDiv = document.getElementById('listStats');
        if (listStatsDiv) {
            let listHtml = `<div class="stats-total">Total list items: ${totalLists}</div>`;
            
            if (listNames.length > 0) {
                listHtml += '<div class="stats-breakdown">';
                listHtml += `<h4 class="collapsible-header" data-toggle="listNames">
                    <span class="toggle-icon">▼</span>
                    Available Lists (${listNames.length}):
                </h4>`;
                listHtml += '<div class="list-names-container collapsed" data-container="listNames">';
                
                listNames.forEach(listName => {
                    listHtml += `<span class="list-name-tag clickable-list-filter" data-list="${escapeHtml(listName)}" title="Click to filter by ${escapeHtml(listName)}">${escapeHtml(listName)}</span>`;
                });
                
                listHtml += '</div></div>';
            }
            
            listStatsDiv.innerHTML = listHtml;
            
            // Add click handlers for list name filters
            listStatsDiv.querySelectorAll('.clickable-list-filter').forEach(element => {
                element.addEventListener('click', () => {
                    const listName = element.getAttribute('data-list');
                    filterByListName(listName);
                });
            });
            
            // Add click handler for toggle header
            const toggleHeader = listStatsDiv.querySelector('.collapsible-header');
            if (toggleHeader) {
                toggleHeader.addEventListener('click', () => {
                    const container = listStatsDiv.querySelector('[data-container="listNames"]');
                    const toggle = toggleHeader.querySelector('.toggle-icon');
                    
                    if (container && toggle) {
                        if (container.classList.contains('collapsed')) {
                            container.classList.remove('collapsed');
                            toggle.textContent = '▲';
                        } else {
                            container.classList.add('collapsed');
                            toggle.textContent = '▼';
                        }
                    }
                });
            }
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



    // Filter by list name
    function filterByListName(listName) {
        console.log('[Filter] Filtering by list name:', listName);
        
        const searchInput = document.getElementById('listSearchInput');
        if (searchInput) {
            // If clicking on the same list that's already being searched, clear the filter
            if (searchInput.value === listName) {
                searchInput.value = '';
                console.log('[Filter] Clearing list name filter');
            } else {
                searchInput.value = listName;
            }
            
            // Trigger search with the updated filter
            performListSearch();
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
        
        // Setup event listeners
        setupEventListeners();
        
        // Request initial stats
        vscode.postMessage({ command: 'getStats' });
        
        // Perform initial search if we have commands
        setTimeout(() => {
            if (totalCommands > 0) {
                performSearch();
            }
        }, 500);
    }

    // Setup event listeners (moved to a function to be called after DOM is ready)
    function setupEventListeners() {
        console.log('[Init] Setting up event listeners...');
        
        // Search and filter event listeners
        const searchInput = document.getElementById('searchInput');
        const searchScope = document.getElementById('searchScope');
        const filterApplication = document.getElementById('filterApplication');
        const filterMode = document.getElementById('filterMode');
        const filterRepository = document.getElementById('filterRepository');
        
        if (searchInput) {
            searchInput.addEventListener('input', performSearch);
            console.log('[Init] Search input listener attached');
        }
        
        if (searchScope) {
            searchScope.addEventListener('change', performSearch);
            console.log('[Init] Search scope listener attached');
        }
        
        if (filterApplication) {
            filterApplication.addEventListener('change', performSearch);
            console.log('[Init] Application filter listener attached');
        }
        
        if (filterMode) {
            filterMode.addEventListener('change', performSearch);
            console.log('[Init] Mode filter listener attached');
        }
        
        if (filterRepository) {
            filterRepository.addEventListener('change', (e) => {
                const selectedRepo = e.target.value;
                updateRepositoryHighlight(selectedRepo);
                performSearch();
            });
            console.log('[Init] Repository filter listener attached');
        }

        // Toolbar button handlers
        const checkDbBtn = document.getElementById('checkDbBtn');
        const clearDbBtn = document.getElementById('clearDbBtn');
        const refreshBtn = document.getElementById('refreshBtn');
        
        if (checkDbBtn) {
            checkDbBtn.addEventListener('click', () => {
                console.log('[CheckDB] Button clicked, totalCommands:', totalCommands);
                
                // Send message to extension to show info via VS Code notification
                vscode.postMessage({ 
                    command: 'showInfo', 
                    message: `Database contains ${totalCommands} commands.\n\nDatabase: JSON file storage\nLocation: Extension global storage`
                });
            });
            console.log('[Init] Check DB button handler attached');
        } else {
            console.error('[Init] Check DB button not found!');
        }

        if (clearDbBtn) {
            clearDbBtn.addEventListener('click', () => {
                console.log('[ClearDB] Button clicked, totalCommands:', totalCommands);
                if (totalCommands === 0) {
                    vscode.postMessage({ 
                        command: 'showInfo', 
                        message: 'Database is already empty.'
                    });
                    return;
                }
                
                // Send message to extension to show confirmation dialog via VS Code
                vscode.postMessage({ 
                    command: 'confirmClearDatabase', 
                    commandCount: totalCommands 
                });
            });
            console.log('[Init] Clear DB button handler attached');
        } else {
            console.error('[Init] Clear DB button not found!');
        }

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                console.log('[RefreshBtn] Button clicked');
                vscode.postMessage({ command: 'triggerRefresh' });
            });
            console.log('[Init] Refresh button handler attached');
        } else {
            console.error('[Init] Refresh button not found!');
        }
        
        // Tab button handlers
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.getAttribute('data-tab');
                if (tabName) {
                    switchTab(tabName);
                }
            });
        });
        
        // List search input handler
        const listSearchInput = document.getElementById('listSearchInput');
        if (listSearchInput) {
            listSearchInput.addEventListener('input', performListSearch);
            console.log('[Init] List search input listener attached');
        }
        
        // Clear list search button handler
        const clearListSearchBtn = document.getElementById('clearListSearch');
        if (clearListSearchBtn) {
            clearListSearchBtn.addEventListener('click', () => {
                const listSearchInput = document.getElementById('listSearchInput');
                if (listSearchInput) {
                    listSearchInput.value = '';
                    performListSearch();
                }
            });
            console.log('[Init] Clear list search button listener attached');
        }
    }

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
                console.log('[Webview] Stats:', message.totalCommands, 'commands,', message.totalLists, 'list items');
                updateStats(message.totalCommands, message.repositoryBreakdown, message.totalLists, message.listNames);
                updateFilters(message.filters);
                if (currentTab === 'commands' && message.totalCommands > 0) {
                    performSearch();
                } else if (currentTab === 'lists' && message.totalLists > 0) {
                    performListSearch();
                }
                break;
                
            case 'listSearchResults':
                console.log('[Webview] Displaying', message.results.length, 'list results');
                displayListResults(message.results);
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

    // Initialize on load - ensure DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
        console.log('[Init] Waiting for DOMContentLoaded...');
    } else {
        console.log('[Init] DOM already ready, initializing immediately');
        init();
    }
})();
