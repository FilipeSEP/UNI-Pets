// ====================================================================
// UNIPETS - SISTEMA COMPLETO E CORRIGIDO
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
document.addEventListener('DOMContentLoaded', function() {
    console.log('UNIPETS inicializado');
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
        cartModal.innerHTML = '<div class="modal-content"><span class="close-cart">&times;</span><h2>Seu Carrinho</h2><div id="cart-items"></div><div class="cart-total"><strong>Total:</strong> R$ <span id="cart-total">0,00</span></div><button id="checkout-btn" class="btn-primary">Finalizar Compra</button></div>';
        document.body.appendChild(cartModal);
    }
    loginModal = document.getElementById('login-modal');
    registerModal = document.getElementById('register-modal');
}

// ========== 5. FILTROS ==========
function configurarFiltros() {
    var botoes = document.querySelectorAll('.cat-btn');
    var produtos = document.querySelectorAll('.menu .box');
    if (botoes.length === 0) return;
    
    function aplicarFiltro(categoria) {
        for (var i = 0; i < produtos.length; i++) {
            var produto = produtos[i];
            var cat = produto.getAttribute('data-categoria');
            if (categoria === 'todos' || cat === categoria) {
                produto.style.display = 'flex';
            } else {
                produto.style.display = 'none';
            }
        }
    }
    
    for (var i = 0; i < botoes.length; i++) {
        var botao = botoes[i];
        botao.addEventListener('click', function(e) {
            e.preventDefault();
            var categoria = this.getAttribute('data-cat');
            for (var j = 0; j < botoes.length; j++) {
                botoes[j].classList.remove('active');
            }
            this.classList.add('active');
            aplicarFiltro(categoria);
        });
    }
}

// ========== 6. BUSCA ==========
function configurarBusca() {
    var btn = document.getElementById('search-btn');
    var input = document.getElementById('search-input');
    if (!btn) return;
    
    btn.addEventListener('click', function() {
        if (input.style.display === 'none') {
            input.style.display = 'block';
            input.focus();
        } else {
            input.style.display = 'none';
            input.value = '';
            var produtos = document.querySelectorAll('.menu .box');
            for (var i = 0; i < produtos.length; i++) {
                produtos[i].style.display = 'flex';
            }
            var botoes = document.querySelectorAll('.cat-btn');
            for (var i = 0; i < botoes.length; i++) {
                if (botoes[i].getAttribute('data-cat') === 'todos') {
                    botoes[i].classList.add('active');
                } else {
                    botoes[i].classList.remove('active');
                }
            }
        }
    });
    
    input.addEventListener('keyup', function() {
        var termo = this.value.toLowerCase();
        var produtos = document.querySelectorAll('.menu .box');
        for (var i = 0; i < produtos.length; i++) {
            var produto = produtos[i];
            var nome = produto.querySelector('h3') ? produto.querySelector('h3').innerText.toLowerCase() : '';
            if (nome.indexOf(termo) !== -1) {
                produto.style.display = 'flex';
            } else {
                produto.style.display = 'none';
            }
        }
    });
}

// ========== 7. SISTEMA DE CARRINHO ==========
function adicionarAoCarrinho(id, nome, preco) {
    var existente = null;
    for (var i = 0; i < cart.length; i++) {
        if (cart[i].id === id) {
            existente = cart[i];
            break;
        }
    }
    
    var precoFinal = preco;
    if (currentUserPlan) {
        if (currentUserPlan.plano === 'patinhas') precoFinal = preco * 0.9;
        else if (currentUserPlan.plano === 'amigo-pet') precoFinal = preco * 0.8;
        else if (currentUserPlan.plano === 'vida-animal') precoFinal = preco * 0.7;
    }
    
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
    var novoCart = [];
    for (var i = 0; i < cart.length; i++) {
        if (cart[i].id !== id) {
            novoCart.push(cart[i]);
        }
    }
    cart = novoCart;
    salvarCarrinho();
    atualizarCarrinhoContador();
    atualizarModalCarrinho();
}

