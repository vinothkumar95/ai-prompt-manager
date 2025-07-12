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
    const newPromptTextarea = /** @type {HTMLTextAreaElement} */ (document.getElementById('new-prompt-text'));


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
        // If already editing this element, don't add more buttons etc.
        if (textEl.getAttribute('contenteditable') === 'true') return;

        textEl.setAttribute('contenteditable', 'true');
        textEl.focus();
        // Select all text in contentEditable element
        const range = document.createRange();
        range.selectNodeContents(textEl);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);

        const originalText = currentText;
        const promptBox = textEl.closest('.prompt-box');

        // Remove existing save button if any (e.g. from a previous edit attempt that was interrupted)
        const existingSaveBtn = promptBox?.querySelector('.prompt-edit-save-btn');
        existingSaveBtn?.remove();

        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save';
        saveBtn.className = 'prompt-edit-save-btn'; // For styling

        const cleanup = () => {
            textEl.removeAttribute('contenteditable');
            saveBtn.remove();
            textEl.removeEventListener('blur', onBlur);
            textEl.removeEventListener('keydown', onKeydown);
            // Restore focus to the prompt text element or prompt box for accessibility
            textEl.focus();
        };

        const saveChanges = () => {
            const newText = textEl.textContent.trim();
            if (newText && newText !== originalText) {
                vscode.postMessage({ command: 'editPrompt', promptId: promptId, newText: newText, categoryId: currentCategoryId });
                // Optimistically show saved message - backend will refresh the list
                showTemporaryMessage(promptBox, "Saved!");
            } else {
                textEl.textContent = originalText; // Revert if empty or unchanged
            }
            cleanup();
        };

        saveBtn.addEventListener('click', saveChanges);
        promptBox?.appendChild(saveBtn); // Append save button to the prompt box

        const onBlur = (e) => {
            // IMPORTANT: Allow click on save button without triggering blur-to-save first
            // Check if the relatedTarget (where focus is going) is the save button
            if (e.relatedTarget !== saveBtn) {
                saveChanges();
            }
        };
        const onKeydown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                saveChanges();
            } else if (e.key === 'Escape') {
                textEl.textContent = originalText; // Revert
                cleanup();
            }
        };

        textEl.addEventListener('blur', onBlur);
        textEl.addEventListener('keydown', onKeydown);
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

    addPromptButton?.addEventListener('click', () => {
        const text = newPromptTextarea?.value?.trim();
        if (text && currentCategoryId) {
            vscode.postMessage({ command: 'addPrompt', categoryId: currentCategoryId, text: text });
            if (newPromptTextarea) newPromptTextarea.value = '';
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
