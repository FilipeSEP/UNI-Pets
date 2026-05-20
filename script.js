// ====================================================================
// UNIPETS - SISTEMA COMPLETO E ESTÁVEL
// ====================================================================

// ========== 1. ESTADO GLOBAL ==========
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let selectedShipping = null;
let checkoutData = { address: null, shipping: null, payment: null };
let currentUserPlan = JSON.parse(localStorage.getItem('userPlan')) || null;

// ========== 2. ELEMENTOS DOM ==========
const cartIcon = document.getElementById('cart-icon');
const cartCounter = document.getElementById('cart-counter');
let cartModal, loginModal, registerModal;

// ========== 3. INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 UNIPETS inicializado');
    criarModais();
    atualizarCarrinhoContador();
    atualizarInterfaceUsuario();
    configurarEventos();
    configurarFiltros();
    configurarBusca();
    setupPix();
});

// ========== 4. MODAIS ==========
function criarModais() {
    cartModal = document.getElementById('cart-modal');
    if (!cartModal) {
        cartModal = document.createElement('div');
        cartModal.id = 'cart-modal';
        cartModal.className = 'modal cart-modal';
        cartModal.innerHTML = `<div class="modal-content"><span class="close-cart">&times;</span><h2>Seu Carrinho</h2><div id="cart-items"></div><div class="cart-total"><strong>Total:</strong> R$ <span id="cart-total">0,00</span></div><button id="checkout-btn" class="btn-primary">Finalizar Compra</button></div>`;
        document.body.appendChild(cartModal);
    }
    loginModal = document.getElementById('login-modal');
    registerModal = document.getElementById('register-modal');
}

// ========== 5. FILTROS ==========
function configurarFiltros() {
    const botoes = document.querySelectorAll('.cat-btn');
    const produtos = document.querySelectorAll('.menu .box');
    if (botoes.length === 0) return;
    function aplicarFiltro(categoria) {
        produtos.forEach(produto => {
            const cat = produto.getAttribute('data-categoria');
            produto.style.display = (categoria === 'todos' || cat === categoria) ? 'flex' : 'none';
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

// ========== 6. BUSCA ==========
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
            document.querySelectorAll('.cat-btn').forEach(btn2 => {
                if (btn2.getAttribute('data-cat') === 'todos') btn2.classList.add('active');
                else btn2.classList.remove('active');
            });
        }
    });
    input.addEventListener('keyup', () => {
        const termo = input.value.toLowerCase();
        document.querySelectorAll('.menu .box').forEach(produto => {
            const nome = produto.querySelector('h3')?.innerText.toLowerCase() || '';
            produto.style.display = nome.includes(termo) ? 'flex' : 'none';
        });
    });
}

// ========== 7. SISTEMA DE CARRINHO ==========
function adicionarAoCarrinho(id, nome, preco) {
    const existente = cart.find(item => item.id === id);
    let precoFinal = preco;
    if (currentUserPlan) {
        if (currentUserPlan.plano === 'patinhas') precoFinal = preco * 0.9;
        else if (currentUserPlan.plano === 'amigo-pet') precoFinal = preco * 0.8;
        else if (currentUserPlan.plano === 'vida-animal') precoFinal = preco * 0.7;
    }
    if (existente) {
        existente.quantity++;
    } else {
        cart.push({ id, name: nome, price: precoFinal, priceOriginal: preco, quantity: 1 });
    }
    salvarCarrinho();
    atualizarCarrinhoContador();
    atualizarModalCarrinho();
    alert(nome + ' adicionado!');
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
    if (cart.length === 0) {
        div.innerHTML = '<p style="text-align:center;">Carrinho vazio</p>';
        if (totalSpan) totalSpan.textContent = '0,00';
        return;
    }
    let total = 0;
    let html = '';
    for (let i = 0; i < cart.length; i++) {
        const item = cart[i];
        const subtotal = item.price * item.quantity;
        total += subtotal;
        html += `<div class="cart-item"><div class="cart-item-info"><h4>${item.name}</h4><p>R$ ${item.price.toFixed(2)}</p></div><div class="cart-item-actions"><button class="quantity-btn" onclick="alterarQuantidade('${item.id}', -1)">-</button><span>${item.quantity}</span><button class="quantity-btn" onclick="alterarQuantidade('${item.id}', 1)">+</button><button onclick="removerDoCarrinho('${item.id}')" style="background:none; border:none; color:red;">🗑️</button></div></div>`;
    }
    div.innerHTML = html;
    if (totalSpan) totalSpan.textContent = total.toFixed(2);
}

