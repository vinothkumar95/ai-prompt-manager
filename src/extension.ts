import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
	const promptsFile = path.join(context.globalStorageUri.fsPath, 'prompts.json');

	if (!fs.existsSync(promptsFile)) {
		fs.mkdirSync(context.globalStorageUri.fsPath, { recursive: true });
		fs.writeFileSync(promptsFile, JSON.stringify([
			{ category: "Debug", prompt: "Explain what this code does:\n{code}" },
			{ category: "Dev", prompt: "Generate unit tests for:\n{code}" }
		], null, 2));
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
			const category = await vscode.window.showInputBox({ prompt: 'Enter prompt category' });
			if (!category) return;
			const prompt = await vscode.window.showInputBox({ prompt: 'Enter prompt template (use {code} for code placeholder)' });
			if (!prompt) return;
			const data = JSON.parse(fs.readFileSync(promptsFile, 'utf8'));
			data.push({ category, prompt });
			fs.writeFileSync(promptsFile, JSON.stringify(data, null, 2));
			treeDataProvider.refresh();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('aiPromptTemplates.editPrompt', async (item: PromptItem) => {
			const newCategory = await vscode.window.showInputBox({ prompt: 'Edit prompt category', value: item.category });
			if (!newCategory) return;
			const newPrompt = await vscode.window.showInputBox({ prompt: 'Edit prompt template', value: item.prompt });
			if (!newPrompt) return;
			let data = JSON.parse(fs.readFileSync(promptsFile, 'utf8'));
			data = data.map((d: any) => (d.category === item.category && d.prompt === item.prompt) ? { category: newCategory, prompt: newPrompt } : d);
			fs.writeFileSync(promptsFile, JSON.stringify(data, null, 2));
			treeDataProvider.refresh();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('aiPromptTemplates.deletePrompt', async (item: PromptItem) => {
			const confirm = await vscode.window.showWarningMessage('Delete this prompt?', { modal: true }, 'Delete');
			if (confirm !== 'Delete') return;
			let data = JSON.parse(fs.readFileSync(promptsFile, 'utf8'));
			data = data.filter((d: any) => !(d.category === item.category && d.prompt === item.prompt));
			fs.writeFileSync(promptsFile, JSON.stringify(data, null, 2));
			treeDataProvider.refresh();
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
		const data = JSON.parse(fs.readFileSync(this.promptsFile, 'utf8')) as { category: string; prompt: string }[];
		if (!element) {
			const categories = Array.from(new Set(data.map(d => d.category)));
			return Promise.resolve(categories.map(cat => new CategoryItem(cat)));
		} else {
			return Promise.resolve(
				data.filter(d => d.category === element.label).map(d => new PromptItem(d.category, d.prompt))
			);
		}
	}
}

class CategoryItem extends vscode.TreeItem {
	constructor(
		public readonly label: string
	) {
		super(label, vscode.TreeItemCollapsibleState.Collapsed);
	}
}

class PromptItem extends vscode.TreeItem {
	constructor(
		public readonly category: string,
		public readonly prompt: string
	) {
		super(prompt.substring(0, 30) + '...', vscode.TreeItemCollapsibleState.None);
		this.tooltip = prompt;
		this.contextValue = 'promptItem';
		this.command = {
			command: 'aiPromptTemplates.insertPrompt',
			title: 'Insert Prompt',
			arguments: [this]
		};
	}
}

export function deactivate() {}
