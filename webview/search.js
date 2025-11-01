// Talon Command Search - Webview UI (communicates with SQLite backend via extension host)

(function () {
    const vscode = acquireVsCodeApi();
    let currentFilters = {
        applications: [],
        modes: [],
        repositories: [],
        operatingSystems: [],
        tags: []
    };
    let totalCommands = 0;
    let totalLists = 0;
    let listNames = [];
    let currentTab = 'commands';
    let searchTimeout = null;
    let isSearching = false;
    let lastSearchParams = null;
    let searchDebounceMs = 3000; // Default 3 seconds, will be updated from extension config
    let capturesData = []; // Will be populated with common Talon captures and lists
    let preferredApplications = [];
    let excludedOperatingSystems = [];

    // Initialize captures data with common Talon captures and lists
    function initializeCapturesData() {
        capturesData = [
            {
                category: "Navigation & Positioning",
                description: "Commands for moving cursor and navigating text",
                captures: [
                    {
                        name: "user.snap_targets",
                        type: "capture",
                        description: "Window snapping positions for window management",
                        examples: [
                            { spoken: "snap full", description: "Snap window to fill the entire screen" },
                            { spoken: "snap maximize", description: "Maximize window" },
                            { spoken: "snap minimize", description: "Minimize window" },
                            { spoken: "snap restore", description: "Restore window to previous size" },
                            { spoken: "snap left", description: "Snap window to left half of screen" },
                            { spoken: "snap right", description: "Snap window to right half of screen" },
                            { spoken: "snap top", description: "Snap window to top half of screen" },
                            { spoken: "snap bottom", description: "Snap window to bottom half of screen" },
                            { spoken: "snap top left", description: "Snap window to top-left quadrant" },
                            { spoken: "snap top right", description: "Snap window to top-right quadrant" },
                            { spoken: "snap bottom left", description: "Snap window to bottom-left quadrant" },
                            { spoken: "snap bottom right", description: "Snap window to bottom-right quadrant" },
                            { spoken: "snap center", description: "Center window on screen" },
                            { spoken: "snap half left", description: "Snap window to left half of screen" },
                            { spoken: "snap half right", description: "Snap window to right half of screen" },
                            { spoken: "snap quarter top left", description: "Snap window to top-left quarter" },
                            { spoken: "snap quarter top right", description: "Snap window to top-right quarter" },
                            { spoken: "snap quarter bottom left", description: "Snap window to bottom-left quarter" },
                            { spoken: "snap quarter bottom right", description: "Snap window to bottom-right quarter" },
                            { spoken: "snap third left", description: "Snap window to left third of screen" },
                            { spoken: "snap third right", description: "Snap window to right third of screen" }
                        ]
                    },
                    {
                        name: "user.arrow_keys",
                        type: "list",
                        description: "Arrow key directions for navigation",
                        examples: [
                            { spoken: "left", description: "Move cursor left (←)" },
                            { spoken: "right", description: "Move cursor right (→)" },
                            { spoken: "up", description: "Move cursor up (↑)" },
                            { spoken: "down", description: "Move cursor down (↓)" }
                        ]
                    },
                    {
                        name: "user.navigation_target",
                        type: "capture",
                        description: "Common navigation targets in text",
                        examples: [
                            { spoken: "word", description: "Navigate by word" },
                            { spoken: "line", description: "Navigate by line" },
                            { spoken: "page", description: "Navigate by page" },
                            { spoken: "paragraph", description: "Navigate by paragraph" },
                            { spoken: "sentence", description: "Navigate by sentence" },
                            { spoken: "character", description: "Navigate by character" }
                        ]
                    }
                ]
            },
            {
                category: "Text & Numbers",
                description: "Spoken forms for typing text and numbers",
                captures: [
                    {
                        name: "user.letter",
                        type: "list",
                        description: "Default Talon phonetic alphabet for letters (your configuration may differ)",
                        examples: [
                            { spoken: "air", description: "Type letter 'a'" },
                            { spoken: "bat", description: "Type letter 'b'" },
                            { spoken: "cap", description: "Type letter 'c'" },
                            { spoken: "drum", description: "Type letter 'd'" },
                            { spoken: "each", description: "Type letter 'e'" },
                            { spoken: "fine", description: "Type letter 'f'" },
                            { spoken: "gust", description: "Type letter 'g'" },
                            { spoken: "harp", description: "Type letter 'h'" },
                            { spoken: "sit", description: "Type letter 'i'" },
                            { spoken: "jury", description: "Type letter 'j'" },
                            { spoken: "crunch", description: "Type letter 'k'" },
                            { spoken: "look", description: "Type letter 'l'" },
                            { spoken: "made", description: "Type letter 'm'" },
                            { spoken: "near", description: "Type letter 'n'" },
                            { spoken: "odd", description: "Type letter 'o'" },
                            { spoken: "pit", description: "Type letter 'p'" },
                            { spoken: "quench", description: "Type letter 'q'" },
                            { spoken: "red", description: "Type letter 'r'" },
                            { spoken: "sun", description: "Type letter 's'" },
                            { spoken: "trap", description: "Type letter 't'" },
                            { spoken: "urge", description: "Type letter 'u'" },
                            { spoken: "vest", description: "Type letter 'v'" },
                            { spoken: "whale", description: "Type letter 'w'" },
                            { spoken: "plex", description: "Type letter 'x'" },
                            { spoken: "yank", description: "Type letter 'y'" },
                            { spoken: "zip", description: "Type letter 'z'" }
                        ]
                    },
                    {
                        name: "user.number_small",
                        type: "list",
                        description: "Small numbers (1-20) in spoken form",
                        examples: [
                            { spoken: "one", description: "Type number '1'" },
                            { spoken: "two", description: "Type number '2'" },
                            { spoken: "three", description: "Type number '3'" },
                            { spoken: "four", description: "Type number '4'" },
                            { spoken: "five", description: "Type number '5'" },
                            { spoken: "six", description: "Type number '6'" },
                            { spoken: "seven", description: "Type number '7'" },
                            { spoken: "eight", description: "Type number '8'" },
                            { spoken: "nine", description: "Type number '9'" },
                            { spoken: "ten", description: "Type number '10'" },
                            { spoken: "eleven", description: "Type number '11'" },
                            { spoken: "twelve", description: "Type number '12'" },
                            { spoken: "thirteen", description: "Type number '13'" },
                            { spoken: "fourteen", description: "Type number '14'" },
                            { spoken: "fifteen", description: "Type number '15'" },
                            { spoken: "sixteen", description: "Type number '16'" },
                            { spoken: "seventeen", description: "Type number '17'" },
                            { spoken: "eighteen", description: "Type number '18'" },
                            { spoken: "nineteen", description: "Type number '19'" },
                            { spoken: "twenty", description: "Type number '20'" }
                        ]
                    },
                    {
                        name: "user.symbol_key",
                        type: "list",
                        description: "Common symbols and special characters",
                        examples: [
                            { spoken: "dot", description: "Type period '.'" },
                            { spoken: "comma", description: "Type comma ','" },
                            { spoken: "colon", description: "Type colon ':'" },
                            { spoken: "semicolon", description: "Type semicolon ';'" },
                            { spoken: "question", description: "Type question mark '?'" },
                            { spoken: "exclamation", description: "Type exclamation mark '!'" },
                            { spoken: "quote", description: "Type single quote \"'\"" },
                            { spoken: "dub quote", description: "Type double quote '\"'" },
                            { spoken: "paren", description: "Type opening parenthesis '('" },
                            { spoken: "r paren", description: "Type closing parenthesis ')'" },
                            { spoken: "bracket", description: "Type opening bracket '['" },
                            { spoken: "r bracket", description: "Type closing bracket ']'" },
                            { spoken: "brace", description: "Type opening brace '{'" },
                            { spoken: "r brace", description: "Type closing brace '}'" }
                        ]
                    }
                ]
            },
            {
                category: "Editing Commands",
                description: "Common editing actions and text manipulation",
                captures: [
                    {
                        name: "user.text_action",
                        type: "capture",
                        description: "Actions to perform on text selections",
                        examples: [
                            { spoken: "copy", description: "Copy selected text" },
                            { spoken: "cut", description: "Cut selected text" },
                            { spoken: "paste", description: "Paste from clipboard" },
                            { spoken: "delete", description: "Delete selected text" },
                            { spoken: "select", description: "Select text" },
                            { spoken: "clear", description: "Clear/delete text" },
                            { spoken: "duplicate", description: "Duplicate text/line" },
                            { spoken: "undo", description: "Undo last action" },
                            { spoken: "redo", description: "Redo last action" }
                        ]
                    },
                    {
                        name: "user.formatters",
                        type: "capture",
                        description: "Text formatting and case conversion",
                        examples: [
                            { spoken: "snake", description: "Convert to snake_case" },
                            { spoken: "camel", description: "Convert to camelCase" },
                            { spoken: "pascal", description: "Convert to PascalCase" },
                            { spoken: "kebab", description: "Convert to kebab-case" },
                            { spoken: "upper", description: "Convert to UPPERCASE" },
                            { spoken: "lower", description: "Convert to lowercase" },
                            { spoken: "title", description: "Convert to Title Case" },
                            { spoken: "sentence", description: "Convert to Sentence case" }
                        ]
                    }
                ]
            },
            {
                category: "Application Control",
                description: "Commands for controlling applications and system",
                captures: [
                    {
                        name: "user.running_applications",
                        type: "list",
                        description: "Switch between running applications",
                        examples: [
                            { spoken: "code", description: "Switch to VS Code" },
                            { spoken: "chrome", description: "Switch to Chrome browser" },
                            { spoken: "firefox", description: "Switch to Firefox browser" },
                            { spoken: "edge", description: "Switch to Edge browser" },
                            { spoken: "terminal", description: "Switch to terminal" },
                            { spoken: "explorer", description: "Switch to file explorer" },
                            { spoken: "notepad", description: "Switch to Notepad" },
                            { spoken: "discord", description: "Switch to Discord" }
                        ]
                    },
                    {
                        name: "user.system_keys",
                        type: "list",
                        description: "System function keys and special keys",
                        examples: [
                            { spoken: "escape", description: "Press Escape key" },
                            { spoken: "enter", description: "Press Enter key" },
                            { spoken: "tab", description: "Press Tab key" },
                            { spoken: "space", description: "Press Space key" },
                            { spoken: "backspace", description: "Press Backspace key" },
                            { spoken: "delete", description: "Press Delete key" },
                            { spoken: "home", description: "Press Home key" },
                            { spoken: "end", description: "Press End key" },
                            { spoken: "page up", description: "Press Page Up key" },
                            { spoken: "page down", description: "Press Page Down key" }
                        ]
                    }
                ]
            },
            {
                category: "Programming",
                description: "Common programming constructs and syntax",
                captures: [
                    {
                        name: "user.code_operators",
                        type: "capture",
                        description: "Programming operators and symbols",
                        examples: [
                            { spoken: "equals", description: "Assignment operator '='" },
                            { spoken: "plus equals", description: "Add assignment '+=' " },
                            { spoken: "minus equals", description: "Subtract assignment '-='" },
                            { spoken: "and", description: "Logical AND '&&'" },
                            { spoken: "or", description: "Logical OR '||'" },
                            { spoken: "not", description: "Logical NOT '!'" },
                            { spoken: "greater", description: "Greater than '>'" },
                            { spoken: "less", description: "Less than '<'" },
                            { spoken: "greater equal", description: "Greater than or equal '>='" },
                            { spoken: "less equal", description: "Less than or equal '<='" }
                        ]
                    },
                    {
                        name: "user.code_keywords",
                        type: "capture",
                        description: "Common programming keywords",
                        examples: [
                            { spoken: "if", description: "If statement" },
                            { spoken: "else", description: "Else clause" },
                            { spoken: "for", description: "For loop" },
                            { spoken: "while", description: "While loop" },
                            { spoken: "function", description: "Function declaration" },
                            { spoken: "return", description: "Return statement" },
                            { spoken: "class", description: "Class declaration" },
                            { spoken: "import", description: "Import statement" },
                            { spoken: "export", description: "Export statement" },
                            { spoken: "try", description: "Try block" },
                            { spoken: "catch", description: "Catch block" }
                        ]
                    }
                ]
            }
        ];
    }

    // Request search from extension host (SQLite backend)
    function performSearch() {
        // Clear any pending search
        if (searchTimeout) {
            clearTimeout(searchTimeout);
            searchTimeout = null;
        }

        // Show visual feedback that search is pending
        showSearchPending();

        // Debounce search requests
        searchTimeout = setTimeout(() => {
            performSearchImmediate();
        }, searchDebounceMs);
    }

    function performSearchImmediate() {
        // Prevent multiple concurrent searches
        if (isSearching) {
            console.log('[Search] Search already in progress, skipping');
            return;
        }

        const searchTerm = document.getElementById('searchInput')?.value.trim() || '';
        const scopeElement = document.getElementById('searchScope');
        const searchScope = scopeElement ? parseInt(scopeElement.value) : 2;
        const application = document.getElementById('filterApplication')?.value || undefined;
        const mode = document.getElementById('filterMode')?.value || undefined;
        const repository = document.getElementById('filterRepository')?.value || undefined;
        const tags = document.getElementById('filterTags')?.value || undefined;
        const title = document.getElementById('filterTitle')?.value || undefined;
        const operatingSystem = document.getElementById('filterOperatingSystem')?.value || undefined;

        // Create search parameters object
        const searchParams = {
            searchTerm: searchTerm,
            searchScope: searchScope,
            application: application === '' ? undefined : application,
            mode: mode === '' ? undefined : mode,
            repository: repository === '' ? undefined : repository,
            tags: tags === '' ? undefined : tags,
            title: title === '' ? undefined : title,
            operatingSystem: operatingSystem === '' ? undefined : operatingSystem,
            maxResults: 500,
            preferredApplications: preferredApplications.length > 0 ? preferredApplications : undefined,
            excludedOperatingSystems: excludedOperatingSystems.length > 0 ? excludedOperatingSystems : undefined
        };

        // Check if this is the same search as the last one
        if (lastSearchParams && JSON.stringify(searchParams) === JSON.stringify(lastSearchParams)) {
            console.log('[Search] Same search parameters as last search, skipping');
            return;
        }

        lastSearchParams = { ...searchParams };
        isSearching = true;

        // Show spinner with contextual message
        let spinnerMessage = 'Searching commands...';
        if (searchTerm) {
            spinnerMessage = `Searching for "${searchTerm}"...`;
        } else if (application || mode || repository) {
            spinnerMessage = 'Applying filters...';
        }
        showSearchSpinner(spinnerMessage);

        console.log('[Search] Performing search:', { searchTerm, searchScope, scopeValue: scopeElement?.value, application, mode, repository, title });

        vscode.postMessage({
            command: 'search',
            ...searchParams
        });
    }

    // Request list search from extension host
    function performListSearch() {
        const searchTerm = document.getElementById('listSearchInput')?.value.trim() || '';

        // Show spinner with contextual message
        let spinnerMessage = 'Searching lists...';
        if (searchTerm) {
            spinnerMessage = `Searching lists for "${searchTerm}"...`;
        }
        showListSearchSpinner(spinnerMessage);

        console.log('[ListSearch] Performing list search:', { searchTerm });

        vscode.postMessage({
            command: 'searchLists',
            searchTerm: searchTerm,
            maxResults: 500
        });
    }

    // Display list results in UI
    function displayListResults(results) {
        // Hide spinner
        hideListSearchSpinner();

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

    // Perform capture search
    function performCaptureSearch() {
        const searchTerm = document.getElementById('captureSearchInput')?.value.trim().toLowerCase() || '';
        console.log('[CaptureSearch] Performing capture search:', { searchTerm });

        displayCaptureResults(searchTerm);
    }

    // Display capture results
    function displayCaptureResults(searchTerm = '') {
        const resultsDiv = document.getElementById('captureResults');
        if (!resultsDiv) return;

        resultsDiv.innerHTML = '';

        if (capturesData.length === 0) {
            resultsDiv.innerHTML = '<p class="no-results">Captures & Lists data not loaded.</p>';
            return;
        }

        let totalMatches = 0;

        capturesData.forEach(category => {
            const categoryMatches = [];

            category.captures.forEach(capture => {
                if (!searchTerm) {
                    // No search term - show all
                    categoryMatches.push(capture);
                } else {
                    // Check if capture name, description, or any example matches search term
                    const nameMatch = capture.name.toLowerCase().includes(searchTerm);
                    const descMatch = capture.description.toLowerCase().includes(searchTerm);
                    const exampleMatch = capture.examples.some(ex =>
                        ex.spoken.toLowerCase().includes(searchTerm) ||
                        ex.description.toLowerCase().includes(searchTerm)
                    );

                    if (nameMatch || descMatch || exampleMatch) {
                        categoryMatches.push(capture);
                    }
                }
            });

            if (categoryMatches.length > 0) {
                totalMatches += categoryMatches.reduce((count, capture) => count + capture.examples.length, 0);

                // Create category header
                const categoryHeader = document.createElement('div');
                categoryHeader.className = 'capture-category-header';
                categoryHeader.innerHTML = `
                    <h2 class="capture-category-title">${escapeHtml(category.category)}</h2>
                    <p class="capture-category-description">${escapeHtml(category.description)}</p>
                `;
                resultsDiv.appendChild(categoryHeader);

                // Create captures in this category
                categoryMatches.forEach(capture => {
                    const captureGroup = document.createElement('div');
                    captureGroup.className = `capture-group capture-type-${capture.type}`;

                    const groupHeader = document.createElement('div');
                    groupHeader.className = 'capture-group-header';
                    groupHeader.innerHTML = `
                        <span class="capture-name">${highlightSearchTerm(capture.name, searchTerm)}</span>
                        <span class="capture-type-badge capture-type-${capture.type}">${capture.type}</span>
                        <span class="capture-toggle">▼</span>
                    `;

                    const description = document.createElement('div');
                    description.className = 'capture-description';
                    description.innerHTML = highlightSearchTerm(capture.description, searchTerm);

                    const content = document.createElement('div');
                    content.className = 'capture-content';

                    const examplesDiv = document.createElement('div');
                    examplesDiv.className = 'capture-examples';

                    capture.examples.forEach(example => {
                        const exampleDiv = document.createElement('div');
                        exampleDiv.className = 'capture-example';
                        exampleDiv.innerHTML = `
                            <div class="example-spoken">${highlightSearchTerm(example.spoken, searchTerm)}</div>
                            <div class="example-description">${highlightSearchTerm(example.description, searchTerm)}</div>
                        `;
                        examplesDiv.appendChild(exampleDiv);
                    });

                    content.appendChild(examplesDiv);
                    captureGroup.appendChild(groupHeader);
                    captureGroup.appendChild(description);
                    captureGroup.appendChild(content);

                    // Add click handler for collapsible groups
                    groupHeader.addEventListener('click', () => {
                        captureGroup.classList.toggle('collapsed');
                    });

                    resultsDiv.appendChild(captureGroup);
                });
            }
        });

        // Add results header if we found matches
        if (totalMatches > 0) {
            const header = document.createElement('div');
            header.className = 'results-header';
            if (searchTerm) {
                header.textContent = `Found ${totalMatches} spoken form${totalMatches !== 1 ? 's' : ''} matching "${searchTerm}"`;
            } else {
                header.textContent = `${totalMatches} available spoken forms in ${capturesData.length} categories`;
            }
            resultsDiv.insertBefore(header, resultsDiv.firstChild);
        } else if (searchTerm) {
            resultsDiv.innerHTML = `<p class="no-results">No captures or lists found matching "${escapeHtml(searchTerm)}". Try a different search term.</p>`;
        }
    }

    // Highlight search terms in text
    function highlightSearchTerm(text, searchTerm) {
        if (!searchTerm) return escapeHtml(text);

        const escapedText = escapeHtml(text);
        const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
        return escapedText.replace(regex, '<span class="search-highlight">$1</span>');
    }

    // Escape special regex characters
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Spinner control functions
    function showSearchPending() {
        const spinner = document.getElementById('searchSpinner');
        const results = document.getElementById('results');
        const spinnerText = spinner?.querySelector('.spinner-text');

        if (spinner) {
            spinner.classList.add('visible', 'pending');
        }
        if (results) results.style.display = 'none';
        if (spinnerText) {
            const delaySeconds = (searchDebounceMs / 1000).toFixed(1);
            spinnerText.textContent = `Search will start in ${delaySeconds}s (typing to reset delay)...`;
        }
    }

    function showSearchSpinner(message = 'Searching commands...') {
        const spinner = document.getElementById('searchSpinner');
        const results = document.getElementById('results');
        const spinnerText = spinner?.querySelector('.spinner-text');

        if (spinner) {
            spinner.classList.add('visible');
            spinner.classList.remove('pending'); // Remove pending state when actually searching
        }
        if (results) results.style.display = 'none';
        if (spinnerText) spinnerText.textContent = message;
    }

    function hideSearchSpinner() {
        const spinner = document.getElementById('searchSpinner');
        const results = document.getElementById('results');
        if (spinner) spinner.classList.remove('visible', 'pending');
        if (results) results.style.display = 'grid';
    }

    function showListSearchSpinner(message = 'Searching lists...') {
        const spinner = document.getElementById('listSearchSpinner');
        const results = document.getElementById('listResults');
        const spinnerText = spinner?.querySelector('.spinner-text');

        if (spinner) spinner.classList.add('visible');
        if (results) results.style.display = 'none';
        if (spinnerText) spinnerText.textContent = message;
    }

    function hideListSearchSpinner() {
        const spinner = document.getElementById('listSearchSpinner');
        const results = document.getElementById('listResults');
        if (spinner) spinner.classList.remove('visible');
        if (results) results.style.display = 'block';
    }

    // Display results in UI
    function displayResults(results) {
        // Mark search as complete and hide spinner
        isSearching = false;
        hideSearchSpinner();

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

        // Set focus on the search input for the new active tab
        setFocusOnActiveTab();

        // Trigger appropriate search based on current tab
        if (tabName === 'commands') {
            if (totalCommands > 0) {
                performSearch();
            }
        } else if (tabName === 'lists') {
            if (totalLists > 0) {
                performListSearch();
            }
        } else if (tabName === 'captures') {
            performCaptureSearch();
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
        const titleFilter = document.getElementById('filterTitle');

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

        if (titleFilter) {
            titleFilter.innerHTML = '<option value="">All Titles</option>';
            // Sort titles alphabetically
            const sortedTitles = [...filters.titles].sort((a, b) =>
                a.toLowerCase().localeCompare(b.toLowerCase())
            );
            sortedTitles.forEach(title => {
                const option = document.createElement('option');
                option.value = title;
                option.textContent = title;
                titleFilter.appendChild(option);
            });
        }

        const tagsFilter = document.getElementById('filterTags');
        if (tagsFilter) {
            tagsFilter.innerHTML = '<option value="">All Tags</option>';
            // Sort tags alphabetically
            const sortedTags = [...filters.tags].sort((a, b) =>
                a.toLowerCase().localeCompare(b.toLowerCase())
            );
            sortedTags.forEach(tag => {
                const option = document.createElement('option');
                option.value = tag;
                option.textContent = tag;
                tagsFilter.appendChild(option);
            });
        }

        const osFilter = document.getElementById('filterOperatingSystem');
        if (osFilter) {
            osFilter.innerHTML = '<option value="">All Operating Systems</option>';
            // Sort operating systems alphabetically
            const sortedOS = [...filters.operatingSystems].sort((a, b) =>
                a.toLowerCase().localeCompare(b.toLowerCase())
            );
            sortedOS.forEach(os => {
                const option = document.createElement('option');
                option.value = os;
                option.textContent = os;
                osFilter.appendChild(option);
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
    window.clearRepositoryFilter = function () {
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

        // Initialize captures and lists data
            initializeCapturesData(); // Initialize captures data with common Talon captures and lists
        console.log('[Init] Captures & Lists data initialized with', capturesData.length, 'categories');

        // Add new search scope option for Spoken Forms
        const scopeSelect = document.getElementById('searchScope');
        if (scopeSelect) {
            scopeSelect.innerHTML = '';
            scopeSelect.appendChild(new Option('Spoken Forms (Commands + Lists)', '3'));
            scopeSelect.appendChild(new Option('All (Commands + Scripts + Lists)', '2'));
            scopeSelect.appendChild(new Option('Command Names Only', '0'));
            scopeSelect.appendChild(new Option('Scripts Only', '1'));
            scopeSelect.value = '3'; // Set Spoken Forms as default
        }

        // Setup event listeners
        setupEventListeners();

        // Set focus on the search input for the current active tab
        setFocusOnActiveTab();

        // Request configuration and initial stats
        vscode.postMessage({ command: 'getConfig' });
        vscode.postMessage({ command: 'getStats' });

        // Perform initial search based on current tab
        setTimeout(() => {
            if (currentTab === 'commands' && totalCommands > 0) {
                performSearch();
            } else if (currentTab === 'captures') {
                performCaptureSearch();
            }
        }, 500);
    }

    // Set focus on the search input for the currently active tab
    function setFocusOnActiveTab() {
        setTimeout(() => {
            if (currentTab === 'commands') {
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.focus();
                    console.log('[Init] Focus set on commands search input');
                }
            } else if (currentTab === 'lists') {
                const listSearchInput = document.getElementById('listSearchInput');
                if (listSearchInput) {
                    listSearchInput.focus();
                    console.log('[Init] Focus set on lists search input');
                }
            } else if (currentTab === 'captures') {
                const captureSearchInput = document.getElementById('captureSearchInput');
                if (captureSearchInput) {
                    captureSearchInput.focus();
                    console.log('[Init] Focus set on captures search input');
                }
            }
        }, 100); // Small delay to ensure DOM is fully rendered
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
        const filterTitle = document.getElementById('filterTitle');

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

        if (filterTitle) {
            filterTitle.addEventListener('change', performSearch);
            console.log('[Init] Title filter listener attached');
        }

        const filterTags = document.getElementById('filterTags');
        if (filterTags) {
            filterTags.addEventListener('change', performSearch);
            console.log('[Init] Tags filter listener attached');
        }

        const filterOperatingSystem = document.getElementById('filterOperatingSystem');
        if (filterOperatingSystem) {
            filterOperatingSystem.addEventListener('change', performSearch);
            console.log('[Init] Operating System filter listener attached');
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

        // Capture search input handler
        const captureSearchInput = document.getElementById('captureSearchInput');
        if (captureSearchInput) {
            captureSearchInput.addEventListener('input', performCaptureSearch);
            console.log('[Init] Capture search input listener attached');
        }

        // Clear capture search button handler
        const clearCaptureSearchBtn = document.getElementById('clearCaptureSearch');
        if (clearCaptureSearchBtn) {
            clearCaptureSearchBtn.addEventListener('click', () => {
                const captureSearchInput = document.getElementById('captureSearchInput');
                if (captureSearchInput) {
                    captureSearchInput.value = '';
                    performCaptureSearch();
                }
            });
            console.log('[Init] Clear capture search button listener attached');
        }
    }

    // Handle messages from extension
    window.addEventListener('message', (event) => {
        const message = event.data;
        console.log('[Webview] Received message:', message.command);

        switch (message.command) {
            case 'searchResults':
                console.log('[Webview] Displaying', message.results.length, 'results');
                if (Array.isArray(message.results)) {
                    displayResults(message.results);
                } else {
                    console.error('[Webview] Invalid search results format:', message.results);
                    isSearching = false;
                }
                break;

            case 'stats':
                console.log('[Webview] Stats:', message.totalCommands, 'commands,', message.totalLists, 'list items');
                updateStats(message.totalCommands, message.repositoryBreakdown, message.totalLists, message.listNames);
                updateFilters(message.filters);
                if (currentTab === 'commands' && message.totalCommands > 0) {
                    performSearch();
                } else if (currentTab === 'lists' && message.totalLists > 0) {
                    performListSearch();
                } else if (currentTab === 'captures') {
                    performCaptureSearch();
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

            case 'config':
                console.log('[Webview] Received config:', message.config);
                if (message.config.searchDebounceMs !== undefined) {
                    searchDebounceMs = message.config.searchDebounceMs;
                    console.log('[Webview] Search debounce set to:', searchDebounceMs, 'ms');
                }
                preferredApplications = Array.isArray(message.config.defaultApplications) ? message.config.defaultApplications.filter(Boolean) : [];
                excludedOperatingSystems = Array.isArray(message.config.excludedOperatingSystems) ? message.config.excludedOperatingSystems.filter(Boolean) : [];
                lastSearchParams = null; // force refresh with new defaults
                performSearch();
                break;

            case 'error':
                console.error('[Webview] Error from extension:', message.message);
                // Hide spinners and mark search as complete
                isSearching = false;
                hideSearchSpinner();
                hideListSearchSpinner();

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
