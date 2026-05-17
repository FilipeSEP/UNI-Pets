// ========== CONFIGURAÇÃO ==========
const API_URL = 'http://localhost:3000/api';

// Estado global
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let selectedShipping = null;
let checkoutData = { address: null, shipping: null, payment: null };
let currentUserPlan = JSON.parse(localStorage.getItem('userPlan')) || null;

// ========== PRODUTOS ==========
const produtos = [
    // ALIMENTOS
    { id: 1, nome: "Ração Premium para Cães Adultos - 10kg", preco: 149.99, categoria: "alimentos", imagem: "caoadulto.png", descricao: "Ração super premium para cães adultos" },
    { id: 2, nome: "Ração para Cães Filhotes - 10kg", preco: 109.99, categoria: "alimentos", imagem: "caofilhote.png", descricao: "Nutrição completa para filhotes" },
    { id: 3, nome: "Ração Premium para Gatos Adultos - 10kg", preco: 169.99, categoria: "alimentos", imagem: "gatoadulto.png", descricao: "Ração saborosa para gatos" },
    { id: 4, nome: "Ração para Gatos Filhotes - 10kg", preco: 119.99, categoria: "alimentos", imagem: "gatof.png", descricao: "Especial para gatinhos em crescimento" },
    { id: 9, nome: "Petisco Natural Frango - 500g", preco: 24.90, categoria: "alimentos", imagem: "petisco.jpg", descricao: "Petisco saudável e natural" },
    { id: 10, nome: "Ração Úmida Sache - Carne", preco: 5.99, categoria: "alimentos", imagem: "sache.jpg", descricao: "Complemento alimentar saboroso" },
    
    // BRINQUEDOS
    { id: 11, nome: "Mordedor de Corda - Tamanho G", preco: 29.90, categoria: "brinquedos", imagem: "mordedor.jpg", descricao: "Ideal para cães de porte médio/grande" },
    { id: 12, nome: "Bolinha com Guizo", preco: 15.90, categoria: "brinquedos", imagem: "bolinha.jpg", descricao: "Bolinha colorida com som" },
    { id: 13, nome: "Brinquedo Interativo Ocultar Petisco", preco: 49.90, categoria: "brinquedos", imagem: "interativo.jpg", descricao: "Estimula a inteligência do pet" },
    { id: 14, nome: "Pelúcia Macia - Ursinho", preco: 39.90, categoria: "brinquedos", imagem: "pelucia.jpg", descricao: "Pelúcia resistente para brincadeiras" },
    { id: 15, nome: "Frisbee para Cães", preco: 34.90, categoria: "brinquedos", imagem: "frisbee.jpg", descricao: "Para brincadeiras ao ar livre" },
    
    // CAMAS
    { id: 5, nome: "Cama Cinza - TAM EGG", preco: 329.99, categoria: "camas", imagem: "EGG.jpg", descricao: "Cama super confortável formato ovo" },
    { id: 6, nome: "Cama Nuvem Brigadeiro - TAM M", preco: 129.99, categoria: "camas", imagem: "camanuvem.jpg", descricao: "Cama macia e fofinha" },
    { id: 16, nome: "Cama Redonda para Gatos", preco: 89.90, categoria: "camas", imagem: "cama_gato.jpg", descricao: "Cama acolchoada para gatos" },
    { id: 17, nome: "Tapete Confortável", preco: 59.90, categoria: "camas", imagem: "tapete.jpg", descricao: "Tapete antiderrapante" },
    
    // HIGIENE
    { id: 8, nome: "Sanitário de Luxo para Cães", preco: 209.99, categoria: "higiene", imagem: "sanitario.jpg", descricao: "Sanitário prático e higiênico" },
    { id: 18, nome: "Shampoo Antipulgas - 500ml", preco: 45.90, categoria: "higiene", imagem: "shampoo.jpg", descricao: "Protege contra pulgas e carrapatos" },
    { id: 19, nome: "Escova de Pelos", preco: 29.90, categoria: "higiene", imagem: "escova.jpg", descricao: "Escova remove pelos mortos" },
    { id: 20, nome: "Tapete Higiênico - 30 unidades", preco: 79.90, categoria: "higiene", imagem: "tapete_higienico.jpg", descricao: "Absorve xixi e previne vazamentos" },
    { id: 21, nome: "Cortador de Unhas", preco: 35.90, categoria: "higiene", imagem: "cortador.jpg", descricao: "Cortador de unhas profissional" },

    // ACESSÓRIOS
    { id: 7, nome: "Kit Guia e Coleira Vermelha", preco: 66.99, categoria: "higiene", imagem: "guia.jpg", descricao: "Kit completo para passeios" },
    { id: 23, nome: "Peitoral Ajustável", preco: 79.90, categoria: "acessorios", imagem: "peitoral.jpg", descricao: "Peitoral acolchoado para passeios" },
    { id: 24, nome: "Roupinha de Frio", preco: 89.90, categoria: "acessorios", imagem: "roupinha.jpg", descricao: "Moletom confortável para dias frios" },
    { id: 25, nome: "Identificador de Coleira", preco: 29.90, categoria: "acessorios", imagem: "identificador.jpg", descricao: "Placa de identificação com nome e telefone" },
    { id: 26, nome: "Focinheira", preco: 59.90, categoria: "acessorios", imagem: "focinheira.jpg", descricao: "Focinheira ajustável para raças médias" },
    { id: 27, nome: "Bebedouro Portátil", preco: 49.90, categoria: "acessorios", imagem: "bebedouro.jpg", descricao: "Para passeios e viagens" }
];

