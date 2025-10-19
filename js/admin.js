// Simple admin: products and categories management (localStorage fallback)

(function () {
    const PRODUCTS_KEY = 'local-products';
    const CATEGORIES_KEY = 'local-categories';

    // --- helpers ---
    function el(id) { return document.getElementById(id); }
    function safeParse(raw) {
        try { return raw ? JSON.parse(raw) : []; } catch { return []; }
    }
    function loadLocal(key) { return safeParse(localStorage.getItem(key)); }
    function saveLocal(key, arr) { localStorage.setItem(key, JSON.stringify(arr)); }

    function fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            if (!file) return resolve('');
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (e) => reject(e);
            try { reader.readAsDataURL(file); } catch (err) { reject(err); }
        });
    }

    /* --- helper: resize/compress image file to dataURL --- */
    function resizeImageFileToDataURL(file, maxWidth = 1000, maxHeight = 1000, quality = 0.7) {
        return new Promise((resolve, reject) => {
            if (!file) return resolve('');
            const img = new Image();
            const reader = new FileReader();
            reader.onerror = reject;
            reader.onload = () => {
                img.onload = () => {
                    // calculate new size keeping aspect ratio
                    let w = img.width, h = img.height;
                    const ratio = Math.min(1, maxWidth / w, maxHeight / h);
                    w = Math.round(w * ratio);
                    h = Math.round(h * ratio);
                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    try {
                        const dataUrl = canvas.toDataURL('image/jpeg', quality);
                        resolve(dataUrl);
                    } catch (err) {
                        reject(err);
                    }
                };
                img.onerror = reject;
                img.src = reader.result;
            };
            reader.readAsDataURL(file);
        });
    }

    /* --- choose conversion strategy for a file: small -> full dataURL, large -> resized/compressed --- */
    async function convertFileForStorage(file) {
        if (!file) return '';
        // threshold in bytes (200 KB)
        const THRESHOLD = 200 * 1024;
        try {
            if (file.size > THRESHOLD) {
                // resize/compress
                return await resizeImageFileToDataURL(file, 1000, 1000, 0.7);
            } else {
                // small file: plain dataURL
                return await fileToDataURL(file);
            }
        } catch (err) {
            console.warn('convertFileForStorage failed, falling back to raw dataURL', err);
            try { return await fileToDataURL(file); } catch (e) { return ''; }
        }
    }

    /* --- safe localStorage save with quota handling --- */
    function safeSaveLocal(key, arr) {
        try {
            localStorage.setItem(key, JSON.stringify(arr));
            return true;
        } catch (err) {
            if (err && err.name === 'QuotaExceededError') {
                console.warn('QuotaExceededError saving', key);
                // attempt to free up space: remove half of oldest items for products/categories
                try {
                    const other = key === 'local-products' ? 'local-categories' : 'local-products';
                    const existing = safeParse(localStorage.getItem(key));
                    if (Array.isArray(existing) && existing.length > 2) {
                        const keep = existing.slice(0, Math.max(1, Math.floor(existing.length / 2)));
                        localStorage.setItem(key, JSON.stringify(keep));
                        // try again
                        localStorage.setItem(key, JSON.stringify(arr));
                        return true;
                    }
                    // if cannot free, notify user
                } catch (e) { /* ignore */ }
            }
            alert('Failed to save locally: storage quota exceeded. Clear some items in Admin or use smaller images.');
            return false;
        }
    }

    // --- tabs ---
    const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
    tabButtons.forEach(btn => btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        document.querySelectorAll('.tab-panel').forEach(p => {
            p.style.display = (p.id === 'tab-' + tab) ? '' : 'none';
        });
    }));

    // --- renderers ---
    function renderProductsList() {
        const container = el('productsList');
        if (!container) return;
        const arr = loadLocal(PRODUCTS_KEY);
        container.innerHTML = '';
        if (!arr.length) { container.innerHTML = '<div style="color:#666">No products.</div>'; return; }
        arr.forEach(p => {
            const item = document.createElement('div');
            item.className = 'admin-item';
            item.innerHTML = `
        <img src="${p.image || 'images/placeholder.png'}" alt="" />
        <div class="meta">
          <div style="font-weight:700">${escapeHtml(p.title)}</div>
          <div style="color:#777">LKR ${Number(p.price).toLocaleString()}</div>
        </div>
        <div class="actions">
          <button class="btn-small btn-delete">Delete</button>
        </div>
      `;
            item.querySelector('.btn-delete').addEventListener('click', () => {
                const keep = loadLocal(PRODUCTS_KEY).filter(x => x.id !== p.id);
                saveLocal(PRODUCTS_KEY, keep);
                renderProductsList();
            });
            container.appendChild(item);
        });
    }

    function renderCategoriesList() {
        const container = el('categoriesList');
        if (!container) return;
        const arr = loadLocal(CATEGORIES_KEY);
        container.innerHTML = '';
        if (!arr.length) { container.innerHTML = '<div style="color:#666">No categories.</div>'; return; }
        arr.forEach(c => {
            const item = document.createElement('div');
            item.className = 'admin-item';
            item.innerHTML = `
        <img src="${c.image || 'images/placeholder.png'}" alt="" />
        <div class="meta">
          <div style="font-weight:700">${escapeHtml(c.name)}</div>
        </div>
        <div class="actions">
          <button class="btn-small btn-delete">Delete</button>
        </div>
      `;
            item.querySelector('.btn-delete').addEventListener('click', () => {
                const keep = loadLocal(CATEGORIES_KEY).filter(x => x.id !== c.id);
                saveLocal(CATEGORIES_KEY, keep);
                renderCategoriesList();
                window.dispatchEvent(new Event('localCategoriesUpdated'));
            });
            container.appendChild(item);
        });
    }

    // small helper to avoid XSS when injecting text
    function escapeHtml(str) {
        return String(str || '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
    }

    // --- product form (file -> dataURL + submit) ---
    {
        // replace existing addProductForm submit handler with this robust version
        const addProductForm = el('addProductForm');
        if (addProductForm) {
            addProductForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                try {
                    console.log('[admin] addProductForm submit');

                    const titleEl = el('prod-title');
                    const priceEl = el('prod-price');
                    const descEl = el('prod-desc');
                    const catSel = el('prod-category');
                    const imageInput = el('prod-image'); // from earlier code
                    const fileInput = el('prod-image-file'); // from earlier code

                    if (!titleEl || !priceEl) {
                        console.error('[admin] form elements missing (prod-title/prod-price)');
                        return;
                    }

                    const title = titleEl.value.trim();
                    if (!title) {
                        console.warn('[admin] title is empty, product not added');
                        return;
                    }
                    const price = Number(priceEl.value) || 0;
                    const description = descEl ? descEl.value.trim() : '';

                    // ensure image: prefer text input, otherwise convert selected file
                    let image = imageInput && imageInput.value.trim() ? imageInput.value.trim() : '';
                    if ((!image || image === '') && fileInput && fileInput.files && fileInput.files[0]) {
                        console.log('[admin] converting selected file to dataURL...');
                        try {
                            image = await convertFileForStorage(fileInput.files[0]);
                            console.log('[admin] file converted, length:', image ? image.length : 0);
                        } catch (err) {
                            console.warn('[admin] fileToDataURL failed, continuing without image', err);
                            image = '';
                        }
                    }

                    // read selected category if available
                    let category = null;
                    if (catSel && catSel.value) {
                        const cid = String(catSel.value);
                        const found = loadLocal(CATEGORIES_KEY).find(c => String(c.id) === cid);
                        if (found) category = { id: found.id, name: found.name };
                    }

                    const payload = { id: Date.now(), title, price, description, image, category };
                    const arr = loadLocal(PRODUCTS_KEY);
                    arr.unshift(payload);
                    saveLocal(PRODUCTS_KEY, arr);

                    // notify and refresh UI
                    window.dispatchEvent(new Event('localProductsUpdated'));
                    renderProductsList();

                    // reset form + preview
                    addProductForm.reset();
                    if (el('prod-image-preview')) el('prod-image-preview').innerHTML = '';
                    console.log('[admin] product saved locally', payload);
                } catch (err) {
                    console.error('[admin] add product failed', err);
                }
            });
        } else {
            console.warn('[admin] addProductForm not found in DOM');
        }
    }

    // --- category form (file -> dataURL + submit) ---
    const catFile = el('cat-image-file');
    const catImageInput = el('cat-image-url');
    const catPreview = el('cat-image-preview');
    const addCategoryForm = el('addCategoryForm');

    if (catFile) {
        catFile.addEventListener('change', async (e) => {
            const f = e.target.files && e.target.files[0];
            if (!f) { if (catPreview) catPreview.innerHTML = ''; if (catImageInput) catImageInput.value = ''; return; }
            try {
                const data = await fileToDataURL(f);
                if (catImageInput) catImageInput.value = data;
                if (catPreview) catPreview.innerHTML = `<img src="${data}" alt="preview" style="max-width:160px;max-height:120px;border-radius:6px;object-fit:cover;">`;
                console.log('cat image converted, length', data.length);
            } catch (err) {
                console.error('category image conversion failed', err);
                if (catPreview) catPreview.innerHTML = '<div style="color:#c00">Preview failed</div>';
            }
        });
    }

    if (addCategoryForm) {
        addCategoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = el('cat-name') ? el('cat-name').value.trim() : '';
            let image = catImageInput && catImageInput.value.trim() ? catImageInput.value.trim() : '';

            try {
                if ((!image || image === '') && catFile && catFile.files && catFile.files[0]) {
                    image = await fileToDataURL(catFile.files[0]);
                }
            } catch (err) {
                console.warn('category image conversion at submit failed', err);
            }

            const payload = { id: Date.now(), name, image };
            const arr = loadLocal(CATEGORIES_KEY);
            arr.unshift(payload);
            saveLocal(CATEGORIES_KEY, arr);

            addCategoryForm.reset();
            if (catPreview) catPreview.innerHTML = '';
            renderCategoriesList();
            window.dispatchEvent(new Event('localCategoriesUpdated'));
        });
    }

    // --- logout ---
    const logoutBtn = el('adminLogoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => { window.location.href = 'admin-register.html'; });

    // --- initial render ---
    renderProductsList();
    renderCategoriesList();

    // add near top (after loadLocal / saveLocal helpers)
    function populateProductCategoryOptions() {
        const sel = el('prod-category');
        if (!sel) return;
        sel.innerHTML = '<option value="">Uncategorized</option>';
        const cats = loadLocal(CATEGORIES_KEY);
        cats.forEach(c => {
            const opt = document.createElement('option');
            opt.value = String(c.id);
            opt.textContent = c.name;
            sel.appendChild(opt);
        });
    }

    // call after initial render and when categories change
    populateProductCategoryOptions();
    window.addEventListener('localCategoriesUpdated', populateProductCategoryOptions);

    // expose helper for other scripts that load categories onto homepage
    window.adminClient = {
        getLocalCategories: () => loadLocal(CATEGORIES_KEY)
    };

    // add product file -> dataURL + preview handler (mirror of category handler)
    const prodFile = el('prod-image-file');
    const prodImageInput = el('prod-image');
    const prodPreview = el('prod-image-preview');

    if (prodFile) {
        prodFile.addEventListener('change', async (e) => {
            const f = e.target.files && e.target.files[0];
            if (!f) { if (prodPreview) prodPreview.innerHTML = ''; if (prodImageInput) prodImageInput.value = ''; return; }
            try {
                const data = await fileToDataURL(f);
                if (prodImageInput) prodImageInput.value = data;
                if (prodPreview) prodPreview.innerHTML = `<img src="${data}" alt="preview" style="max-width:160px;max-height:120px;border-radius:6px;object-fit:cover;">`;
                console.log('prod image converted, length', data.length);
            } catch (err) {
                console.error('product image conversion failed', err);
                if (prodPreview) prodPreview.innerHTML = '<div style="color:#c00">Preview failed</div>';
            }
        });
    }
})();

