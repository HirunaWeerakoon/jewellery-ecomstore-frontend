document.addEventListener('DOMContentLoaded', () => {
  const header = document.getElementById('siteHeader');
  const hero = document.getElementById('hero');

  // Toggle header style after hero scroll
  const toggleHeader = () => {
    const threshold = Math.max(0, (hero?.offsetHeight || 120) - (header?.offsetHeight || 64));
    header.classList.toggle('is-scrolled', window.scrollY > threshold);
  };
  toggleHeader();
  document.addEventListener('scroll', toggleHeader, { passive: true });

  // Category rail controls
  const rail = document.getElementById('categoryRail');
  const prevBtn = document.getElementById('scrollPrev');
  const nextBtn = document.getElementById('scrollNext');

  const getStep = () => Math.round(rail.clientWidth / 3); // show 3 at a time
  const scrollByStep = (dir) => rail.scrollBy({ left: dir * getStep(), behavior: 'smooth' });

  prevBtn?.addEventListener('click', () => scrollByStep(-1));
  nextBtn?.addEventListener('click', () => scrollByStep(1));

  // Keyboard support
  rail?.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') scrollByStep(1);
    if (e.key === 'ArrowLeft') scrollByStep(-1);
  });

  // Category click functionality
  const categoryCards = document.querySelectorAll('.category-card');
  categoryCards.forEach(card => {
    card.addEventListener('click', () => {
      const category = card.getAttribute('data-category');
      if (category) {
        // Store selected category and redirect to catalog
        localStorage.setItem('selectedCategory', category);
        window.location.href = 'catalog.html';
      }
    });
  });

  // Cart functionality
  let cart = JSON.parse(localStorage.getItem('cart')) || [];

  const cartIcon = document.getElementById('cartIcon');
  const cartSlide = document.getElementById('cartSlide');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartClose = document.getElementById('cartClose');
  const cartItems = document.getElementById('cartItems');
  const cartTotal = document.getElementById('cartTotal');
  const cartCheckoutBtn = document.getElementById('cartCheckoutBtn');
  const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');

  // Open cart
  const openCart = () => {
    cartSlide.classList.add('active');
    cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    updateCartDisplay();
  };

  // Close cart
  const closeCart = () => {
    cartSlide.classList.remove('active');
    cartOverlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  // Add to cart
  const addToCart = (productName, price, imageSrc = 'images/necklace_1.png') => {
    const existingItem = cart.find(item => item.name === productName);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        name: productName,
        price: parseFloat(price),
        quantity: 1,
        image: imageSrc
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();

    // Show success animation
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = 'Added!';
    btn.style.background = '#28a745';
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
    }, 1000);
  };

  // Remove from cart
  const removeFromCart = (productName) => {
    cart = cart.filter(item => item.name !== productName);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
  };

  // Update cart display
  const updateCartDisplay = () => {
    if (!cartItems) return;

    if (cart.length === 0) {
      cartItems.innerHTML = '<div class="empty-cart"><p>Your cart is empty</p></div>';
      cartTotal.textContent = 'Total: $0';
    } else {
      cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
          <img src="${item.image}" alt="${item.name}" class="cart-item-image">
          <div class="cart-item-details">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">$${item.price.toFixed(2)} x ${item.quantity}</div>
          </div>
          <button class="cart-item-remove" onclick="removeFromCart('${item.name}')">&times;</button>
        </div>
      `).join('');

      const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      cartTotal.textContent = `Total: $${total.toFixed(2)}`;
    }
  };

  // Generic cart handling so it works on any page (catalog, product, index, ...)
  const CART_OPEN_CLASS = 'cart-open';
  const body = document.body;
  const cartPanel = document.querySelector('.cart-panel'); // optional panel element

  function setCartOpen(open) {
    if (cartPanel) {
      cartPanel.setAttribute('aria-hidden', open ? 'false' : 'true');
    }
    body.classList.toggle(CART_OPEN_CLASS, !!open);
  }

  // Attach direct listeners to any existing toggles
  document.querySelectorAll('.cart-toggle, [data-action="toggle-cart"]').forEach(el => {
    el.addEventListener('click', (ev) => {
      ev.preventDefault();
      setCartOpen(!body.classList.contains(CART_OPEN_CLASS));
    });
  });

  // Delegated listener - covers dynamically added icons and icons on any page
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('.cart-toggle, [data-action="open-cart"], [data-action="toggle-cart"]');
    if (!btn) return;
    ev.preventDefault();
    if (btn.matches('[data-action="open-cart"]')) {
      setCartOpen(true);
    } else if (btn.matches('[data-action="close-cart"]')) {
      setCartOpen(false);
    } else {
      setCartOpen(!body.classList.contains(CART_OPEN_CLASS));
    }
  });

  // Close cart on Escape
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') setCartOpen(false);
  });

  // Event listeners
  cartIcon?.addEventListener('click', openCart);
  cartClose?.addEventListener('click', closeCart);
  cartOverlay?.addEventListener('click', closeCart);

  cartCheckoutBtn?.addEventListener('click', () => {
    if (cart.length > 0) {
      window.location.href = 'checkout.html';
    }
  });

  addToCartBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const productName = btn.getAttribute('data-product');
      const price = btn.getAttribute('data-price');
      addToCart(productName, price);
    });
  });

  // Make removeFromCart globally available
  window.removeFromCart = removeFromCart;
});