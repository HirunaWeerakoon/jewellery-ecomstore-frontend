(function () {
    const rail = document.querySelector('.category-rail');
    if (!rail) return;

    // If you later add a backend, set window.API_BASE_URL = 'http://localhost:3000/api' before this script
    const baseUrl = window.API_BASE_URL || '';

    function render(categories) {
        rail.innerHTML = '';
        if (!Array.isArray(categories) || categories.length === 0) {
            rail.innerHTML = '<div style="color:#777;padding:12px">No categories</div>';
            return;
        }
        categories.forEach(c => {
            const card = document.createElement('a');
            card.className = 'category-card';
            card.href = 'catalog.html?category=' + encodeURIComponent(c.name || '');
            card.innerHTML = `
        <img src="${c.image || 'images/placeholder.png'}" alt="${c.name || ''}" />
        <div class="label">${c.name || ''}</div>
      `;
            rail.appendChild(card);
        });
    }

    async function fetchCategoriesServer() {
        if (!baseUrl) return null;
        try {
            const res = await fetch(baseUrl.replace(/\/$/, '') + '/categories');
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            return null;
        }
    }

    async function load() {
        // Prefer server only if API_BASE_URL is set. Otherwise use localStorage only.
        let categories = null;
        if (baseUrl) categories = await fetchCategoriesServer();
        if (Array.isArray(categories) && categories.length) {
            render(categories);
            return;
        }

        const raw = localStorage.getItem('local-categories');
        const arr = raw ? JSON.parse(raw) : [];
        render(arr);
    }

    load();

    // update when admin modifies categories
    window.addEventListener('localCategoriesUpdated', load);
})();