function abrirFecharCarrinho() {
    if (!cartModal) return;
    if (cartModal.style.display === 'block') cartModal.style.display = 'none';
    else { atualizarModalCarrinho(); cartModal.style.display = 'block'; }
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
    adicionarAoCarrinho(btn.getAttribute('data-product-id'), btn.getAttribute('data-product'), parseFloat(btn.getAttribute('data-price')));
}

// ========== 8. PLANOS ==========
window.assinarPlano = function(plano) {
    if (!currentUser) {
        alert('Faça login para assinar!');
        if (loginModal) loginModal.style.display = 'block';
        return;
    }
    let preco = 0, beneficios = '';
    if (plano === 'patinhas') { preco = 39.90; beneficios = '1 banho/mês, 10% off'; }
    else if (plano === 'amigo-pet') { preco = 79.90; beneficios = '2 banhos/mês, 20% off, prioridade'; }
    else { preco = 149.90; beneficios = 'Banhos ilimitados, 30% off, corte grátis'; }
    if (confirm(`Confirmar Plano ${plano} - R$ ${preco}/mês?\n\n${beneficios}\n\n*UNIPETS não cobre consultas.`)) {
        currentUserPlan = { plano, preco, dataAssinatura: new Date().toISOString() };
        localStorage.setItem('userPlan', JSON.stringify(currentUserPlan));
        alert('✅ Plano ativado!');
        atualizarInterfaceUsuario();
    }
};

// ========== 9. PAGAMENTO PIX ==========
function setupPix() {
    console.log('🔧 setupPix executado');
    const radioPix = document.querySelector('input[name="payment"][value="pix"]');
    const pixContent = document.getElementById('pix-content');
    if (!radioPix) { console.warn('Radio PIX não encontrado'); return; }
    if (!pixContent) { console.warn('pix-content não encontrado'); return; }
    const radios = document.querySelectorAll('input[name="payment"]');
    radios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'pix') {
                pixContent.style.display = 'block';
            } else {
                pixContent.style.display = 'none';
            }
        });
    });
    console.log('✅ setupPix configurado');
}

window.copiarCodigoPix = function() {
    const codigo = document.getElementById('pix-codigo');
    if (!codigo) return;
    const textarea = document.createElement('textarea');
    textarea.value = codigo.innerText;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    alert('Código PIX copiado!');
};

