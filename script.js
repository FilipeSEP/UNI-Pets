// ========== UNIPETS - VERSÃO FINAL REVISADA (PC + MOBILE) ==========
console.log('🚀 UNIPETS iniciando...');

// Estado Global
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let selectedShipping = null;
let checkoutData = { address: null, shipping: null, payment: null };
let currentUserPlan = JSON.parse(localStorage.getItem('userPlan')) || null;

// Elementos da Interface
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

// ========== MODAIS ==========
function criarModais() {
    // Vincula os modais existentes no HTML fornecido
    cartModal = document.getElementById('cart-modal');
    loginModal = document.getElementById('login-modal');
    registerModal = document.getElementById('register-modal');
}

// ========== FILTROS ==========
function configurarFiltros() {
    const botoes = document.querySelectorAll('.cat-btn');
    const produtos = document.querySelectorAll('.menu .box');
    if (botoes.length === 0) return;

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
        if (input.style.display === 'none' || input.style.display === '') {
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
        document.querySelectorAll('.menu .box').forEach(prod => {
            const nome = prod.querySelector('h3')?.innerText.toLowerCase() || '';
            prod.style.display = nome.includes(termo) ? 'flex' : 'none';
        });
    });
}

// ========== PLANOS ==========
window.assinarPlano = function(plano) {
    if (!currentUser) {
        alert('Faça login para assinar um plano!');
        if (loginModal) loginModal.style.display = 'block';
        return;
    }
    let preco = 0;
    let beneficios = '';
    if (plano === 'basico') {
        preco = 29.90;
        beneficios = '1 banho/mês, 10% off';
    } else if (plano === 'premium') {
        preco = 59.90;
        beneficios = '2 banhos/mês, 20% off, prioridade';
    } else {
        preco = 99.90;
        beneficios = 'Banhos ilimitados, 30% off, corte grátis';
    }
    if (confirm('Confirmar Plano ' + plano.toUpperCase() + ' - R$ ' + preco + '/mês?\n\n' + beneficios + '\n\n*UNIPETS não cobre consultas.')) {
        currentUserPlan = { plano: plano, preco: preco, dataAssinatura: new Date().toISOString() };
        localStorage.setItem('userPlan', JSON.stringify(currentUserPlan));
        alert('✅ Plano ' + plano.toUpperCase() + ' ativado!');
        atualizarInterfaceUsuario();
        
        // Aplica o desconto nos itens que já estão no carrinho
        cart.forEach(item => {
            item.price = calcularPrecoComDesconto(item.priceOriginal);
        });
        salvarCarrinho();
        atualizarModalCarrinho();
    }
};

function calcularPrecoComDesconto(preco) {
    if (!currentUserPlan) return preco;
    if (currentUserPlan.plano === 'basico') return preco * 0.9;
    if (currentUserPlan.plano === 'premium') return preco * 0.8;
    if (currentUserPlan.plano === 'vip') return preco * 0.7;
    return preco;
}

// ========== CARRINHO ==========
function adicionarAoCarrinho(id, nome, preco) {
    const existente = cart.find(item => item.id === id);
    const precoFinal = calcularPrecoComDesconto(preco);
    if (existente) {
        existente.quantity = existente.quantity + 1;
    } else {
        cart.push({ id: id, name: nome, price: precoFinal, priceOriginal: preco, quantity: 1 });
    }
    salvarCarrinho();
    atualizarCarrinhoContador();
    atualizarModalCarrinho();
    alert(nome + ' adicionado ao carrinho!');
}

function removerDoCarrinho(id) {
    cart = cart.filter(item => item.id !== id);
    salvarCarrinho();
    atualizarCarrinhoContador();
    atualizarModalCarrinho();
}

window.alterarQuantidade = function(id, delta) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity = item.quantity + delta;
        if (item.quantity <= 0) {
            removerDoCarrinho(id);
        } else {
            salvarCarrinho();
            atualizarCarrinhoContador();
            atualizarModalCarrinho();
        }
    }
};

window.removerDoCarrinho = removerDoCarrinho;

function atualizarCarrinhoContador() {
    if (cartCounter) {
        let total = 0;
        for (let i = 0; i < cart.length; i++) {
            total = total + cart[i].quantity;
        }
        cartCounter.textContent = total;
    }
}