// ========== ELEMENTOS DO DOM ==========
const cartIcon = document.getElementById('cart-icon');
const cartCounter = document.getElementById('cart-counter');
let cartModal, loginModal, registerModal;

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', async () => {
    initializeModals();
    renderizarProdutos();
    updateCartCounter();
    updateUserInterface();
    setupEventListeners();
    setupCategoryFilters();
    setupCheckoutButton();
});

// ========== RENDERIZAR PRODUTOS ==========
function renderizarProdutos(categoria = 'todos') {
    const container = document.getElementById('produtos-container');
    if (!container) return;
    
    let produtosFiltrados = produtos;
    if (categoria !== 'todos') {
        produtosFiltrados = produtos.filter(p => p.categoria === categoria);
    }
    
    if (produtosFiltrados.length === 0) {
        container.innerHTML = '<div class="loading">Nenhum produto encontrado nesta categoria</div>';
        return;
    }
    
    container.innerHTML = produtosFiltrados.map(produto => `
        <article class="box" data-product-id="${produto.id}" data-categoria="${produto.categoria}">
            <img width="250" src="https://filipesep.github.io/loja-pet/img/${produto.imagem}" 
                 alt="${produto.nome}"
                 onerror="this.src='https://via.placeholder.com/250x200/ff6b6b/ffffff?text=UNIPETS'">
            <h3>${produto.nome}</h3>
            <div class="price">R$ ${produto.preco.toFixed(2)}</div>
            <button class="btn add-to-cart" 
                    data-product-id="${produto.id}"
                    data-product="${produto.nome}" 
                    data-price="${produto.preco}">
                Adicionar ao Carrinho
            </button>
        </article>
    `).join('');
    
    atribuirEventosProdutos();
}

