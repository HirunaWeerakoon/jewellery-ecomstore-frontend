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

