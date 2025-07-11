import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Define the structure for a prompt
interface Prompt {
	id: string;
	category: string;
	prompt: string;
}

// Helper function to read prompts from the file
function readPrompts(filePath: string): Prompt[] {
	try {
		if (!fs.existsSync(filePath)) {
			return []; // Return empty if file doesn't exist
		}
		const fileContents = fs.readFileSync(filePath, 'utf8');
		if (!fileContents) {
			return []; // Return empty if file is empty
		}
		const prompts = JSON.parse(fileContents) as Prompt[];
		if (!Array.isArray(prompts)) {
			vscode.window.showErrorMessage('Prompts data is corrupted (not an array). Starting with empty list.');
			return [];
		}
		// Further validation could be added here to check structure of each prompt object
		return prompts;
	} catch (error) {
		if (error instanceof SyntaxError) {
			vscode.window.showErrorMessage(`Error parsing prompts.json: ${error.message}. Starting with an empty list.`);
		} else {
			vscode.window.showErrorMessage(`Error reading prompts file: ${error}. Starting with an empty list.`);
		}
		return [];
	}
}

// Helper function to write prompts to the file
function writePrompts(filePath: string, prompts: Prompt[]): void {
	try {
		fs.writeFileSync(filePath, JSON.stringify(prompts, null, 2));
	} catch (error) {
		vscode.window.showErrorMessage(`Error writing prompts file: ${error}`);
		throw error; // Re-throw to allow command to handle UI response if needed
	}
}