// ========== FILTROS POR CATEGORIA ==========
function setupCategoryFilters() {
    const buttons = document.querySelectorAll('.cat-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const categoria = btn.dataset.cat;
            
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            renderizarProdutos(categoria);
        });
    });
    
    // Filtro do header também
    const selectFilter = document.getElementById('categoria-filter');
    if (selectFilter) {
        selectFilter.addEventListener('change', (e) => {
            const categoria = e.target.value;
            renderizarProdutos(categoria);
            
            // Atualiza também os botões visuais
            const buttons = document.querySelectorAll('.cat-btn');
            buttons.forEach(btn => {
                if (btn.dataset.cat === categoria) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        });
    }
}

// ========== SISTEMA DE CONVÊNIO ==========
window.assinarPlano = function(plano) {
    if (!currentUser) {
        alert('Faça login para assinar um plano!');
        showLoginModal();
        return;
    }
    
    let preco = 0;
    let beneficios = '';
    
    switch(plano) {
        case 'basico':
            preco = 29.90;
            beneficios = '1 banho por mês, 10% desconto em produtos';
            break;
        case 'premium':
            preco = 59.90;
            beneficios = '2 banhos por mês, 20% desconto em produtos, prioridade';
            break;
        case 'vip':
            preco = 99.90;
            beneficios = 'Banhos ilimitados, 30% desconto em produtos, 1 corte grátis';
            break;
    }
    
    if (confirm(`Confirmar assinatura do Plano ${plano.toUpperCase()} por R$ ${preco}/mês?\n\nBenefícios: ${beneficios}\n\n*A UNIPETS não se responsabiliza por consultas médicas.`)) {
        currentUserPlan = { plano, preco, dataAssinatura: new Date().toISOString() };
        localStorage.setItem('userPlan', JSON.stringify(currentUserPlan));
        
        // Aplica desconto nos preços se for assinante
        aplicarDescontoPlano();
        
        alert(`✅ Assinatura realizada com sucesso!\n\nPlano ${plano.toUpperCase()} ativo.\nAproveite seus benefícios!`);
        updateUserInterface();
    }
};

function aplicarDescontoPlano() {
    if (!currentUserPlan) return;
    
    let desconto = 0;
    if (currentUserPlan.plano === 'basico') desconto = 0.1;
    if (currentUserPlan.plano === 'premium') desconto = 0.2;
    if (currentUserPlan.plano === 'vip') desconto = 0.3;
    
    if (desconto > 0) {
        showNotification(`🎉 Assinante! Você ganha ${desconto * 100}% de desconto em produtos!`);
    }
}

function calcularPrecoComDesconto(precoOriginal) {
    if (!currentUserPlan) return precoOriginal;
    
    let desconto = 0;
    if (currentUserPlan.plano === 'basico') desconto = 0.1;
    if (currentUserPlan.plano === 'premium') desconto = 0.2;
    if (currentUserPlan.plano === 'vip') desconto = 0.3;
    
    return precoOriginal * (1 - desconto);
}

// ========== MODAIS ==========
function initializeModals() {
    // Modal do Carrinho
    cartModal = document.getElementById('cart-modal');
    if (!cartModal) {
        cartModal = document.createElement('div');
        cartModal.id = 'cart-modal';
        cartModal.className = 'modal cart-modal';
        cartModal.innerHTML = `
            <div class="modal-content">
                <span class="close-cart">&times;</span>
                <h2>Seu Carrinho</h2>
                <div id="cart-items"></div>
                <div class="cart-total">
                    <strong>Total:</strong> R$ <span id="cart-total">0,00</span>
                </div>
                <button id="checkout-btn" class="btn-primary">Finalizar Compra</button>
            </div>
        `;
        document.body.appendChild(cartModal);
    }

    // Modal de Login
    loginModal = document.getElementById('login-modal');
    if (!loginModal) {
        loginModal = document.createElement('div');
        loginModal.id = 'login-modal';
        loginModal.className = 'modal';
        loginModal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>Login</h2>
                <form id="login-form">
                    <div class="form-group">
                        <label>Email:</label>
                        <input type="email" id="login-email" required>
                    </div>
                    <div class="form-group">
                        <label>Senha:</label>
                        <input type="password" id="login-password" required>
                    </div>
                    <button type="submit" class="btn-primary">Entrar</button>
                </form>
                <p style="text-align: center; margin-top: 15px;">
                    Não tem conta? <a href="#" id="show-register-link">Cadastre-se</a>
                </p>
            </div>
        `;
        document.body.appendChild(loginModal);
    }

    // Modal de Cadastro
    registerModal = document.getElementById('register-modal');
    if (!registerModal) {
        registerModal = document.createElement('div');
        registerModal.id = 'register-modal';
        registerModal.className = 'modal';
        registerModal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>Criar Conta</h2>
                <form id="register-form">
                    <div class="form-group">
                        <label>Nome:</label>
                        <input type="text" id="reg-name" required>
                    </div>
                    <div class="form-group">
                        <label>Email:</label>
                        <input type="email" id="reg-email" required>
                    </div>
                    <div class="form-group">
                        <label>Senha:</label>
                        <input type="password" id="reg-password" required>
                    </div>
                    <button type="submit" class="btn-primary">Cadastrar</button>
                </form>
            </div>
        `;
        document.body.appendChild(registerModal);
    }
}

// ========== SISTEMA DE CARRINHO ==========
function addToCart(productId, productName, productPrice) {
    const existingItem = cart.find(item => item.id === productId);
    const precoFinal = currentUserPlan ? calcularPrecoComDesconto(productPrice) : productPrice;
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: productName,
            price: precoFinal,
            priceOriginal: productPrice,
            quantity: 1
        });
    }
    
    updateCartCounter();
    saveCart();
    updateCartModal();
    
    if (currentUserPlan) {
        showNotification(`${productName} adicionado ao carrinho com desconto de assinante!`);
    } else {
        showNotification(`${productName} adicionado ao carrinho!`);
    }
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
    if (cartCounter) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCounter.textContent = totalItems;
    }
}

