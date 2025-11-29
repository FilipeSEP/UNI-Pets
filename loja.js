let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let selectedShipping = null;
let checkoutData = {
    address: null,
    shipping: null,
    payment: null
};

const cartIcon = document.getElementById('cart-icon');
const cartCounter = document.getElementById('cart-counter');
let cartModal, loginModal;

document.addEventListener('DOMContentLoaded', function() {
    if (!cartIcon || !cartCounter) {
        console.error('Elementos essenciais do carrinho não encontrados');
        return;
    }
    
    initializeModals();
    updateCartCounter();
    updateUserInterface();
    setupEventListeners();
    setupCheckoutButton(); 
    mobileDebug(); 
});

function initializeModals() {

    cartModal = document.createElement('div');
    cartModal.className = 'cart-modal';
    cartModal.innerHTML = `
        <div class="cart-header">
            <h2>Seu Carrinho</h2>
            <button class="close-cart">&times;</button>
        </div>
        <div class="cart-items" id="cart-items">
            <!-- Itens do carrinho serão inseridos aqui -->
        </div>
        <div class="cart-total">
            Total: R$ <span id="cart-total">0,00</span>
        </div>
        <div class="cart-footer">
            <button class="btn-primary" id="checkout-btn" style="width: 100%;" onclick="handleFinalizarCompra(event)">Finalizar Compra</button>
        </div>
    `;

    document.body.appendChild(cartModal);
    loginModal = document.createElement('div');
    loginModal.className = 'modal';
    loginModal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Login / Cadastro</h2>
            <form id="login-form">
                <div class="form-group">
                    <label for="email">Email:</label>
                    <input type="email" id="email" required>
                </div>
                <div class="form-group">
                    <label for="password">Senha:</label>
                    <input type="password" id="password" required>
                </div>
                <button type="submit" class="btn-primary" style="width: 100%;">Entrar</button>
            </form>
            <p style="text-align: center; margin-top: 15px;">
                Não tem conta? <a href="#" id="show-register">Cadastre-se</a>
            </p>
        </div>
    `;
    document.body.appendChild(loginModal);
}

function setupEventListeners() {
    if (cartIcon) {
        cartIcon.addEventListener('click', toggleCart);
        cartIcon.addEventListener('touchend', function(e) {
            e.preventDefault();
            toggleCart();
        });
    }

    const closeCartBtn = document.querySelector('.close-cart');
    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', toggleCart);
        closeCartBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            toggleCart();
        });
    }

    const userIcon = document.getElementById('user-icon');
    if (userIcon) {
        userIcon.addEventListener('click', toggleUserDropdown);
        userIcon.addEventListener('touchend', function(e) {
            e.preventDefault();
            toggleUserDropdown();
        });
    }

    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', showLoginModal);
        loginBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            showLoginModal();
        });
    }

    const closeLoginBtn = document.querySelector('.close');
    if (closeLoginBtn) {
        closeLoginBtn.addEventListener('click', hideLoginModal);
        closeLoginBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            hideLoginModal();
        });
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const showRegisterBtn = document.getElementById('show-register');
    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', showRegister);
        showRegisterBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            showRegister(e);
        });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
        logoutBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            handleLogout();
        });
    }

    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    if (addToCartButtons.length > 0) {
        addToCartButtons.forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.dataset.productId;
                const productName = this.dataset.product;
                const productPrice = parseFloat(this.dataset.price);
                addToCart(productId, productName, productPrice);
            });
            
            button.addEventListener('touchend', function(e) {
                e.preventDefault();
                const productId = this.dataset.productId;
                const productName = this.dataset.product;
                const productPrice = parseFloat(this.dataset.price);
                addToCart(productId, productName, productPrice);
            });
        });
    }

    const checkoutClose = document.querySelector('#checkout-modal .close');
    if (checkoutClose) {
        checkoutClose.addEventListener('click', closeCheckout);
        checkoutClose.addEventListener('touchend', function(e) {
            e.preventDefault();
            closeCheckout();
        });
    }

    setupCEPAutoComplete();

    window.addEventListener('click', function(event) {
        if (cartModal && event.target === cartModal) {
            toggleCart();
        }
        if (loginModal && event.target === loginModal) {
            hideLoginModal();
        }
        
        const checkoutModal = document.getElementById('checkout-modal');
        if (checkoutModal && event.target === checkoutModal) {
            closeCheckout();
        }
        
        const userDropdown = document.getElementById('user-dropdown');
        if (userDropdown && userDropdown.classList.contains('show') && 
            !event.target.closest('.user-menu')) {
            toggleUserDropdown();
        }
    });
}

function setupCheckoutButton() {
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        console.log('Configurando botão Finalizar Compra para mobile...');
        
        checkoutBtn.replaceWith(checkoutBtn.cloneNode(true));
        
        const newCheckoutBtn = document.getElementById('checkout-btn');
        
        newCheckoutBtn.addEventListener('click', handleFinalizarCompra);
        newCheckoutBtn.addEventListener('touchend', handleFinalizarCompra);
        
        console.log('Botão Finalizar Compra configurado com sucesso!');
    }
}

function handleFinalizarCompra(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    }
    
    console.log('📍 Botão Finalizar Compra acionado (mobile fix)');
    finalizarCompra();
}

function finalizarCompra() {
    console.log('📍 Função finalizarCompra executada');
    
    if (cart.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }
    
    if (!currentUser) {
        alert('Por favor, faça login para finalizar a compra!');
        showLoginModal();
        toggleCart(); 
        return;
    }
    
    toggleCart();
    
    setTimeout(() => {
        showCheckoutModal();
        console.log('✅ Checkout modal aberto com sucesso!');
    }, 300);
}
function addToCart(productId, productName, productPrice) {
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: productName,
            price: productPrice,
            quantity: 1
        });
    }
    
    updateCartCounter();
    saveCart();
    showNotification(`${productName} adicionado ao carrinho!`);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartCounter();
    updateCartModal();
    saveCart();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            updateCartCounter();
            updateCartModal();
            saveCart();
        }
    }
}

function updateCartCounter() {
    if (!cartCounter) return;
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCounter.textContent = totalItems;
}

function updateCartModal() {
    if (!cartModal) return;
    
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    if (!cartItems || !cartTotal) return;
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p>Seu carrinho está vazio</p>';
        cartTotal.textContent = '0,00';
        return;
    }
    
    let total = 0;
    cartItems.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>R$ ${item.price.toFixed(2)}</p>
                </div>
                <div class="cart-item-actions">
                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                    <button onclick="removeFromCart('${item.id}')" style="margin-left: 10px; color: red; background: none; border: none; cursor: pointer; font-size: 18px;">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
    
    cartTotal.textContent = total.toFixed(2);
    
    setTimeout(setupCheckoutButton, 100);
}

function toggleCart() {
    if (!cartModal) return;
    
    if (cartModal.style.display === 'block') {
        cartModal.style.display = 'none';
    } else {
        updateCartModal();
        cartModal.style.display = 'block';
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function showLoginModal() {
    if (loginModal) {
        loginModal.style.display = 'block';
    }
    hideUserDropdown();
}

function hideLoginModal() {
    if (loginModal) {
        loginModal.style.display = 'none';
    }
}

function showRegister(e) {
    e.preventDefault();
    const registerModal = document.getElementById('register-modal');
    registerModal.style.display = 'block';
    hideLoginModal();
}

document.getElementById("register-form").addEventListener("submit", function(e){
    e.preventDefault();

    const name = document.getElementById("reg-name").value;
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-password").value;

    // Carregar usuários salvos
    let users = JSON.parse(localStorage.getItem("users")) || [];

    // Impedir cadastro duplicado
    if (users.some(u => u.email === email)) {
        alert("Este e-mail já está cadastrado!");
        return;
    }

    // Criar novo usuário
    const newUser = {
        name: name,
        email: email,
        password: password,
        avatar: name.charAt(0).toUpperCase()
    };

    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));

    alert("Cadastro realizado com sucesso! Faça login.");

    document.getElementById("register-form").reset();

    document.getElementById('register-modal').style.display = "none";
    showLoginModal();
});


function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Pega lista de usuários cadastrados
    let users = JSON.parse(localStorage.getItem("users")) || [];

    // Busca usuário correspondente
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        alert("Usuário ou senha incorretos.");
        return;
    }

    // Login OK
    currentUser = {
        name: user.name,
        email: user.email,
        avatar: user.name.charAt(0).toUpperCase()
    };

    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    updateUserInterface();
    hideLoginModal();
    showNotification('Login realizado com sucesso!');

    document.getElementById('login-form').reset();
}

document.getElementById("close-register").addEventListener("click", function(){
    document.getElementById("register-modal").style.display = "none";
});

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUserInterface();
    hideUserDropdown();
    showNotification('Logout realizado com sucesso!');
}

function toggleUserDropdown() {
    const userDropdown = document.getElementById('user-dropdown');
    if (userDropdown) {
        userDropdown.classList.toggle('show');
    }
}

function hideUserDropdown() {
    const userDropdown = document.getElementById('user-dropdown');
    if (userDropdown) {
        userDropdown.classList.remove('show');
    }
}

function updateUserInterface() {
    const userName = document.getElementById('user-name');
    const userAvatar = document.getElementById('user-avatar');
    const userGreeting = document.getElementById('user-greeting');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const myOrdersBtn = document.getElementById('my-orders-btn');
    const myAddressesBtn = document.getElementById('my-addresses-btn');
    
    if (userName && userAvatar && userGreeting) {
        if (currentUser) {
            userName.textContent = currentUser.name;
            userAvatar.textContent = currentUser.avatar;
            userGreeting.textContent = `Olá, ${currentUser.name}!`;
        } else {
            userName.textContent = 'Visitante';
            userAvatar.textContent = 'V';
            userGreeting.textContent = 'Olá, Visitante!';
        }
    }
    
    if (loginBtn) loginBtn.style.display = currentUser ? 'none' : 'block';
    if (logoutBtn) logoutBtn.style.display = currentUser ? 'block' : 'none';
    if (myOrdersBtn) myOrdersBtn.style.display = currentUser ? 'block' : 'none';
    if (myAddressesBtn) myAddressesBtn.style.display = currentUser ? 'block' : 'none';
}

function showCheckoutModal() {
    const checkoutModal = document.getElementById('checkout-modal');
    if (checkoutModal) {
        checkoutModal.style.display = 'block';
        resetCheckout();
        updateOrderSummary();
    }
}

function closeCheckout() {
    const checkoutModal = document.getElementById('checkout-modal');
    if (checkoutModal) {
        checkoutModal.style.display = 'none';
    }
}

function resetCheckout() {
    checkoutData = { address: null, shipping: null, payment: null };
    selectedShipping = null;
    goToStep(1);
}

function goToStep(stepNumber) {
    document.querySelectorAll('.checkout-step').forEach(step => {
        step.style.display = 'none';
    });
    
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    
    const currentStep = document.getElementById(`step-${stepNumber}`);
    const currentStepIndicator = document.querySelector(`[data-step="${stepNumber}"]`);
    
    if (currentStep) currentStep.style.display = 'block';
    if (currentStepIndicator) currentStepIndicator.classList.add('active');
}

function nextStep(next) {
    if (next === 2) {
        if (!validateAddress()) {
            alert('Por favor, preencha todos os campos obrigatórios do endereço.');
            return;
        }
        saveAddress();
        calculateShipping();
    }
    
    if (next === 3) {
        if (!selectedShipping) {
            alert('Por favor, selecione uma opção de frete.');
            return;
        }
        checkoutData.shipping = selectedShipping;
        updateOrderSummary();
    }
    
    goToStep(next);
}

function prevStep(prev) {
    goToStep(prev);
}

function validateAddress() {
    const requiredFields = ['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado'];
    for (let field of requiredFields) {
        const element = document.getElementById(field);
        if (!element || !element.value.trim()) {
            return false;
        }
    }
    return true;
}

function saveAddress() {
    checkoutData.address = {
        cep: document.getElementById('cep').value,
        logradouro: document.getElementById('logradouro').value,
        numero: document.getElementById('numero').value,
        complemento: document.getElementById('complemento').value,
        bairro: document.getElementById('bairro').value,
        cidade: document.getElementById('cidade').value,
        estado: document.getElementById('estado').value
    };
}

function calculateShipping() {
    const shippingOptions = document.getElementById('shipping-options');
    if (!shippingOptions) return;

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const options = [
        { name: 'Entrega Econômica', price: 15.90, days: '7-10', description: 'Entrega em até 10 dias úteis' },
        { name: 'Entrega Padrão', price: 24.90, days: '3-5', description: 'Entrega em até 5 dias úteis' },
        { name: 'Entrega Expressa', price: 39.90, days: '1-2', description: 'Entrega em até 2 dias úteis' }
    ];

    if (subtotal > 200) {
        options.unshift({
            name: 'Entrega Grátis',
            price: 0,
            days: '5-7',
            description: 'Frete grátis - entrega em até 7 dias úteis'
        });
    }

    shippingOptions.innerHTML = options.map((option, index) => `
        <div class="shipping-option ${index === 1 ? 'selected' : ''}" onclick="selectShipping(${index})">
            <input type="radio" name="shipping" ${index === 1 ? 'checked' : ''} value="${index}">
            <div class="shipping-info">
                <div>
                    <strong>${option.name}</strong>
                    <div class="shipping-time">${option.description}</div>
                </div>
                <div class="shipping-price">
                    ${option.price === 0 ? 'GRÁTIS' : `R$ ${option.price.toFixed(2)}`}
                </div>
            </div>
        </div>
    `).join('');

    selectedShipping = options[1];
}

function selectShipping(index) {
    const options = [
        { name: 'Entrega Grátis', price: 0, days: '5-7' },
        { name: 'Entrega Econômica', price: 15.90, days: '7-10' },
        { name: 'Entrega Padrão', price: 24.90, days: '3-5' },
        { name: 'Entrega Expressa', price: 39.90, days: '1-2' }
    ];

    selectedShipping = options[index];
    
    document.querySelectorAll('.shipping-option').forEach((option, i) => {
        if (i === index) {
            option.classList.add('selected');
            option.querySelector('input').checked = true;
        } else {
            option.classList.remove('selected');
        }
    });
}

function updateOrderSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = selectedShipping ? selectedShipping.price : 0;
    const total = subtotal + shipping;

    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryFrete = document.getElementById('summary-frete');
    const summaryTotal = document.getElementById('summary-total');

    if (summarySubtotal) summarySubtotal.textContent = `R$ ${subtotal.toFixed(2)}`;
    if (summaryFrete) summaryFrete.textContent = `R$ ${shipping.toFixed(2)}`;
    if (summaryTotal) summaryTotal.textContent = `R$ ${total.toFixed(2)}`;
}

function finalizeOrder() {
    const paymentMethod = document.querySelector('input[name="payment"]:checked');
    if (!paymentMethod) {
        alert('Por favor, selecione um método de pagamento.');
        return;
    }

    checkoutData.payment = paymentMethod.value;
    
    const orderNumber = '#' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 
                  (selectedShipping ? selectedShipping.price : 0);
    
    document.getElementById('order-number').textContent = orderNumber;
    document.getElementById('delivery-estimate').textContent = `${selectedShipping.days} dias úteis`;
    document.getElementById('order-total').textContent = `R$ ${total.toFixed(2)}`;
    
    goToStep(4);
    
    cart = [];
    updateCartCounter();
    saveCart();
}

function setupCEPAutoComplete() {
    const cepInput = document.getElementById('cep');
    if (cepInput) {
        cepInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 5) {
                value = value.substring(0, 5) + '-' + value.substring(5, 8);
            }
            e.target.value = value;
            
            if (value.length === 9) {
                fetch(`https://viacep.com.br/ws/${value}/json/`)
                    .then(response => response.json())
                    .then(data => {
                        if (!data.erro) {
                            document.getElementById('logradouro').value = data.logradouro || '';
                            document.getElementById('bairro').value = data.bairro || '';
                            document.getElementById('cidade').value = data.localidade || '';
                            document.getElementById('estado').value = data.uf || '';
                        }
                    })
                    .catch(error => {
                        console.log('Erro ao buscar CEP:', error);
                    });
            }
        });
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-size: 1.4rem;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

