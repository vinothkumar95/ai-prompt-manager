# ai-prompt-manager

A VS Code extension to manage and insert AI prompt templates, grouped by category, with support for template variables like `{code}`.

## Features

- Activity bar icon to open the Prompt Templates view
- View, add, edit, and delete prompt templates grouped by category
- Insert prompt templates into the editor, replacing `{code}` with the selected text
- Context menu actions for editing and deleting prompts
- Quick add from the view title bar

## Usage

1. Click the Prompt Templates icon in the activity bar to open the view.
2. Use the "+" button to add a new prompt template (category and template text).
3. Right-click a prompt to edit or delete it.
4. Click a prompt to insert it into the active editor. If you have text selected, `{code}` in the template will be replaced with your selection.
5. Prompts are grouped by category for easy organization.

## Activity Bar Icon

The extension adds a dedicated icon to the activity bar for quick access to your prompt templates.

## Requirements

No special requirements.

## Extension Settings

None yet.

## Known Issues

- Prompts are stored locally and not synced.
- No import/export functionality yet.

## Release Notes

### 0.0.3
- **Enhanced Data Management**: Prompts now use unique IDs, making editing and deletion more robust.
- **Improved Error Handling**: Better error reporting for file operations (reading/writing prompt data).
- **Input Validation**: Added validation to ensure category and prompt text are not empty when adding or editing prompts.
- **Bug Fix**: Corrected `engines.vscode` version in `package.json` to ensure proper extension loading and compatibility.
- **Code Quality**: Refactored codebase for better readability and maintainability (e.g., centralized file I/O).
- **Testing**: Added a comprehensive test suite for core functionalities.

### 0.0.2
- Add/edit/delete prompt templates
- Group prompts by category
- Activity bar icon and dedicated view
- Context menu actions
- Template variable replacement for `{code}`

### 0.0.1
- Initial release: basic prompt insertion

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
