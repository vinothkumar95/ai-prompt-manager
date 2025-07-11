// @ts-check

// This script will be run within the webview itself
(function () {
    // @ts-ignore
    const vscode = acquireVsCodeApi(); // Hook to communicate with the extension

    let categories = [];
    let prompts = [];
    let currentView = 'categories'; // 'categories' or 'prompts'
    let currentCategoryId = null;
    let currentCategoryName = '';

    // --- Get DOM Elements ---
    const categoriesView = document.getElementById('categories-view');
    const promptsView = document.getElementById('prompts-view');

    const categoriesContainer = document.getElementById('categories-container');
    const categoryNameHeader = document.getElementById('category-name-header');
    const promptsListContainer = document.getElementById('prompts-list-container');

    const addCategoryButton = document.getElementById('add-category-btn');
    const newCategoryInput = document.getElementById('new-category-name');

    const backToCategoriesButton = document.getElementById('back-to-categories-btn');
    const addPromptButton = document.getElementById('add-prompt-btn');
    const newPromptTextarea = document.getElementById('new-prompt-text');


    // --- Render Functions ---

    function renderCategories() {
        if (!categoriesContainer) return;
        categoriesContainer.innerHTML = ''; // Clear previous
        categories.forEach(cat => {
            const card = document.createElement('div');
            card.className = 'category-card';
            card.dataset.categoryId = cat.id;
            card.dataset.categoryName = cat.name;
            card.setAttribute('tabindex', '0'); // Make it focusable for keyboard nav

            const nameEl = document.createElement('div');
            nameEl.className = 'category-name';
            nameEl.textContent = cat.name;
            card.appendChild(nameEl);

            const countEl = document.createElement('div');
            countEl.className = 'prompt-count';
            countEl.textContent = `(${cat.promptCount || 0} prompt${(cat.promptCount || 0) === 1 ? '' : 's'})`;
            card.appendChild(countEl);

            if (cat.id !== 'UNCACHED_PROMPTS_CATEGORY_ID_FIXED') { // Don't allow editing/deleting "Uncategorized"
                const actions = document.createElement('div');
                actions.className = 'category-actions';

                const editBtn = document.createElement('button');
                editBtn.innerHTML = '<span class="icon-edit" title="Edit category"></span>';
                editBtn.dataset.categoryId = cat.id;
                editBtn.dataset.categoryName = cat.name;
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent card click
                    handleEditCategory(cat.id, cat.name);
                });
                actions.appendChild(editBtn);

                const deleteBtn = document.createElement('button');
                deleteBtn.innerHTML = '<span class="icon-delete" title="Delete category"></span>';
                deleteBtn.dataset.categoryId = cat.id;
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent card click
                    handleDeleteCategory(cat.id, cat.name);
                });
                actions.appendChild(deleteBtn);
                card.appendChild(actions);
            }

            card.addEventListener('click', () => {
                currentCategoryId = cat.id;
                currentCategoryName = cat.name;
                vscode.postMessage({ command: 'getPromptsForCategory', categoryId: cat.id });
            });
            card.addEventListener('keypress', (e) => { // Allow selection with Enter key
                if (e.key === 'Enter') {
                    card.click();
                }
            });

            categoriesContainer.appendChild(card);
        });
        switchToCategoriesView();
    }

    function renderPrompts() {
        if (!promptsListContainer || !categoryNameHeader) return;
        promptsListContainer.innerHTML = ''; // Clear previous
        categoryNameHeader.textContent = currentCategoryName || 'Prompts';

        if (prompts.length === 0) {
            promptsListContainer.innerHTML = '<p>No prompts in this category yet.</p>';
        } else {
            prompts.forEach(prompt => {
                const box = document.createElement('div');
                box.className = 'prompt-box';
                box.dataset.promptId = prompt.id;

                const textEl = document.createElement('div');
                textEl.className = 'prompt-text';
                textEl.textContent = prompt.text;
                textEl.setAttribute('tabindex', '0');
                box.appendChild(textEl);

                const actions = document.createElement('div');
                actions.className = 'prompt-actions';

                const copyBtn = document.createElement('button');
                copyBtn.innerHTML = '<span class="icon-copy" title="Copy prompt"></span>';
                copyBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    vscode.postMessage({ command: 'copyPromptText', text: prompt.text });
                });
                actions.appendChild(copyBtn);

                const deleteBtn = document.createElement('button');
                deleteBtn.innerHTML = '<span class="icon-delete" title="Delete prompt"></span>';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    handleDeletePrompt(prompt.id, prompt.text);
                });
                actions.appendChild(deleteBtn);
                box.appendChild(actions);

                // Double click to edit
                textEl.addEventListener('dblclick', () => {
                    makePromptEditable(textEl, prompt.id, prompt.text);
                });

                promptsListContainer.appendChild(box);
            });
        }
        switchToPromptsView();
    }

    function makePromptEditable(textEl, promptId, currentText) {
        textEl.setAttribute('contenteditable', 'true');
        textEl.focus();
        const originalText = currentText;

        const saveChanges = () => {
            textEl.removeAttribute('contenteditable');
            const newText = textEl.textContent.trim();
            if (newText && newText !== originalText) {
                vscode.postMessage({ command: 'editPrompt', promptId: promptId, newText: newText, categoryId: currentCategoryId });
            } else {
                textEl.textContent = originalText; // Revert if empty or unchanged
            }
            // Remove event listeners to prevent multiple bindings
            textEl.removeEventListener('blur', onBlur);
            textEl.removeEventListener('keydown', onKeydown);
        };

        const onBlur = () => saveChanges();
        const onKeydown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { // Save on Enter (but allow Shift+Enter for newlines)
                e.preventDefault();
                saveChanges();
            } else if (e.key === 'Escape') { // Cancel on Escape
                textEl.textContent = originalText;
                textEl.removeAttribute('contenteditable');
                textEl.removeEventListener('blur', onBlur);
                textEl.removeEventListener('keydown', onKeydown);
            }
        };

        textEl.addEventListener('blur', onBlur);
        textEl.addEventListener('keydown', onKeydown);
    }


    // --- View Switching ---
    function switchToCategoriesView() {
        if (categoriesView) categoriesView.classList.remove('hidden');
        if (promptsView) promptsView.classList.add('hidden');
        currentView = 'categories';
    }

    function switchToPromptsView() {
        if (categoriesView) categoriesView.classList.add('hidden');
        if (promptsView) promptsView.classList.remove('hidden');
        currentView = 'prompts';
    }

    // --- Event Handlers & Message Posting ---
    addCategoryButton?.addEventListener('click', () => {
        const name = newCategoryInput?.value.trim();
        if (name) {
            vscode.postMessage({ command: 'addCategory', name: name });
            if (newCategoryInput) newCategoryInput.value = '';
        } else {
            // Optionally, show a small validation message in the UI
            vscode.postMessage({ command: 'showError', message: 'Category name cannot be empty.' });
        }
    });

    newCategoryInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addCategoryButton?.click();
        }
    });

    function handleEditCategory(categoryId, currentName) {
        const newName = prompt(`Edit category name:`, currentName); // Using browser prompt for simplicity for now
        if (newName && newName.trim() !== currentName) {
            vscode.postMessage({ command: 'editCategory', categoryId: categoryId, newName: newName.trim() });
        }
    }

    function handleDeleteCategory(categoryId, categoryName) {
        if (confirm(`Are you sure you want to delete category "${categoryName}"? Prompts will be moved to Uncategorized.`)) {
            vscode.postMessage({ command: 'deleteCategory', categoryId: categoryId });
        }
    }

    backToCategoriesButton?.addEventListener('click', () => {
        vscode.postMessage({ command: 'getCategories' }); // This will trigger re-render of categories view
    });

    addPromptButton?.addEventListener('click', () => {
        const text = newPromptTextarea?.value.trim();
        if (text && currentCategoryId) {
            vscode.postMessage({ command: 'addPrompt', categoryId: currentCategoryId, text: text });
            if (newPromptTextarea) newPromptTextarea.value = '';
        } else if (!text) {
             vscode.postMessage({ command: 'showError', message: 'Prompt text cannot be empty.' });
        }
    });

    function handleDeletePrompt(promptId, promptText) {
        const shortText = promptText.length > 50 ? promptText.substring(0, 47) + '...' : promptText;
        if (confirm(`Are you sure you want to delete prompt "${shortText}"?`)) {
            vscode.postMessage({ command: 'deletePrompt', promptId: promptId, categoryId: currentCategoryId });
        }
    }

    // --- Message Listener from Extension ---
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'updateCategories':
                categories = message.categories || [];
                renderCategories();
                break;
            case 'updatePrompts':
                prompts = message.prompts || [];
                currentCategoryId = message.categoryId; // Ensure we have the current category ID for context
                currentCategoryName = message.categoryName;
                renderPrompts();
                break;
            case 'promptCopied': // Feedback that copy was successful (optional)
                // Could show a temporary "Copied!" message
                console.log('Prompt text copied to clipboard.');
                break;
            case 'showErrorInWebview': // For backend to send error messages
                alert(`Error: ${message.message}`); // Simple alert for now
                break;
        }
    });

    // --- Initial Load ---
    // Request initial categories when the webview loads
    vscode.postMessage({ command: 'getCategories' });

}());
