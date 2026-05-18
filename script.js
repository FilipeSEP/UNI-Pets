// ========== CONFIGURAÇÃO ==========
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let selectedShipping = null;
let checkoutData = { address: null, shipping: null, payment: null };
let currentUserPlan = JSON.parse(localStorage.getItem('userPlan')) || null;

// ========== ELEMENTOS DO DOM ==========
const cartIcon = document.getElementById('cart-icon');
const cartCounter = document.getElementById('cart-counter');
let cartModal, loginModal, registerModal;

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    initializeModals();
    updateCartCounter();
    updateUserInterface();
    setupEventListeners();
    setupCategoryFilters();
    setupSearch();
});

// ========== FILTROS POR CATEGORIA (MOBILE) ==========
function setupCategoryFilters() {
    const botoes = document.querySelectorAll('.cat-btn');
    const produtos = document.querySelectorAll('.menu .box');

    if (!botoes.length || !produtos.length) return;

    const aplicarFiltro = (categoria) => {
        produtos.forEach(produto => {
            const categoriaProduto = produto.getAttribute('data-categoria');
            if (categoria === 'todos' || categoriaProduto === categoria) {
                produto.style.display = 'flex';
            } else {
                produto.style.display = 'none';
            }
        });
    };

    const ativarBotao = (botaoAtivo) => {
        botoes.forEach(btn => btn.classList.remove('active'));
        botaoAtivo.classList.add('active');
        aplicarFiltro(botaoAtivo.getAttribute('data-cat'));
    };

    botoes.forEach(botao => {
        // Suporte para clique e toque
        botao.addEventListener('click', (e) => {
            e.preventDefault();
            ativarBotao(botao);
        });
        botao.addEventListener('touchend', (e) => {
            e.preventDefault();
            ativarBotao(botao);
        });
    });
}

// ========== BUSCA (MOBILE) ==========
function setupSearch() {
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');

    if (!searchBtn || !searchInput) return;

    const toggleSearch = () => {
        if (searchInput.style.display === 'none') {
            searchInput.style.display = 'block';
            searchInput.focus();
        } else {
            searchInput.style.display = 'none';
            searchInput.value = '';
            mostrarTodosProdutos();
        }
    };

    searchBtn.addEventListener('click', toggleSearch);
    searchBtn.addEventListener('touchend', toggleSearch);

    searchInput.addEventListener('keyup', (e) => {
        const termo = e.target.value.toLowerCase();
        const produtos = document.querySelectorAll('.menu .box');
        produtos.forEach(produto => {
            const nome = produto.querySelector('h3')?.innerText.toLowerCase() || '';
            produto.style.display = nome.includes(termo) ? 'flex' : 'none';
        });
    });
}

function mostrarTodosProdutos() {
    const produtos = document.querySelectorAll('.menu .box');
    produtos.forEach(produto => produto.style.display = 'flex');

    const botoes = document.querySelectorAll('.cat-btn');
    botoes.forEach(btn => {
        if (btn.dataset.cat === 'todos') btn.classList.add('active');
        else btn.classList.remove('active');
    });
}

// ========== MODAIS ==========
function initializeModals() {
    cartModal = document.getElementById('cart-modal');
    loginModal = document.getElementById('login-modal');
    registerModal = document.getElementById('register-modal');
}

// ========== CONVÊNIO ==========
window.assinarPlano = function(plano) {
    if (!currentUser) {
        alert('Faça login para assinar um plano!');
        showLoginModal();
        return;
    }
    let preco = 0, beneficios = '';
    if (plano === 'basico') { preco = 29.90; beneficios = '1 banho/mês, 10% off'; }
    else if (plano === 'premium') { preco = 59.90; beneficios = '2 banhos/mês, 20% off, prioridade'; }
    else { preco = 99.90; beneficios = 'Banhos ilimitados, 30% off, corte grátis'; }

    if (confirm(`Confirmar Plano ${plano.toUpperCase()} - R$ ${preco}/mês?\n\n${beneficios}\n\n*UNIPETS não cobre consultas.`)) {
        currentUserPlan = { plano, preco, dataAssinatura: new Date().toISOString() };
        localStorage.setItem('userPlan', JSON.stringify(currentUserPlan));
        alert(`✅ Plano ${plano.toUpperCase()} ativado!`);
        updateUserInterface();
    }
};

function calcularPrecoComDesconto(precoOriginal) {
    if (!currentUserPlan) return precoOriginal;
    const descontos = { basico: 0.1, premium: 0.2, vip: 0.3 };
    return precoOriginal * (1 - (descontos[currentUserPlan.plano] || 0));
}

