# Changelog

All notable changes to the Search Talon Commands extension will be documented in this file in reverse chronological order.

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
