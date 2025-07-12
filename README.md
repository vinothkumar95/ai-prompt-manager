# AI Prompt Manager

A powerful VS Code extension for managing and organizing AI prompts with intelligent code template support. Save, categorize, and quickly insert your favorite AI prompts with automatic code replacement.

![AI Prompt Manager](https://raw.githubusercontent.com/vinothkumar95/ai-prompt-manager/main/resources/prompt-templates.png)

## Features

### 🎯 **Smart Prompt Management**
- **Organize by Categories**: Group your prompts into custom categories for easy access
- **Quick Insert**: Click any prompt to insert it directly into your active editor
- **Code Template Support**: Use `{code}` placeholder to automatically replace with selected text
- **Inline Editing**: Double-click prompts to edit them directly in the interface

### 🚀 **Productivity Boosters**
- **Activity Bar Integration**: Dedicated icon in VS Code's activity bar for instant access
- **Keyboard Navigation**: Full keyboard support for accessibility
- **Copy to Clipboard**: One-click copying of prompts to clipboard
- **Auto-save**: Changes are automatically saved without manual intervention

### 💡 **Developer-Friendly**
- **Template Variables**: Use `{code}` in your prompts to automatically insert selected code
- **Uncategorized Support**: Automatic "Uncategorized" category for quick organization
- **Local Storage**: All data stored locally for privacy and offline access
- **Error Handling**: Robust error handling with user-friendly messages

## Installation

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "AI Prompt Manager"
4. Click Install

## Quick Start

### 1. Access the Extension
- Click the **AI Prompts** icon in the VS Code activity bar
- The prompt manager will open in a dedicated panel

### 2. Create Your First Category
- Click the **"+"** button next to "Categories"
- Enter a category name (e.g., "Debugging", "Code Review", "Documentation")
- Press Enter to create

### 3. Add Your First Prompt
- Select a category to view its prompts
- Click **"Add Prompt"** 
- Enter your prompt text
- Use `{code}` placeholder where you want selected code to appear
- Click Save

### 4. Use Your Prompts
- **Insert with Code**: Select code in your editor, then click a prompt
- **Insert without Code**: Click a prompt without selecting text
- **Copy to Clipboard**: Use the copy button to copy prompt text

## Usage Examples

### Example 1: Code Explanation
**Prompt**: `Explain what this code does:\n{code}`

**Usage**: Select code → Click prompt → AI gets: "Explain what this code does: [your selected code]"

### Example 2: Unit Test Generation
**Prompt**: `Generate unit tests for this function:\n{code}`

**Usage**: Select function → Click prompt → AI gets: "Generate unit tests for this function: [your function]"

### Example 3: Code Review
**Prompt**: `Please review this code for best practices and potential improvements:\n{code}`

**Usage**: Select code → Click prompt → AI gets: "Please review this code for best practices and potential improvements: [your code]"

## Features in Detail

### Category Management
- **Create Categories**: Organize prompts by purpose or type
- **Edit Categories**: Rename categories inline
- **Delete Categories**: Remove unused categories (prompts move to "Uncategorized")
- **Uncategorized**: Automatic category for orphaned prompts

### Prompt Management
- **Add Prompts**: Create new prompts with template support
- **Edit Prompts**: Double-click to edit inline
- **Delete Prompts**: Remove prompts with confirmation
- **Copy Prompts**: One-click copying to clipboard

### Template Variables
- **{code}**: Replaces with selected text from editor
- **Multiple Placeholders**: Use {code} multiple times in one prompt
- **Fallback**: If no text selected, {code} remains as placeholder

### Keyboard Shortcuts
- **Enter**: Create new category/prompt
- **Escape**: Cancel editing
- **Tab**: Navigate between elements
- **Double-click**: Edit prompts inline

## Extension Settings

This extension contributes the following settings:

*No settings are currently available. All configuration is done through the UI.*

## Commands

This extension contributes the following commands:

- `aiPromptManager.refreshWebview`: Refresh the AI Prompts webview
- `aiPromptManager.insertTextWithCode`: Insert AI prompt with selected code

## Requirements

- VS Code 1.85.0 or higher
- No additional dependencies required

## Known Issues

- Prompts are stored locally and not synced across devices
- No import/export functionality yet
- Limited to text-based prompts (no rich formatting)

## Roadmap

- [ ] Cloud sync support
- [ ] Import/export functionality
- [ ] Rich text formatting
- [ ] Prompt templates library
- [ ] Usage analytics
- [ ] Keyboard shortcuts customization

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

1. Clone the repository
2. Run `npm install`
3. Press F5 to start debugging
4. Make your changes
5. Run `npm run test` to ensure everything works

## Release Notes

### 1.0.0
- **Initial Release**: Complete AI prompt management system
- **Category Organization**: Create, edit, and delete categories
- **Template Support**: Use {code} placeholder for automatic code insertion
- **Inline Editing**: Double-click to edit prompts directly
- **Activity Bar Integration**: Dedicated icon for easy access
- **Keyboard Navigation**: Full accessibility support
- **Local Storage**: All data stored locally for privacy

## Support

- **Issues**: [GitHub Issues](https://github.com/vinothkumar95/ai-prompt-manager/issues)
- **Documentation**: [GitHub Wiki](https://github.com/vinothkumar95/ai-prompt-manager/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/vinothkumar95/ai-prompt-manager/discussions)

## License

This extension is licensed under the [MIT License](LICENSE).

---

**Made with ❤️ for the VS Code community**

If you find this extension helpful, please consider giving it a ⭐ on the VS Code Marketplace!
