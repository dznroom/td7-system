window.UI = {
    showMessage(text, type, elementId = 'message') {
        const messageDiv = document.getElementById(elementId);
        if (!messageDiv) return;

        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        
        if (elementId !== 'message') {
            setTimeout(() => {
                messageDiv.textContent = '';
                messageDiv.className = 'message';
            }, window.CONFIG.UI.MENSAGENS.TIMEOUT);
        }
    },

    renderEstoque(estoque, cargoAtual) {
        const tbody = document.getElementById('estoqueBody');
        const acoesHeader = document.getElementById('acoesHeader');
        if (!tbody || !acoesHeader) return;

        tbody.innerHTML = '';
        
        const podeEditar = cargoAtual === 'gerente' || cargoAtual === 'lider';
        acoesHeader.style.display = podeEditar ? '' : 'none';

        estoque.forEach((item, index) => {
            const tr = document.createElement('tr');
            const qtdClass = item.quantidade < window.CONFIG.ESTOQUE.ALERTA_CRITICO ? 'critico' : 
                           item.quantidade < window.CONFIG.ESTOQUE.LIMITE_BAIXO ? 'baixo' : '';

            tr.innerHTML = `
                <td>${item.nome}</td>
                <td id="qtd-${index}" class="${qtdClass}">${item.quantidade}</td>
                ${podeEditar ? `
                    <td>
                        <button class="edit-btn" onclick="editarQuantidade(${index})">
                            <i class="fas fa-edit"></i> Alterar
                        </button>
                    </td>
                ` : ''}
            `;
            tbody.appendChild(tr);
        });
    },

    renderClientes(clientes) {
        const tbody = document.getElementById('clientesBody');
        const totalDiv = document.getElementById('totalClientes');
        if (!tbody || !totalDiv) return;

        tbody.innerHTML = '';

        if (clientes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-message">Nenhum cliente cadastrado ainda.</td></tr>';
            totalDiv.textContent = 'Total de clientes: 0';
            return;
        }

        clientes.forEach((cliente, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${cliente.nome}</td>
                <td>${cliente.id}</td>
                <td>${cliente.telefone}</td>
                <td>${cliente.dataCadastro}</td>
                <td>
                    <button class="edit-btn" onclick="editarCliente(${index})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="delete-btn" onclick="excluirCliente(${index})">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        totalDiv.textContent = `Total de clientes: ${clientes.length}`;
    },

    renderProdutosVenda(carrinhoVenda, comParceria = true) {
        const grid = document.getElementById('produtos-grid');
        if (!grid) return;

        grid.innerHTML = '';

        window.CONFIG.PRODUTOS.forEach((produto, index) => {
            const card = document.createElement('div');
            card.className = 'produto-card';
            
            const quantidade = carrinhoVenda[index] || 0;
            const preco = comParceria ? produto.precoComParceria : produto.precoSemParceria;
            const subtotal = quantidade * preco;
            
            card.innerHTML = `
                <div class="produto-nome">${produto.nome}</div>
                <div class="produto-info">
                    <div class="produto-preco" id="preco-${index}">${window.utils.formatarMoeda(preco)}</div>
                    ${quantidade > 0 ? `
                        <div class="produto-subtotal">
                            Subtotal: ${window.utils.formatarMoeda(subtotal)}
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
    },

    renderResumoVenda(total, materiaisNecessarios, ganhosComParceria, ganhosSemParceria) {
        const totalElement = document.getElementById('total-valor');
        const ganhosParceiraElement = document.getElementById('ganhos-parceria');
        const ganhosSemParceiraElement = document.getElementById('ganhos-sem-parceria');
        const materiaisDiv = document.getElementById('materiais-necessarios');

        if (!totalElement || !ganhosParceiraElement || !ganhosSemParceiraElement || !materiaisDiv) return;

        totalElement.textContent = window.utils.formatarMoeda(total);
        ganhosParceiraElement.textContent = window.utils.formatarMoeda(ganhosComParceria);
        ganhosSemParceiraElement.textContent = window.utils.formatarMoeda(ganhosSemParceria);

        if (Object.keys(materiaisNecessarios).length === 0) {
            materiaisDiv.innerHTML = '<p class="empty-message">Nenhum material necessário ainda</p>';
            return;
        }

        let html = '';
        Object.entries(materiaisNecessarios).forEach(([material, quantidade]) => {
            html += `
                <div class="materiais-item">
                    <span class="material-nome">${material}:</span>
                    <span class="quantidade">${quantidade.toLocaleString('pt-BR')} unidades</span>
                </div>`;
        });
        materiaisDiv.innerHTML = html;
    },

    renderHistorico(historico, usuarioAtual) {
        const historicoDiv = document.getElementById('historico-vendas');
        if (!historicoDiv) return;
        
        if (historico.length === 0) {
            historicoDiv.innerHTML = '<p class="empty-message">Nenhuma venda realizada ainda.</p>';
            return;
        }

        let html = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Cliente</th>
                        <th>Vendedor</th>
                        <th>Parceria</th>
                        <th>Total</th>
                        <th>Data</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
        `;

        historico.forEach((venda, index) => {
            const podeAlterarStatus = usuarioAtual.cargo === 'gerente' || 
                                    usuarioAtual.cargo === 'lider' || 
                                    (venda.vendedor.id === usuarioAtual.id && 
                                     venda.vendedor.cargo === usuarioAtual.cargo);
            
            html += `
                <tr>
                    <td>#${venda.id}</td>
                    <td>
                        <div class="cliente-info">
                            <strong>${venda.cliente.nome}</strong><br>
                            <small>ID: ${venda.cliente.id}</small>
                        </div>
                    </td>
                    <td>
                        <div class="vendedor-info">
                            <strong>${venda.vendedor.nome}</strong><br>
                            <small>${venda.vendedor.cargo}</small>
                        </div>
                    </td>
                    <td>
                        ${venda.tipoParceria}
                        ${venda.organizacao ? `<br><small>${venda.organizacao}</small>` : ''}
                    </td>
                    <td>${window.utils.formatarMoeda(venda.total)}</td>
                    <td>${venda.data}</td>
                    <td>
                        <div class="status-circle ${venda.status}" 
                             ${podeAlterarStatus ? `onclick="alterarStatusVenda(${index})"` : ''}
                             title="${venda.status.charAt(0).toUpperCase() + venda.status.slice(1)}">
                        </div>
                    </td>
                    <td>
                        <button class="details-btn" onclick="verDetalhesVenda(${index})">
                            <i class="fas fa-eye"></i> Detalhes
                        </button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        historicoDiv.innerHTML = html;
    },

    atualizarCabecalho(usuario) {
        const userInfoDiv = document.getElementById('userInfo');
        if (!userInfoDiv) return;

        if (!usuario) {
            userInfoDiv.innerHTML = '';
            return;
        }

        userInfoDiv.innerHTML = `
            <span>${usuario.nome} (${usuario.cargo})</span>
            <button class="logout-btn" onclick="app.logout()">
                <i class="fas fa-sign-out-alt"></i> Sair
            </button>
        `;
    }
}; 