function alterarQuantidade(id, delta) {
    for (var i = 0; i < cart.length; i++) {
        if (cart[i].id === id) {
            cart[i].quantity = cart[i].quantity + delta;
            if (cart[i].quantity <= 0) {
                removerDoCarrinho(id);
            } else {
                salvarCarrinho();
                atualizarCarrinhoContador();
                atualizarModalCarrinho();
            }
            break;
        }
    }
}

function atualizarCarrinhoContador() {
    if (cartCounter) {
        var total = 0;
        for (var i = 0; i < cart.length; i++) {
            total = total + cart[i].quantity;
        }
        cartCounter.textContent = total;
    }
}

function atualizarModalCarrinho() {
    var div = document.getElementById('cart-items');
    var totalSpan = document.getElementById('cart-total');
    if (!div) return;
    
    if (cart.length === 0) {
        div.innerHTML = '<p style="text-align:center;">Seu carrinho está vazio</p>';
        if (totalSpan) totalSpan.textContent = '0,00';
        return;
    }
    
    var total = 0;
    var html = '';
    for (var i = 0; i < cart.length; i++) {
        var item = cart[i];
        var subtotal = item.price * item.quantity;
        total = total + subtotal;
        html = html + '<div class="cart-item"><div class="cart-item-info"><h4>' + item.name + '</h4><p>R$ ' + item.price.toFixed(2) + '</p></div><div class="cart-item-actions"><button class="quantity-btn" onclick="alterarQuantidade(\'' + item.id + '\', -1)">-</button><span>' + item.quantity + '</span><button class="quantity-btn" onclick="alterarQuantidade(\'' + item.id + '\', 1)">+</button><button onclick="removerDoCarrinho(\'' + item.id + '\')" style="background:none; border:none; color:red;">🗑️</button></div></div>';
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

function configurarBotoesProdutos() {
    var botoes = document.querySelectorAll('.add-to-cart');
    for (var i = 0; i < botoes.length; i++) {
        var btn = botoes[i];
        btn.removeEventListener('click', handlerProduto);
        btn.addEventListener('click', handlerProduto);
    }
}

function handlerProduto(e) {
    var btn = e.currentTarget;
    adicionarAoCarrinho(btn.getAttribute('data-product-id'), btn.getAttribute('data-product'), parseFloat(btn.getAttribute('data-price')));
}

// ========== 8. PLANOS ==========
window.assinarPlano = function(plano) {
    if (!currentUser) {
        alert('Faça login para assinar um plano!');
        if (loginModal) loginModal.style.display = 'block';
        return;
    }
    var preco = 0;
    var beneficios = '';
    if (plano === 'patinhas') {
        preco = 39.90;
        beneficios = '1 banho por mês, 10% desconto em produtos';
    } else if (plano === 'amigo-pet') {
        preco = 79.90;
        beneficios = '2 banhos por mês, 20% desconto em produtos, prioridade';
    } else {
        preco = 149.90;
        beneficios = 'Banhos ilimitados, 30% desconto em produtos, 1 corte de graça por mês';
    }
    if (confirm('Confirmar Plano ' + plano + ' - R$ ' + preco + '/mês?\n\n' + beneficios + '\n\n*UNIPETS não cobre consultas.')) {
        currentUserPlan = { plano: plano, preco: preco, dataAssinatura: new Date().toISOString() };
        localStorage.setItem('userPlan', JSON.stringify(currentUserPlan));
        alert('Plano ativado com sucesso!');
        atualizarInterfaceUsuario();
    }
};

// ========== 9. PAGAMENTO PIX ==========
function setupPix() {
    console.log('setupPix executado');
    var radioPix = document.querySelector('input[name="payment"][value="pix"]');
    var pixContent = document.getElementById('pix-content');
    if (!radioPix) { return; }
    if (!pixContent) { return; }
    var radios = document.querySelectorAll('input[name="payment"]');
    for (var i = 0; i < radios.length; i++) {
        var radio = radios[i];
        radio.addEventListener('change', function() {
            if (this.value === 'pix') {
                pixContent.style.display = 'block';
            } else {
                pixContent.style.display = 'none';
            }
        });
    }
}

window.copiarCodigoPix = function() {
    var codigo = document.getElementById('pix-codigo');
    if (!codigo) return;
    var textarea = document.createElement('textarea');
    textarea.value = codigo.innerText;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    alert('Código PIX copiado para a área de transferência!');
};

function atualizarPixComValor(total) {
    var pixData = '00020126360014br.gov.bcb.pix0114contato@unipets.com.br52040000530398654' + total.toFixed(2).replace('.', '') + '5802BR5925UNIPETS PET SHOP6009SAO PAULO62070503***6304E2A3';
    var qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(pixData);
    var qrImg = document.getElementById('pix-qr');
    if (qrImg) qrImg.src = qrUrl;
    var codigoElement = document.getElementById('pix-codigo');
    if (codigoElement) codigoElement.innerText = pixData;
}

// ========== 10. CHECKOUT ==========
function finalizarCompra() {
    if (cart.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }
    if (!currentUser) {
        alert('Faça login para finalizar a compra!');
        abrirFecharCarrinho();
        if (loginModal) loginModal.style.display = 'block';
        return;
    }
    abrirFecharCarrinho();
    setTimeout(function() {
        var modal = document.getElementById('checkout-modal');
        if (modal) modal.style.display = 'block';
        resetarCheckout();
    }, 200);
}

function resetarCheckout() {
    checkoutData = { address: null, shipping: null, payment: null };
    selectedShipping = null;
    irParaStep(1);
    atualizarResumo();
}

function irParaStep(step) {
    var steps = document.querySelectorAll('.checkout-step');
    for (var i = 0; i < steps.length; i++) {
        steps[i].style.display = 'none';
    }
    var stepsIndicator = document.querySelectorAll('.step');
    for (var i = 0; i < stepsIndicator.length; i++) {
        stepsIndicator[i].classList.remove('active');
    }
    var el = document.getElementById('step-' + step);
    var indicador = document.querySelector('[data-step="' + step + '"]');
    if (el) el.style.display = 'block';
    if (indicador) indicador.classList.add('active');
}

function proximoStep(next) {
    if (next === 2) {
        if (!validarEndereco()) {
            alert('Por favor, preencha todos os campos do endereço.');
            return;
        }
        salvarEndereco();
        calcularFrete();
    }
    if (next === 3) {
        if (!selectedShipping) {
            alert('Por favor, selecione uma opção de frete.');
            return;
        }
        checkoutData.shipping = selectedShipping;
        atualizarResumo();
    }
    irParaStep(next);
}

function stepAnterior(prev) {
    irParaStep(prev);
}

function validarEndereco() {
    var campos = ['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado'];
    for (var i = 0; i < campos.length; i++) {
        var el = document.getElementById(campos[i]);
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
    var div = document.getElementById('shipping-options');
    if (!div) return;
    var subtotal = 0;
    for (var i = 0; i < cart.length; i++) {
        subtotal = subtotal + (cart[i].price * cart[i].quantity);
    }
    var opcoes = [
        { nome: 'Econômica', preco: 15.90, dias: '7-10' },
        { nome: 'Padrão', preco: 24.90, dias: '3-5' },
        { nome: 'Expressa', preco: 39.90, dias: '1-2' }
    ];
    if (subtotal > 200 || (currentUserPlan && currentUserPlan.plano === 'vida-animal')) {
        opcoes.unshift({ nome: 'Grátis', preco: 0, dias: '5-7' });
    }
    var html = '';
    for (var i = 0; i < opcoes.length; i++) {
        var opt = opcoes[i];
        var precoTexto = opt.preco === 0 ? 'GRÁTIS' : 'R$ ' + opt.preco.toFixed(2);
        var selectedClass = (i === 1) ? 'selected' : '';
        if (opt.preco === 0) selectedClass = 'selected';
        html = html + '<div class="shipping-option ' + selectedClass + '" onclick="selecionarFrete(' + i + ')"><input type="radio" name="shipping" ' + (selectedClass ? 'checked' : '') + '><div class="shipping-info"><div><strong>' + opt.nome + '</strong><div class="shipping-time">' + opt.dias + ' dias úteis</div></div><div class="shipping-price">' + precoTexto + '</div></div></div>';
    }
    div.innerHTML = html;
    selectedShipping = opcoes[1];
    if (opcoes[0].preco === 0) selectedShipping = opcoes[0];
}

window.selecionarFrete = function(idx) {
    var opcoes = [];
    var optionsDivs = document.querySelectorAll('.shipping-option');
    for (var i = 0; i < optionsDivs.length; i++) {
        var opt = optionsDivs[i];
        var nome = opt.querySelector('strong') ? opt.querySelector('strong').innerText : '';
        var precoTxt = opt.querySelector('.shipping-price') ? opt.querySelector('.shipping-price').innerText : 'R$ 0';
        var preco = 0;
        if (precoTxt !== 'GRÁTIS') {
            preco = parseFloat(precoTxt.replace('R$', '').replace(',', '.'));
        }
        var diasMatch = opt.innerText.match(/\d+/);
        var dias = diasMatch ? diasMatch[0] : '5';
        opcoes.push({ nome: nome, preco: preco, dias: dias });
    }
    selectedShipping = opcoes[idx];
    for (var i = 0; i < optionsDivs.length; i++) {
        if (i === idx) {
            optionsDivs[i].classList.add('selected');
        } else {
            optionsDivs[i].classList.remove('selected');
        }
    }
    atualizarResumo();
};

function atualizarResumo() {
    var subtotal = 0;
    for (var i = 0; i < cart.length; i++) {
        subtotal = subtotal + (cart[i].price * cart[i].quantity);
    }
    var frete = selectedShipping ? selectedShipping.preco : 0;
    document.getElementById('summary-subtotal').innerHTML = 'R$ ' + subtotal.toFixed(2);
    document.getElementById('summary-frete').innerHTML = 'R$ ' + frete.toFixed(2);
    document.getElementById('summary-total').innerHTML = 'R$ ' + (subtotal + frete).toFixed(2);
}

function finalizeOrder() {
    var metodo = document.querySelector('input[name="payment"]:checked');
    if (!metodo) {
        alert('Por favor, selecione um método de pagamento.');
        return;
    }
    checkoutData.payment = metodo.value;
    var total = 0;
    for (var i = 0; i < cart.length; i++) {
        total = total + (cart[i].price * cart[i].quantity);
    }
    total = total + (selectedShipping ? selectedShipping.preco : 0);
    if (metodo.value === 'pix') {
        atualizarPixComValor(total);
    }
    var numPedido = '#' + Math.random().toString(36).substr(2, 8).toUpperCase();
    document.getElementById('order-number').innerHTML = numPedido;
    document.getElementById('delivery-estimate').innerHTML = (selectedShipping ? selectedShipping.dias : 5) + ' dias úteis';
    document.getElementById('order-total').innerHTML = 'R$ ' + total.toFixed(2);
    irParaStep(4);
    cart = [];
    salvarCarrinho();
    atualizarCarrinhoContador();
    alert('Pedido finalizado com sucesso!');
}

window.finalizeOrder = finalizeOrder;
window.nextStep = proximoStep;
window.prevStep = stepAnterior;
window.closeCheckout = function() {
    var modal = document.getElementById('checkout-modal');
    if (modal) modal.style.display = 'none';
};

// ========== 11. LOGIN ==========
function fazerLogin(email, senha) {
    var nome = email.split('@')[0];
    currentUser = { id: 1, nome: nome, email: email };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    atualizarInterfaceUsuario();
    if (loginModal) loginModal.style.display = 'none';
    alert('Bem-vindo, ' + nome + '!');
    var plano = localStorage.getItem('userPlan');
    if (plano) currentUserPlan = JSON.parse(plano);
}

function cadastrar(nome, email, senha) {
    fazerLogin(email, senha);
    if (registerModal) registerModal.style.display = 'none';
}

function atualizarInterfaceUsuario() {
    var userName = document.getElementById('user-name');
    var userAvatar = document.getElementById('user-avatar');
    var userGreeting = document.getElementById('user-greeting');
    var loginBtn = document.getElementById('login-btn');
    var cadastroBtn = document.getElementById('cadastro-btn');
    var logoutBtn = document.getElementById('logout-btn');
    var myOrdersBtn = document.getElementById('my-orders-btn');
    var myPlanBtn = document.getElementById('my-plan-btn');
    if (currentUser) {
        if (userName) userName.textContent = currentUser.nome;
        if (userAvatar) userAvatar.textContent = currentUser.nome.charAt(0).toUpperCase();
        if (userGreeting) {
            var planoTexto = currentUserPlan ? ' (' + currentUserPlan.plano + ')' : '';
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
function fecharLogin() { if (loginModal) loginModal.style.display = 'none'; }
function abrirCadastro() { if (registerModal) registerModal.style.display = 'block'; fecharDropdown(); }
function fecharCadastro() { if (registerModal) registerModal.style.display = 'none'; }
function alternarDropdown() { var dd = document.getElementById('user-dropdown'); if (dd) dd.classList.toggle('show'); }
function fecharDropdown() { var dd = document.getElementById('user-dropdown'); if (dd) dd.classList.remove('show'); }

// ========== 12. EVENTOS GLOBAIS ==========
function configurarEventos() {
    if (cartIcon) cartIcon.addEventListener('click', abrirFecharCarrinho);
    var closeCart = document.querySelector('.close-cart');
    if (closeCart) closeCart.addEventListener('click', abrirFecharCarrinho);
    var checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) checkoutBtn.addEventListener('click', finalizarCompra);
    var userIcon = document.getElementById('user-icon');
    if (userIcon) userIcon.addEventListener('click', alternarDropdown);
    var loginBtn = document.getElementById('login-btn');
    if (loginBtn) loginBtn.addEventListener('click', abrirLogin);
    var cadastroBtn = document.getElementById('cadastro-btn');
    if (cadastroBtn) cadastroBtn.addEventListener('click', abrirCadastro);
    var logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            currentUser = null;
            localStorage.removeItem('currentUser');
            atualizarInterfaceUsuario();
            alert('Logout realizado com sucesso!');
        });
    }
    var myPlanBtn = document.getElementById('my-plan-btn');
    if (myPlanBtn) {
        myPlanBtn.addEventListener('click', function() {
            if (currentUserPlan) {
                alert('Plano ' + currentUserPlan.plano + ' - R$ ' + currentUserPlan.preco + '/mês');
            } else {
                alert('Você ainda não possui um plano. Acesse a seção CONVÊNIO para assinar!');
            }
        });
    }
    var closeBtns = document.querySelectorAll('.modal .close');
    for (var i = 0; i < closeBtns.length; i++) {
        closeBtns[i].addEventListener('click', function() {
            if (loginModal) loginModal.style.display = 'none';
            if (registerModal) registerModal.style.display = 'none';
            var checkout = document.getElementById('checkout-modal');
            if (checkout) checkout.style.display = 'none';
        });
    }
    var loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            fazerLogin(document.getElementById('login-email').value, document.getElementById('login-password').value);
        });
    }
    var registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            cadastrar(document.getElementById('reg-name').value, document.getElementById('reg-email').value, document.getElementById('reg-password').value);
        });
    }
    var showRegisterLink = document.getElementById('show-register-link');
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
        if (cartModal && e.target === cartModal) abrirFecharCarrinho();
        var checkoutModal = document.getElementById('checkout-modal');
        if (checkoutModal && e.target === checkoutModal) checkoutModal.style.display = 'none';
        if (!e.target.closest('.user-menu')) fecharDropdown();
    });
    configurarBotoesProdutos();
    configurarCEP();
}

