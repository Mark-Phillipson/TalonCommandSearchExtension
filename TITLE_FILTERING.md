# Title Filtering Feature

The Talon Command Search Extension now supports filtering by title, which is particularly useful for commands that only work when matched to specific window titles.

## How it works

In Talon files, you can specify a title in the header:

```talon
app: chrome
title: Google Chrome
-
new tab: key(ctrl-t)
close tab: key(ctrl-w)
```

The `title: Google Chrome` line means these commands will only be active when the window title matches "Google Chrome".

## Using the Title Filter

1. Open the Talon Command Search extension
2. Use the "Refresh Index" button to import your Talon files
3. In the filters section, you'll see a new "All Titles" dropdown
4. Select a specific title to see only commands that require that window title

## Examples

- **Microsoft Word**: Commands that only work in Microsoft Word documents
- **Google Chrome**: Browser-specific commands for Chrome
- **Notepad**: Simple text editor commands
- **Visual Studio Code**: IDE-specific commands

This helps you quickly find commands that are context-sensitive to specific applications or window titles.