function atualizarModalCarrinho() {
    const div = document.getElementById('cart-items');
    const totalSpan = document.getElementById('cart-total');
    if (!div) return;
    if (cart.length === 0) {
        div.innerHTML = '<p style="text-align:center; padding: 20px;">Seu carrinho está vazio</p>';
        if (totalSpan) totalSpan.textContent = '0,00';
        return;
    }
    let total = 0;
    let html = '';
    for (let i = 0; i < cart.length; i++) {
        const item = cart[i];
        const sub = item.price * item.quantity;
        total = total + sub;
        html = html + '<div class="cart-item" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:10px;"><div class="cart-item-info"><h4>' + item.name + '</h4><p>R$ ' + item.price.toFixed(2) + '</p></div><div class="cart-item-actions" style="display:flex; align-items:center; gap:5px;"><button class="quantity-btn" onclick="window.alterarQuantidade(\'' + item.id + '\', -1)">-</button><span style="min-width:20px; text-align:center;">' + item.quantity + '</span><button class="quantity-btn" onclick="window.alterarQuantidade(\'' + item.id + '\', 1)">+</button><button onclick="window.removerDoCarrinho(\'' + item.id + '\')" style="background:none; border:none; color:red; cursor:pointer; font-size:16px; padding:5px;">🗑️</button></div></div>';
    }
    div.innerHTML = html;
    if (totalSpan) totalSpan.textContent = total.toFixed(2);
}

function abrirFecharCarrinho() {
    if (!cartModal) return;
    if (cartModal.style.display === 'block') {
        cartModal.style.display = 'none';
    } else {
        atualizarModalCarrinho();
        cartModal.style.display = 'block';
    }
}

function salvarCarrinho() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// ========== CHECKOUT INTERFACE & PASSOS ==========
function finalizarCompra() {
    if (cart.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }
    if (!currentUser) {
        alert('Por favor, faça login para finalizar a sua compra.');
        abrirFecharCarrinho();
        if (loginModal) loginModal.style.display = 'block';
        return;
    }
    abrirFecharCarrinho();
    setTimeout(function() {
        const modal = document.getElementById('checkout-modal');
        if (modal) modal.style.display = 'block';
        resetarCheckout();
    }, 200);
}

function resetarCheckout() {
    checkoutData = { address: null, shipping: null, payment: null };
    selectedShipping = null;
    window.irParaStep(1);
    atualizarResumo();
}

window.irParaStep = function(step) {
    const steps = document.querySelectorAll('.checkout-step');
    for (let i = 0; i < steps.length; i++) {
        steps[i].style.display = 'none';
    }
    const stepsIndicator = document.querySelectorAll('.step');
    for (let i = 0; i < stepsIndicator.length; i++) {
        stepsIndicator[i].classList.remove('active');
    }
    const el = document.getElementById('step-' + step);
    const indicador = document.querySelector('[data-step="' + step + '"]');
    if (el) el.style.display = 'block';
    if (indicador) indicador.classList.add('active');
};

window.nextStep = function(next) {
    if (next === 2) {
        if (!validarEndereco()) {
            alert('Por favor, preencha todos os campos obrigatórios do endereço.');
            return;
        }
        salvarEndereco();
        calcularFrete();
    }
    if (next === 3) {
        if (!selectedShipping) {
            alert('Escolha uma opção de frete antes de continuar.');
            return;
        }
        checkoutData.shipping = selectedShipping;
        atualizarResumo();
    }
    window.irParaStep(next);
};

window.prevStep = function(prev) {
    window.irParaStep(prev);
};

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
        complemento: document.getElementById('complemento')?.value || '',
        bairro: document.getElementById('bairro').value,
        cidade: document.getElementById('cidade').value,
        estado: document.getElementById('estado').value
    };
}

function calcularFrete() {
    const div = document.getElementById('shipping-options');
    if (!div) return;
    let subtotal = 0;
    for (let i = 0; i < cart.length; i++) {
        subtotal = subtotal + (cart[i].price * cart[i].quantity);
    }
    let opcoes = [
        { nome: 'Econômica', preco: 15.90, dias: '7-10' },
        { nome: 'Padrão', preco: 24.90, dias: '3-5' },
        { nome: 'Expressa', preco: 39.90, dias: '1-2' }
    ];
    if (subtotal > 200 || (currentUserPlan && currentUserPlan.plano === 'vip')) {
        opcoes.unshift({ nome: 'Grátis', preco: 0, dias: '5-7' });
    }
    let html = '';
    for (let i = 0; i < opcoes.length; i++) {
        const opt = opcoes[i];
        let precoTexto = opt.preco === 0 ? 'GRÁTIS' : 'R$ ' + opt.preco.toFixed(2);
        let selectedClass = (i === 0) ? 'selected' : '';
        
        html = html + '<div class="shipping-option ' + selectedClass + '" onclick="window.selecionarFrete(' + i + ')" style="display:flex; align-items:center; gap:10px; border:1px solid #ccc; padding:10px; margin-bottom:10px; border-radius:5px; cursor:pointer;"><input type="radio" name="shipping" ' + (selectedClass ? 'checked' : '') + '><div class="shipping-info" style="display:flex; justify-content:space-between; width:100%;"><div><strong>' + opt.nome + '</strong><div class="shipping-time" style="font-size:12px; color:#666;">' + opt.dias + ' dias úteis</div></div><div class="shipping-price">' + precoTexto + '</div></div></div>';
    }
    div.innerHTML = html;
    selectedShipping = opcoes[0];
}

