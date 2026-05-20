// Carrinho de compras: array que armazena os produtos adicionados
// Os dados são salvos no localStorage para persistência entre sessões
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Usuário atual: objeto com dados do cliente logado
// Se não houver usuário logado, armazena null
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// Variáveis temporárias para o processo de checkout
let selectedShipping = null;           // Opção de frete selecionada
let checkoutData = {                   // Dados da compra em andamento
    address: null,                     // Endereço de entrega
    shipping: null,                    // Informações do frete
    payment: null                      // Método de pagamento escolhido
};

// Plano de assinatura do usuário (Básico, Premium ou VIP)
let currentUserPlan = JSON.parse(localStorage.getItem('userPlan')) || null;

// ====================================================================
// 2. ELEMENTOS DO DOM (referências para manipulação)
// ====================================================================

// Ícone do carrinho no cabeçalho
const cartIcon = document.getElementById('cart-icon');

// Contador de itens do carrinho (badge)
const cartCounter = document.getElementById('cart-counter');

// Modais (pop-ups) da aplicação
let cartModal, loginModal, registerModal;

// ====================================================================
// 3. INICIALIZAÇÃO DO SISTEMA
// Executa quando toda a página HTML é carregada
// ====================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 UNIPETS - Sistema inicializado');
    
    criarModais();              // Cria os modais se não existirem no HTML
    atualizarCarrinhoContador(); // Atualiza o número no ícone do carrinho
    atualizarInterfaceUsuario(); // Atualiza nome e avatar do usuário
    configurarEventos();        // Configura todos os event listeners
    configurarFiltros();        // Configura os botões de filtro por categoria
    configurarBusca();          // Configura a barra de busca de produtos
    setupPix();                 // Configura a exibição do conteúdo PIX
});

// ====================================================================
// 4. CRIAÇÃO DOS MODAIS (pop-ups)
// Verifica se os modais já existem no HTML, se não, cria dinamicamente
// ====================================================================
function criarModais() {
    // Modal do Carrinho
    if (!document.getElementById('cart-modal')) {
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
    } else {
        cartModal = document.getElementById('cart-modal');
    }
    
    // Referências para os modais de login e cadastro
    loginModal = document.getElementById('login-modal');
    registerModal = document.getElementById('register-modal');
}

// ====================================================================
// 5. FILTROS POR CATEGORIA
// Permite ao usuário filtrar produtos por categoria (Alimentos, Brinquedos, etc.)
// ====================================================================
function configurarFiltros() {
    // Seleciona todos os botões de categoria
    const botoes = document.querySelectorAll('.cat-btn');
    
    // Seleciona apenas os produtos que estão dentro da seção .menu
    const produtos = document.querySelectorAll('.menu .box');
    
    if (botoes.length === 0) return;

    // Função que aplica o filtro baseado na categoria selecionada
    function aplicarFiltro(categoria) {
        produtos.forEach(produto => {
            const cat = produto.getAttribute('data-categoria');
            // Se categoria for 'todos' ou corresponder à do produto, mostra, senão esconde
            produto.style.display = (categoria === 'todos' || cat === categoria) ? 'flex' : 'none';
        });
    }

    // Adiciona evento de clique a cada botão de categoria
    botoes.forEach(botao => {
        botao.addEventListener('click', (e) => {
            e.preventDefault();
            const categoria = botao.getAttribute('data-cat');
            
            // Remove classe 'active' de todos os botões e adiciona ao clicado
            document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
            botao.classList.add('active');
            
            // Aplica o filtro
            aplicarFiltro(categoria);
        });
    });
}

// ====================================================================
// 6. BUSCA DE PRODUTOS
// Permite ao usuário buscar produtos pelo nome em tempo real
// ====================================================================
function configurarBusca() {
    const btn = document.getElementById('search-btn');
    const input = document.getElementById('search-input');
    
    if (!btn) return;
    
    // Evento do botão de busca: mostra ou esconde o campo de texto
    btn.addEventListener('click', () => {
        if (input.style.display === 'none') {
            input.style.display = 'block';
            input.focus();
        } else {
            input.style.display = 'none';
            input.value = '';
            // Mostra todos os produtos novamente
            document.querySelectorAll('.menu .box').forEach(p => p.style.display = 'flex');
            // Reseta os filtros para 'Todos'
            document.querySelectorAll('.cat-btn').forEach(btn2 => {
                if (btn2.getAttribute('data-cat') === 'todos') btn2.classList.add('active');
                else btn2.classList.remove('active');
            });
        }
    });
    
    // Evento de digitação: filtra produtos pelo nome
    input.addEventListener('keyup', () => {
        const termo = input.value.toLowerCase();
        document.querySelectorAll('.menu .box').forEach(produto => {
            const nome = produto.querySelector('h3')?.innerText.toLowerCase() || '';
            produto.style.display = nome.includes(termo) ? 'flex' : 'none';
        });
    });
}