function mobileDebug() {
    console.log('🛠️ Debug mobile ativado');
    
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('touchstart', function(e) {
            console.log('📱 Touchstart no botão Finalizar Compra');
        });
        
        checkoutBtn.addEventListener('touchend', function(e) {
            console.log('📱 Touchend no botão Finalizar Compra');
        });
        
        checkoutBtn.addEventListener('click', function(e) {
            console.log('🖱️ Click no botão Finalizar Compra');
        });
    }
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);
// =============================
// CAMPOS DO CARTÃO DE CRÉDITO
// =============================
document.querySelectorAll('input[name="payment"]').forEach(radio => {
    radio.addEventListener('change', function () {
        const cardFields = document.getElementById("credit-card-fields");

        if (this.value === "credit") {
            cardFields.style.display = "block";
        } else {
            cardFields.style.display = "none";
        }
    });
});

// Preencher automaticamente os próximos 12 anos no select
window.addEventListener("load", () => {
    const yearSelect = document.getElementById("card-year");
    if (yearSelect) {
        const now = new Date().getFullYear();
        for (let i = 0; i < 12; i++) {
            const opt = document.createElement("option");
            opt.value = now + i;
            opt.textContent = now + i;
            yearSelect.appendChild(opt);
        }
    }
});
// Máscara do número do cartão
document.getElementById("card-number").addEventListener("input", function () {
    let v = this.value.replace(/\D/g, "");
    v = v.replace(/(\d{4})/g, "$1 ").trim();
    this.value = v.substring(0, 19);
});


console.log('✅ UNIPETS - Sistema carregado com correções para mobile!');
const searchBtn = document.getElementById("search-btn");
const searchInput = document.getElementById("search-input");

searchBtn.addEventListener("click", () => {
    if (searchInput.style.display === "none") {
        searchInput.style.display = "inline-block";
        searchInput.focus();
    } else {
        searchInput.style.display = "none";
        searchInput.value = "";
        filterProducts("");
    }
});

// Filtrar produtos em tempo real
searchInput.addEventListener("input", function () {
    filterProducts(this.value);
});

function filterProducts(term) {
    const products = document.querySelectorAll(".box");

    products.forEach(product => {
        const name = product.querySelector("h3").textContent.toLowerCase();
        
        if (name.includes(term.toLowerCase())) {
            product.style.display = "block";
        } else {
            product.style.display = "none";
        }
    });
}