function atualizarPixComValor(total) {
    const pixData = `00020126360014br.gov.bcb.pix0114contato@unipets.com.br52040000530398654${total.toFixed(2).replace('.', '')}5802BR5925UNIPETS PET SHOP6009SAO PAULO62070503***6304E2A3`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixData)}`;
    const qrImg = document.getElementById('pix-qr');
    if (qrImg) qrImg.src = qrUrl;
    const codigoElement = document.getElementById('pix-codigo');
    if (codigoElement) codigoElement.innerText = pixData;
}

// ========== 10. CHECKOUT ==========
function finalizarCompra() {
    if (cart.length === 0) { alert('Carrinho vazio'); return; }
    if (!currentUser) { alert('Faça login'); abrirFecharCarrinho(); if (loginModal) loginModal.style.display = 'block'; return; }
    abrirFecharCarrinho();
    setTimeout(() => { const modal = document.getElementById('checkout-modal'); if (modal) modal.style.display = 'block'; resetarCheckout(); }, 200);
}

function resetarCheckout() {
    checkoutData = { address: null, shipping: null, payment: null };
    selectedShipping = null;
    irParaStep(1);
    atualizarResumo();
}

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

function validarEndereco() {
    const campos = ['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado'];
    for (let i = 0; i < campos.length; i++) {
        const el = document.getElementById(campos[i]);
        if (!el || !el.value.trim()) return false;
    }
    return true;
}

function salvarEndereco() {
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

function calcularFrete() {
    const div = document.getElementById('shipping-options');
    if (!div) return;
    let subtotal = 0;
    for (let i = 0; i < cart.length; i++) subtotal += cart[i].price * cart[i].quantity;
    let opcoes = [
        { nome: 'Econômica', preco: 15.90, dias: '7-10' },
        { nome: 'Padrão', preco: 24.90, dias: '3-5' },
        { nome: 'Expressa', preco: 39.90, dias: '1-2' }
    ];
    if (subtotal > 200 || (currentUserPlan && currentUserPlan.plano === 'vida-animal')) opcoes.unshift({ nome: 'Grátis', preco: 0, dias: '5-7' });
    let html = '';
    for (let i = 0; i < opcoes.length; i++) {
        const opt = opcoes[i];
        const precoTexto = opt.preco === 0 ? 'GRÁTIS' : `R$ ${opt.preco.toFixed(2)}`;
        let selectedClass = (i === 1) ? 'selected' : '';
        if (opt.preco === 0) selectedClass = 'selected';
        html += `<div class="shipping-option ${selectedClass}" onclick="selecionarFrete(${i})"><input type="radio" name="shipping" ${selectedClass ? 'checked' : ''}><div class="shipping-info"><div><strong>${opt.nome}</strong><div class="shipping-time">${opt.dias} dias úteis</div></div><div class="shipping-price">${precoTexto}</div></div></div>`;
    }
    div.innerHTML = html;
    selectedShipping = opcoes[1];
    if (opcoes[0].preco === 0) selectedShipping = opcoes[0];
}

window.selecionarFrete = function(idx) {
    const opcoes = [];
    document.querySelectorAll('.shipping-option').forEach(opt => {
        const nome = opt.querySelector('strong')?.innerText || '';
        const precoTxt = opt.querySelector('.shipping-price')?.innerText || 'R$ 0';
        let preco = 0;
        if (precoTxt !== 'GRÁTIS') preco = parseFloat(precoTxt.replace('R$', '').replace(',', '.'));
        const dias = opt.innerText.match(/\d+/)?.[0] || '5';
        opcoes.push({ nome, preco, dias });
    });
    selectedShipping = opcoes[idx];
    document.querySelectorAll('.shipping-option').forEach((opt, i) => {
        if (i === idx) opt.classList.add('selected');
        else opt.classList.remove('selected');
    });
    atualizarResumo();
};

function atualizarResumo() {
    let subtotal = 0;
    for (let i = 0; i < cart.length; i++) subtotal += cart[i].price * cart[i].quantity;
    const frete = selectedShipping ? selectedShipping.preco : 0;
    document.getElementById('summary-subtotal').innerHTML = `R$ ${subtotal.toFixed(2)}`;
    document.getElementById('summary-frete').innerHTML = `R$ ${frete.toFixed(2)}`;
    document.getElementById('summary-total').innerHTML = `R$ ${(subtotal + frete).toFixed(2)}`;
}

function finalizeOrder() {
    const metodo = document.querySelector('input[name="payment"]:checked');
    if (!metodo) { alert('Selecione o pagamento'); return; }
    checkoutData.payment = metodo.value;
    let total = 0;
    for (let i = 0; i < cart.length; i++) total += cart[i].price * cart[i].quantity;
    total += selectedShipping ? selectedShipping.preco : 0;
    if (metodo.value === 'pix') atualizarPixComValor(total);
    const numPedido = '#' + Math.random().toString(36).substr(2, 8).toUpperCase();
    document.getElementById('order-number').innerHTML = numPedido;
    document.getElementById('delivery-estimate').innerHTML = `${selectedShipping ? selectedShipping.dias : 5} dias úteis`;
    document.getElementById('order-total').innerHTML = `R$ ${total.toFixed(2)}`;
    irParaStep(4);
    cart = [];
    salvarCarrinho();
    atualizarCarrinhoContador();
    alert('Pedido finalizado!');
}

window.finalizeOrder = finalizeOrder;
window.nextStep = proximoStep;
window.prevStep = stepAnterior;
window.closeCheckout = () => { const modal = document.getElementById('checkout-modal'); if (modal) modal.style.display = 'none'; };

// ========== 11. LOGIN ==========
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

// ========== 12. EVENTOS GLOBAIS ==========
function configurarEventos() {
    if (cartIcon) cartIcon.addEventListener('click', abrirFecharCarrinho);
    document.querySelector('.close-cart')?.addEventListener('click', abrirFecharCarrinho);
    document.getElementById('checkout-btn')?.addEventListener('click', finalizarCompra);
    document.getElementById('user-icon')?.addEventListener('click', alternarDropdown);
    document.getElementById('login-btn')?.addEventListener('click', abrirLogin);
    document.getElementById('cadastro-btn')?.addEventListener('click', abrirCadastro);
    document.getElementById('logout-btn')?.addEventListener('click', () => { currentUser = null; localStorage.removeItem('currentUser'); atualizarInterfaceUsuario(); alert('Logout'); });
    document.getElementById('my-plan-btn')?.addEventListener('click', () => { if (currentUserPlan) alert(`Plano ${currentUserPlan.plano} - R$ ${currentUserPlan.preco}/mês`); else alert('Nenhum plano ativo'); });
    document.querySelectorAll('.modal .close').forEach(btn => { btn.addEventListener('click', () => { if (loginModal) loginModal.style.display = 'none'; if (registerModal) registerModal.style.display = 'none'; document.getElementById('checkout-modal')?.style.display = 'none'; }); });
    document.getElementById('login-form')?.addEventListener('submit', e => { e.preventDefault(); fazerLogin(document.getElementById('login-email').value, document.getElementById('login-password').value); });
    document.getElementById('register-form')?.addEventListener('submit', e => { e.preventDefault(); cadastrar(document.getElementById('reg-name').value, document.getElementById('reg-email').value, document.getElementById('reg-password').value); });
    document.getElementById('show-register-link')?.addEventListener('click', e => { e.preventDefault(); fecharLogin(); abrirCadastro(); });
    window.addEventListener('click', e => { if (loginModal && e.target === loginModal) fecharLogin(); if (registerModal && e.target === registerModal) fecharCadastro(); if (cartModal && e.target === cartModal) abrirFecharCarrinho(); if (e.target === document.getElementById('checkout-modal')) document.getElementById('checkout-modal').style.display = 'none'; if (!e.target.closest('.user-menu')) fecharDropdown(); });
    configurarBotoesProdutos();
    configurarCEP();
}

function configurarCEP() {
    const cep = document.getElementById('cep');
    if (!cep) return;
    cep.addEventListener('input', e => { let v = e.target.value.replace(/\D/g, ''); if (v.length > 5) v = v.slice(0, 5) + '-' + v.slice(5, 8); e.target.value = v; });
    cep.addEventListener('blur', async () => { let v = cep.value.replace(/\D/g, ''); if (v.length === 8) { try { const resposta = await fetch(`https://viacep.com.br/ws/${v}/json/`); const data = await resposta.json(); if (!data.erro) { document.getElementById('logradouro').value = data.logradouro || ''; document.getElementById('bairro').value = data.bairro || ''; document.getElementById('cidade').value = data.localidade || ''; document.getElementById('estado').value = data.uf || ''; } } catch (err) { console.log(err); } } });
}

