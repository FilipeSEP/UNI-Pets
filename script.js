// ========== UNIPETS - VERSÃO MOBILE 100% ==========
console.log('🚀 UNIPETS iniciando...');

// Estado
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let selectedShipping = null;
let checkoutData = { address: null, shipping: null, payment: null };
let currentUserPlan = JSON.parse(localStorage.getItem('userPlan')) || null;

// Elementos
const cartIcon = document.getElementById('cart-icon');
const cartCounter = document.getElementById('cart-counter');
let cartModal, loginModal, registerModal;

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado');
    criarModais();
    atualizarCarrinhoContador();
    atualizarInterfaceUsuario();
    configurarEventos();
    configurarFiltros();
    configurarBusca();
});

// ========== CRIA MODAIS SE NÃO EXISTIREM ==========
function criarModais() {
    if (!document.getElementById('cart-modal')) {
        cartModal = document.createElement('div');
        cartModal.id = 'cart-modal';
        cartModal.className = 'modal cart-modal';
        cartModal.innerHTML = `<div class="modal-content"><span class="close-cart">&times;</span><h2>Seu Carrinho</h2><div id="cart-items"></div><div class="cart-total"><strong>Total:</strong> R$ <span id="cart-total">0,00</span></div><button id="checkout-btn" class="btn-primary">Finalizar Compra</button></div>`;
        document.body.appendChild(cartModal);
    } else {
        cartModal = document.getElementById('cart-modal');
    }
    loginModal = document.getElementById('login-modal');
    registerModal = document.getElementById('register-modal');
}

// ========== FILTROS (funciona no mobile) ==========
function configurarFiltros() {
    const botoes = document.querySelectorAll('.cat-btn');
    const produtos = document.querySelectorAll('.menu .box');
    if (!botoes.length) return;

    function aplicarFiltro(categoria) {
        produtos.forEach(prod => {
            const cat = prod.getAttribute('data-categoria');
            prod.style.display = (categoria === 'todos' || cat === categoria) ? 'flex' : 'none';
        });
    }

    botoes.forEach(botao => {
        botao.addEventListener('click', (e) => {
            e.preventDefault();
            const categoria = botao.getAttribute('data-cat');
            document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
            botao.classList.add('active');
            aplicarFiltro(categoria);
        });
    });
}

// ========== BUSCA ==========
function configurarBusca() {
    const btn = document.getElementById('search-btn');
    const input = document.getElementById('search-input');
    if (!btn) return;
    btn.addEventListener('click', () => {
        if (input.style.display === 'none') {
            input.style.display = 'block';
            input.focus();
        } else {
            input.style.display = 'none';
            input.value = '';
            document.querySelectorAll('.menu .box').forEach(p => p.style.display = 'flex');
        }
    });
    input.addEventListener('keyup', () => {
        const termo = input.value.toLowerCase();
        document.querySelectorAll('.menu .box').forEach(prod => {
            const nome = prod.querySelector('h3')?.innerText.toLowerCase() || '';
            prod.style.display = nome.includes(termo) ? 'flex' : 'none';
        });
    });
}

// ========== PLANOS (convênio) ==========
window.assinarPlano = function(plano) {
    console.log('Assinando plano:', plano);
    if (!currentUser) {
        alert('Faça login para assinar um plano!');
        if (loginModal) loginModal.style.display = 'block';
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
        atualizarInterfaceUsuario();
    }
};

function calcularPrecoComDesconto(preco) {
    if (!currentUserPlan) return preco;
    const descontos = { basico: 0.1, premium: 0.2, vip: 0.3 };
    return preco * (1 - (descontos[currentUserPlan.plano] || 0));
}

