import store from './store.js';
import CONFIG from './config.js';
import { calcularMaterialNecessario, verificarEstoqueSuficiente } from './utils.js';

export const AuthService = {
    login(nome, id, cargo, senha) {
        if (!CONFIG.AUTH.CARGOS.includes(cargo)) {
            throw new Error('Cargo inválido.');
        }
        if (senha !== CONFIG.AUTH.SENHAS[cargo]) {
            throw new Error('Senha incorreta para o cargo selecionado.');
        }
        store.setUsuario(nome, id, cargo);
    },

    logout() {
        store.logout();
    }
};

export const ClienteService = {
    cadastrar(nome, id, telefone) {
        // Validações
        if (nome.length < CONFIG.VALIDACOES.NOME.MIN_LENGTH || nome.length > CONFIG.VALIDACOES.NOME.MAX_LENGTH) {
            throw new Error(`O nome deve ter entre ${CONFIG.VALIDACOES.NOME.MIN_LENGTH} e ${CONFIG.VALIDACOES.NOME.MAX_LENGTH} caracteres.`);
        }

        if (id.length < CONFIG.VALIDACOES.ID.MIN_LENGTH || id.length > CONFIG.VALIDACOES.ID.MAX_LENGTH) {
            throw new Error(`O ID deve ter entre ${CONFIG.VALIDACOES.ID.MIN_LENGTH} e ${CONFIG.VALIDACOES.ID.MAX_LENGTH} caracteres.`);
        }

        if (telefone.length < CONFIG.VALIDACOES.TELEFONE.MIN_LENGTH || telefone.length > CONFIG.VALIDACOES.TELEFONE.MAX_LENGTH) {
            throw new Error(`O telefone deve ter entre ${CONFIG.VALIDACOES.TELEFONE.MIN_LENGTH} e ${CONFIG.VALIDACOES.TELEFONE.MAX_LENGTH} caracteres.`);
        }

        if (store.getState().clientes.some(cliente => cliente.id === id)) {
            throw new Error('ID do cliente já existe.');
        }

        const novoCliente = {
            nome,
            id,
            telefone,
            dataCadastro: new Date().toLocaleString('pt-BR')
        };

        store.adicionarCliente(novoCliente);
        return novoCliente;
    },

    editar(index, nome, telefone) {
        // Validações
        if (nome.length < CONFIG.VALIDACOES.NOME.MIN_LENGTH || nome.length > CONFIG.VALIDACOES.NOME.MAX_LENGTH) {
            throw new Error(`O nome deve ter entre ${CONFIG.VALIDACOES.NOME.MIN_LENGTH} e ${CONFIG.VALIDACOES.NOME.MAX_LENGTH} caracteres.`);
        }

        if (telefone.length < CONFIG.VALIDACOES.TELEFONE.MIN_LENGTH || telefone.length > CONFIG.VALIDACOES.TELEFONE.MAX_LENGTH) {
            throw new Error(`O telefone deve ter entre ${CONFIG.VALIDACOES.TELEFONE.MIN_LENGTH} e ${CONFIG.VALIDACOES.TELEFONE.MAX_LENGTH} caracteres.`);
        }

        const cliente = store.getState().clientes[index];
        const clienteAtualizado = {
            ...cliente,
            nome,
            telefone
        };
        store.editarCliente(index, clienteAtualizado);
    },

    remover(index) {
        store.removerCliente(index);
    }
};

export const VendaService = {
    iniciarVenda(clienteIndex) {
        const cliente = store.getState().clientes[clienteIndex];
        if (!cliente) {
            throw new Error('Cliente não encontrado.');
        }
        store.setClienteAtualVenda(cliente);
    },

    atualizarQuantidade(index, quantidade) {
        store.atualizarCarrinho(index, quantidade);
    },

    calcularTotal(comParceria = true) {
        const { carrinhoVenda } = store.getState();
        let total = 0;
        let materiaisNecessarios = {};

        CONFIG.PRODUTOS.forEach((produto, index) => {
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
        const state = store.getState();
        const { total, materiaisNecessarios } = this.calcularTotal(comParceria);

        // Verificar estoque
        const verificacao = verificarEstoqueSuficiente(materiaisNecessarios, state.estoque);
        if (!verificacao.suficiente) {
            throw new Error(`Material insuficiente: ${verificacao.material}\nNecessário: ${verificacao.necessario}\nDisponível: ${verificacao.disponivel}`);
        }

        // Criar objeto da venda
        const venda = {
            id: state.historico.length + 1,
            cliente: state.clienteAtualVenda,
            vendedor: state.usuario,
            itens: CONFIG.PRODUTOS.map((produto, index) => {
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
            ganhosVendedor: total * CONFIG.VENDAS.COMISSAO_VENDEDOR,
            data: new Date().toLocaleString('pt-BR'),
            status: CONFIG.VENDAS.STATUS.PENDENTE
        };

        // Atualizar estoque
        Object.entries(materiaisNecessarios).forEach(([material, quantidade]) => {
            const index = state.estoque.findIndex(e => e.nome === material);
            if (index !== -1) {
                store.atualizarEstoque(index, state.estoque[index].quantidade - quantidade);
            }
        });

        // Registrar venda
        store.registrarVenda(venda);
        return venda;
    }
};

export const EstoqueService = {
    atualizar(index, quantidade) {
        if (quantidade < 0) {
            throw new Error('A quantidade não pode ser negativa.');
        }
        store.atualizarEstoque(index, quantidade);
    },

    verificarAlertasEstoque() {
        return store.getState().estoque
            .filter(item => item.quantidade < CONFIG.ESTOQUE.LIMITE_BAIXO)
            .map(item => ({
                nome: item.nome,
                quantidade: item.quantidade,
                critico: item.quantidade < CONFIG.ESTOQUE.ALERTA_CRITICO
            }));
    }
}; 