// ========== 13. MODAL "SAIBA MAIS" ==========
window.abrirModalSaibaMais = function(servico) {
    let titulo = '', descricao = '', beneficios = [], duracao = '';
    if (servico === 'banho') { titulo = '🐕 Serviço de Banho'; descricao = 'Banho completo com produtos hipoalergênicos.'; beneficios = ['✅ Produtos de qualidade', '✅ Secagem adequada', '✅ Escovação inclusa']; duracao = '⏱️ 1 hora'; }
    else if (servico === 'tosa') { titulo = '✂️ Serviço de Tosa'; descricao = 'Tosa profissional respeitando o padrão da raça.'; beneficios = ['✅ Profissional especializado', '✅ Equipamentos de qualidade', '✅ Finalização com perfume']; duracao = '⏱️ 1h30'; }
    else if (servico === 'limpeza') { titulo = '👂 Limpeza de Ouvidos'; descricao = 'Limpeza profunda e segura.'; beneficios = ['✅ Remoção de cera', '✅ Produtos antissépticos', '✅ Prevenção de otites']; duracao = '⏱️ 20 minutos'; }
    else if (servico === 'unhas') { titulo = '✂️ Corte de Unhas'; descricao = 'Corte profissional sem risco.'; beneficios = ['✅ Corte preciso', '✅ Lixamento', '✅ Pet tranquilo']; duracao = '⏱️ 15 minutos'; }
    let modal = document.getElementById('modal-saiba-mais');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-saiba-mais';
        modal.className = 'modal';
        modal.innerHTML = `<div class="modal-content"><span class="close-saiba">&times;</span><div id="modal-saiba-conteudo"></div></div>`;
        document.body.appendChild(modal);
        modal.querySelector('.close-saiba').onclick = () => modal.style.display = 'none';
        window.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });
    }
    const conteudo = document.getElementById('modal-saiba-conteudo');
    conteudo.innerHTML = `<h2 style="color:#ff6b6b">${titulo}</h2><p style="font-size:1.6rem;margin-bottom:2rem;">${descricao}</p><ul style="list-style:none;">${beneficios.map(b => `<li style="padding:0.8rem 0;">${b}</li>`).join('')}</ul><p style="font-size:1.4rem;color:#666;">${duracao}</p><button class="btn-primary" style="margin-top:2rem;" onclick="document.getElementById('modal-saiba-mais').style.display='none'">Fechar</button>`;
    modal.style.display = 'block';
};

console.log('✅ UNIPETS - Sistema completo inicializado!');