// ========== CARRINHO ==========
function adicionarAoCarrinho(id, nome, preco) {
    const existente = cart.find(item => item.id === id);
    const precoFinal = currentUserPlan ? calcularPrecoComDesconto(preco) : preco;
    if (existente) existente.quantity++;
    else cart.push({ id, name: nome, price: precoFinal, priceOriginal: preco, quantity: 1 });
    salvarCarrinho();
    atualizarCarrinhoContador();
    atualizarModalCarrinho();
    alert(`${nome} adicionado!`);
}

function removerDoCarrinho(id) {
    cart = cart.filter(item => item.id !== id);
    salvarCarrinho();
    atualizarCarrinhoContador();
    atualizarModalCarrinho();
}

function alterarQuantidade(id, delta) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) removerDoCarrinho(id);
        else { salvarCarrinho(); atualizarCarrinhoContador(); atualizarModalCarrinho(); }
    }
}

function atualizarCarrinhoContador() {
    if (cartCounter) cartCounter.textContent = cart.reduce((s, i) => s + i.quantity, 0);
}

function atualizarModalCarrinho() {
    const div = document.getElementById('cart-items');
    const totalSpan = document.getElementById('cart-total');
    if (!div) return;
    if (!cart.length) { div.innerHTML = '<p style="text-align:center;">Carrinho vazio</p>'; if (totalSpan) totalSpan.textContent = '0,00'; return; }
    let total = 0;
    div.innerHTML = cart.map(item => {
        const sub = item.price * item.quantity;
        total += sub;
        return `<div class="cart-item"><div><h4>${item.name}</h4><p>R$ ${item.price.toFixed(2)}</p></div><div><button onclick="alterarQuantidade('${item.id}', -1)">-</button> ${item.quantity} <button onclick="alterarQuantidade('${item.id}', 1)">+</button> <button onclick="removerDoCarrinho('${item.id}')">🗑️</button></div></div>`;
    }).join('');
    if (totalSpan) totalSpan.textContent = total.toFixed(2);
}

function abrirFecharCarrinho() {
    if (!cartModal) return;
    const visivel = cartModal.style.display === 'block';
    cartModal.style.display = visivel ? 'none' : 'block';
    if (!visivel) atualizarModalCarrinho();
}

function salvarCarrinho() { localStorage.setItem('cart', JSON.stringify(cart)); }

function configurarBotoesProdutos() {
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.removeEventListener('click', handlerProduto);
        btn.addEventListener('click', handlerProduto);
    });
}
function handlerProduto(e) {
    const btn = e.currentTarget;
    adicionarAoCarrinho(btn.dataset.productId, btn.dataset.product, parseFloat(btn.dataset.price));
}