function configurarCEP() {
    var cep = document.getElementById('cep');
    if (!cep) return;
    cep.addEventListener('input', function(e) {
        var v = e.target.value.replace(/\D/g, '');
        if (v.length > 5) {
            v = v.slice(0, 5) + '-' + v.slice(5, 8);
        }
        e.target.value = v;
    });
    cep.addEventListener('blur', async function() {
        var v = cep.value.replace(/\D/g, '');
        if (v.length === 8) {
            try {
                var resposta = await fetch('https://viacep.com.br/ws/' + v + '/json/');
                var data = await resposta.json();
                if (!data.erro) {
                    var logradouro = document.getElementById('logradouro');
                    var bairro = document.getElementById('bairro');
                    var cidade = document.getElementById('cidade');
                    var estado = document.getElementById('estado');
                    if (logradouro) logradouro.value = data.logradouro || '';
                    if (bairro) bairro.value = data.bairro || '';
                    if (cidade) cidade.value = data.localidade || '';
                    if (estado) estado.value = data.uf || '';
                }
            } catch (err) {
                console.log('Erro ao buscar CEP:', err);
            }
        }
    });
}

// ========== 13. MODAL "SAIBA MAIS" ==========
window.abrirModalSaibaMais = function(servico) {
    var titulo = '', descricao = '', beneficios = [], duracao = '';
    if (servico === 'banho') {
        titulo = 'Serviço de Banho';
        descricao = 'Banho completo com produtos hipoalergênicos e profissionais qualificados.';
        beneficios = ['Produtos de alta qualidade', 'Secagem adequada para cada raça', 'Escovação inclusa', 'Perfume personalizado'];
        duracao = 'Duração média: 1 hora';
    } else if (servico === 'tosa') {
        titulo = 'Serviço de Tosa';
        descricao = 'Tosa profissional respeitando o padrão da raça ou seu gosto.';
        beneficios = ['Profissional especializado', 'Equipamentos de qualidade', 'Finalização com perfume', 'Higienização após tosa'];
        duracao = 'Duração média: 1h30';
    } else if (servico === 'limpeza') {
        titulo = 'Limpeza de Ouvidos';
        descricao = 'Limpeza profunda e segura com produtos específicos.';
        beneficios = ['Remoção de cera e sujeira', 'Produtos antissépticos', 'Prevenção de otites', 'Profissional treinado'];
        duracao = 'Duração média: 20 minutos';
    } else if (servico === 'unhas') {
        titulo = 'Corte de Unhas';
        descricao = 'Corte profissional sem risco para seu pet.';
        beneficios = ['Corte preciso e seguro', 'Lixamento das unhas', 'Identificação da veia', 'Pet tranquilo e confortável'];
        duracao = 'Duração média: 15 minutos';
    }
    var modal = document.getElementById('modal-saiba-mais');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-saiba-mais';
        modal.className = 'modal';
        modal.innerHTML = '<div class="modal-content"><span class="close-saiba">&times;</span><div id="modal-saiba-conteudo"></div></div>';
        document.body.appendChild(modal);
        modal.querySelector('.close-saiba').onclick = function() { modal.style.display = 'none'; };
        window.addEventListener('click', function(e) { if (e.target === modal) modal.style.display = 'none'; });
    }
    var conteudo = document.getElementById('modal-saiba-conteudo');
    var beneficiosHtml = '';
    for (var i = 0; i < beneficios.length; i++) {
        beneficiosHtml = beneficiosHtml + '<li style="padding: 0.8rem 0; font-size: 1.4rem;">' + beneficios[i] + '</li>';
    }
    conteudo.innerHTML = '<h2 style="color: #ff6b6b; margin-bottom: 2rem;">' + titulo + '</h2><p style="font-size: 1.6rem; margin-bottom: 2rem;">' + descricao + '</p><ul style="list-style: none; margin-bottom: 2rem;">' + beneficiosHtml + '</ul><p style="font-size: 1.4rem; color: #666; margin-bottom: 2rem;">' + duracao + '</p><p style="font-size: 1.2rem; color: #999; font-style: italic;">*Preço pode variar conforme porte do pet.</p><button class="btn-primary" style="margin-top: 2rem;" onclick="document.getElementById(\'modal-saiba-mais\').style.display=\'none\'">Fechar</button>';
    modal.style.display = 'block';
};

console.log('UNIPETS - Sistema completo inicializado com sucesso!');