// ========== CARRINHO ==========
function addToCart(productId, productName, productPrice) {
    const existing = cart.find(item => item.id === productId);
    const precoFinal = currentUserPlan ? calcularPrecoComDesconto(productPrice) : productPrice;
    if (existing) existing.quantity++;
    else cart.push({ id: productId, name: productName, price: precoFinal, priceOriginal: productPrice, quantity: 1 });
    updateCartCounter();
    saveCart();
    updateCartModal();
    showNotification(`${productName} adicionado!${currentUserPlan ? ' (desconto assinante)' : ''}`);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartCounter();
    updateCartModal();
    saveCart();
}

function updateQuantity(productId, change) {
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) removeFromCart(productId);
        else { updateCartCounter(); updateCartModal(); saveCart(); }
    }
}

function updateCartCounter() {
    if (cartCounter) cartCounter.textContent = cart.reduce((s, i) => s + i.quantity, 0);
}

function updateCartModal() {
    const div = document.getElementById('cart-items');
    const totalSpan = document.getElementById('cart-total');
    if (!div) return;
    if (!cart.length) { div.innerHTML = '<p style="text-align:center;">Carrinho vazio</p>'; if (totalSpan) totalSpan.textContent = '0,00'; return; }
    let total = 0;
    div.innerHTML = cart.map(item => {
        const sub = item.price * item.quantity;
        total += sub;
        const desconto = item.priceOriginal && item.priceOriginal > item.price;
        return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    ${desconto ? `<p><s>R$ ${item.priceOriginal.toFixed(2)}</s> <span style="color:#28a745;">R$ ${item.price.toFixed(2)}</span></p>` : `<p>R$ ${item.price.toFixed(2)}</p>`}
                </div>
                <div class="cart-item-actions">
                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                    <button onclick="removeFromCart('${item.id}')" style="background:none; border:none; color:red; font-size:18px;">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
    if (totalSpan) totalSpan.textContent = total.toFixed(2);
}

function toggleCart() {
    if (!cartModal) return;
    cartModal.style.display = cartModal.style.display === 'block' ? 'none' : 'block';
    if (cartModal.style.display === 'block') updateCartModal();
}

function saveCart() { localStorage.setItem('cart', JSON.stringify(cart)); }

function atribuirEventosProdutos() {
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.removeEventListener('click', addToCartHandler);
        btn.removeEventListener('touchend', addToCartHandler);
        btn.addEventListener('click', addToCartHandler);
        btn.addEventListener('touchend', addToCartHandler);
    });
}
function addToCartHandler(e) {
    const btn = e.currentTarget;
    addToCart(btn.dataset.productId, btn.dataset.product, parseFloat(btn.dataset.price));
}

