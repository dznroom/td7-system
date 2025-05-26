import store from './store.js';
import { AuthService, ClienteService, VendaService, EstoqueService } from './services.js';
import { UI } from './ui.js';
import { agruparDadosPorPeriodo, formatarMoeda } from './utils.js';
import CONFIG from './config.js';

// Configurações de autenticação
const AUTH_CONFIG = {
    SENHAS: {
        vendedor: '1510',
        gerente: '0987',
        lider: '1357'
    }
};

class App {
    constructor() {
        // Garantir que o DOM está carregado antes de inicializar
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    initialize() {
        this.loginForm = document.getElementById('loginForm');
        this.loginSection = document.getElementById('login-section');
        this.dashboardSection = document.getElementById('dashboard-section');
        this.messageElement = document.getElementById('message');

        if (!this.loginForm || !this.loginSection || !this.dashboardSection || !this.messageElement) {
            console.error('Elementos necessários não encontrados');
            return;
        }

        this.initializeEventListeners();
        this.checkExistingSession();
        this.charts = {
            vendas: null,
            produtos: null
        };
    }

    initializeEventListeners() {
        // Adicionar evento de submit ao formulário de login
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));

        // Cliente
        document.getElementById('clienteForm').addEventListener('submit', this.handleClienteSubmit.bind(this));

