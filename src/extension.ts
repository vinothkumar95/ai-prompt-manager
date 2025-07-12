import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// --- Data Structures ---
export interface Category {
	id: string;
	name: string;
}

export interface Prompt {
	id: string;
	categoryId: string;
	text: string; // Renamed from 'prompt' for clarity
	// Future: add fields like 'title', 'description', 'lastUsed', 'createdAt'
}

export interface PromptsData {
	categories: Category[];
	prompts: Prompt[];
}

// --- Constants ---
export const UNCACHED_CATEGORY_ID = 'UNCACHED_PROMPTS_CATEGORY_ID_FIXED'; // Fixed ID for "Uncategorized"
export const UNCACHED_CATEGORY_NAME = 'Uncategorized';


// --- Data Access Helper Functions ---
export function readData(filePath: string): PromptsData { // Added export
	const defaultData: PromptsData = {
		categories: [{ id: UNCACHED_CATEGORY_ID, name: UNCACHED_CATEGORY_NAME }],
		prompts: []
	};

	try {
		if (!fs.existsSync(filePath)) {
			return defaultData; // Return default if file doesn't exist
		}
		const fileContents = fs.readFileSync(filePath, 'utf8');
		if (!fileContents) {
			return defaultData; // Return default if file is empty
		}

		const data = JSON.parse(fileContents) as PromptsData;

		// Basic validation and ensure "Uncategorized" category exists
		if (typeof data !== 'object' || !Array.isArray(data.categories) || !Array.isArray(data.prompts)) {
			vscode.window.showErrorMessage('Prompts data file is corrupted. Restoring defaults.');
			return defaultData;
		}

		let uncategorizedExists = data.categories.find(c => c.id === UNCACHED_CATEGORY_ID);
		if (!uncategorizedExists) {
			data.categories.unshift({ id: UNCACHED_CATEGORY_ID, name: UNCACHED_CATEGORY_NAME });
			// If there were prompts assigned to a non-existent "Uncategorized" ID, they might be orphaned.
			// This simple check doesn't migrate them, but ensures the category is there.
			// Migration logic could be added if necessary.
		}

		return data;
	} catch (error) {
		if (error instanceof SyntaxError) {
			vscode.window.showErrorMessage(`Error parsing prompts.json: ${error.message}. Restoring defaults.`);
		} else {
			vscode.window.showErrorMessage(`Error reading prompts file: ${error}. Restoring defaults.`);
		}
		return defaultData;
	}
}

export function writeData(filePath: string, data: PromptsData): void { // Added export
	try {
		fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
	} catch (error) {
		vscode.window.showErrorMessage(`Error writing prompts file: ${error}`);
		throw error; // Re-throw to allow dependent UI to know operation failed
	}
}

// Individual exports for types, consts, and functions are now used.
// The aggregate export line below was causing redeclaration errors and is removed.
// export { PromptsData, Category, Prompt, readData, writeData, UNCACHED_CATEGORY_ID, UNCACHED_CATEGORY_NAME };
import { PromptManagerViewProvider } from './PromptManagerViewProvider';
import { PromptManagerModalProvider } from './PromptManagerModalProvider';


export function activate(context: vscode.ExtensionContext) {
	const promptsFile = path.join(context.globalStorageUri.fsPath, 'prompts.json');

	// Initialize prompts file (which now includes categories) if it doesn't exist or directory isn't there
	try {
		const storagePath = context.globalStorageUri.fsPath;
		if (!fs.existsSync(storagePath)) {
			fs.mkdirSync(storagePath, { recursive: true });
		}
		if (!fs.existsSync(promptsFile)) {
			// Create a default initial structure with "Uncategorized" and a couple of example prompts/categories
			const debugCategoryId = uuidv4();
			const devCategoryId = uuidv4();
			const initialData: PromptsData = {
				categories: [
					{ id: UNCACHED_CATEGORY_ID, name: UNCACHED_CATEGORY_NAME },
					{ id: debugCategoryId, name: "Debugging" },
					{ id: devCategoryId, name: "Development" }
				],
				prompts: [
					{ id: uuidv4(), categoryId: debugCategoryId, text: "Explain what this code does:\n{code}" },
					{ id: uuidv4(), categoryId: devCategoryId, text: "Generate unit tests for:\n{code}" }
				]
			};
			writeData(promptsFile, initialData);
		} else {
			// If file exists, ensure "Uncategorized" category is present
			let data = readData(promptsFile); // readData already ensures Uncategorized exists
			writeData(promptsFile, data); // write it back in case readData added/modified it
		}
	} catch (error) {
		// Error message already shown by writeData or fs.mkdirSync or readData
		// vscode.window.showErrorMessage(`Failed to initialize prompts file: ${error}`);
		// If promptsFile can't be initialized, the provider might not work.
		// Consider disabling the extension or providing a way to retry.
		// For now, we'll let it proceed, and subsequent operations will likely fail.
	}

	// Register the WebviewViewProvider
	const provider = new PromptManagerViewProvider(context.extensionUri, context.globalStorageUri.fsPath);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(PromptManagerViewProvider.viewType, provider)
	);

	// Register the Modal Provider
	const modalProvider = new PromptManagerModalProvider(context.extensionUri, context.globalStorageUri.fsPath);
	modalProvider.registerStatusBarItem(context);

	// TODO: Re-evaluate commands. Some might be triggered from webview, others might be global.
	// For now, old commands are removed as they were tied to the TreeView.
	// A command to insert selected text via a webview interaction might be useful.
	// Example: a global command to "Insert AI Prompt with selected code" that then communicates with the webview.
	// Or, the webview itself handles code insertion when a prompt is clicked.

	// Example: A command to re-send categories to the webview (manual refresh)
	// This might be useful for debugging or if external changes to prompts.json occur.
	context.subscriptions.push(
		vscode.commands.registerCommand('aiPromptManager.refreshWebview', () => {
			provider.sendCategories(); // Example: provider needs such a method
		})
	);

	// Command to insert text (could be triggered by webview)
	// This is a placeholder for how the webview might trigger code insertion.
	// The actual mechanism will involve message passing from webview to extension.
	context.subscriptions.push(
		vscode.commands.registerCommand('aiPromptManager.insertTextWithCode', async (args: { text: string }) => {
			const editor = vscode.window.activeTextEditor;
			if (editor && args && typeof args.text === 'string') {
				let finalText = args.text;
				const selection = editor.selection;
				const selectedText = editor.document.getText(selection);
				finalText = finalText.replace(/\{code\}/g, selectedText);
				editor.insertSnippet(new vscode.SnippetString(finalText));
			} else if (!editor) {
				vscode.window.showErrorMessage('No active text editor found.');
			} else {
				vscode.window.showErrorMessage('Invalid arguments for inserting text.');
			}
		})
	);

	// Command to open the modal
	context.subscriptions.push(
		vscode.commands.registerCommand('aiPromptManager.openModal', () => {
			modalProvider.createOrShowModal();
		})
	);

}


export function deactivate() {}