function updateCartModal() {
    const cartItemsDiv = document.getElementById('cart-items');
    const cartTotalSpan = document.getElementById('cart-total');
    
    if (!cartItemsDiv) return;
    
    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<p style="text-align: center;">Seu carrinho está vazio</p>';
        if (cartTotalSpan) cartTotalSpan.textContent = '0,00';
        return;
    }
    
    let total = 0;
    cartItemsDiv.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const temDesconto = item.priceOriginal && item.priceOriginal > item.price;
        
        return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    ${temDesconto ? `<p><s>R$ ${item.priceOriginal.toFixed(2)}</s> <span style="color:#28a745;">R$ ${item.price.toFixed(2)}</span></p>` : `<p>R$ ${item.price.toFixed(2)}</p>`}
                </div>
                <div class="cart-item-actions">
                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                    <button onclick="removeFromCart('${item.id}')" style="background: none; border: none; cursor: pointer; color: red;">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
    
    if (cartTotalSpan) cartTotalSpan.textContent = total.toFixed(2);
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

// ========== CHECKOUT ==========
function finalizarCompra() {
    if (cart.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }
    
    if (!currentUser) {
        alert('Por favor, faça login para finalizar a compra!');
        toggleCart();
        showLoginModal();
        return;
    }
    
    toggleCart();
    setTimeout(() => {
        showCheckoutModal();
    }, 300);
}

function showCheckoutModal() {
    const checkoutModal = document.getElementById('checkout-modal');
    if (checkoutModal) {
        checkoutModal.style.display = 'block';
        resetCheckout();
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
    updateOrderSummary();
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
    
    const opcoes = [
        { nome: 'Entrega Econômica', preco: 15.90, dias: '7-10' },
        { nome: 'Entrega Padrão', preco: 24.90, dias: '3-5' },
        { nome: 'Entrega Expressa', preco: 39.90, dias: '1-2' }
    ];
    
    if (subtotal > 200 || (currentUserPlan && currentUserPlan.plano === 'vip')) {
        opcoes.unshift({ nome: 'Entrega Grátis', preco: 0, dias: '5-7' });
    }

    shippingOptions.innerHTML = opcoes.map((option, index) => `
        <div class="shipping-option ${index === 0 && option.preco === 0 ? 'selected' : index === 1 ? 'selected' : ''}" onclick="selectShipping(${index})">
            <input type="radio" name="shipping" ${(index === 0 && option.preco === 0) || index === 1 ? 'checked' : ''} value="${index}">
            <div class="shipping-info">
                <div>
                    <strong>${option.nome}</strong>
                    <div class="shipping-time">Entrega em ${option.dias} dias úteis</div>
                </div>
                <div class="shipping-price">
                    ${option.preco === 0 ? 'GRÁTIS' : `R$ ${option.preco.toFixed(2)}`}
                </div>
            </div>
        </div>
    `).join('');

    selectedShipping = opcoes[1];
    if (opcoes[0].preco === 0) selectedShipping = opcoes[0];
}

window.selectShipping = function(index) {
    const options = document.querySelectorAll('.shipping-option');
    const opcoes = [];
    
    document.querySelectorAll('.shipping-option').forEach(opt => {
        const nome = opt.querySelector('strong')?.innerText || '';
        const precoTexto = opt.querySelector('.shipping-price')?.innerText || 'R$ 0,00';
        let preco = 0;
        if (precoTexto !== 'GRÁTIS') {
            preco = parseFloat(precoTexto.replace('R$ ', '').replace(',', '.'));
        }
        const dias = opt.querySelector('.shipping-time')?.innerText.match(/\d+/)?.[0] || '5';
        opcoes.push({ nome, preco, dias });
    });
    
    selectedShipping = opcoes[index];
    
    options.forEach((option, i) => {
        if (i === index) {
            option.classList.add('selected');
            option.querySelector('input').checked = true;
        } else {
            option.classList.remove('selected');
        }
    });
    
    updateOrderSummary();
};

function updateOrderSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = selectedShipping ? selectedShipping.preco : 0;
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
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 
                  (selectedShipping ? selectedShipping.preco : 0);
    
    const orderNumber = '#' + Math.random().toString(36).substr(2, 9).toUpperCase();
    
    document.getElementById('order-number').textContent = orderNumber;
    document.getElementById('delivery-estimate').textContent = `${selectedShipping.dias} dias úteis`;
    document.getElementById('order-total').textContent = `R$ ${total.toFixed(2)}`;
    
    goToStep(4);
    
    // Mensagem personalizada para assinantes
    if (currentUserPlan) {
        setTimeout(() => {
            showNotification(`🎉 ${currentUser.nome}, seu pedido foi aprovado com frete ${selectedShipping.preco === 0 ? 'GRÁTIS' : 'via ' + selectedShipping.nome}!`);
        }, 100);
    }
    
    cart = [];
    updateCartCounter();
    saveCart();
}