        // Eventos de navegação
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                const tabId = e.target.getAttribute('onclick').match(/'([^']+)'/)[1];
                this.showTab(tabId, e);
            });
        });

        // Eventos de venda
        document.querySelectorAll('input[name="parceria"]').forEach(radio => {
            radio.addEventListener('change', () => this.atualizarPrecos());
        });

        document.querySelectorAll('input[name="parceria-calc"]').forEach(radio => {
            radio.addEventListener('change', () => this.atualizarCalculadora());
        });
    }

    setupStoreSubscription() {
        store.subscribe((state) => {
            this.updateUI(state);
        });
    }

    showMessage(text, type = 'error') {
        if (!this.messageElement) return;
        
        this.messageElement.textContent = text;
        this.messageElement.className = `message ${type}`;
        this.messageElement.style.opacity = '1';
        
        setTimeout(() => {
            this.messageElement.textContent = '';
            this.messageElement.className = 'message';
            this.messageElement.style.opacity = '0';
        }, 3000);
    }

    handleLogin(event) {
        event.preventDefault();
        
        const nome = document.getElementById('nome').value.trim();
        const id = document.getElementById('iduser').value.trim();
        const cargo = document.getElementById('cargo').value;
        const senha = document.getElementById('senha').value.trim();

        console.log('Tentativa de login:', { nome, id, cargo }); // Debug

        // Validar campos vazios
        if (!nome || !id || !cargo || !senha) {
            this.showMessage('Por favor, preencha todos os campos');
            return;
        }

        // Verificar senha
        if (AUTH_CONFIG.SENHAS[cargo] !== senha) {
            this.showMessage('Senha incorreta para o cargo selecionado');
            return;
        }

        // Login bem sucedido
        this.showMessage('Login realizado com sucesso!', 'success');
        
        // Guardar informações do usuário
        const userData = {
            nome,
            id,
            cargo,
            loginTime: new Date().getTime()
        };
        
        sessionStorage.setItem('user', JSON.stringify(userData));

        // Redirecionar para o dashboard após 1 segundo
        setTimeout(() => {
            this.loginSection.style.display = 'none';
            this.dashboardSection.style.display = 'block';
            this.initializeDashboard();
        }, 1000);
    }

    initializeDashboard() {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user) {
            this.loginSection.style.display = 'flex';
            this.dashboardSection.style.display = 'none';
            return;
        }

        this.dashboardSection.innerHTML = `
            <div class="dashboard-container">
                <header class="dashboard-header">
                    <h1>Bem-vindo, ${user.nome}</h1>
                    <p>Cargo: ${user.cargo}</p>
                    <button onclick="app.logout()">Sair</button>
                </header>
                <main class="dashboard-content">
                    <!-- Conteúdo do dashboard será adicionado aqui -->
                    <p>Dashboard em construção...</p>
                </main>
            </div>
        `;
    }

    logout() {
        sessionStorage.removeItem('user');
        this.loginSection.style.display = 'flex';
        this.dashboardSection.style.display = 'none';
        this.loginForm.reset();
    }

    checkExistingSession() {
        const user = sessionStorage.getItem('user');
        if (user) {
            this.initializeDashboard();
        }
    }

    // UI Updates
    updateUI(state) {
        UI.atualizarCabecalho(state.usuario);
        this.updateDashboard(state);
        this.updateVendaUI(state);
        this.updateHistorico(state);
        this.updateEstoque(state);
        this.updateClientes(state);
    }

    updateDashboard(state) {
        // Atualizar vendas pendentes
        const vendasPendentes = state.historico.filter(v => v.status === 'pendente').length;
        document.getElementById('num-vendas-pendentes').textContent = vendasPendentes;
        
        // Atualizar ranking rápido
        const vendedores = {};
        state.historico.forEach(venda => {
            const id = venda.vendedor.id;
            if (!vendedores[id]) {
                vendedores[id] = {
                    nome: venda.vendedor.nome,
                    total: 0
                };
            }
            vendedores[id].total += venda.total;
        });

        const top3 = Object.entries(vendedores)
            .sort(([,a], [,b]) => b.total - a.total)
            .slice(0, 3);

        const rankingHtml = top3.map((vendedor, index) => `
            <div class="ranking-item">
                <div class="ranking-position">#${index + 1}</div>
                <div class="ranking-info">
                    <div class="ranking-name">${vendedor[1].nome}</div>
                    <div class="ranking-stats">${formatarMoeda(vendedor[1].total)}</div>
                </div>
            </div>
        `).join('');

        document.getElementById('ranking-rapido').innerHTML = rankingHtml || '<p>Nenhuma venda registrada</p>';

        // Atualizar alertas de estoque
        const alertas = EstoqueService.verificarAlertasEstoque();
        const alertasHtml = alertas.map(item => `
            <div class="alerta-estoque">
                <i class="fas fa-exclamation-triangle"></i>
                ${item.nome}: ${item.quantidade} unidades
            </div>
        `).join('');

        document.getElementById('alertas-estoque-content').innerHTML = 
            alertasHtml || '<p style="color: #00ffff;">Estoque em níveis adequados</p>';

        // Atualizar resumo de vendas
        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const vendasMes = state.historico.filter(v => new Date(v.data.split(' ')[0].split('/').reverse().join('-')) >= inicioMes);
        const totalMes = vendasMes.reduce((sum, v) => sum + v.total, 0);
        const mediaTicket = vendasMes.length > 0 ? totalMes / vendasMes.length : 0;

        document.getElementById('resumo-vendas').innerHTML = `
            <div>
                <strong>Vendas no mês:</strong> ${vendasMes.length}<br>
                <strong>Total:</strong> ${formatarMoeda(totalMes)}<br>
                <strong>Ticket Médio:</strong> ${formatarMoeda(mediaTicket)}
            </div>
        `;
    }

    updateVendaUI(state) {
        if (state.clienteAtualVenda) {
            document.getElementById('cliente-venda-nome').textContent = state.clienteAtualVenda.nome;
            document.getElementById('cliente-venda-id').textContent = state.clienteAtualVenda.id;
            document.getElementById('cliente-venda-telefone').textContent = state.clienteAtualVenda.telefone;

            const comParceria = document.querySelector('input[name="parceria"]:checked').value === 'com';
            UI.renderProdutosVenda(state.carrinhoVenda, comParceria);
            
            const { total, materiaisNecessarios } = VendaService.calcularTotal(comParceria);
            const ganhosComParceria = VendaService.calcularTotal(true).total * CONFIG.VENDAS.COMISSAO_VENDEDOR;
            const ganhosSemParceria = VendaService.calcularTotal(false).total * CONFIG.VENDAS.COMISSAO_VENDEDOR;
            
            UI.renderResumoVenda(total, materiaisNecessarios, ganhosComParceria, ganhosSemParceria);
        }
    }

    updateHistorico(state) {
        UI.renderHistorico(state.historico, state.usuario);
    }

    updateEstoque(state) {
        UI.renderEstoque(state.estoque, state.usuario.cargo);
    }

    updateClientes(state) {
        UI.renderClientes(state.clientes);
        this.updateClienteSelect();
    }

    updateClienteSelect() {
        const select = document.getElementById('clienteVenda');
        const state = store.getState();
        
        select.innerHTML = '<option value="" disabled selected>Selecione um cliente cadastrado</option>';
        
        if (state.clientes.length === 0) {
            select.innerHTML = '<option value="" disabled>Nenhum cliente cadastrado</option>';
            return;
        }

        state.clientes.forEach((cliente, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${cliente.nome} - ID: ${cliente.id}`;
            select.appendChild(option);
        });
    }

    // Navigation
    showTab(tabId, event) {
        const tabs = document.querySelectorAll('.content');
        const links = document.querySelectorAll('nav a');

        tabs.forEach(tab => tab.style.display = 'none');
        links.forEach(link => link.classList.remove('active'));

        document.getElementById(tabId).style.display = 'block';
        if (event) event.target.classList.add('active');

        // Update specific tab content
        switch(tabId) {
            case 'estoque':
                this.updateEstoque(store.getState());
                break;
            case 'nova-venda':
                this.updateClienteSelect();
                this.voltarSelecaoCliente();
                break;
            case 'clientes':
                this.updateClientes(store.getState());
                break;
            case 'historico':
                this.updateHistorico(store.getState());
                break;
            case 'estatisticas':
                this.atualizarEstatisticas('total');
                this.atualizarGraficos('dia');
                break;
        }
    }

    showDashboard() {
        this.showTab('pagina-inicial');
        this.updateDashboard(store.getState());
    }

    // Venda
    voltarSelecaoCliente() {
        document.getElementById('area-venda').style.display = 'none';
        document.querySelector('.calculadora-container').style.display = 'grid';
        store.setClienteAtualVenda(null);
    }

    iniciarVenda() {
        const selectCliente = document.getElementById('clienteVenda');
        const clienteIndex = selectCliente.value;

        try {
            VendaService.iniciarVenda(clienteIndex);
            document.querySelector('.calculadora-container').style.display = 'none';
            document.getElementById('area-venda').style.display = 'block';
        } catch (error) {
            UI.showMessage(error.message, 'error', 'vendaMessage');
        }
    }

    finalizarVenda() {
        const comParceria = document.querySelector('input[name="parceria"]:checked').value === 'com';
        const organizacao = comParceria ? document.getElementById('organizacao').value.trim() : '';

        if (comParceria && !organizacao) {
            UI.showMessage('Por favor, informe o nome da organização para vendas com parceria.', 'error', 'vendaMessage');
            return;
        }

        try {
            const venda = VendaService.finalizarVenda(comParceria, organizacao);
            alert(`Venda finalizada com sucesso!\nTotal: ${formatarMoeda(venda.total)}\nSeus ganhos (30%): ${formatarMoeda(venda.ganhosVendedor)}`);
            this.voltarSelecaoCliente();
        } catch (error) {
            UI.showMessage(error.message, 'error', 'vendaMessage');
        }
    }

    // Calculadora
    atualizarCalculadora() {
        const comParceria = document.querySelector('input[name="parceria-calc"]:checked').value === 'com';
        const state = store.getState();
        
        CONFIG.PRODUTOS.forEach((produto, index) => {
            const preco = comParceria ? produto.precoComParceria : produto.precoSemParceria;
            document.getElementById(`calc-preco-${index}`).textContent = formatarMoeda(preco);
        });

        const { total, materiaisNecessarios } = VendaService.calcularTotal(comParceria);
        const ganhosComParceria = VendaService.calcularTotal(true).total * CONFIG.VENDAS.COMISSAO_VENDEDOR;
        const ganhosSemParceria = VendaService.calcularTotal(false).total * CONFIG.VENDAS.COMISSAO_VENDEDOR;

        document.getElementById('calc-total-valor').textContent = formatarMoeda(total);
        document.getElementById('calc-ganhos-parceria').textContent = formatarMoeda(ganhosComParceria);
        document.getElementById('calc-ganhos-sem-parceria').textContent = formatarMoeda(ganhosSemParceria);

        const materiaisDiv = document.getElementById('calc-materiais-lista');
        if (Object.keys(materiaisNecessarios).length === 0) {
            materiaisDiv.innerHTML = '<p style="color: #fff;">Nenhum material necessário ainda</p>';
            return;
        }

        let html = '';
        Object.entries(materiaisNecessarios).forEach(([material, quantidade]) => {
            html += `
                <div class="calc-material-item">
                    <span class="calc-material-nome">${material}:</span>
                    <span class="calc-material-qtd">${quantidade} unidades</span>
                </div>`;
        });
        materiaisDiv.innerHTML = html;
    }

    // Charts
    atualizarGraficos(periodo) {
        const state = store.getState();
        const dadosAgrupados = agruparDadosPorPeriodo(state.historico, periodo);
        const labels = Object.keys(dadosAgrupados);
        
        // Gráfico de vendas
        const dadosVendas = {
            labels: labels,
            datasets: [{
                label: 'Total de Vendas (R$)',
                data: labels.map(label => dadosAgrupados[label].total),
                borderColor: CONFIG.UI.TEMA.CORES.primaria,
                backgroundColor: 'rgba(0, 255, 255, 0.1)',
                fill: true,
                tension: 0.4
            }]
        };

        // Gráfico de produtos
        const produtos = CONFIG.PRODUTOS.map(p => p.nome);
        const cores = [
            CONFIG.UI.TEMA.CORES.primaria,
            '#ffffff',
            'rgba(0, 255, 255, 0.7)',
            'rgba(255, 255, 255, 0.7)',
            'rgba(0, 255, 255, 0.4)'
        ];
        
        const dadosProdutos = {
            labels: labels,
            datasets: produtos.map((produto, index) => ({
                label: produto,
                data: labels.map(label => dadosAgrupados[label].produtos[produto] || 0),
                borderColor: cores[index],
                backgroundColor: cores[index].replace('1)', '0.2)'),
                tension: 0.4
            }))
        };

        // Atualizar ou criar gráficos
        if (this.charts.vendas) {
            this.charts.vendas.data = dadosVendas;
            this.charts.vendas.update();
        } else {
            const ctx = document.getElementById('graficoVendas').getContext('2d');
            this.charts.vendas = new Chart(ctx, {
                type: 'line',
                data: dadosVendas,
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Volume de Vendas',
                            color: CONFIG.UI.TEMA.CORES.primaria
                        },
                        legend: {
                            labels: {
                                color: CONFIG.UI.TEMA.CORES.primaria
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: CONFIG.UI.TEMA.CORES.primaria,
                                callback: value => formatarMoeda(value)
                            }
                        },
                        x: {
                            grid: {
                                color: 'rgba(0, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: CONFIG.UI.TEMA.CORES.primaria
                            }
                        }
                    }
                }
            });
        }

        if (this.charts.produtos) {
            this.charts.produtos.data = dadosProdutos;
            this.charts.produtos.update();
        } else {
            const ctx = document.getElementById('graficoProdutos').getContext('2d');
            this.charts.produtos = new Chart(ctx, {
                type: 'bar',
                data: dadosProdutos,
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Quantidade de Produtos Vendidos',
                            color: CONFIG.UI.TEMA.CORES.primaria
                        },
                        legend: {
                            labels: {
                                color: CONFIG.UI.TEMA.CORES.primaria
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: CONFIG.UI.TEMA.CORES.primaria,
                                stepSize: 1
                            }
                        },
                        x: {
                            grid: {
                                color: 'rgba(0, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: CONFIG.UI.TEMA.CORES.primaria
                            }
                        }
                    }
                }
            });
        }
    }

    atualizarEstatisticas(tipo) {
        const state = store.getState();
        const estatisticas = {};

        state.historico.forEach(venda => {
            const vendedorId = venda.vendedor.id;
            if (!estatisticas[vendedorId]) {
                estatisticas[vendedorId] = {
                    nome: venda.vendedor.nome,
                    cargo: venda.vendedor.cargo,
                    totalVendas: 0,
                    totalComissao: 0,
                    quantidadeMunicoes: 0,
                    quantidadeColetes: 0
                };
            }

            estatisticas[vendedorId].totalVendas += venda.total;
            estatisticas[vendedorId].totalComissao += venda.ganhosVendedor;

            venda.itens.forEach(item => {
                if (item.produto.includes('Munição')) {
                    estatisticas[vendedorId].quantidadeMunicoes += item.quantidade;
                } else if (item.produto === 'Colete') {
                    estatisticas[vendedorId].quantidadeColetes += item.quantidade;
                }
            });
        });

        let vendedores = Object.entries(estatisticas).map(([id, stats]) => ({
            id,
            ...stats
        }));

        switch(tipo) {
            case 'total':
                vendedores.sort((a, b) => b.totalVendas - a.totalVendas);
                break;
            case 'comissao':
                vendedores.sort((a, b) => b.totalComissao - a.totalComissao);
                break;
            case 'quantidade':
                vendedores.sort((a, b) => 
                    (b.quantidadeMunicoes + b.quantidadeColetes) - 
                    (a.quantidadeMunicoes + a.quantidadeColetes)
                );
                break;
        }

        const rankingDiv = document.getElementById('ranking-list');
        rankingDiv.innerHTML = '';

        if (vendedores.length === 0) {
            rankingDiv.innerHTML = '<p style="text-align: center; color: #666;">Nenhuma venda registrada ainda.</p>';
            return;
        }

        vendedores.forEach((vendedor, index) => {
            const posicaoClass = index < 3 ? `top-${index + 1} top-3` : '';
            const card = document.createElement('div');
            card.className = `ranking-card ${posicaoClass}`;
            card.innerHTML = `
                <div class="ranking-position">#${index + 1}</div>
                <div class="ranking-info">
                    <div class="ranking-name">${vendedor.nome}</div>
                    <small>${vendedor.cargo.charAt(0).toUpperCase() + vendedor.cargo.slice(1)} - ID: ${vendedor.id}</small>
                    <div class="ranking-details">
                        <div class="ranking-stat">
                            Total em Vendas: <strong>${formatarMoeda(vendedor.totalVendas)}</strong>
                        </div>
                        <div class="ranking-stat">
                            Total em Comissões: <strong>${formatarMoeda(vendedor.totalComissao)}</strong>
                        </div>
                        <div class="ranking-stat">
                            Munições Vendidas: <strong>${vendedor.quantidadeMunicoes.toLocaleString('pt-BR')}</strong>
                        </div>
                        <div class="ranking-stat">
                            Coletes Vendidos: <strong>${vendedor.quantidadeColetes.toLocaleString('pt-BR')}</strong>
                        </div>
                    </div>
                </div>
            `;
            rankingDiv.appendChild(card);
        });
    }

    renderProdutosVenda(carrinhoVenda, comParceria = true) {
        const grid = document.getElementById('produtos-grid');
        if (!grid) return;

        grid.innerHTML = '';

        CONFIG.PRODUTOS.forEach((produto, index) => {
            const card = document.createElement('div');
            card.className = 'produto-card';
            
            const quantidade = carrinhoVenda[index] || 0;
            const preco = comParceria ? produto.precoComParceria : produto.precoSemParceria;
            const subtotal = quantidade * preco;
            
            card.innerHTML = `
                <div class="produto-nome">${produto.nome}</div>
                <div class="produto-info">
                    <div class="produto-preco" id="preco-${index}">${formatarMoeda(preco)}</div>
                    ${quantidade > 0 ? `
                        <div class="produto-subtotal">
                            Subtotal: ${formatarMoeda(subtotal)}
                        </div>
                    ` : ''}
                </div>
                <div class="produto-quantidade">
                    <button class="qty-btn minus" onclick="definirQuantidade(${index}, ${Math.max(0, quantidade - 1)})">
                        <i class="fas fa-minus"></i>
                    </button>
                    <input type="number" id="qty-${index}" value="${quantidade}" min="0" 
                           oninput="definirQuantidade(${index}, this.value)"
                           placeholder="Quantidade">
                    <button class="qty-btn plus" onclick="definirQuantidade(${index}, ${quantidade + 1})">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                ${quantidade > 0 ? `
                    <div class="produto-materiais">
                        <small>Materiais por lote (${produto.loteQuantidade} unidades):</small>
                        <ul>
                            ${produto.materiais.map(m => `
                                <li>${m.nome}: ${m.quantidade}</li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
            `;
            
            grid.appendChild(card);
        });
    }
}

// Criar uma instância global para funções chamadas pelo HTML
const app = new App();
export default app; 