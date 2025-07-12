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
    const newCategoryInput = /** @type {HTMLInputElement} */ (document.getElementById('new-category-name'));

    const backToCategoriesButton = document.getElementById('back-to-categories-btn');
    const addPromptButton = document.getElementById('add-prompt-btn');
    const newPromptTitleInput = document.getElementById('new-prompt-title');
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
                editBtn.dataset.categoryName = cat.name; // Keep for context if needed, but new fn uses live value
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent card click
                    // Pass the name display element, category ID, and current name
                    makeCategoryNameEditable(nameEl, cat.id, nameEl.textContent || cat.name);
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

                // Title
                const titleEl = document.createElement('div');
                titleEl.className = 'prompt-title';
                titleEl.textContent = prompt.title;
                box.appendChild(titleEl);

                // Text
                const textEl = document.createElement('div');
                textEl.className = 'prompt-text';
                textEl.textContent = prompt.text;
                box.appendChild(textEl);

                // Actions
                const actions = document.createElement('div');
                actions.className = 'prompt-actions';

                // Edit button
                const editBtn = document.createElement('button');
                editBtn.innerHTML = '<span class="icon-edit" title="Edit prompt"></span>';
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    makePromptEditable(box, prompt.id, prompt.title, prompt.text);
                });
                actions.appendChild(editBtn);

                // Delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.innerHTML = '<span class="icon-delete" title="Delete prompt"></span>';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    handleDeletePrompt(prompt.id, prompt.text);
                });
                actions.appendChild(deleteBtn);

                box.appendChild(actions);

                // Copy on click (optional: keep for quick copy)
                box.addEventListener('click', (e) => {
                    // Only copy if not clicking on an action button
                    if (e.target === box || e.target === titleEl || e.target === textEl) {
                        vscode.postMessage({ command: 'copyPromptText', text: prompt.text });
                    }
                });
                // Keyboard accessibility
                box.setAttribute('tabindex', '0');
                box.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        vscode.postMessage({ command: 'copyPromptText', text: prompt.text });
                    }
                });

                promptsListContainer.appendChild(box);
            });
        }
        switchToPromptsView();
    }

    function makePromptEditable(box, promptId, currentTitle, currentText) {
        // Remove existing edit UI if any
        box.innerHTML = '';
        // Title input
        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.value = currentTitle;
        titleInput.className = 'prompt-title-edit-input';
        box.appendChild(titleInput);
        // Textarea
        const textArea = document.createElement('textarea');
        textArea.value = currentText;
        textArea.className = 'prompt-text-edit-input';
        box.appendChild(textArea);
        // Button row
        const btnRow = document.createElement('div');
        btnRow.className = 'prompt-edit-btn-row';
        // Save button
        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save';
        saveBtn.className = 'prompt-edit-save-btn';
        saveBtn.addEventListener('click', () => {
            const newTitle = titleInput.value.trim();
            const newText = textArea.value.trim();
            if (newTitle && newText) {
                vscode.postMessage({ command: 'editPrompt', promptId: promptId, data: { title: newTitle, text: newText }, categoryId: currentCategoryId });
            } else {
                showTemporaryMessage(box, 'Title and text cannot be empty.');
            }
        });
        btnRow.appendChild(saveBtn);
        // Cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.className = 'prompt-edit-cancel-btn';
        cancelBtn.addEventListener('click', () => {
            renderPrompts();
        });
        btnRow.appendChild(cancelBtn);
        box.appendChild(btnRow);
        // Focus title input
        titleInput.focus();
    }

    function showTemporaryMessage(containerElement, messageText) {
        if (!containerElement) return;
        const messageDiv = document.createElement('div');
        messageDiv.textContent = messageText;
        messageDiv.className = 'temp-message'; // Style this

        containerElement.appendChild(messageDiv);
        setTimeout(() => {
            messageDiv.remove();
        }, 1500); // Remove after 1.5 seconds
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
        const name = newCategoryInput?.value?.trim();
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

    function makeCategoryNameEditable(nameDisplayElement, categoryId, currentName) {
        // Prevent multiple inline edits
        if (nameDisplayElement.querySelector('input')) return;

        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.className = 'category-name-edit-input'; // For styling

        const originalParent = nameDisplayElement.parentNode;

        const saveCategoryName = () => {
            const newName = input.value.trim();
            nameDisplayElement.textContent = newName || currentName; // Revert to old if new is empty
            originalParent?.replaceChild(nameDisplayElement, input); // Put original div back

            if (newName && newName !== currentName) {
                vscode.postMessage({ command: 'editCategory', categoryId: categoryId, newName: newName });
            }
        };

        const cancelEdit = () => {
            nameDisplayElement.textContent = currentName;
            originalParent?.replaceChild(nameDisplayElement, input);
        };

        input.addEventListener('blur', saveCategoryName);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveCategoryName();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelEdit();
            }
        });

        originalParent?.replaceChild(input, nameDisplayElement); // Replace div with input
        input.focus();
        input.select();
    }

    function handleDeleteCategory(categoryId, categoryName) {
        // Removed confirm() dialog as per new requirements
        vscode.postMessage({ command: 'deleteCategory', categoryId: categoryId });
    }

    backToCategoriesButton?.addEventListener('click', () => {
        vscode.postMessage({ command: 'getCategories' }); // This will trigger re-render of categories view
    });

    // Add prompt form logic
    addPromptButton?.addEventListener('click', () => {
        const title = newPromptTitleInput ? (newPromptTitleInput instanceof HTMLInputElement ? newPromptTitleInput.value.trim() : '') : '';
        const text = newPromptTextarea ? (newPromptTextarea instanceof HTMLTextAreaElement ? newPromptTextarea.value.trim() : '') : '';
        if (title && text && currentCategoryId) {
            vscode.postMessage({ command: 'addPrompt', categoryId: currentCategoryId, data: { title, text } });
            if (newPromptTitleInput && newPromptTitleInput instanceof HTMLInputElement) newPromptTitleInput.value = '';
            if (newPromptTextarea && newPromptTextarea instanceof HTMLTextAreaElement) newPromptTextarea.value = '';
        } else if (!title) {
            vscode.postMessage({ command: 'showError', message: 'Prompt title cannot be empty.' });
        } else if (!text) {
            vscode.postMessage({ command: 'showError', message: 'Prompt text cannot be empty.' });
        }
    });

    function handleDeletePrompt(promptId, promptText) {
        // Removed confirm() dialog as per new requirements
        vscode.postMessage({ command: 'deletePrompt', promptId: promptId, categoryId: currentCategoryId });
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
                // alert(`Error: ${message.message}`); // Simple alert for now
                vscode.postMessage({ command: 'showError', message: `${message.message}` });
                break;
        }
    });

    // --- Initial Load ---
    // Request initial categories when the webview loads
    vscode.postMessage({ command: 'getCategories' });

}());