window.selecionarFrete = function(idx) {
    const opcoes = [];
    const optionsDivs = document.querySelectorAll('.shipping-option');
    optionsDivs.forEach(opt => {
        const nome = opt.querySelector('strong')?.innerText || '';
        const precoTxt = opt.querySelector('.shipping-price')?.innerText || 'R$ 0';
        let preco = 0;
        if (precoTxt !== 'GRÁTIS') {
            preco = parseFloat(precoTxt.replace('R$', '').replace(',', '.').trim());
        }
        const dias = opt.innerText.match(/\d+/)?.[0] || '5';
        opcoes.push({ nome: nome, preco: preco, dias: dias });
    });

    selectedShipping = opcoes[idx];
    for (let i = 0; i < optionsDivs.length; i++) {
        if (i === idx) {
            optionsDivs[i].style.borderColor = '#111'; // Destaca visualmente a borda selecionada
            const radio = optionsDivs[i].querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
        } else {
            optionsDivs[i].style.borderColor = '#ccc';
        }
    }
    atualizarResumo();
};

function atualizarResumo() {
    let subtotal = 0;
    for (let i = 0; i < cart.length; i++) {
        subtotal = subtotal + (cart[i].price * cart[i].quantity);
    }
    const frete = selectedShipping ? selectedShipping.preco : 0;
    
    const subtotalEl = document.getElementById('summary-subtotal');
    const freteEl = document.getElementById('summary-frete');
    const totalEl = document.getElementById('summary-total');
    
    if (subtotalEl) subtotalEl.innerHTML = 'R$ ' + subtotal.toFixed(2);
    if (freteEl) freteEl.innerHTML = 'R$ ' + frete.toFixed(2);
    if (totalEl) totalEl.innerHTML = 'R$ ' + (subtotal + frete).toFixed(2);
}

window.finalizeOrder = function() {
    const metodo = document.querySelector('input[name="payment"]:checked');
    if (!metodo) {
        alert('Escolha o método de pagamento.');
        return;
    }
    checkoutData.payment = metodo.value;
    let total = 0;
    for (let i = 0; i < cart.length; i++) {
        total = total + (cart[i].price * cart[i].quantity);
    }
    total = total + (selectedShipping ? selectedShipping.preco : 0);
    
    // Substituído para o padrão universal .substring() aceito em dispositivos móveis modernos (iOS e Android)
    const num = '#' + Math.random().toString(36).substring(2, 10).toUpperCase();
    
    document.getElementById('order-number').innerHTML = num;
    document.getElementById('delivery-estimate').innerHTML = (selectedShipping ? selectedShipping.dias : 5) + ' dias úteis';
    document.getElementById('order-total').innerHTML = 'R$ ' + total.toFixed(2);
    
    window.irParaStep(4);
    cart = [];
    salvarCarrinho();
    atualizarCarrinhoContador();
    alert('Pedido finalizado com sucesso! Obrigado.');
};

window.closeCheckout = function() {
    const modal = document.getElementById('checkout-modal');
    if (modal) modal.style.display = 'none';
};

// ========== LOGIN & CONTROLE DE SESSÃO ==========
function fazerLogin(email, senha) {
    const nome = email.split('@')[0];
    currentUser = { id: 1, nome: nome, email: email };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    const plano = localStorage.getItem('userPlan');
    if (plano) currentUserPlan = JSON.parse(plano);
    
    atualizarInterfaceUsuario();
    if (loginModal) loginModal.style.display = 'none';
    alert('Bem-vindo, ' + nome + '!');
}

