// Product Page JavaScript with Backend Integration
class ProductManager {
    constructor() {
        this.product = null;
        this.productId = null;

        // API Configuration - Update these URLs to match your backend
        this.apiConfig = {
            baseUrl: 'http://localhost:3000/api', // Update with your backend URL
            endpoints: {
                product: '/products'
            }
        };

        this.init();
    }

    init() {
        this.getProductId();
        this.loadProduct();
    }

    getProductId() {
        // Get product ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        this.productId = urlParams.get('id');

        // If no ID in URL, use a default for development
        if (!this.productId) {
            this.productId = 1; // Default product ID
        }
    }

    // API Helper Methods
    async apiRequest(url, options = {}) {
        const TIMEOUT_MS = 1500; // fast-fail to mock if backend is slow/unavailable
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort('timeout'), TIMEOUT_MS);

        try {
            const response = await fetch(`${this.apiConfig.baseUrl}${url}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                signal: controller.signal,
                ...options
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            // Prefer quick UX over waiting for long network timeouts
            console.warn('API request fallback to mock due to error:', error);
            return this.getMockProduct();
        }
    }

    async loadProduct() {
        try {
            this.showLoading();

            const data = await this.apiRequest(`${this.apiConfig.endpoints.product}/${this.productId}`);
            this.product = data.product || data; // Handle different response formats

            this.renderProduct();
        } catch (error) {
            console.error('Failed to load product:', error);
            this.loadMockProduct();
        }
    }

    renderProduct() {
        if (!this.product) {
            this.showError('Product not found');
            return;
        }

        const productInfo = document.querySelector('.product-info');

        // If loading placeholder exists, remove and reveal content
        if (productInfo) {
            const loadingEl = productInfo.querySelector('.loading-product');
            if (loadingEl) loadingEl.remove();
            // unhide any hidden children
            Array.from(productInfo.children).forEach((child) => {
                if (!(child.classList && child.classList.contains('loading-product'))) {
                    child.style.display = '';
                }
            });
        }

        // Ensure required DOM exists (in case a previous version replaced it)
        let titleElement = document.querySelector('.product-title');
        let priceElement = document.querySelector('.product-price');
        let descriptionElement = document.querySelector('.product-description');
        let addToCartBtn = document.querySelector('.add-to-cart-btn');

        if (productInfo && (!titleElement || !priceElement || !descriptionElement || !addToCartBtn)) {
            productInfo.innerHTML = `
                <h1 class="product-title"></h1>
                <p class="product-price"></p>
                <p class="product-description"></p>
                <div style="display:flex; gap:12px;">
                  <button class="btn-add-cart add-to-cart-btn" data-product="" data-price="">ADD TO CART</button>
                </div>
            `;
            titleElement = productInfo.querySelector('.product-title');
            priceElement = productInfo.querySelector('.product-price');
            descriptionElement = productInfo.querySelector('.product-description');
            addToCartBtn = productInfo.querySelector('.add-to-cart-btn');
        }

        // Update product title
        if (titleElement) {
            titleElement.textContent = this.product.name;
        }

        // Update product price
        if (priceElement) {
            priceElement.textContent = `$${this.product.price.toFixed(2)}`;
        }

        // Update product description
        if (descriptionElement) {
            descriptionElement.textContent = this.product.description;
        }

        // Update product image
        const imageElement = document.querySelector('.main-image');
        if (imageElement) {
            imageElement.src = this.product.image || 'images/placeholder1.jpg';
            imageElement.alt = this.product.name;
        }

        // Update add to cart button with product data
        if (addToCartBtn) {
            addToCartBtn.setAttribute('data-product', this.product.name);
            addToCartBtn.setAttribute('data-price', this.product.price);
        }

        // Update page title
        document.title = `${this.product.name} - Luxury Boutique`;
    }

    showLoading() {
        const productInfo = document.querySelector('.product-info');
        if (!productInfo) return;

        // Hide existing content non-destructively
        Array.from(productInfo.children).forEach((child) => {
            child.style.display = 'none';
        });

        // Add loading indicator if not present
        if (!productInfo.querySelector('.loading-product')) {
            const loading = document.createElement('div');
            loading.className = 'loading-product';
            loading.innerHTML = `
                <div class="spinner"></div>
                <p>Loading product...</p>
            `;
            productInfo.appendChild(loading);
        }
    }

    showError(message) {
        const productInfo = document.querySelector('.product-info');
        if (productInfo) {
            productInfo.innerHTML = `
                <div class="error-product">
                    <h3>Error</h3>
                    <p>${message}</p>
                    <a href="catalog.html" class="btn-secondary">Back to Catalog</a>
                </div>
            `;
        }
    }

    // Mock data for development (remove when backend is ready)
    getMockProduct() {
        const mockProducts = {
            1: {
                id: 1,
                name: 'Golden Elegance Necklace',
                price: 40000,
                description: 'Handcrafted in 18K gold with dazzling diamonds, this necklace embodies timeless luxury.',
                image: 'images/necklace_1.png',
                category: 'necklaces'
            },
            2: {
                id: 2,
                name: 'Diamond Ring',
                price: 950,
                description: 'Exquisite diamond ring with platinum setting, perfect for special occasions.',
                image: 'images/necklace_2.png',
                category: 'rings'
            },
            3: {
                id: 3,
                name: 'Pearl Earrings',
                price: 780,
                description: 'Classic pearl earrings for elegant occasions, crafted with attention to detail.',
                image: 'images/necklace_3.png',
                category: 'earrings'
            },
            4: {
                id: 4,
                name: 'Luxury Bracelet',
                price: 1100,
                description: 'Sophisticated gold bracelet with intricate design, a statement piece for any outfit.',
                image: 'images/necklace_4.png',
                category: 'bracelets'
            }
        };

        return mockProducts[this.productId] || mockProducts[1];
    }

    loadMockProduct() {
        this.product = this.getMockProduct();
        this.renderProduct();
    }
}

// Initialize product manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on product page
    if (document.querySelector('.product-page')) {
        window.productManager = new ProductManager();
    }
});

// Review section behaviour
(function () {
    // determine base API URL and product id
    const baseUrl = (window.productManager && window.productManager.apiConfig && window.productManager.apiConfig.baseUrl) || '/api';
    const getProductId = () => {
        if (window.productManager && window.productManager.productId) return window.productManager.productId;
        const params = new URLSearchParams(window.location.search);
        return params.get('id') || 1;
    };
    const productId = getProductId();
    const listEl = document.getElementById('review-list');
    const form = document.getElementById('review-form');
    if (!listEl || !form) return;

    // helper to create star elements
    function createStarNodes(rating) {
        const wrapper = document.createElement('span');
        wrapper.className = 'review-stars';
        // accessible text
        const sr = document.createElement('span');
        sr.className = 'sr-only';
        sr.textContent = `${rating} out of 5`;
        for (let i = 1; i <= 5; i++) {
            const s = document.createElement('span');
            s.className = 'star' + (i <= rating ? ' filled' : '');
            s.setAttribute('aria-hidden', 'true');
            s.textContent = '★';
            wrapper.appendChild(s);
        }
        wrapper.appendChild(sr);
        return wrapper;
    }

    function renderReviews(raw) {
        const reviews = Array.isArray(raw) ? raw : (raw && raw.reviews) ? raw.reviews : [];
        listEl.innerHTML = '';
        if (!reviews || reviews.length === 0) {
            listEl.innerHTML = '<li>No reviews yet — be the first to review!</li>';
            return;
        }
        reviews.forEach(r => {
            const li = document.createElement('li');
            li.style.marginBottom = '12px';
            li.style.borderBottom = '1px solid #eee';
            li.style.paddingBottom = '8px';

            const name = document.createElement('div');
            name.style.fontWeight = '600';
            name.textContent = (r.user && r.user.name) || r.name || 'Anonymous';

            // replace numeric rating with star nodes
            const rating = createStarNodes(Number(r.rating) || 0);

            const comment = document.createElement('div');
            comment.style.marginTop = '6px';
            comment.textContent = r.comment || '';

            const date = document.createElement('div');
            date.style.fontSize = '12px';
            date.style.color = '#666';
            date.style.marginTop = '4px';
            date.textContent = new Date(r.createdAt || r.date || Date.now()).toLocaleString();

            li.appendChild(name);
            li.appendChild(rating);
            li.appendChild(comment);
            li.appendChild(date);
            listEl.appendChild(li);
        });
    }

    async function loadReviews() {
        try {
            const res = await fetch(`${baseUrl.replace(/\/$/, '')}/products/${encodeURIComponent(productId)}/reviews`);
            if (!res.ok) {
                console.warn('No reviews endpoint or non-OK response', res.status);
                return;
            }
            const data = await res.json();
            renderReviews(data);
        } catch (err) {
            console.warn('Failed to load reviews', err);
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = document.getElementById('review-error');
        const submitBtn = document.getElementById('review-submit');
        const rating = Number(document.getElementById('review-rating').value);
        const comment = document.getElementById('review-comment').value.trim();

        if (errorEl) { errorEl.style.display = 'none'; errorEl.textContent = ''; }
        if (!comment) {
            if (errorEl) { errorEl.textContent = 'Please add a comment.'; errorEl.style.display = 'block'; }
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        try {
            const token = localStorage.getItem('token'); // adapt if using other auth
            const res = await fetch(`${baseUrl.replace(/\/$/, '')}/products/${encodeURIComponent(productId)}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: 'Bearer ' + token } : {})
                },
                body: JSON.stringify({ rating, comment })
            });

            if (!res.ok) {
                const errJson = await res.json().catch(() => ({}));
                throw new Error(errJson.message || `Failed to submit review (${res.status})`);
            }

            // Refresh reviews list (server should return created review or allow GET)
            await loadReviews();
            document.getElementById('review-comment').value = '';
            document.getElementById('review-rating').value = '5';
        } catch (err) {
            if (errorEl) { errorEl.textContent = err.message || 'Network error'; errorEl.style.display = 'block'; }
            console.error('Submit review error', err);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit review';
        }
    });

    // initial load
    loadReviews();
})();

