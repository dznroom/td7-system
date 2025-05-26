// Serviços do Sistema
window.AuthService = {
    login(nome, id, cargo, senha) {
        if (!window.CONFIG.AUTH.CARGOS.includes(cargo)) {
            throw new Error('Cargo inválido.');
        }
        if (senha !== window.CONFIG.AUTH.SENHAS[cargo]) {
            throw new Error('Senha incorreta para o cargo selecionado.');
        }
        window.store.setUsuario(nome, id, cargo);
    },

    logout() {
        window.store.logout();
    }
};

window.ClienteService = {
    cadastrar(nome, id, telefone) {
        // Validações
        if (nome.length < window.CONFIG.VALIDACOES.NOME.MIN_LENGTH || nome.length > window.CONFIG.VALIDACOES.NOME.MAX_LENGTH) {
            throw new Error(`O nome deve ter entre ${window.CONFIG.VALIDACOES.NOME.MIN_LENGTH} e ${window.CONFIG.VALIDACOES.NOME.MAX_LENGTH} caracteres.`);
        }

        if (id.length < window.CONFIG.VALIDACOES.ID.MIN_LENGTH || id.length > window.CONFIG.VALIDACOES.ID.MAX_LENGTH) {
            throw new Error(`O ID deve ter entre ${window.CONFIG.VALIDACOES.ID.MIN_LENGTH} e ${window.CONFIG.VALIDACOES.ID.MAX_LENGTH} caracteres.`);
        }

        if (telefone.length < window.CONFIG.VALIDACOES.TELEFONE.MIN_LENGTH || telefone.length > window.CONFIG.VALIDACOES.TELEFONE.MAX_LENGTH) {
            throw new Error(`O telefone deve ter entre ${window.CONFIG.VALIDACOES.TELEFONE.MIN_LENGTH} e ${window.CONFIG.VALIDACOES.TELEFONE.MAX_LENGTH} caracteres.`);
        }

        if (window.store.getState().clientes.some(cliente => cliente.id === id)) {
            throw new Error('ID do cliente já existe.');
        }

        const novoCliente = {
            nome,
            id,
            telefone,
            dataCadastro: new Date().toLocaleString('pt-BR')
        };

        window.store.adicionarCliente(novoCliente);
        return novoCliente;
    },

    editar(index, nome, telefone) {
        // Validações
        if (nome.length < window.CONFIG.VALIDACOES.NOME.MIN_LENGTH || nome.length > window.CONFIG.VALIDACOES.NOME.MAX_LENGTH) {
            throw new Error(`O nome deve ter entre ${window.CONFIG.VALIDACOES.NOME.MIN_LENGTH} e ${window.CONFIG.VALIDACOES.NOME.MAX_LENGTH} caracteres.`);
        }

        if (telefone.length < window.CONFIG.VALIDACOES.TELEFONE.MIN_LENGTH || telefone.length > window.CONFIG.VALIDACOES.TELEFONE.MAX_LENGTH) {
            throw new Error(`O telefone deve ter entre ${window.CONFIG.VALIDACOES.TELEFONE.MIN_LENGTH} e ${window.CONFIG.VALIDACOES.TELEFONE.MAX_LENGTH} caracteres.`);
        }

        const cliente = window.store.getState().clientes[index];
        const clienteAtualizado = {
            ...cliente,
            nome,
            telefone
        };
        window.store.editarCliente(index, clienteAtualizado);
    },

    remover(index) {
        window.store.removerCliente(index);
    }
};

window.VendaService = {
    iniciarVenda(clienteIndex) {
        const cliente = window.store.getState().clientes[clienteIndex];
        if (!cliente) {
            throw new Error('Cliente não encontrado.');
        }
        window.store.setClienteAtualVenda(cliente);
    },

    atualizarQuantidade(index, quantidade) {
        window.store.atualizarCarrinho(index, quantidade);
    },

    calcularTotal(comParceria = true) {
        const { carrinhoVenda } = window.store.getState();
        let total = 0;
        let materiaisNecessarios = {};

        window.CONFIG.PRODUTOS.forEach((produto, index) => {
            const quantidade = carrinhoVenda[index] || 0;
            if (quantidade > 0) {
                const preco = comParceria ? produto.precoComParceria : produto.precoSemParceria;
                total += quantidade * preco;

                const lotesNecessarios = Math.ceil(quantidade / produto.loteQuantidade);
                produto.materiais.forEach(material => {
                    const qtdMaterialNecessario = material.quantidade * lotesNecessarios;
                    materiaisNecessarios[material.nome] = (materiaisNecessarios[material.nome] || 0) + qtdMaterialNecessario;
                });
            }
        });

        return { total, materiaisNecessarios };
    },

    finalizarVenda(comParceria, organizacao = '') {
        const state = window.store.getState();
        const { total, materiaisNecessarios } = this.calcularTotal(comParceria);

        // Verificar estoque
        const verificacao = window.utils.verificarEstoqueSuficiente(materiaisNecessarios, state.estoque);
        if (!verificacao.suficiente) {
            throw new Error(`Material insuficiente: ${verificacao.material}\nNecessário: ${verificacao.necessario}\nDisponível: ${verificacao.disponivel}`);
        }

        // Criar objeto da venda
        const venda = {
            id: state.historico.length + 1,
            cliente: state.clienteAtualVenda,
            vendedor: state.usuario,
            itens: window.CONFIG.PRODUTOS.map((produto, index) => {
                const quantidade = state.carrinhoVenda[index] || 0;
                if (quantidade > 0) {
                    const preco = comParceria ? produto.precoComParceria : produto.precoSemParceria;
                    return {
                        produto: produto.nome,
                        quantidade,
                        precoUnitario: preco,
                        subtotal: quantidade * preco
                    };
                }
                return null;
            }).filter(Boolean),
            tipoParceria: comParceria ? 'Com Parceria' : 'Sem Parceria',
            organizacao: comParceria ? organizacao : null,
            materiaisUsados: materiaisNecessarios,
            total,
            ganhosVendedor: total * window.CONFIG.VENDAS.COMISSAO_VENDEDOR,
            data: new Date().toLocaleString('pt-BR'),
            status: window.CONFIG.VENDAS.STATUS.PENDENTE
        };

        // Atualizar estoque
        Object.entries(materiaisNecessarios).forEach(([material, quantidade]) => {
            const index = state.estoque.findIndex(e => e.nome === material);
            if (index !== -1) {
                window.store.atualizarEstoque(index, state.estoque[index].quantidade - quantidade);
            }
        });

        // Registrar venda
        window.store.registrarVenda(venda);
        return venda;
    }
};

window.EstoqueService = {
    atualizar(index, quantidade) {
        if (quantidade < 0) {
            throw new Error('A quantidade não pode ser negativa.');
        }
        window.store.atualizarEstoque(index, quantidade);
    },

    verificarAlertasEstoque() {
        return window.store.getState().estoque
            .filter(item => item.quantidade < window.CONFIG.ESTOQUE.LIMITE_BAIXO)
            .map(item => ({
                nome: item.nome,
                quantidade: item.quantidade,
                critico: item.quantidade < window.CONFIG.ESTOQUE.ALERTA_CRITICO
            }));
    }
}; 