// ========== CHECKOUT ==========
function finalizarCompra() {
    if (!cart.length) { alert('Carrinho vazio'); return; }
    if (!currentUser) { alert('Faça login para finalizar'); toggleCart(); showLoginModal(); return; }
    toggleCart();
    setTimeout(() => showCheckoutModal(), 200);
}
function showCheckoutModal() { const m = document.getElementById('checkout-modal'); if (m) { m.style.display = 'block'; resetCheckout(); } }
function closeCheckout() { const m = document.getElementById('checkout-modal'); if (m) m.style.display = 'none'; }
function resetCheckout() { checkoutData = { address: null, shipping: null, payment: null }; selectedShipping = null; goToStep(1); updateOrderSummary(); }
function goToStep(s) {
    document.querySelectorAll('.checkout-step').forEach(step => step.style.display = 'none');
    document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
    const st = document.getElementById(`step-${s}`);
    const ind = document.querySelector(`[data-step="${s}"]`);
    if (st) st.style.display = 'block';
    if (ind) ind.classList.add('active');
}
function nextStep(n) {
    if (n === 2) { if (!validateAddress()) { alert('Preencha o endereço'); return; } saveAddress(); calculateShipping(); }
    if (n === 3) { if (!selectedShipping) { alert('Selecione o frete'); return; } checkoutData.shipping = selectedShipping; updateOrderSummary(); }
    goToStep(n);
}
function prevStep(p) { goToStep(p); }
function validateAddress() {
    return ['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado'].every(id => document.getElementById(id)?.value.trim());
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
    const div = document.getElementById('shipping-options');
    if (!div) return;
    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    let opcoes = [
        { nome: 'Econômica', preco: 15.90, dias: '7-10' },
        { nome: 'Padrão', preco: 24.90, dias: '3-5' },
        { nome: 'Expressa', preco: 39.90, dias: '1-2' }
    ];
    if (subtotal > 200 || currentUserPlan?.plano === 'vip') opcoes.unshift({ nome: 'Grátis', preco: 0, dias: '5-7' });
    div.innerHTML = opcoes.map((opt, idx) => `
        <div class="shipping-option ${idx === 1 && !opt.preco ? '' : idx === 1 ? 'selected' : ''}" onclick="selectShipping(${idx})">
            <input type="radio" name="shipping" ${idx === 1 ? 'checked' : ''}>
            <div class="shipping-info">
                <div><strong>${opt.nome}</strong><div class="shipping-time">${opt.dias} dias úteis</div></div>
                <div class="shipping-price">${opt.preco === 0 ? 'GRÁTIS' : `R$ ${opt.preco.toFixed(2)}`}</div>
            </div>
        </div>
    `).join('');
    selectedShipping = opcoes[1];
    if (opcoes[0].preco === 0) selectedShipping = opcoes[0];
}
window.selectShipping = function(idx) {
    const opts = [];
    document.querySelectorAll('.shipping-option').forEach(opt => {
        const nome = opt.querySelector('strong')?.innerText || '';
        const precoTxt = opt.querySelector('.shipping-price')?.innerText || 'R$ 0';
        let preco = 0;
        if (precoTxt !== 'GRÁTIS') preco = parseFloat(precoTxt.replace('R$', '').replace(',', '.'));
        const dias = opt.querySelector('.shipping-time')?.innerText.match(/\d+/)?.[0] || '5';
        opts.push({ nome, preco, dias });
    });
    selectedShipping = opts[idx];
    document.querySelectorAll('.shipping-option').forEach((opt, i) => {
        if (i === idx) opt.classList.add('selected');
        else opt.classList.remove('selected');
    });
    updateOrderSummary();
};
function updateOrderSummary() {
    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const frete = selectedShipping?.preco || 0;
    document.getElementById('summary-subtotal').innerHTML = `R$ ${subtotal.toFixed(2)}`;
    document.getElementById('summary-frete').innerHTML = `R$ ${frete.toFixed(2)}`;
    document.getElementById('summary-total').innerHTML = `R$ ${(subtotal + frete).toFixed(2)}`;
}
function finalizeOrder() {
    const metodo = document.querySelector('input[name="payment"]:checked')?.value;
    if (!metodo) { alert('Escolha o pagamento'); return; }
    checkoutData.payment = metodo;
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0) + (selectedShipping?.preco || 0);
    const numPedido = '#' + Math.random().toString(36).substr(2, 8).toUpperCase();
    document.getElementById('order-number').innerHTML = numPedido;
    document.getElementById('delivery-estimate').innerHTML = `${selectedShipping?.dias || 5} dias úteis`;
    document.getElementById('order-total').innerHTML = `R$ ${total.toFixed(2)}`;
    goToStep(4);
    cart = [];
    updateCartCounter();
    saveCart();
    showNotification('Pedido finalizado!');
}