// ====================================================================
// 7. PLANOS DE ASSINATURA (CONVÊNIO)
// Funções para assinar planos e aplicar descontos
// ====================================================================

// Função global chamada pelos botões "Assinar Plano"
window.assinarPlano = function(plano) {
    console.log('Assinando plano:', plano);
    
    // Verifica se usuário está logado
    if (!currentUser) {
        alert('Faça login para assinar um plano!');
        if (loginModal) loginModal.style.display = 'block';
        return;
    }
    
    // Define preço e benefícios baseado no plano escolhido
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
    
    // Confirmação com o usuário
    if (confirm('Confirmar Plano ' + plano.toUpperCase() + ' - R$ ' + preco + '/mês?\n\n' + beneficios + '\n\n*UNIPETS não cobre consultas.')) {
        // Salva o plano no localStorage
        currentUserPlan = { 
            plano: plano, 
            preco: preco, 
            dataAssinatura: new Date().toISOString() 
        };
        localStorage.setItem('userPlan', JSON.stringify(currentUserPlan));
        alert('✅ Plano ' + plano.toUpperCase() + ' ativado!');
        atualizarInterfaceUsuario(); // Atualiza a interface para mostrar o plano
    }
};

// Aplica desconto baseado no plano do usuário
function calcularPrecoComDesconto(preco) {
    if (!currentUserPlan) return preco;
    
    if (currentUserPlan.plano === 'basico') return preco * 0.9;    // 10% desconto
    if (currentUserPlan.plano === 'premium') return preco * 0.8;   // 20% desconto
    if (currentUserPlan.plano === 'vip') return preco * 0.7;       // 30% desconto
    
    return preco;
}

// ====================================================================
// 8. SISTEMA DE CARRINHO
// Funções para adicionar, remover e gerenciar produtos no carrinho
// ====================================================================

// Adiciona um produto ao carrinho
function adicionarAoCarrinho(id, nome, preco) {
    // Verifica se o produto já existe no carrinho
    const existente = cart.find(item => item.id === id);
    
    // Aplica desconto se usuário for assinante
    const precoFinal = currentUserPlan ? calcularPrecoComDesconto(preco) : preco;
    
    if (existente) {
        // Se já existe, aumenta a quantidade
        existente.quantity = existente.quantity + 1;
    } else {
        // Se não existe, adiciona novo item
        cart.push({ 
            id: id, 
            name: nome, 
            price: precoFinal, 
            priceOriginal: preco, 
            quantity: 1 
        });
    }
    
    // Salva e atualiza a interface
    salvarCarrinho();
    atualizarCarrinhoContador();
    atualizarModalCarrinho();
    alert(nome + ' adicionado ao carrinho!');
}

// Remove um produto do carrinho pelo ID
function removerDoCarrinho(id) {
    cart = cart.filter(item => item.id !== id);
    salvarCarrinho();
    atualizarCarrinhoContador();
    atualizarModalCarrinho();
}

// Altera a quantidade de um produto no carrinho
function alterarQuantidade(id, delta) {
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
}

// Atualiza o contador do ícone do carrinho
function atualizarCarrinhoContador() {
    if (cartCounter) {
        let total = 0;
        for (let i = 0; i < cart.length; i++) {
            total = total + cart[i].quantity;
        }
        cartCounter.textContent = total;
    }
}

