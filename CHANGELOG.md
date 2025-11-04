## [0.0.5] - 2025-11-04
### Changed
- Removed the `defaultApplications` setting from configuration and code.
- The initial search results now show a random selection of commands, making it easier to discover and remember commands.
### Fixed
- No longer filters by a default application on startup; random commands are shown instead.
# Changelog

All notable changes to the Search Talon Commands extension will be documented in this file in reverse chronological order.


## [0.0.4] - 2025-11-03
### Changed
- UI improvement: The repository breakdown ("Commands by Repository") is now displayed above the search box in the Commands tab, making it clear that the figures are totals and not filtered results.
### Added
- Application header normalization: `terminal` and `windows_terminal` are now treated as `windows_terminal` for filtering and search consistency.
- Explicit header requirement: To index commands under `powershell` or `terminal`, Talon files must include `app: powershell` or `app: terminal` headers.

## [0.0.3] - 2025-11-01
### Changed
- The default search scope is now "Spoken Forms (Commands + Lists)", making it easier to find both command names and list values immediately when the search panel opens.
- Backend and UI updated to support the new search scope, including enum and initialization logic.

## [0.0.2] - 2024-10-30
### Added
- Dedicated lists tab with grouped Talon list search results and click-to-filter navigation
- Intelligent list-value matching that maps placeholders like `<user.arrow_key>` to their actual list values
- Advanced filtering controls including repository-aware breakdowns, tag filters, and operating system filters
- Configurable search debounce with visual countdown indicators for balanced responsiveness
- Focus management improvements that keep search inputs ready for voice-first workflows

### Changed
- Migrated data storage to optimized JSON with in-memory search for 27k+ commands
- Refined the webview UI with a responsive CSS Grid layout and clearer repository statistics

### Fixed
- Eliminated unstable search refresh behaviour that occasionally dropped results during rapid input
- Removed development-only logging to keep console output concise during troubleshooting

## [0.0.1] - 2024-10-29
### Added
- Initial public release with Talon command indexing, lightning-fast search, and repository breakdown stats
- Commands to refresh the index, import from custom folders, and set the Talon user directory
- Click-to-open integration for `.talon` and `.talon-list` files from search results
