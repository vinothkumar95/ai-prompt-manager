import * as vscode from 'vscode';
import { PromptsData, Category, Prompt, readData, writeData, UNCACHED_CATEGORY_ID } from './extension'; // Adjust path as needed
import { v4 as uuidv4 } from 'uuid';

export class PromptManagerViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'aiPromptManager.webview'; // Matches package.json contribution

    private _view?: vscode.WebviewView;
    private readonly _extensionUri: vscode.Uri;
    private readonly _promptsFile: string;

    constructor(extensionUri: vscode.Uri, globalStoragePath: string) {
        this._extensionUri = extensionUri;
        this._promptsFile = vscode.Uri.joinPath(vscode.Uri.file(globalStoragePath), 'prompts.json').fsPath;
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'media')]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async message => {
            // Handle messages from the webview
            switch (message.command) {
                case 'getCategories':
                    this.sendCategories();
                    return;
                case 'getPromptsForCategory':
                    this.sendPromptsForCategory(message.categoryId);
                    return;
                case 'addCategory':
                    this.addCategory(message.name);
                    return;
                case 'editCategory':
                    this.editCategory(message.categoryId, message.newName);
                    return;
                case 'deleteCategory':
                    this.deleteCategory(message.categoryId);
                    return;
                case 'addPrompt':
                    this.addPrompt(message.categoryId, message.text);
                    return;
                case 'editPrompt':
                    this.editPrompt(message.promptId, message.newText, message.categoryId);
                    return;
                case 'deletePrompt':
                    this.deletePrompt(message.promptId, message.categoryId);
                    return;
                case 'movePrompt':
                    this.movePrompt(message.promptId, message.newCategoryId, message.oldCategoryId);
                    return;
                case 'copyPromptText':
                    vscode.env.clipboard.writeText(message.text).then(() => {
                        vscode.window.showInformationMessage('Prompt text copied to clipboard.');
                        // Optionally send a 'promptCopied' message back to webview for UI feedback
                        // this._view?.webview.postMessage({ command: 'promptCopied' });
                    }, (err) => {
                        vscode.window.showErrorMessage('Failed to copy prompt text: ' + err.message);
                    });
                    return;
                case 'showError': // Message from webview to show an error (e.g. validation)
                    vscode.window.showErrorMessage(message.message);
                    return;

            }
        });
    }

    public sendCategories() {
        if (!this._view) return;
        const data = readData(this._promptsFile);
        const categoriesWithCounts = data.categories.map(category => {
            const count = data.prompts.filter(prompt => prompt.categoryId === category.id).length;
            return { ...category, promptCount: count };
        });
        this._view.webview.postMessage({ command: 'updateCategories', categories: categoriesWithCounts });
    }

    public sendPromptsForCategory(categoryId: string) {
        if (!this._view) return;
        const data = readData(this._promptsFile);
        const category = data.categories.find(c => c.id === categoryId);
        const promptsForCategory = data.prompts.filter(p => p.categoryId === categoryId);
        this._view.webview.postMessage({
            command: 'updatePrompts',
            categoryId: categoryId,
            categoryName: category ? category.name : 'Unknown Category',
            prompts: promptsForCategory
        });
    }

    private addCategory(name: string) {
        if (!name || !name.trim()) {
            this._view?.webview.postMessage({ command: 'showErrorInWebview', message: 'Category name cannot be empty.' });
            return;
        }
        const data = readData(this._promptsFile);
        if (data.categories.find(c => c.name.toLowerCase() === name.trim().toLowerCase())) {
            this._view?.webview.postMessage({ command: 'showErrorInWebview', message: `Category "${name.trim()}" already exists.` });
            return;
        }
        data.categories.push({ id: uuidv4(), name: name.trim() });
        writeData(this._promptsFile, data);
        this.sendCategories(); // Refresh categories list in webview
    }

    private editCategory(categoryId: string, newName: string) {
        try {
            if (!newName || !newName.trim()) {
                this._view?.webview.postMessage({ command: 'showErrorInWebview', message: 'Category name cannot be empty.' });
                this.sendCategories(); // Refresh UI with current state
                return;
            }
            if (categoryId === UNCACHED_CATEGORY_ID) {
                this._view?.webview.postMessage({ command: 'showErrorInWebview', message: '"Uncategorized" category cannot be renamed.' });
                this.sendCategories(); // Refresh UI with current state
                return;
            }

            const data = readData(this._promptsFile);
            const category = data.categories.find(c => c.id === categoryId);

            if (!category) {
                this._view?.webview.postMessage({ command: 'showErrorInWebview', message: 'Category not found for editing.' });
                this.sendCategories(); // Refresh UI with current state
                return;
            }

            // Check if another category (excluding current one) already has the new name
            if (data.categories.some(c => c.id !== categoryId && c.name.toLowerCase() === newName.trim().toLowerCase())) {
                this._view?.webview.postMessage({ command: 'showErrorInWebview', message: `Another category with name "${newName.trim()}" already exists.` });
                this.sendCategories(); // Refresh UI with current state
                return;
            }

            category.name = newName.trim();
            writeData(this._promptsFile, data);
            this.sendCategories();
        } catch (error) {
            const err = error as Error;
            this._view?.webview.postMessage({ command: 'showErrorInWebview', message: `Failed to edit category: ${err.message}` });
            this.sendCategories();
        }
    }

    private deleteCategory(categoryId: string) {
        try {
            if (categoryId === UNCACHED_CATEGORY_ID) {
                this._view?.webview.postMessage({ command: 'showErrorInWebview', message: '"Uncategorized" category cannot be deleted.' });
                this.sendCategories();
                return;
            }

            const data = readData(this._promptsFile);
            const initialCategoryCount = data.categories.length;
            const categoryExists = data.categories.some(c => c.id === categoryId);

            if (!categoryExists) {
                this._view?.webview.postMessage({ command: 'showErrorInWebview', message: 'Category not found for deletion.' });
                this.sendCategories();
                return;
            }

            data.prompts.forEach(prompt => {
                if (prompt.categoryId === categoryId) {
                    prompt.categoryId = UNCACHED_CATEGORY_ID;
                }
            });
            data.categories = data.categories.filter(c => c.id !== categoryId);

            // Only write and refresh if a category was actually removed.
            // This condition is implicitly covered if categoryExists was true.
            writeData(this._promptsFile, data);
            this.sendCategories();

        } catch (error) {
            const err = error as Error;
            this._view?.webview.postMessage({ command: 'showErrorInWebview', message: `Failed to delete category: ${err.message}` });
            this.sendCategories();
        }
    }

    private addPrompt(categoryId: string, text: string) {
        if (!text || !text.trim()) {
            this._view?.webview.postMessage({ command: 'showErrorInWebview', message: 'Prompt text cannot be empty.' });
            return;
        }
        const data = readData(this._promptsFile);
        if (!data.categories.find(c => c.id === categoryId)) {
            this._view?.webview.postMessage({ command: 'showErrorInWebview', message: 'Category not found for adding prompt.' });
            return;
        }
        data.prompts.push({ id: uuidv4(), categoryId: categoryId, text: text.trim() });
        writeData(this._promptsFile, data);
        this.sendPromptsForCategory(categoryId); // Refresh prompts for the current category
    }

    private editPrompt(promptId: string, newText: string, categoryId: string) {
         if (!newText || !newText.trim()) {
            this._view?.webview.postMessage({ command: 'showErrorInWebview', message: 'Prompt text cannot be empty.' });
            return;
        }
        const data = readData(this._promptsFile);
        const prompt = data.prompts.find(p => p.id === promptId);
        if (prompt) {
            prompt.text = newText.trim();
            writeData(this._promptsFile, data);
            this.sendPromptsForCategory(categoryId); // Refresh view for current category
        } else {
             this._view?.webview.postMessage({ command: 'showErrorInWebview', message: 'Prompt not found for editing.' });
        }
    }

    private deletePrompt(promptId: string, categoryId: string) {
        try {
            const data = readData(this._promptsFile);
            const initialPromptCount = data.prompts.length;
            data.prompts = data.prompts.filter(p => p.id !== promptId);

            if (data.prompts.length < initialPromptCount) { // Check if a prompt was actually deleted
                writeData(this._promptsFile, data);
                this.sendPromptsForCategory(categoryId);
            } else {
                // Prompt not found, maybe already deleted? Or bad ID.
                // Optionally send an error or just refresh. For now, refresh.
                this._view?.webview.postMessage({ command: 'showErrorInWebview', message: 'Prompt not found for deletion.' });
                this.sendPromptsForCategory(categoryId);
            }
        } catch (error) {
            const err = error as Error;
            this._view?.webview.postMessage({ command: 'showErrorInWebview', message: `Failed to delete prompt: ${err.message}` });
            // Still try to send current state of prompts for that category
            if (categoryId) {
                this.sendPromptsForCategory(categoryId);
            }
        }
    }

    private movePrompt(promptId: string, newCategoryId: string, oldCategoryId: string) {
        const data = readData(this._promptsFile);
        const prompt = data.prompts.find(p => p.id === promptId);
        if (!data.categories.find(c => c.id === newCategoryId)) {
             this._view?.webview.postMessage({ command: 'showErrorInWebview', message: 'Target category not found for moving prompt.' });
            return;
        }
        if (prompt) {
            prompt.categoryId = newCategoryId;
            writeData(this._promptsFile, data);
            // We need to tell the webview to refresh the source category's prompt list
            // and potentially the destination if it's visible, or just go back to categories view.
            // For simplicity now, just refresh the old category. If the webview is smart, it might re-request.
            this.sendPromptsForCategory(oldCategoryId);
            // Consider if we also need to sendPromptsForCategory(newCategoryId) or sendCategories()
            // If both old and new categories are the same (e.g. an error in UI logic), this is fine.
        } else {
            this._view?.webview.postMessage({ command: 'showErrorInWebview', message: 'Prompt not found for moving.' });
        }
    }


    private _getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'style.css'));

        // Use a nonce for Content Security Policy
        const nonce = getNonce();

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <!--
                    Use a content security policy to only allow loading images from https or from our extension directory,
                    and only allow scripts that have a specific nonce.
                -->
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">

                <link href="${styleUri}" rel="stylesheet">
                <title>AI Prompt Manager</title>
            </head>
            <body>
                <div id="app-container">
                    <!-- Categories View -->
                    <div id="categories-view">
                        <div class="view-header">
                            <input type="text" id="new-category-name" placeholder="New category name...">
                            <button id="add-category-btn" title="Add New Category"><span class="icon-add"></span> Add</button>
                        </div>
                        <div id="categories-container">
                            <!-- Categories will be rendered here by main.js -->
                            <p>Loading categories...</p>
                        </div>
                    </div>

                    <!-- Prompts View (initially hidden) -->
                    <div id="prompts-view" class="hidden">
                        <div class="view-header">
                            <button id="back-to-categories-btn" title="Back to Categories"><span class="icon-back"></span> Back</button>
                            <h2 id="category-name-header">Category Prompts</h2>
                        </div>
                        <div class="add-prompt-form">
                             <textarea id="new-prompt-text" placeholder="New prompt text (use {code} for selection)..." rows="4"></textarea>
                             <button id="add-prompt-btn" title="Add New Prompt to this Category"><span class="icon-add"></span> Add Prompt</button>
                        </div>
                        <div id="prompts-list-container">
                            <!-- Prompts will be rendered here by main.js -->
                        </div>
                    </div>
                </div>

                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
