// @ts-check

// This script will be run within the modal webview
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

    const backToCategoriesButton = document.getElementById('back-to-categories-btn');
    const closeModalButton = document.getElementById('close-modal-btn');

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

            // Add click handler for navigation
            card.addEventListener('click', () => {
                currentCategoryId = cat.id;
                currentCategoryName = cat.name;
                vscode.postMessage({ command: 'getPromptsForCategory', categoryId: cat.id });
            });
            
            // Add keyboard navigation
            card.addEventListener('keypress', (e) => {
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

                const insertBtn = document.createElement('button');
                insertBtn.innerHTML = '<span class="icon-insert" title="Insert prompt"></span>';
                insertBtn.title = 'Insert prompt';
                insertBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    vscode.postMessage({ command: 'insertPromptText', text: prompt.text });
                });
                actions.appendChild(insertBtn);

                box.appendChild(actions);

                // Add keyboard navigation for insert
                textEl.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        vscode.postMessage({ command: 'insertPromptText', text: prompt.text });
                    }
                });

                promptsListContainer.appendChild(box);
            });
        }
        switchToPromptsView();
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

    // --- Event Handlers ---
    backToCategoriesButton?.addEventListener('click', () => {
        vscode.postMessage({ command: 'getCategories' }); // This will trigger re-render of categories view
    });

    closeModalButton?.addEventListener('click', () => {
        vscode.postMessage({ command: 'closeModal' });
    });

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            vscode.postMessage({ command: 'closeModal' });
        }
    });

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
                currentCategoryId = message.categoryId;
                currentCategoryName = message.categoryName;
                renderPrompts();
                break;
        }
    });

    // --- Initial Load ---
    // Request initial categories when the modal loads
    vscode.postMessage({ command: 'getCategories' });

}()); 