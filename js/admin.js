// Admin Panel JavaScript with Backend Integration Points
class AdminPanel {
    constructor() {
        this.products = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalPages = 0;
        this.currentEditId = null;
        this.currentDeleteId = null;
        
        // API Configuration - Update these URLs to match your backend
        this.apiConfig = {
            baseUrl: 'http://localhost:3000/api', // Update with your backend URL
            endpoints: {
                products: '/products',
                categories: '/categories',
                upload: '/upload'
            }
        };
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadProducts();
        this.loadCategories();
    }
    
    bindEvents() {
        // Form submissions
        document.getElementById('addProductForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addProduct();
        });
        
        document.getElementById('editProductForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateProduct();
        });
        
        // Modal controls
        document.getElementById('closeEditModal').addEventListener('click', () => {
            this.closeEditModal();
        });
        
        document.getElementById('closeDeleteModal').addEventListener('click', () => {
            this.closeDeleteModal();
        });
        
        document.getElementById('cancelEdit').addEventListener('click', () => {
            this.closeEditModal();
        });
        
        document.getElementById('cancelDelete').addEventListener('click', () => {
            this.closeDeleteModal();
        });
        
        document.getElementById('confirmDelete').addEventListener('click', () => {
            this.deleteProduct();
        });
        
        // Search and filter
        document.getElementById('searchProducts').addEventListener('input', (e) => {
            this.filterProducts();
        });
        
        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.filterProducts();
        });
        
        // Clear form
        document.getElementById('clearForm').addEventListener('click', () => {
            this.clearAddForm();
        });
        
        // Image preview
        document.getElementById('productImages').addEventListener('change', (e) => {
            this.previewImages(e.target.files, 'imagePreview');
        });
        
        document.getElementById('editProductImages').addEventListener('change', (e) => {
            this.previewImages(e.target.files, 'currentImages');
        });
        
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });
        
        // Close modals on overlay click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }
    
    // API Helper Methods
    async apiRequest(url, options = {}) {
        try {
            const response = await fetch(`${this.apiConfig.baseUrl}${url}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`, // Add auth token
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            this.showNotification('Error connecting to server', 'error');
            throw error;
        }
    }
    
    getAuthToken() {
        // Get auth token from localStorage or session
        return localStorage.getItem('adminToken') || '';
    }
    
    // Product Management Methods
    async loadProducts() {
        try {
            this.showLoading('productsTableBody');
            const data = await this.apiRequest(this.apiConfig.endpoints.products);
            this.products = data.products || data; // Handle different response formats
            this.renderProducts();
        } catch (error) {
            this.showError('Failed to load products');
            // Fallback to mock data for development
            this.loadMockProducts();
        }
    }
    
    async addProduct() {
        try {
            const formData = new FormData(document.getElementById('addProductForm'));
            const productData = this.prepareProductData(formData);
            
            const response = await this.apiRequest(this.apiConfig.endpoints.products, {
                method: 'POST',
                body: JSON.stringify(productData)
            });
            
            this.showNotification('Product added successfully', 'success');
            this.clearAddForm();
            this.loadProducts();
        } catch (error) {
            this.showNotification('Failed to add product', 'error');
        }
    }
    
    async updateProduct() {
        try {
            const formData = new FormData(document.getElementById('editProductForm'));
            const productData = this.prepareProductData(formData);
            
            await this.apiRequest(`${this.apiConfig.endpoints.products}/${this.currentEditId}`, {
                method: 'PUT',
                body: JSON.stringify(productData)
            });
            
            this.showNotification('Product updated successfully', 'success');
            this.closeEditModal();
            this.loadProducts();
        } catch (error) {
            this.showNotification('Failed to update product', 'error');
        }
    }
    
    async deleteProduct() {
        try {
            await this.apiRequest(`${this.apiConfig.endpoints.products}/${this.currentDeleteId}`, {
                method: 'DELETE'
            });
            
            this.showNotification('Product deleted successfully', 'success');
            this.closeDeleteModal();
            this.loadProducts();
        } catch (error) {
            this.showNotification('Failed to delete product', 'error');
        }
    }
    
    async loadCategories() {
        try {
            const data = await this.apiRequest(this.apiConfig.endpoints.categories);
            this.populateCategorySelects(data);
        } catch (error) {
            console.log('Categories endpoint not available, using static categories');
        }
    }
    
    // Helper Methods
    prepareProductData(formData) {
        const data = {};
        for (let [key, value] of formData.entries()) {
            if (key === 'images') continue; // Handle images separately
            data[key] = value;
        }
        
        // Convert price to number
        if (data.price) {
            data.price = parseFloat(data.price);
        }
        
        // Convert stock to number
        if (data.stock) {
            data.stock = parseInt(data.stock);
        }
        
        return data;
    }
    
    populateCategorySelects(categories) {
        const selects = ['productCategory', 'editProductCategory', 'categoryFilter'];
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select && categories) {
                // Clear existing options except the first one
                const firstOption = select.querySelector('option[value=""]');
                select.innerHTML = '';
                if (firstOption) select.appendChild(firstOption);
                
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id || category.name;
                    option.textContent = category.name;
                    select.appendChild(option);
                });
            }
        });
    }
    
    renderProducts() {
        const tbody = document.getElementById('productsTableBody');
        const filteredProducts = this.getFilteredProducts();
        const paginatedProducts = this.getPaginatedProducts(filteredProducts);
        
        if (paginatedProducts.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <p>No products found</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = paginatedProducts.map(product => `
            <tr>
                <td>
                    <img src="${product.image || 'images/placeholder1.jpg'}" 
                         alt="${product.name}" 
                         class="product-image">
                </td>
                <td>
                    <div class="product-name" title="${product.name}">
                        ${product.name}
                    </div>
                </td>
                <td>
                    <span class="product-category">${product.category}</span>
                </td>
                <td>
                    <span class="product-price">$${product.price.toFixed(2)}</span>
                </td>
                <td>
                    <span class="product-stock ${this.getStockClass(product.stock)}">
                        ${product.stock}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="adminPanel.editProduct(${product.id})">
                            Edit
                        </button>
                        <button class="btn-delete" onclick="adminPanel.confirmDelete(${product.id})">
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        this.renderPagination(filteredProducts.length);
    }
    
    getFilteredProducts() {
        const searchTerm = document.getElementById('searchProducts').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        
        return this.products.filter(product => {
            const matchesSearch = !searchTerm || 
                product.name.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm);
            
            const matchesCategory = !categoryFilter || product.category === categoryFilter;
            
            return matchesSearch && matchesCategory;
        });
    }
    
    getPaginatedProducts(products) {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return products.slice(startIndex, endIndex);
    }
    
    renderPagination(totalItems) {
        this.totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const pagination = document.getElementById('pagination');
        
        if (this.totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <button ${this.currentPage === 1 ? 'disabled' : ''} 
                    onclick="adminPanel.goToPage(${this.currentPage - 1})">
                Previous
            </button>
        `;
        
        // Page numbers
        for (let i = 1; i <= this.totalPages; i++) {
            if (i === 1 || i === this.totalPages || 
                (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                paginationHTML += `
                    <button class="${i === this.currentPage ? 'active' : ''}" 
                            onclick="adminPanel.goToPage(${i})">
                        ${i}
                    </button>
                `;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                paginationHTML += '<span>...</span>';
            }
        }
        
        // Next button
        paginationHTML += `
            <button ${this.currentPage === this.totalPages ? 'disabled' : ''} 
                    onclick="adminPanel.goToPage(${this.currentPage + 1})">
                Next
            </button>
        `;
        
        pagination.innerHTML = paginationHTML;
    }
    
    goToPage(page) {
        this.currentPage = page;
        this.renderProducts();
    }
    
    filterProducts() {
        this.currentPage = 1;
        this.renderProducts();
    }
    
    getStockClass(stock) {
        if (stock <= 5) return 'stock-low';
        if (stock <= 20) return 'stock-medium';
        return 'stock-high';
    }
    
    editProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        this.currentEditId = productId;
        
        // Populate edit form
        document.getElementById('editProductId').value = product.id;
        document.getElementById('editProductName').value = product.name;
        document.getElementById('editProductPrice').value = product.price;
        document.getElementById('editProductCategory').value = product.category;
        document.getElementById('editProductStock').value = product.stock;
        document.getElementById('editProductDescription').value = product.description;
        
        // Show current images
        const currentImages = document.getElementById('currentImages');
        currentImages.innerHTML = '';
        if (product.image) {
            const img = document.createElement('img');
            img.src = product.image;
            img.alt = product.name;
            currentImages.appendChild(img);
        }
        
        document.getElementById('editModal').classList.add('active');
    }
    
    confirmDelete(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        this.currentDeleteId = productId;
        
        // Show product preview
        const preview = document.getElementById('deleteProductPreview');
        preview.innerHTML = `
            <img src="${product.image || 'images/placeholder1.jpg'}" alt="${product.name}">
            <div class="product-preview-info">
                <h4>${product.name}</h4>
                <p>Category: ${product.category} | Price: $${product.price.toFixed(2)}</p>
            </div>
        `;
        
        document.getElementById('deleteModal').classList.add('active');
    }
    
    closeEditModal() {
        document.getElementById('editModal').classList.remove('active');
        this.currentEditId = null;
    }
    
    closeDeleteModal() {
        document.getElementById('deleteModal').classList.remove('active');
        this.currentDeleteId = null;
    }
    
    clearAddForm() {
        document.getElementById('addProductForm').reset();
        document.getElementById('imagePreview').innerHTML = '';
    }
    
    previewImages(files, containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.alt = file.name;
                    container.appendChild(img);
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    showLoading(containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = `
            <tr>
                <td colspan="6" class="loading">
                    <div class="spinner"></div>
                    Loading...
                </td>
            </tr>
        `;
    }
    
    showError(message) {
        const container = document.getElementById('productsTableBody');
        container.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <p>${message}</p>
                </td>
            </tr>
        `;
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '6px',
            color: '#fff',
            fontWeight: '500',
            zIndex: '10001',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });
        
        // Set background color based on type
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    logout() {
        localStorage.removeItem('adminToken');
        window.location.href = 'index.html';
    }
    
    // Mock data for development (remove when backend is ready)
    loadMockProducts() {
        this.products = [
            {
                id: 1,
                name: 'Golden Elegance Necklace',
                category: 'necklaces',
                price: 40000,
                stock: 15,
                description: 'Handcrafted in 18K gold with dazzling diamonds',
                image: 'images/necklace_1.png'
            },
            {
                id: 2,
                name: 'Diamond Ring',
                category: 'rings',
                price: 950,
                stock: 8,
                description: 'Exquisite diamond ring with platinum setting',
                image: 'images/necklace_2.png'
            },
            {
                id: 3,
                name: 'Pearl Earrings',
                category: 'earrings',
                price: 780,
                stock: 3,
                description: 'Classic pearl earrings for elegant occasions',
                image: 'images/necklace_3.png'
            },
            {
                id: 4,
                name: 'Luxury Bracelet',
                category: 'bracelets',
                price: 1100,
                stock: 12,
                description: 'Sophisticated gold bracelet with intricate design',
                image: 'images/necklace_4.png'
            }
        ];
        this.renderProducts();
    }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});