// ========== CHECKOUT ==========
function finalizarCompra() {
    if (!cart.length) { alert('Carrinho vazio'); return; }
    if (!currentUser) { alert('Faça login'); abrirFecharCarrinho(); if (loginModal) loginModal.style.display = 'block'; return; }
    abrirFecharCarrinho();
    setTimeout(() => { const modal = document.getElementById('checkout-modal'); if (modal) modal.style.display = 'block'; resetarCheckout(); }, 200);
}
function resetarCheckout() { checkoutData = { address: null, shipping: null, payment: null }; selectedShipping = null; irParaStep(1); atualizarResumo(); }
function irParaStep(step) {
    document.querySelectorAll('.checkout-step').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(`step-${step}`);
    const indicador = document.querySelector(`[data-step="${step}"]`);
    if (el) el.style.display = 'block';
    if (indicador) indicador.classList.add('active');
}
function proximoStep(next) {
    if (next === 2) { if (!validarEndereco()) { alert('Preencha o endereço'); return; } salvarEndereco(); calcularFrete(); }
    if (next === 3) { if (!selectedShipping) { alert('Selecione o frete'); return; } checkoutData.shipping = selectedShipping; atualizarResumo(); }
    irParaStep(next);
}
function stepAnterior(prev) { irParaStep(prev); }
function validarEndereco() { return ['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado'].every(id => document.getElementById(id)?.value.trim()); }
function salvarEndereco() { checkoutData.address = { cep: document.getElementById('cep').value, logradouro: document.getElementById('logradouro').value, numero: document.getElementById('numero').value, complemento: document.getElementById('complemento').value, bairro: document.getElementById('bairro').value, cidade: document.getElementById('cidade').value, estado: document.getElementById('estado').value }; }
function calcularFrete() {
    const div = document.getElementById('shipping-options');
    if (!div) return;
    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    let opcoes = [
        { nome: 'Econômica', preco: 15.90, dias: '7-10' },
        { nome: 'Padrão', preco: 24.90, dias: '3-5' },
        { nome: 'Expressa', preco: 39.90, dias: '1-2' }
    ];
    if (subtotal > 200 || currentUserPlan?.plano === 'vip') opcoes.unshift({ nome: 'Grátis', preco: 0, dias: '5-7' });
    div.innerHTML = opcoes.map((opt, idx) => `<div class="shipping-option ${idx === 1 ? 'selected' : ''}" onclick="selecionarFrete(${idx})"><input type="radio" name="shipping" ${idx === 1 ? 'checked' : ''}><div><strong>${opt.nome}</strong><div>${opt.dias} dias úteis</div></div><div>${opt.preco === 0 ? 'GRÁTIS' : `R$ ${opt.preco.toFixed(2)}`}</div></div>`).join('');
    selectedShipping = opcoes[1];
    if (opcoes[0].preco === 0) selectedShipping = opcoes[0];
}
window.selecionarFrete = function(idx) {
    const opcoes = [];
    document.querySelectorAll('.shipping-option').forEach(opt => {
        const nome = opt.querySelector('strong')?.innerText || '';
        const precoTxt = opt.querySelector('div:last-child')?.innerText || 'R$ 0';
        let preco = 0;
        if (precoTxt !== 'GRÁTIS') preco = parseFloat(precoTxt.replace('R$', '').replace(',', '.'));
        const dias = opt.innerText.match(/\d+/)?.[0] || '5';
        opcoes.push({ nome, preco, dias });
    });
    selectedShipping = opcoes[idx];
    document.querySelectorAll('.shipping-option').forEach((opt, i) => { if (i === idx) opt.classList.add('selected'); else opt.classList.remove('selected'); });
    atualizarResumo();
};
function atualizarResumo() {
    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const frete = selectedShipping?.preco || 0;
    document.getElementById('summary-subtotal').innerHTML = `R$ ${subtotal.toFixed(2)}`;
    document.getElementById('summary-frete').innerHTML = `R$ ${frete.toFixed(2)}`;
    document.getElementById('summary-total').innerHTML = `R$ ${(subtotal + frete).toFixed(2)}`;
}
function finalizarPedido() {
    const metodo = document.querySelector('input[name="payment"]:checked')?.value;
    if (!metodo) { alert('Escolha o pagamento'); return; }
    checkoutData.payment = metodo;
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0) + (selectedShipping?.preco || 0);
    const num = '#' + Math.random().toString(36).substr(2, 8).toUpperCase();
    document.getElementById('order-number').innerHTML = num;
    document.getElementById('delivery-estimate').innerHTML = `${selectedShipping?.dias || 5} dias úteis`;
    document.getElementById('order-total').innerHTML = `R$ ${total.toFixed(2)}`;
    irParaStep(4);
    cart = [];
    salvarCarrinho();
    atualizarCarrinhoContador();
    alert('Pedido finalizado!');
}
window.finalizeOrder = finalizarPedido;
window.nextStep = proximoStep;
window.prevStep = stepAnterior;
window.closeCheckout = () => { const modal = document.getElementById('checkout-modal'); if (modal) modal.style.display = 'none'; };