// Local-fallback review helpers (try API, otherwise use localStorage)
(function () {
    const params = new URLSearchParams(window.location.search);
    const productId = (window.productManager && window.productManager.productId) || params.get('id') || 'local-product';
    const baseUrl = (window.productManager && window.productManager.apiConfig && window.productManager.apiConfig.baseUrl) || 'http://localhost:3000/api';
    const listEl = document.getElementById('review-list');
    const form = document.getElementById('review-form');
    if (!listEl || !form) return;

    const localKey = `reviews:${productId}`;

    // small helper used by fallback block (same behavior)
    function createStarNodesFallback(rating) {
        const wrapper = document.createElement('span');
        wrapper.className = 'review-stars';
        const sr = document.createElement('span');
        sr.className = 'sr-only';
        sr.textContent = `${rating} out of 5`;
        for (let i = 1; i <= 5; i++) {
            const s = document.createElement('span');
            s.className = 'star' + (i <= rating ? ' filled' : '');
            s.setAttribute('aria-hidden', 'true');
            s.textContent = '★';
            wrapper.appendChild(s);
        }
        wrapper.appendChild(sr);
        return wrapper;
    }

    function renderReviewsArray(reviews) {
        listEl.innerHTML = '';
        if (!reviews || reviews.length === 0) {
            listEl.innerHTML = '<li>No reviews yet — be the first to review!</li>';
            return;
        }
        reviews.forEach(r => {
            const li = document.createElement('li');
            li.style.marginBottom = '12px';
            li.style.borderBottom = '1px solid #eee';
            li.style.paddingBottom = '8px';
            const name = document.createElement('div'); name.style.fontWeight = '600'; name.textContent = r.name || 'Anonymous';
            const ratingNode = createStarNodesFallback(Number(r.rating) || 0);
            const rating = document.createElement('div');
            rating.appendChild(ratingNode);
            const comment = document.createElement('div'); comment.style.marginTop = '6px'; comment.textContent = r.comment || '';
            const date = document.createElement('div'); date.style.fontSize = '12px'; date.style.color = '#666'; date.style.marginTop = '4px'; date.textContent = new Date(r.createdAt || Date.now()).toLocaleString();
            li.append(name, rating, comment, date);
            listEl.appendChild(li);
        });
    }

    async function loadReviews() {
        // try API first
        try {
            const res = await fetch(`${baseUrl.replace(/\/$/, '')}/products/${encodeURIComponent(productId)}/reviews`);
            if (res.ok) {
                const data = await res.json();
                const arr = Array.isArray(data) ? data : (data.reviews || []);
                renderReviewsArray(arr);
                return;
            }
        } catch (e) {
            /* ignore — fallback to localStorage */
        }
        // fallback to localStorage
        const saved = localStorage.getItem(localKey);
        renderReviewsArray(saved ? JSON.parse(saved) : []);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rating = Number(document.getElementById('review-rating').value);
        const comment = document.getElementById('review-comment').value.trim();
        const errorEl = document.getElementById('review-error');
        if (errorEl) { errorEl.style.display = 'none'; errorEl.textContent = ''; }
        if (!comment) {
            if (errorEl) { errorEl.textContent = 'Please add a comment.'; errorEl.style.display = 'block'; }
            return;
        }

        const newReview = { name: 'You', rating, comment, createdAt: new Date().toISOString() };

        // try POST to API, if fails save locally
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${baseUrl.replace(/\/$/, '')}/products/${encodeURIComponent(productId)}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
                body: JSON.stringify({ rating, comment })
            });
            if (res.ok) {
                // reload from server
                await loadReviews();
                document.getElementById('review-comment').value = '';
                document.getElementById('review-rating').value = '5';
                return;
            }
        } catch (e) {
            /* fallback below */
        }

        // local fallback: append and persist
        const saved = localStorage.getItem(localKey);
        const arr = saved ? JSON.parse(saved) : [];
        arr.unshift(newReview);
        localStorage.setItem(localKey, JSON.stringify(arr));
        renderReviewsArray(arr);
        document.getElementById('review-comment').value = '';
        document.getElementById('review-rating').value = '5';
    });

    // initial
    loadReviews();
})();