// ========== LOGIN / USUÁRIO ==========
function fazerLogin(email, senha) {
    const nome = email.split('@')[0];
    currentUser = { id: 1, nome, email };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateUserInterface();
    hideLoginModal();
    showNotification(`Bem-vindo, ${nome}!`);
    const plano = localStorage.getItem('userPlan');
    if (plano) currentUserPlan = JSON.parse(plano);
    return true;
}
function cadastrarUsuario(nome, email, senha) {
    fazerLogin(email, senha);
    hideRegisterModal();
    return true;
}
function updateUserInterface() {
    const userName = document.getElementById('user-name');
    const userAvatar = document.getElementById('user-avatar');
    const userGreeting = document.getElementById('user-greeting');
    const loginBtn = document.getElementById('login-btn');
    const cadastroBtn = document.getElementById('cadastro-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const myOrdersBtn = document.getElementById('my-orders-btn');
    const myPlanBtn = document.getElementById('my-plan-btn');
    if (currentUser) {
        if (userName) userName.textContent = currentUser.nome;
        if (userAvatar) userAvatar.textContent = currentUser.nome.charAt(0).toUpperCase();
        if (userGreeting) userGreeting.innerHTML = `Olá, ${currentUser.nome}${currentUserPlan ? ` 🎉 (${currentUserPlan.plano})` : ''}`;
        if (loginBtn) loginBtn.style.display = 'none';
        if (cadastroBtn) cadastroBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'block';
        if (myOrdersBtn) myOrdersBtn.style.display = 'block';
        if (myPlanBtn) myPlanBtn.style.display = 'block';
    } else {
        if (userName) userName.textContent = 'Visitante';
        if (userAvatar) userAvatar.textContent = 'V';
        if (userGreeting) userGreeting.textContent = 'Olá, Visitante!';
        if (loginBtn) loginBtn.style.display = 'block';
        if (cadastroBtn) cadastroBtn.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (myOrdersBtn) myOrdersBtn.style.display = 'none';
        if (myPlanBtn) myPlanBtn.style.display = 'none';
    }
}
function showLoginModal() { if (loginModal) loginModal.style.display = 'block'; hideUserDropdown(); }
function hideLoginModal() { if (loginModal) loginModal.style.display = 'none'; }
function showRegisterModal() { if (registerModal) registerModal.style.display = 'block'; hideUserDropdown(); }
function hideRegisterModal() { if (registerModal) registerModal.style.display = 'none'; }
function toggleUserDropdown() { document.getElementById('user-dropdown')?.classList.toggle('show'); }
function hideUserDropdown() { document.getElementById('user-dropdown')?.classList.remove('show'); }

// ========== EVENTOS GLOBAIS ==========
function setupEventListeners() {
    // Carrinho
    if (cartIcon) {
        cartIcon.addEventListener('click', toggleCart);
        cartIcon.addEventListener('touchend', toggleCart);
    }
    document.querySelector('.close-cart')?.addEventListener('click', toggleCart);
    document.querySelector('.close-cart')?.addEventListener('touchend', toggleCart);
    document.getElementById('checkout-btn')?.addEventListener('click', finalizarCompra);
    document.getElementById('checkout-btn')?.addEventListener('touchend', finalizarCompra);

    // Menu usuário
    document.getElementById('user-icon')?.addEventListener('click', toggleUserDropdown);
    document.getElementById('user-icon')?.addEventListener('touchend', toggleUserDropdown);
    document.getElementById('login-btn')?.addEventListener('click', showLoginModal);
    document.getElementById('login-btn')?.addEventListener('touchend', showLoginModal);
    document.getElementById('cadastro-btn')?.addEventListener('click', showRegisterModal);
    document.getElementById('cadastro-btn')?.addEventListener('touchend', showRegisterModal);
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        currentUser = null;
        localStorage.removeItem('currentUser');
        updateUserInterface();
        showNotification('Logout');
    });
    document.getElementById('logout-btn')?.addEventListener('touchend', () => {
        currentUser = null;
        localStorage.removeItem('currentUser');
        updateUserInterface();
        showNotification('Logout');
    });
    document.getElementById('my-plan-btn')?.addEventListener('click', () => {
        if (currentUserPlan) alert(`Plano ${currentUserPlan.plano} - R$ ${currentUserPlan.preco}/mês`);
        else alert('Nenhum plano ativo. Acesse CONVÊNIO.');
    });

    // Fechar modais
    document.querySelectorAll('.modal .close').forEach(btn => {
        btn.addEventListener('click', () => {
            if (loginModal) loginModal.style.display = 'none';
            if (registerModal) registerModal.style.display = 'none';
            document.getElementById('checkout-modal')?.style.display = 'none';
        });
    });

    // Formulários
    document.getElementById('login-form')?.addEventListener('submit', e => {
        e.preventDefault();
        fazerLogin(document.getElementById('login-email').value, document.getElementById('login-password').value);
    });
    document.getElementById('register-form')?.addEventListener('submit', e => {
        e.preventDefault();
        cadastrarUsuario(document.getElementById('reg-name').value, document.getElementById('reg-email').value, document.getElementById('reg-password').value);
    });
    document.getElementById('show-register-link')?.addEventListener('click', e => {
        e.preventDefault();
        hideLoginModal();
        showRegisterModal();
    });

    // Fechar modais clique fora
    window.addEventListener('click', e => {
        if (loginModal && e.target === loginModal) hideLoginModal();
        if (registerModal && e.target === registerModal) hideRegisterModal();
        if (cartModal && e.target === cartModal) toggleCart();
        if (e.target === document.getElementById('checkout-modal')) closeCheckout();
        if (!e.target.closest('.user-menu')) hideUserDropdown();
    });

    atribuirEventosProdutos();
    setupCEPAutoComplete();
}

function setupCEPAutoComplete() {
    const cep = document.getElementById('cep');
    if (!cep) return;
    cep.addEventListener('input', e => {
        let v = e.target.value.replace(/\D/g, '');
        if (v.length > 5) v = v.slice(0, 5) + '-' + v.slice(5, 8);
        e.target.value = v;
    });
    cep.addEventListener('blur', async () => {
        let v = cep.value.replace(/\D/g, '');
        if (v.length === 8) {
            const res = await fetch(`https://viacep.com.br/ws/${v}/json/`);
            const data = await res.json();
            if (!data.erro) {
                document.getElementById('logradouro').value = data.logradouro || '';
                document.getElementById('bairro').value = data.bairro || '';
                document.getElementById('cidade').value = data.localidade || '';
                document.getElementById('estado').value = data.uf || '';
            }
        }
    });
}

function showNotification(msg) {
    const n = document.createElement('div');
    n.textContent = msg;
    n.style.cssText = 'position:fixed; bottom:20px; right:20px; background:#28a745; color:white; padding:12px 20px; border-radius:8px; z-index:10000; animation:slideIn 0.3s ease;';
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3500);
}
document.head.insertAdjacentHTML('beforeend', `<style>@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}</style>`);

console.log('✅ UNIPETS mobile ready');