// ========== LOGIN ==========
function fazerLogin(email, senha) {
    const nome = email.split('@')[0];
    currentUser = { id: 1, nome, email };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    atualizarInterfaceUsuario();
    if (loginModal) loginModal.style.display = 'none';
    alert(`Bem-vindo, ${nome}!`);
    const plano = localStorage.getItem('userPlan');
    if (plano) currentUserPlan = JSON.parse(plano);
}
function cadastrar(nome, email, senha) { fazerLogin(email, senha); if (registerModal) registerModal.style.display = 'none'; }
function atualizarInterfaceUsuario() {
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
function abrirLogin() { if (loginModal) loginModal.style.display = 'block'; fecharDropdown(); }
function fecharLogin() { if (loginModal) loginModal.style.display = 'none'; }
function abrirCadastro() { if (registerModal) registerModal.style.display = 'block'; fecharDropdown(); }
function fecharCadastro() { if (registerModal) registerModal.style.display = 'none'; }
function alternarDropdown() { document.getElementById('user-dropdown')?.classList.toggle('show'); }
function fecharDropdown() { document.getElementById('user-dropdown')?.classList.remove('show'); }

// ========== CONFIGURAÇÃO DE EVENTOS ==========
function configurarEventos() {
    if (cartIcon) cartIcon.addEventListener('click', abrirFecharCarrinho);
    document.querySelector('.close-cart')?.addEventListener('click', abrirFecharCarrinho);
    document.getElementById('checkout-btn')?.addEventListener('click', finalizarCompra);
    document.getElementById('user-icon')?.addEventListener('click', alternarDropdown);
    document.getElementById('login-btn')?.addEventListener('click', abrirLogin);
    document.getElementById('cadastro-btn')?.addEventListener('click', abrirCadastro);
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        currentUser = null;
        localStorage.removeItem('currentUser');
        atualizarInterfaceUsuario();
        alert('Logout');
    });
    document.getElementById('my-plan-btn')?.addEventListener('click', () => {
        if (currentUserPlan) alert(`Plano ${currentUserPlan.plano} - R$ ${currentUserPlan.preco}/mês`);
        else alert('Nenhum plano ativo. Acesse CONVÊNIO.');
    });
    document.querySelectorAll('.modal .close').forEach(btn => {
        btn.addEventListener('click', () => {
            if (loginModal) loginModal.style.display = 'none';
            if (registerModal) registerModal.style.display = 'none';
            const checkout = document.getElementById('checkout-modal');
            if (checkout) checkout.style.display = 'none';
        });
    });
    document.getElementById('login-form')?.addEventListener('submit', e => {
        e.preventDefault();
        fazerLogin(document.getElementById('login-email').value, document.getElementById('login-password').value);
    });
    document.getElementById('register-form')?.addEventListener('submit', e => {
        e.preventDefault();
        cadastrar(document.getElementById('reg-name').value, document.getElementById('reg-email').value, document.getElementById('reg-password').value);
    });
    document.getElementById('show-register-link')?.addEventListener('click', e => {
        e.preventDefault();
        fecharLogin();
        abrirCadastro();
    });
    window.addEventListener('click', e => {
        if (loginModal && e.target === loginModal) fecharLogin();
        if (registerModal && e.target === registerModal) fecharCadastro();
        if (cartModal && e.target === cartModal) abrirFecharCarrinho();
        if (e.target === document.getElementById('checkout-modal')) document.getElementById('checkout-modal').style.display = 'none';
        if (!e.target.closest('.user-menu')) fecharDropdown();
    });
    configurarBotoesProdutos();
    configurarCEP();
}

function configurarCEP() {
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
            try {
                const res = await fetch(`https://viacep.com.br/ws/${v}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    document.getElementById('logradouro').value = data.logradouro || '';
                    document.getElementById('bairro').value = data.bairro || '';
                    document.getElementById('cidade').value = data.localidade || '';
                    document.getElementById('estado').value = data.uf || '';
                }
            } catch (err) { console.log(err); }
        }
    });
}

console.log('✅ UNIPETS mobile final');