function cadastrar(nome, email, senha) {
    fazerLogin(email, senha);
    if (registerModal) registerModal.style.display = 'none';
}

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
        if (userGreeting) {
            let planoTexto = currentUserPlan ? ' 🎉 (' + currentUserPlan.plano.toUpperCase() + ')' : '';
            userGreeting.innerHTML = 'Olá, ' + currentUser.nome + planoTexto;
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

function abrirLogin() {
    if (loginModal) loginModal.style.display = 'block';
    fecharDropdown();
}

function fecharLogin() {
    if (loginModal) loginModal.style.display = 'none';
}

function abrirCadastro() {
    if (registerModal) registerModal.style.display = 'block';
    fecharDropdown();
}

function fecharCadastro() {
    if (registerModal) registerModal.style.display = 'none';
}

function alternarDropdown() {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) dropdown.classList.toggle('show');
}

function fecharDropdown() {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) dropdown.classList.remove('show');
}

// ========== MAPEAMENTO DE EVENTOS GLOBAIS ==========
function configurarEventos() {
    // Escuta delegada estruturada: cliques ultra-velozes no mobile (Touch e Click)
    document.addEventListener('click', function(e) {
        const target = e.target;
        
        // Disparador do botão clássico "Adicionar ao Carrinho"
        if (target.classList.contains('add-to-cart') || target.closest('.add-to-cart')) {
            const btn = target.classList.contains('add-to-cart') ? target : target.closest('.add-to-cart');
            adicionarAoCarrinho(
                btn.getAttribute('data-product-id'), 
                btn.getAttribute('data-product'), 
                parseFloat(btn.getAttribute('data-price'))
            );
        }
    });

    if (cartIcon) cartIcon.addEventListener('click', abrirFecharCarrinho);
    
    // Mapeia tanto ".close-cart" quanto ".close" presentes nos seus modais HTML
    document.querySelectorAll('.close, .close-cart').forEach(btn => {
        btn.addEventListener('click', () => {
            if (cartModal) cartModal.style.display = 'none';
            fecharLogin();
            fecharCadastro();
            window.closeCheckout();
        });
    });
    
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) checkoutBtn.addEventListener('click', finalizarCompra);
    
    const userIcon = document.getElementById('user-icon');
    if (userIcon) userIcon.addEventListener('click', alternarDropdown);
    
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) loginBtn.addEventListener('click', abrirLogin);
    
    const cadastroBtn = document.getElementById('cadastro-btn');
    if (cadastroBtn) cadastroBtn.addEventListener('click', abrirCadastro);
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            currentUser = null;
            currentUserPlan = null;
            localStorage.removeItem('currentUser');
            localStorage.removeItem('userPlan');
            atualizarInterfaceUsuario();
            alert('Sessão encerrada.');
        });
    }
    
    const myPlanBtn = document.getElementById('my-plan-btn');
    if (myPlanBtn) {
        myPlanBtn.addEventListener('click', function() {
            if (currentUserPlan) {
                alert('Plano ' + currentUserPlan.plano.toUpperCase() + ' - R$ ' + currentUserPlan.preco + '/mês');
            } else {
                alert('Nenhum plano ativo. Acesse CONVÊNIO.');
            }
        });
    }
    
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const senha = document.getElementById('login-password').value;
            fazerLogin(email, senha);
        });
    }
    
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const nome = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const senha = document.getElementById('reg-password').value;
            cadastrar(nome, email, senha);
        });
    }
    
    const showRegisterLink = document.getElementById('show-register-link');
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', function(e) {
            e.preventDefault();
            fecharLogin();
            abrirCadastro();
        });
    }
    
    window.addEventListener('click', function(e) {
        if (loginModal && e.target === loginModal) fecharLogin();
        if (registerModal && e.target === registerModal) fecharCadastro();
        if (cartModal && e.target === cartModal) cartModal.style.display = 'none';
        const checkoutModal = document.getElementById('checkout-modal');
        if (checkoutModal && e.target === checkoutModal) checkoutModal.style.display = 'none';
        if (!e.target.closest('.user-menu')) fecharDropdown();
    });
    
    configurarCEP();
}

