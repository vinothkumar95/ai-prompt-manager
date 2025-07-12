import * as vscode from 'vscode';
import { PromptsData, Category, Prompt, readData, writeData, UNCACHED_CATEGORY_ID } from './extension';
import { v4 as uuidv4 } from 'uuid';

export class PromptManagerModalProvider {
    private readonly _extensionUri: vscode.Uri;
    private readonly _promptsFile: string;
    private _currentPanel: vscode.WebviewPanel | undefined = undefined;

    constructor(extensionUri: vscode.Uri, globalStoragePath: string) {
        this._extensionUri = extensionUri;
        this._promptsFile = vscode.Uri.joinPath(vscode.Uri.file(globalStoragePath), 'prompts.json').fsPath;
    }

    public createOrShowModal() {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (this._currentPanel) {
            this._currentPanel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        this._currentPanel = vscode.window.createWebviewPanel(
            'aiPromptManagerModal',
            'AI Prompt Manager',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'media')],
                retainContextWhenHidden: true
            }
        );

        this._currentPanel.webview.html = this._getHtmlForModal(this._currentPanel.webview);

        // Handle messages from the webview
        this._currentPanel.webview.onDidReceiveMessage(async message => {
            switch (message.command) {
                case 'getCategories':
                    this.sendCategories();
                    return;
                case 'getPromptsForCategory':
                    this.sendPromptsForCategory(message.categoryId);
                    return;
                case 'copyPromptText':
                    vscode.env.clipboard.writeText(message.text).then(() => {
                        vscode.window.showInformationMessage('Prompt text copied to clipboard. Paste it in your chat input.');
                        // Do not close the modal
                    }, (err) => {
                        vscode.window.showErrorMessage('Failed to copy prompt text: ' + err.message);
                    });
                    return;
                case 'insertPromptText': {
                    const editor = vscode.window.activeTextEditor;
                    if (editor) {
                        editor.insertSnippet(new vscode.SnippetString(message.text));
                        // Do not close the modal
                    } else {
                        vscode.env.clipboard.writeText(message.text).then(() => {
                            vscode.window.showInformationMessage('Prompt text copied to clipboard. Paste it in your chat input.');
                            // Do not close the modal
                        }, (err) => {
                            vscode.window.showErrorMessage('Failed to copy prompt text: ' + err.message);
                        });
                    }
                    return;
                }
                case 'closeModal':
                    this._currentPanel?.dispose();
                    return;
            }
        });

        // When the panel is closed, reset the current panel reference
        this._currentPanel.onDidDispose(() => {
            this._currentPanel = undefined;
        }, null);
    }

    public sendCategories() {
        if (!this._currentPanel) {
            return;
        }
        const data = readData(this._promptsFile);
        const categoriesWithCounts = data.categories.map(category => {
            const count = data.prompts.filter(prompt => prompt.categoryId === category.id).length;
            return { ...category, promptCount: count };
        });
        this._currentPanel.webview.postMessage({ command: 'updateCategories', categories: categoriesWithCounts });
    }

    public sendPromptsForCategory(categoryId: string) {
        if (!this._currentPanel) {
            return;
        }
        const data = readData(this._promptsFile);
        const category = data.categories.find(c => c.id === categoryId);
        const promptsForCategory = data.prompts.filter(p => p.categoryId === categoryId);
        this._currentPanel.webview.postMessage({
            command: 'updatePrompts',
            categoryId: categoryId,
            categoryName: category ? category.name : 'Unknown Category',
            prompts: promptsForCategory
        });
    }

    public registerStatusBarItem(context: vscode.ExtensionContext) {
        const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        statusBarItem.command = 'aiPromptManager.openModal';
        statusBarItem.text = '$(comment-discussion) AI Prompts';
        statusBarItem.tooltip = 'Open AI Prompt Manager Modal';
        statusBarItem.show();
        context.subscriptions.push(statusBarItem);
    }

    private _getHtmlForModal(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'modal.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'style.css'));

        const nonce = getNonce();

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleUri}" rel="stylesheet">
                <title>AI Prompt Manager</title>
            </head>
            <body>
                <div id="modal-container">
                    <div class="modal-header">
                        <h1>AI Prompt Manager</h1>
                        <button id="close-modal-btn" title="Close Modal"><span class="icon-close"></span></button>
                    </div>
                    
                    <!-- Categories View -->
                    <div id="categories-view">
                        <div class="view-header">
                            <h2>Select a Category</h2>
                        </div>
                        <div id="categories-container">
                            <!-- Categories will be rendered here by modal.js -->
                            <p>Loading categories...</p>
                        </div>
                    </div>

                    <!-- Prompts View (initially hidden) -->
                    <div id="prompts-view" class="hidden">
                        <div class="view-header">
                            <button id="back-to-categories-btn" title="Back to Categories"><span class="icon-back"></span> Back</button>
                            <h2 id="category-name-header">Category Prompts</h2>
                        </div>
                        <div id="prompts-list-container">
                            <!-- Prompts will be rendered here by modal.js -->
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