// ========== INTERFACE DO USUÁRIO ==========
function fazerLogin(email, senha) {
    // Simulação de login (em produção, conectaria ao backend)
    const nome = email.split('@')[0];
    currentUser = { id: 1, nome: nome, email: email };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateUserInterface();
    hideLoginModal();
    showNotification(`Bem-vindo, ${nome}!`);
    
    // Carregar plano do usuário se existir
    const plan = localStorage.getItem('userPlan');
    if (plan) {
        currentUserPlan = JSON.parse(plan);
        showNotification(`Seu plano ${currentUserPlan.plano} está ativo!`);
    }
    
    return true;
}

function cadastrarUsuario(nome, email, senha) {
    currentUser = { id: 1, nome: nome, email: email };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateUserInterface();
    hideRegisterModal();
    showNotification(`Cadastro realizado! Bem-vindo, ${nome}!`);
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
        if (userGreeting) {
            if (currentUserPlan) {
                userGreeting.innerHTML = `Olá, ${currentUser.nome}! 🎉 <small>(${currentUserPlan.plano})</small>`;
            } else {
                userGreeting.textContent = `Olá, ${currentUser.nome}!`;
            }
        }
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

function showLoginModal() {
    if (loginModal) loginModal.style.display = 'block';
    hideUserDropdown();
}

function hideLoginModal() {
    if (loginModal) loginModal.style.display = 'none';
}

function showRegisterModal() {
    if (registerModal) registerModal.style.display = 'block';
    hideUserDropdown();
}

function hideRegisterModal() {
    if (registerModal) registerModal.style.display = 'none';
}

function toggleUserDropdown() {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

function hideUserDropdown() {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
}

// ========== EVENTOS ==========
function setupEventListeners() {
    if (cartIcon) {
        cartIcon.addEventListener('click', toggleCart);
    }
    
    const closeCartBtn = document.querySelector('.close-cart');
    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', toggleCart);
    }
    
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', finalizarCompra);
    }
    
    const userIcon = document.getElementById('user-icon');
    if (userIcon) {
        userIcon.addEventListener('click', toggleUserDropdown);
    }
    
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', showLoginModal);
    }
    
    const cadastroBtn = document.getElementById('cadastro-btn');
    if (cadastroBtn) {
        cadastroBtn.addEventListener('click', showRegisterModal);
    }
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            currentUser = null;
            localStorage.removeItem('currentUser');
            updateUserInterface();
            showNotification('Logout realizado com sucesso!');
        });
    }
    
    const myPlanBtn = document.getElementById('my-plan-btn');
    if (myPlanBtn) {
        myPlanBtn.addEventListener('click', () => {
            if (currentUserPlan) {
                alert(`📋 SEU PLANO ATUAL\n\nPlano: ${currentUserPlan.plano.toUpperCase()}\nValor: R$ ${currentUserPlan.preco}/mês\nData: ${new Date(currentUserPlan.dataAssinatura).toLocaleDateString()}\n\nBenefícios:\n- ${currentUserPlan.plano === 'basico' ? '1 banho/mês' : currentUserPlan.plano === 'premium' ? '2 banhos/mês' : 'Banhos ilimitados'}\n- ${currentUserPlan.plano === 'basico' ? '10%' : currentUserPlan.plano === 'premium' ? '20%' : '30%'} desconto em produtos\n${currentUserPlan.plano === 'vip' ? '- 1 corte de graça/mês\n- Prioridade no agendamento' : ''}`);
            } else {
                alert('Você ainda não possui um plano. Visite a seção CONVÊNIO para assinar!');
            }
        });
    }
    
    const closeBtns = document.querySelectorAll('.modal .close');
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (loginModal) loginModal.style.display = 'none';
            if (registerModal) registerModal.style.display = 'none';
            const checkoutModal = document.getElementById('checkout-modal');
            if (checkoutModal) checkoutModal.style.display = 'none';
        });
    });
    
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const senha = document.getElementById('login-password').value;
            fazerLogin(email, senha);
            loginForm.reset();
        });
    }
    
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nome = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const senha = document.getElementById('reg-password').value;
            cadastrarUsuario(nome, email, senha);
            registerForm.reset();
        });
    }
    
    const showRegisterLink = document.getElementById('show-register-link');
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            hideLoginModal();
            showRegisterModal();
        });
    }
    
    // Busca
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            if (searchInput.style.display === 'none') {
                searchInput.style.display = 'block';
                searchInput.focus();
            } else {
                searchInput.style.display = 'none';
                searchInput.value = '';
                renderizarProdutos('todos');
            }
        });
        
        searchInput.addEventListener('keyup', (e) => {
            const termo = e.target.value.toLowerCase();
            if (termo === '') {
                renderizarProdutos('todos');
                return;
            }
            
            const filtrados = produtos.filter(p => p.nome.toLowerCase().includes(termo));
            const container = document.getElementById('produtos-container');
            if (container) {
                if (filtrados.length === 0) {
                    container.innerHTML = '<div class="loading">Nenhum produto encontrado</div>';
                } else {
                    container.innerHTML = filtrados.map(produto => `
                        <article class="box" data-product-id="${produto.id}">
                            <img width="250" src="https://filipesep.github.io/loja-pet/img/${produto.imagem}" 
                                 alt="${produto.nome}"
                                 onerror="this.src='https://via.placeholder.com/250x200/ff6b6b/ffffff?text=UNIPETS'">
                            <h3>${produto.nome}</h3>
                            <div class="price">R$ ${produto.preco.toFixed(2)}</div>
                            <button class="btn add-to-cart" 
                                    data-product-id="${produto.id}"
                                    data-product="${produto.nome}" 
                                    data-price="${produto.preco}">
                                Adicionar ao Carrinho
                            </button>
                        </article>
                    `).join('');
                }
            }
            atribuirEventosProdutos();
        });
    }
    
    window.addEventListener('click', (event) => {
        if (loginModal && event.target === loginModal) hideLoginModal();
        if (registerModal && event.target === registerModal) hideRegisterModal();
        if (cartModal && event.target === cartModal) toggleCart();
        
        const checkoutModal = document.getElementById('checkout-modal');
        if (checkoutModal && event.target === checkoutModal) closeCheckout();
        
        const dropdown = document.getElementById('user-dropdown');
        if (dropdown && dropdown.classList.contains('show') && !event.target.closest('.user-menu')) {
            hideUserDropdown();
        }
    });
    
    setupCEPAutoComplete();
}