// ========== CONSUMO DA API VIACEP (AMIGÁVEL MOBILE) ==========
function configurarCEP() {
    const cep = document.getElementById('cep');
    if (!cep) return;
    
    async function buscarCEP(valor) {
        let v = valor.replace(/\D/g, '');
        if (v.length === 8) {
            try {
                const resposta = await fetch('https://viacep.com.br/ws/' + v + '/json/');
                const data = await resposta.json();
                if (!data.erro) {
                    const logradouro = document.getElementById('logradouro');
                    const bairro = document.getElementById('bairro');
                    const cidade = document.getElementById('cidade');
                    const estado = document.getElementById('estado');
                    
                    if (logradouro) logradouro.value = data.logradouro || '';
                    if (bairro) bairro.value = data.bairro || '';
                    if (cidade) cidade.value = data.localidade || '';
                    if (estado) {
                        estado.value = data.uf || '';
                    }
                }
            } catch (err) {
                console.log('Erro na conexão com ViaCEP:', err);
            }
        }
    }

    cep.addEventListener('input', function(e) {
        let v = e.target.value.replace(/\D/g, '');
        if (v.length > 5) {
            v = v.slice(0, 5) + '-' + v.slice(5, 8);
        }
        e.target.value = v;

        // Executa a busca assim que os 8 números forem digitados no teclado mobile, sem precisar clicar fora
        if (v.length === 9) {
            buscarCEP(v);
        }
    });
    
    cep.addEventListener('blur', function() {
        buscarCEP(cep.value);
    });
}

console.log('✅ UNIPETS funcionando e pronto para rodar!');

// ========== MODAL "SAIBA COMO FUNCIONA" PARA SERVIÇOS ==========
function abrirModalSaibaMais(servico) {
    let titulo = '';
    let descricao = '';
    let beneficios = [];
    let duracao = '';
    
    if (servico === 'banho') {
        titulo = '🐕 Como funciona o Serviço de Banho?';
        descricao = 'Banho completo com produtos hipoalergênicos e profissionais qualificados.';
        beneficios = [
            '✅ Produtos de alta qualidade',
            '✅ Secagem adequada para cada raça',
            '✅ Escovação inclusa',
            '✅ Perfume personalizado'
        ];
        duracao = '⏱️ Duração média: 1 hora';
    }
    else if (servico === 'tosa') {
        titulo = '✂️ Como funciona o Serviço de Tosa?';
        descricao = 'Tosa profissional respeitando o padrão da raça ou seu gosto.';
        beneficios = [
            '✅ Profissional especializado',
            '✅ Equipamentos de qualidade',
            '✅ Finalização com perfume',
            '✅ Higienização após tosa'
        ];
        duracao = '⏱️ Duração média: 1h30';
    }
    else if (servico === 'limpeza') {
        titulo = '👂 Como funciona a Limpeza de Ouvidos?';
        descricao = 'Limpeza profunda e segura com produtos específicos.';
        beneficios = [
            '✅ Remoção de cera e sujeira',
            '✅ Produtos antissépticos',
            '✅ Prevenção de otites',
            '✅ Profissional treinado'
        ];
        duracao = '⏱️ Duração média: 20 minutos';
    }
    else if (servico === 'unhas') {
        titulo = '✂️ Como funciona o Corte de Unhas?';
        descricao = 'Corte profissional sem risco para seu pet.';
        beneficios = [
            '✅ Corte preciso e seguro',
            '✅ Lixamento das unhas',
            '✅ Identificação da veia',
            '✅ Pet tranquilo e confortável'
        ];
        duracao = '⏱️ Duração média: 15 minutos';
    }
    
    // Cria modal se não existir
    let modal = document.getElementById('modal-saiba-mais');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-saiba-mais';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-saiba">&times;</span>
                <div id="modal-saiba-conteudo"></div>
            </div>
        `;
        document.body.appendChild(modal);
        
        modal.querySelector('.close-saiba').onclick = () => {
            modal.style.display = 'none';
        };
        window.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    }
    
    // Preenche conteúdo
    const conteudo = document.getElementById('modal-saiba-conteudo');
    conteudo.innerHTML = `
        <h2 style="color: #ff6b6b; margin-bottom: 2rem;">${titulo}</h2>
        <p style="font-size: 1.6rem; margin-bottom: 2rem;">${descricao}</p>
        <ul style="list-style: none; margin-bottom: 2rem;">
            ${beneficios.map(b => `<li style="padding: 0.8rem 0; font-size: 1.4rem;">${b}</li>`).join('')}
        </ul>
        <p style="font-size: 1.4rem; color: #666; margin-bottom: 2rem;">${duracao}</p>
        <p style="font-size: 1.2rem; color: #999; font-style: italic;">*Preço pode variar conforme porte do pet.</p>
        <button class="btn-primary" style="margin-top: 2rem;" onclick="document.getElementById('modal-saiba-mais').style.display='none'">Fechar</button>
    `;
    
    modal.style.display = 'block';
}

window.abrirModalSaibaMais = abrirModalSaibaMais;