// Renderiza o conteúdo do modal do carrinho
function atualizarModalCarrinho() {
    const div = document.getElementById('cart-items');
    const totalSpan = document.getElementById('cart-total');
    
    if (!div) return;
    
    // Carrinho vazio
    if (cart.length === 0) {
        div.innerHTML = '<p style="text-align:center;">Seu carrinho está vazio</p>';
        if (totalSpan) totalSpan.textContent = '0,00';
        return;
    }
    
    // Calcula total e gera HTML dos itens
    let total = 0;
    let html = '';
    
    for (let i = 0; i < cart.length; i++) {
        const item = cart[i];
        const subtotal = item.price * item.quantity;
        total = total + subtotal;
        
        html = html + `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>R$ ${item.price.toFixed(2)}</p>
                </div>
                <div class="cart-item-actions">
                    <button class="quantity-btn" onclick="alterarQuantidade('${item.id}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="alterarQuantidade('${item.id}', 1)">+</button>
                    <button onclick="removerDoCarrinho('${item.id}')" style="background:none; border:none; color:red;">🗑️</button>
                </div>
            </div>
        `;
    }
    
    div.innerHTML = html;
    if (totalSpan) totalSpan.textContent = total.toFixed(2);
}

// Abre ou fecha o modal do carrinho
function abrirFecharCarrinho() {
    if (!cartModal) return;
    
    if (cartModal.style.display === 'block') {
        cartModal.style.display = 'none';
    } else {
        atualizarModalCarrinho();
        cartModal.style.display = 'block';
    }
}

// Salva o carrinho no localStorage do navegador
function salvarCarrinho() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Configura os botões "Adicionar ao Carrinho" de todos os produtos
function configurarBotoesProdutos() {
    const botoes = document.querySelectorAll('.add-to-cart');
    for (let i = 0; i < botoes.length; i++) {
        const btn = botoes[i];
        btn.removeEventListener('click', handlerProduto);
        btn.addEventListener('click', handlerProduto);
    }
}

// Handler para o clique no botão "Adicionar ao Carrinho"
function handlerProduto(e) {
    const btn = e.currentTarget;
    adicionarAoCarrinho(
        btn.getAttribute('data-product-id'),
        btn.getAttribute('data-product'),
        parseFloat(btn.getAttribute('data-price'))
    );
}

// ====================================================================
// 9. SISTEMA DE PAGAMENTO PIX
// Exibe QR Code e código copiável quando usuário escolhe PIX
// ====================================================================
function setupPix() {
    const radioPix = document.querySelector('input[name="payment"][value="pix"]');
    const pixContent = document.getElementById('pix-content');
    
    if (!radioPix || !pixContent) return;
    
    // Quando o usuário seleciona PIX, mostra o conteúdo
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
}

// Função para copiar o código PIX (acionada pelo botão)
window.copiarCodigoPix = function() {
    const codigo = document.getElementById('pix-codigo');
    if (!codigo) return;
    
    // Cria um textarea temporário para copiar o texto
    const textarea = document.createElement('textarea');
    textarea.value = codigo.innerText;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    
    // Feedback visual para o usuário
    const btn = event.target;
    const textoOriginal = btn.innerText;
    btn.innerText = '✅ Copiado!';
    setTimeout(() => {
        btn.innerText = textoOriginal;
    }, 2000);
    
    alert('Código PIX copiado para a área de transferência!');
};

// ====================================================================
// 10. SISTEMA DE CHECKOUT
// Processo de finalização de compra em 4 etapas
// ====================================================================

// Inicia o processo de finalização da compra
function finalizarCompra() {
    // Validações iniciais
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
    
    // Fecha o carrinho e abre o checkout
    abrirFecharCarrinho();
    setTimeout(function() {
        const modal = document.getElementById('checkout-modal');
        if (modal) modal.style.display = 'block';
        resetarCheckout();
    }, 200);
}

// Reseta os dados do checkout para um novo pedido
function resetarCheckout() {
    checkoutData = { address: null, shipping: null, payment: null };
    selectedShipping = null;
    irParaStep(1);           // Vai para primeira etapa (endereço)
    atualizarResumo();       // Atualiza o resumo do pedido
}

// Navega para uma etapa específica do checkout (1 a 4)
function irParaStep(step) {
    // Esconde todos os steps
    const steps = document.querySelectorAll('.checkout-step');
    for (let i = 0; i < steps.length; i++) {
        steps[i].style.display = 'none';
    }
    
    // Remove classe 'active' de todos os indicadores
    const stepsIndicator = document.querySelectorAll('.step');
    for (let i = 0; i < stepsIndicator.length; i++) {
        stepsIndicator[i].classList.remove('active');
    }
    
    // Mostra o step atual e ativa seu indicador
    const el = document.getElementById('step-' + step);
    const indicador = document.querySelector('[data-step="' + step + '"]');
    if (el) el.style.display = 'block';
    if (indicador) indicador.classList.add('active');
}