function setupCheckoutButton() {
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', finalizarCompra);
    }
}

function atribuirEventosProdutos() {
    const botoes = document.querySelectorAll('.add-to-cart');
    botoes.forEach(botao => {
        botao.removeEventListener('click', addToCartHandler);
        botao.addEventListener('click', addToCartHandler);
    });
}

function addToCartHandler(event) {
    const button = event.currentTarget;
    const productId = button.dataset.productId;
    const productName = button.dataset.product;
    const productPrice = parseFloat(button.dataset.price);
    addToCart(productId, productName, productPrice);
}

function setupCEPAutoComplete() {
    const cepInput = document.getElementById('cep');
    if (cepInput) {
        cepInput.addEventListener('blur', async () => {
            let cep = cepInput.value.replace(/\D/g, '');
            if (cep.length === 8) {
                try {
                    const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                    const dados = await resposta.json();
                    if (!dados.erro) {
                        document.getElementById('logradouro').value = dados.logradouro || '';
                        document.getElementById('bairro').value = dados.bairro || '';
                        document.getElementById('cidade').value = dados.localidade || '';
                        document.getElementById('estado').value = dados.uf || '';
                    }
                } catch (erro) {
                    console.error('Erro ao buscar CEP:', erro);
                }
            }
        });
        
        cepInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 5) {
                value = value.substring(0, 5) + '-' + value.substring(5, 8);
            }
            e.target.value = value;
        });
    }
}

// ========== UTILITÁRIOS ==========
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-size: 1.4rem;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 4000);
}

// Adicionar animação
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

console.log('✅ UNIPETS 2.0 - Sistema carregado com sucesso!');
console.log('📦 Versão com:', produtos.length, 'produtos');
console.log('🏷️ Categorias: Alimentos, Brinquedos, Camas, Higiene');
console.log('💳 Sistema de convênio ativo!');