export function activate(context: vscode.ExtensionContext) {
	const promptsFile = path.join(context.globalStorageUri.fsPath, 'prompts.json');

	// Initialize prompts file if it doesn't exist or directory isn't there
	try {
		const storagePath = context.globalStorageUri.fsPath;
		if (!fs.existsSync(storagePath)) {
			fs.mkdirSync(storagePath, { recursive: true });
		}
		if (!fs.existsSync(promptsFile)) {
			const initialPrompts: Prompt[] = [
				{ id: uuidv4(), category: "Debug", prompt: "Explain what this code does:\n{code}" },
				{ id: uuidv4(), category: "Dev", prompt: "Generate unit tests for:\n{code}" }
			];
			writePrompts(promptsFile, initialPrompts);
		}
	} catch (error) {
		// Error message already shown by writePrompts or fs.mkdirSync
		// vscode.window.showErrorMessage(`Failed to initialize prompts file: ${error}`);
		// If promptsFile can't be initialized, the provider might not work.
		// Consider disabling the extension or providing a way to retry.
		// For now, we'll let it proceed, and subsequent operations will likely fail.
	}

	const treeDataProvider = new PromptProvider(promptsFile);
	vscode.window.registerTreeDataProvider('aiPromptTemplatesView', treeDataProvider);

	context.subscriptions.push(
		vscode.commands.registerCommand('aiPromptTemplates.refresh', () => treeDataProvider.refresh())
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('aiPromptTemplates.insertPrompt', async (item: PromptItem) => {
			const editor = vscode.window.activeTextEditor;
			if (editor) {
				let text = item.prompt;
				const selection = editor.selection;
				const selectedText = editor.document.getText(selection);
				text = text.replace(/\{code\}/g, selectedText);
				editor.insertSnippet(new vscode.SnippetString(text));
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('aiPromptTemplates.addPrompt', async () => {
			const category = await vscode.window.showInputBox({
				prompt: 'Enter a category for the new prompt.',
				placeHolder: 'e.g., Debugging, Refactoring, Testing',
				validateInput: value => {
					return value && value.trim() ? null : 'Category cannot be empty.';
				}
			});
			if (category === undefined || category.trim() === '') return; // User cancelled or entered empty

			const promptText = await vscode.window.showInputBox({
				prompt: 'Enter the prompt template text.',
				placeHolder: 'e.g., Explain this {code} section.',
				validateInput: value => {
					return value && value.trim() ? null : 'Prompt text cannot be empty.';
				}
			});
			if (promptText === undefined || promptText.trim() === '') return; // User cancelled or entered empty

			try {
				const prompts = readPrompts(promptsFile);
				const newPrompt: Prompt = { id: uuidv4(), category: category.trim(), prompt: promptText.trim() };
				prompts.push(newPrompt);
				writePrompts(promptsFile, prompts);
				treeDataProvider.refresh();
			} catch (error) {
				// Error message already shown by writePrompts or readPrompts
				// vscode.window.showErrorMessage(`Error adding prompt: ${error}`);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('aiPromptTemplates.editPrompt', async (item: PromptItem) => {
			const newCategory = await vscode.window.showInputBox({
				prompt: 'Edit prompt category.',
				value: item.category,
				validateInput: value => {
					return value && value.trim() ? null : 'Category cannot be empty.';
				}
			});
			if (newCategory === undefined) return; // User cancelled category edit

			const newPromptTextValue = await vscode.window.showInputBox({
				prompt: 'Edit the prompt template text.',
				value: item.prompt,
				validateInput: value => {
					return value && value.trim() ? null : 'Prompt text cannot be empty.';
				}
			});
			if (newPromptTextValue === undefined) return; // User cancelled prompt edit

			const trimmedNewCategory = newCategory.trim();
			const trimmedNewPromptTextValue = newPromptTextValue.trim();

			if (trimmedNewCategory === item.category && trimmedNewPromptTextValue === item.prompt) return; // No changes made

			try {
				let prompts = readPrompts(promptsFile);
				prompts = prompts.map((p: Prompt) =>
					p.id === item.id ? { ...p, category: newCategory, prompt: newPromptTextValue } : p
				);
				writePrompts(promptsFile, prompts);
				treeDataProvider.refresh();
			} catch (error) {
				// Error message already shown by writePrompts or readPrompts
				// vscode.window.showErrorMessage(`Error editing prompt: ${error}`);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('aiPromptTemplates.deletePrompt', async (item: PromptItem) => {
			const promptNameToConfirm = item.prompt.substring(0, 50) + (item.prompt.length > 50 ? '...' : '');
			const confirm = await vscode.window.showWarningMessage(`Delete prompt "${promptNameToConfirm}"?`, { modal: true }, 'Delete');
			if (confirm !== 'Delete') return;
			try {
				let prompts = readPrompts(promptsFile);
				prompts = prompts.filter((p: Prompt) => p.id !== item.id);
				writePrompts(promptsFile, prompts);
				treeDataProvider.refresh();
			} catch (error) {
				// Error message already shown by writePrompts or readPrompts
				// vscode.window.showErrorMessage(`Error deleting prompt: ${error}`);
			}
		})
	);
}

class PromptProvider implements vscode.TreeDataProvider<CategoryItem | PromptItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<CategoryItem | PromptItem | undefined | void> = new vscode.EventEmitter<CategoryItem | PromptItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<CategoryItem | PromptItem | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private promptsFile: string) {}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: CategoryItem | PromptItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: CategoryItem): Thenable<(CategoryItem | PromptItem)[]> {
		const prompts = readPrompts(this.promptsFile);

		if (!element) { // Root level: show categories
			const categories = Array.from(new Set(prompts.map(p => p.category)));
			return Promise.resolve(categories.map(cat => new CategoryItem(cat)));
		} else { // Child level: show prompts for a category
			return Promise.resolve(
				prompts.filter(p => p.category === element.label).map(p => new PromptItem(p.id, p.category, p.prompt))
			);
		}
	}
}

class CategoryItem extends vscode.TreeItem {
	constructor(
		public readonly label: string // Category name
	) {
		super(label, vscode.TreeItemCollapsibleState.Collapsed);
	}
}

class PromptItem extends vscode.TreeItem {
	constructor(
		public readonly id: string,
		public readonly category: string,
		public readonly prompt: string
	) {
		const labelText = prompt.length > 40 ? prompt.substring(0, 37) + '...' : prompt;
		super(labelText, vscode.TreeItemCollapsibleState.None);
		// 'id' is already a public readonly property from constructor, no need for 'this.id = id;'
		this.tooltip = `Prompt: ${prompt}\nCategory: ${category}`; // Full prompt in tooltip
		this.description = `(${category})`; // Category shown next to the prompt label
		this.contextValue = 'promptItem';
		// The command will receive this PromptItem instance as an argument
		this.command = {
			command: 'aiPromptTemplates.insertPrompt',
			title: 'Insert Prompt',
			arguments: [this]
		};
	}
}

export function deactivate() {}