// Avança para a próxima etapa (com validações)
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

// Volta para a etapa anterior
function stepAnterior(prev) {
    irParaStep(prev);
}

// Valida se todos os campos obrigatórios do endereço estão preenchidos
function validarEndereco() {
    const campos = ['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'estado'];
    for (let i = 0; i < campos.length; i++) {
        const el = document.getElementById(campos[i]);
        if (!el || !el.value.trim()) return false;
    }
    return true;
}

// Salva os dados do endereço no objeto checkoutData
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

// Calcula as opções de frete baseado no subtotal e no plano do usuário
function calcularFrete() {
    const div = document.getElementById('shipping-options');
    if (!div) return;
    
    // Calcula subtotal do carrinho
    let subtotal = 0;
    for (let i = 0; i < cart.length; i++) {
        subtotal = subtotal + (cart[i].price * cart[i].quantity);
    }
    
    // Opções de frete disponíveis
    let opcoes = [
        { nome: 'Econômica', preco: 15.90, dias: '7-10' },
        { nome: 'Padrão', preco: 24.90, dias: '3-5' },
        { nome: 'Expressa', preco: 39.90, dias: '1-2' }
    ];
    
    // Frete grátis para compras acima de R$200 ou planos VIP
    if (subtotal > 200 || (currentUserPlan && currentUserPlan.plano === 'vip')) {
        opcoes.unshift({ nome: 'Grátis', preco: 0, dias: '5-7' });
    }
    
    // Gera o HTML das opções de frete
    let html = '';
    for (let i = 0; i < opcoes.length; i++) {
        const opt = opcoes[i];
        const precoTexto = opt.preco === 0 ? 'GRÁTIS' : 'R$ ' + opt.preco.toFixed(2);
        let selectedClass = (i === 1) ? 'selected' : '';
        if (opt.preco === 0) selectedClass = 'selected';
        
        html = html + `
            <div class="shipping-option ${selectedClass}" onclick="selecionarFrete(${i})">
                <input type="radio" name="shipping" ${selectedClass ? 'checked' : ''}>
                <div class="shipping-info">
                    <div>
                        <strong>${opt.nome}</strong>
                        <div class="shipping-time">${opt.dias} dias úteis</div>
                    </div>
                    <div class="shipping-price">${precoTexto}</div>
                </div>
            </div>
        `;
    }
    div.innerHTML = html;
    
    // Seleciona a opção padrão
    selectedShipping = opcoes[1];
    if (opcoes[0].preco === 0) selectedShipping = opcoes[0];
}

// Permite ao usuário selecionar uma opção de frete
window.selecionarFrete = function(idx) {
    // Coleta todas as opções disponíveis
    const opcoes = [];
    const optionsDivs = document.querySelectorAll('.shipping-option');
    
    for (let i = 0; i < optionsDivs.length; i++) {
        const opt = optionsDivs[i];
        const nome = opt.querySelector('strong')?.innerText || '';
        const precoTxt = opt.querySelector('.shipping-price')?.innerText || 'R$ 0';
        let preco = 0;
        if (precoTxt !== 'GRÁTIS') {
            preco = parseFloat(precoTxt.replace('R$', '').replace(',', '.'));
        }
        const dias = opt.innerText.match(/\d+/)?.[0] || '5';
        opcoes.push({ nome: nome, preco: preco, dias: dias });
    }
    
    // Atualiza a opção selecionada
    selectedShipping = opcoes[idx];
    
    // Atualiza a classe 'selected' visualmente
    for (let i = 0; i < optionsDivs.length; i++) {
        if (i === idx) {
            optionsDivs[i].classList.add('selected');
        } else {
            optionsDivs[i].classList.remove('selected');
        }
    }
    
    // Atualiza o resumo do pedido
    atualizarResumo();
};

// Atualiza o resumo do pedido (subtotal, frete, total)
function atualizarResumo() {
    let subtotal = 0;
    for (let i = 0; i < cart.length; i++) {
        subtotal = subtotal + (cart[i].price * cart[i].quantity);
    }
    
    const frete = selectedShipping ? selectedShipping.preco : 0;
    const total = subtotal + frete;
    
    document.getElementById('summary-subtotal').innerHTML = 'R$ ' + subtotal.toFixed(2);
    document.getElementById('summary-frete').innerHTML = 'R$ ' + frete.toFixed(2);
    document.getElementById('summary-total').innerHTML = 'R$ ' + total.toFixed(2);
}

// Finaliza o pedido e exibe a tela de confirmação
function finalizarPedido() {
    const metodo = document.querySelector('input[name="payment"]:checked');
    if (!metodo) {
        alert('Por favor, selecione um método de pagamento.');
        return;
    }
    
    checkoutData.payment = metodo.value;
    
    // Se for PIX, atualiza QR Code com valor dinâmico
    if (metodo.value === 'pix') {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 
                      (selectedShipping ? selectedShipping.preco : 0);
        
        const pixData = `00020126360014br.gov.bcb.pix0114contato@unipets.com.br52040000530398654${total.toFixed(2).replace('.', '')}5802BR5925UNIPETS PET SHOP6009SAO PAULO62070503***6304E2A3`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixData)}`;
        const qrImg = document.getElementById('pix-qr');
        if (qrImg) qrImg.src = qrUrl;
        
        const codigoElement = document.getElementById('pix-codigo');
        if (codigoElement) codigoElement.innerText = pixData;
    }
    
    // Calcula total final
    let total = 0;
    for (let i = 0; i < cart.length; i++) {
        total = total + (cart[i].price * cart[i].quantity);
    }
    total = total + (selectedShipping ? selectedShipping.preco : 0);
    
    // Gera número de pedido aleatório
    const numPedido = '#' + Math.random().toString(36).substr(2, 8).toUpperCase();
    
    // Atualiza tela de confirmação
    document.getElementById('order-number').innerHTML = numPedido;
    document.getElementById('delivery-estimate').innerHTML = (selectedShipping ? selectedShipping.dias : 5) + ' dias úteis';
    document.getElementById('order-total').innerHTML = 'R$ ' + total.toFixed(2);
    
    // Vai para etapa 4 (confirmação)
    irParaStep(4);
    
    // Limpa o carrinho
    cart = [];
    salvarCarrinho();
    atualizarCarrinhoContador();
    
    alert('Pedido finalizado com sucesso!');
}

// Exporta funções para uso global (chamadas pelo HTML onclick)
function finalizeOrder() {
    const metodo = document.querySelector('input[name="payment"]:checked');
    if (!metodo) {
        alert('Por favor, selecione um método de pagamento.');
        return;
    }
    
    checkoutData.payment = metodo.value;
    
    // Calcula total final
    let total = 0;
    for (let i = 0; i < cart.length; i++) {
        total = total + (cart[i].price * cart[i].quantity);
    }
    total = total + (selectedShipping ? selectedShipping.preco : 0);
    
    // Se for PIX, atualiza QR Code com o valor correto
    if (metodo.value === 'pix') {
        atualizarPixComValor(total);
    }
    
    // Gera número de pedido aleatório
    const numPedido = '#' + Math.random().toString(36).substr(2, 8).toUpperCase();
    
    // Atualiza tela de confirmação
    document.getElementById('order-number').innerHTML = numPedido;
    document.getElementById('delivery-estimate').innerHTML = (selectedShipping ? selectedShipping.dias : 5) + ' dias úteis';
    document.getElementById('order-total').innerHTML = 'R$ ' + total.toFixed(2);
    
    // Vai para etapa 4 (confirmação)
    irParaStep(4);
    
    // Limpa o carrinho
    cart = [];
    salvarCarrinho();
    atualizarCarrinhoContador();
    
    alert('Pedido finalizado com sucesso!');
}

// ====================================================================
// 11. SISTEMA DE LOGIN E CADASTRO DE USUÁRIO
// ====================================================================

// Função de login (simulada - em produção conectaria a um backend)
function fazerLogin(email, senha) {
    const nome = email.split('@')[0]; // Pega o nome antes do @
    currentUser = { id: 1, nome: nome, email: email };
    
    // Salva no localStorage
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Atualiza interface
    atualizarInterfaceUsuario();
    
    // Fecha modal de login
    if (loginModal) loginModal.style.display = 'none';
    
    alert('Bem-vindo, ' + nome + '!');
    
    // Verifica se usuário tem plano ativo
    const plano = localStorage.getItem('userPlan');
    if (plano) currentUserPlan = JSON.parse(plano);
}

// Função de cadastro de novo usuário
function cadastrar(nome, email, senha) {
    fazerLogin(email, senha); // Já faz login após cadastrar
    if (registerModal) registerModal.style.display = 'none';
}

// Atualiza toda a interface baseada no estado do usuário (logado ou não)
function atualizarInterfaceUsuario() {
    // Elementos que mudam conforme o estado do usuário
    const userName = document.getElementById('user-name');
    const userAvatar = document.getElementById('user-avatar');
    const userGreeting = document.getElementById('user-greeting');
    const loginBtn = document.getElementById('login-btn');
    const cadastroBtn = document.getElementById('cadastro-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const myOrdersBtn = document.getElementById('my-orders-btn');
    const myPlanBtn = document.getElementById('my-plan-btn');
    
    if (currentUser) {
        // Usuário logado: mostra nome e opções pessoais
        if (userName) userName.textContent = currentUser.nome;
        if (userAvatar) userAvatar.textContent = currentUser.nome.charAt(0).toUpperCase();
        if (userGreeting) {
            let planoTexto = currentUserPlan ? ' 🎉 (' + currentUserPlan.plano + ')' : '';
            userGreeting.innerHTML = 'Olá, ' + currentUser.nome + planoTexto;
        }
        if (loginBtn) loginBtn.style.display = 'none';
        if (cadastroBtn) cadastroBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'block';
        if (myOrdersBtn) myOrdersBtn.style.display = 'block';
        if (myPlanBtn) myPlanBtn.style.display = 'block';
    } else {
        // Visitante: mostra opções de login/cadastro
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

// Abre o modal de login
function abrirLogin() {
    if (loginModal) loginModal.style.display = 'block';
    fecharDropdown();
}

// Fecha o modal de login
function fecharLogin() {
    if (loginModal) loginModal.style.display = 'none';
}

// Abre o modal de cadastro
function abrirCadastro() {
    if (registerModal) registerModal.style.display = 'block';
    fecharDropdown();
}

// Fecha o modal de cadastro
function fecharCadastro() {
    if (registerModal) registerModal.style.display = 'none';
}

// Abre/fecha o dropdown do usuário
function alternarDropdown() {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) dropdown.classList.toggle('show');
}

// Fecha o dropdown do usuário
function fecharDropdown() {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) dropdown.classList.remove('show');
}

// ====================================================================
// 12. CONFIGURAÇÃO DE EVENTOS GLOBAIS
// Configura todos os event listeners da página
// ====================================================================
function configurarEventos() {
    // Eventos do Carrinho
    if (cartIcon) cartIcon.addEventListener('click', abrirFecharCarrinho);
    
    const closeCart = document.querySelector('.close-cart');
    if (closeCart) closeCart.addEventListener('click', abrirFecharCarrinho);
    
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) checkoutBtn.addEventListener('click', finalizarCompra);
    
    // Eventos do Menu do Usuário
    const userIcon = document.getElementById('user-icon');
    if (userIcon) userIcon.addEventListener('click', alternarDropdown);
    
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) loginBtn.addEventListener('click', abrirLogin);
    
    const cadastroBtn = document.getElementById('cadastro-btn');
    if (cadastroBtn) cadastroBtn.addEventListener('click', abrirCadastro);
    
    // Botão de Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            currentUser = null;
            localStorage.removeItem('currentUser');
            atualizarInterfaceUsuario();
            alert('Logout realizado com sucesso!');
        });
    }
    
    // Botão "Meu Plano"
    const myPlanBtn = document.getElementById('my-plan-btn');
    if (myPlanBtn) {
        myPlanBtn.addEventListener('click', function() {
            if (currentUserPlan) {
                alert('📋 SEU PLANO ATUAL\n\nPlano: ' + currentUserPlan.plano.toUpperCase() + '\nValor: R$ ' + currentUserPlan.preco + '/mês\nData: ' + new Date(currentUserPlan.dataAssinatura).toLocaleDateString());
            } else {
                alert('Você ainda não possui um plano. Acesse a seção CONVÊNIO para assinar!');
            }
        });
    }
    
    // Botões para fechar modais
    const closeBtns = document.querySelectorAll('.modal .close');
    for (let i = 0; i < closeBtns.length; i++) {
        closeBtns[i].addEventListener('click', function() {
            if (loginModal) loginModal.style.display = 'none';
            if (registerModal) registerModal.style.display = 'none';
            const checkout = document.getElementById('checkout-modal');
            if (checkout) checkout.style.display = 'none';
        });
    }
    
    // Formulário de Login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const senha = document.getElementById('login-password').value;
            fazerLogin(email, senha);
        });
    }
    
    // Formulário de Cadastro
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
    
    // Link "Cadastre-se" dentro do modal de login
    const showRegisterLink = document.getElementById('show-register-link');
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', function(e) {
            e.preventDefault();
            fecharLogin();
            abrirCadastro();
        });
    }
    
    // Fecha modais ao clicar fora deles
    window.addEventListener('click', function(e) {
        if (loginModal && e.target === loginModal) fecharLogin();
        if (registerModal && e.target === registerModal) fecharCadastro();
        if (cartModal && e.target === cartModal) abrirFecharCarrinho();
        
        const checkoutModal = document.getElementById('checkout-modal');
        if (checkoutModal && e.target === checkoutModal) checkoutModal.style.display = 'none';
        
        if (!e.target.closest('.user-menu')) fecharDropdown();
    });
    
    // Configura botões de produtos e CEP
    configurarBotoesProdutos();
    configurarCEP();
}

// ====================================================================
// 13. BUSCA AUTOMÁTICA DE CEP (VIA API VIA CEP)
// Quando o usuário digita o CEP, preenche automaticamente endereço
// ====================================================================
function configurarCEP() {
    const cep = document.getElementById('cep');
    if (!cep) return;
    
    // Formata o CEP enquanto digita (00000-000)
    cep.addEventListener('input', function(e) {
        let v = e.target.value.replace(/\D/g, '');
        if (v.length > 5) {
            v = v.slice(0, 5) + '-' + v.slice(5, 8);
        }
        e.target.value = v;
    });
    
    // Quando o CEP perde o foco (blur), busca os dados
    cep.addEventListener('blur', async function() {
        let v = cep.value.replace(/\D/g, '');
        if (v.length === 8) {
            try {
                const resposta = await fetch('https://viacep.com.br/ws/' + v + '/json/');
                const data = await resposta.json();
                
                if (!data.erro) {
                    // Preenche os campos com os dados retornados
                    const logradouro = document.getElementById('logradouro');
                    const bairro = document.getElementById('bairro');
                    const cidade = document.getElementById('cidade');
                    const estado = document.getElementById('estado');
                    
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
// ====================================================================
// PAGAMENTO PIX
// ====================================================================

// Configura o comportamento de exibição do conteúdo PIX
function setupPix() {
    const radioPix = document.querySelector('input[name="payment"][value="pix"]');
    const pixContent = document.getElementById('pix-content');
    
    if (!radioPix || !pixContent) return;
    
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
}

// Função para copiar o código PIX
window.copiarCodigoPix = function() {
    const codigo = document.getElementById('pix-codigo');
    if (!codigo) return;
    
    const textarea = document.createElement('textarea');
    textarea.value = codigo.innerText;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    
    const btn = event.target;
    const textoOriginal = btn.innerText;
    btn.innerText = '✅ Copiado!';
    setTimeout(() => {
        btn.innerText = textoOriginal;
    }, 2000);
    
    alert('Código PIX copiado para a área de transferência!');
};

// Atualiza o QR Code e o código PIX com o valor correto do pedido
function atualizarPixComValor(total) {
    const pixData = `00020126360014br.gov.bcb.pix0114contato@unipets.com.br52040000530398654${total.toFixed(2).replace('.', '')}5802BR5925UNIPETS PET SHOP6009SAO PAULO62070503***6304E2A3`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixData)}`;
    const qrImg = document.getElementById('pix-qr');
    if (qrImg) qrImg.src = qrUrl;
    
    const codigoElement = document.getElementById('pix-codigo');
    if (codigoElement) codigoElement.innerText = pixData;
}


// ====================================================================
// 14. INICIALIZAÇÃO CONCLUÍDA
// ====================================================================
console.log('✅ UNIPETS - Sistema completo inicializado com sucesso!');
console.log('📦 Funcionalidades: Carrinho, Filtros, Busca, Checkout, PIX, Planos');
console.log('🐾 Projeto desenvolvido para e-commerce de produtos e serviços pet');