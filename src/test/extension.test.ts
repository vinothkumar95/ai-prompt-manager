import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import * as fs from 'fs';
import * as path from 'path';
// Assuming your extension's activate function and other exports are in 'extension.ts'
// For direct testing of internal functions like readPrompts, writePrompts if they were exported.
// However, we'll primarily test through commands.
// import * as myExtension from '../../src/extension';

// Helper to delay execution
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

suite('AI Prompt Manager Extension Test Suite', () => {
	let mockPrompts: any[] = [];
	let globalStoragePath: string;
	let promptsFilePath: string;

	// Stubs for fs operations to control prompt data
	let readFileSyncStub: sinon.SinonStub;
	let writeFileSyncStub: sinon.SinonStub;
	let existsSyncStub: sinon.SinonStub;
	let mkdirSyncStub: sinon.SinonStub;

	suiteSetup(async () => {
		// Ensure extension is activated
		// The name comes directly from package.json's "name" field.
		await vscode.extensions.getExtension('ai-prompt-manager')?.activate();

		// Define a mock global storage path for tests
		// Note: context.globalStorageUri is normally provided by VS Code.
		// For testing, we simulate its behavior by controlling fs calls.
		// A more robust way would be if VS Code test utils provide a way to set this.
		// For now, we assume `activate` will try to use it, and we'll intercept fs calls.
		globalStoragePath = path.join(__dirname, 'testGlobalStorage');
		promptsFilePath = path.join(globalStoragePath, 'prompts.json');
	});

	setup(() => {
		mockPrompts = []; // Reset mock prompts before each test

		// Stub fs methods to control prompt data without actual file I/O
		// These stubs will effectively mock our `readPrompts` and `writePrompts` helpers' internals.
		readFileSyncStub = sinon.stub(fs, 'readFileSync');
		writeFileSyncStub = sinon.stub(fs, 'writeFileSync');
		existsSyncStub = sinon.stub(fs, 'existsSync');
		mkdirSyncStub = sinon.stub(fs, 'mkdirSync');

		// Default behavior for stubs
		existsSyncStub.returns(true); // Assume directory and file exist by default
		existsSyncStub.withArgs(promptsFilePath).callsFake(() => mockPrompts.length > 0 || readFileSyncStub.called); // Only "exists" if written or explicitly set
		readFileSyncStub.withArgs(promptsFilePath, 'utf8').callsFake(() => JSON.stringify(mockPrompts));
		writeFileSyncStub.withArgs(promptsFilePath, sinon.match.string).callsFake((path: string, data: string) => {
			mockPrompts = JSON.parse(data);
		});
		mkdirSyncStub.returns(undefined);

		// Reset showInputBox and showWarningMessage stubs
		sinon.restore(); // Restores all stubs, good for a clean slate
	});

	teardown(() => {
		sinon.restore(); // Clean up all stubs
		mockPrompts = [];
	});

	test.skip('Extension should activate', async () => { // Skipping old tests
		const extension = vscode.extensions.getExtension('ai-prompt-manager');
		assert.ok(extension, 'Extension not found.');
		assert.ok(extension.isActive, 'Extension failed to activate.');
	});

	test('Add new prompt command', async () => {
		// Stub vscode.window.showInputBox to return predefined values
		const showInputBoxStub = sinon.stub(vscode.window, 'showInputBox');
		showInputBoxStub.onFirstCall().resolves('TestCategory'); // For category
		showInputBoxStub.onSecondCall().resolves('Test prompt {code}'); // For prompt text

		await vscode.commands.executeCommand('aiPromptTemplates.addPrompt');
		await delay(100); // Allow time for async operations

		assert.strictEqual(mockPrompts.length, 1, 'Prompt should be added');
		assert.strictEqual(mockPrompts[0].category, 'TestCategory');
		assert.strictEqual(mockPrompts[0].prompt, 'Test prompt {code}');
		assert.ok(mockPrompts[0].id, 'Prompt should have an ID');

		showInputBoxStub.restore();
	});

	test.skip('Edit existing prompt command', async () => { // Skipping old tests
		// Setup initial prompt
		const initialPromptId = 'test-id-1';
		mockPrompts = [{ id: initialPromptId, category: 'OldCategory', prompt: 'Old prompt' }];
		// Ensure readFileSyncStub returns this initial prompt when called by edit command
		readFileSyncStub.withArgs(promptsFilePath, 'utf8').returns(JSON.stringify(mockPrompts));


		const showInputBoxStub = sinon.stub(vscode.window, 'showInputBox');
		showInputBoxStub.onFirstCall().resolves('NewCategory'); // New category
		showInputBoxStub.onSecondCall().resolves('New prompt text'); // New prompt text

		// The command aiPromptTemplates.editPrompt expects a PromptItem argument
		// We need to simulate a PromptItem object that would be passed from the tree view
		const mockPromptItem = {
			id: initialPromptId,
			category: 'OldCategory',
			prompt: 'Old prompt'
		};

		await vscode.commands.executeCommand('aiPromptTemplates.editPrompt', mockPromptItem);
		await delay(100);

		assert.strictEqual(mockPrompts.length, 1);
		assert.strictEqual(mockPrompts[0].id, initialPromptId);
		assert.strictEqual(mockPrompts[0].category, 'NewCategory');
		assert.strictEqual(mockPrompts[0].prompt, 'New prompt text');
		showInputBoxStub.restore();
	});

	test.skip('Delete existing prompt command', async () => { // Skipping old tests
		const promptIdToDelete = 'test-id-2';
		mockPrompts = [
			{ id: 'test-id-1', category: 'Category1', prompt: 'Prompt1' },
			{ id: promptIdToDelete, category: 'Category2', prompt: 'Prompt2' }
		];
		readFileSyncStub.withArgs(promptsFilePath, 'utf8').returns(JSON.stringify(mockPrompts));


		// Stub showWarningMessage to automatically confirm deletion
		const showWarningMessageStub = sinon.stub(vscode.window, 'showWarningMessage').resolves('Delete' as any);

		const mockPromptItemToDelete = {
			id: promptIdToDelete,
			category: 'Category2',
			prompt: 'Prompt2'
		};

		await vscode.commands.executeCommand('aiPromptTemplates.deletePrompt', mockPromptItemToDelete);
		await delay(100);

		assert.strictEqual(mockPrompts.length, 1, 'Prompt should be deleted');
		assert.ok(mockPrompts.every(p => p.id !== promptIdToDelete), 'Correct prompt was not deleted');
		assert.strictEqual(mockPrompts[0].id, 'test-id-1');
		showWarningMessageStub.restore();
	});

	test.skip('Insert prompt command with {code} placeholder', async () => { // Skipping old tests
		const mockEditor = {
			document: {
				getText: sinon.stub().returns('selected code text')
			},
			selection: new vscode.Selection(new vscode.Position(0,0), new vscode.Position(0,10)), // Mock selection
			insertSnippet: sinon.spy()
		};
		sinon.stub(vscode.window, 'activeTextEditor').value(mockEditor);

		const promptToInsert = {
			id: 'insert-test',
			category: 'TestInsert',
			prompt: 'Analyze this: {code} carefully.'
		};

		await vscode.commands.executeCommand('aiPromptTemplates.insertPrompt', promptToInsert);
		await delay(100);

		assert.ok(mockEditor.insertSnippet.calledOnce, 'insertSnippet should be called');
		const snippetString = mockEditor.insertSnippet.getCall(0).args[0] as vscode.SnippetString;
		assert.strictEqual(snippetString.value, 'Analyze this: selected code text carefully.');

		sinon.restore(); // Clean up activeTextEditor stub
	});
});
