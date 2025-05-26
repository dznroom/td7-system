import CONFIG from './config.js';

class Store {
    constructor() {
        this.state = {
            usuario: null,
            clientes: [],
            estoque: CONFIG.ESTOQUE.INICIAL,
            historico: [],
            clienteAtualVenda: null,
            carrinhoVenda: {},
            calculadoraQuantidades: {}
        };
        this.subscribers = [];
    }

    getState() {
        return { ...this.state };
    }

    subscribe(callback) {
        this.subscribers.push(callback);
    }

    notify() {
        this.subscribers.forEach(callback => callback(this.getState()));
    }

    setUsuario(nome, id, cargo) {
        this.state.usuario = { nome, id, cargo };
        this.notify();
    }

    logout() {
        this.state = {
            usuario: null,
            clientes: [],
            estoque: CONFIG.ESTOQUE.INICIAL,
            historico: [],
            clienteAtualVenda: null,
            carrinhoVenda: {},
            calculadoraQuantidades: {}
        };
        this.notify();
    }

    cadastrarCliente(cliente) {
        if (this.state.clientes.some(c => c.id === cliente.id)) {
            throw new Error('ID do cliente já existe.');
        }
        this.state.clientes.push({
            ...cliente,
            dataCadastro: new Date().toLocaleString('pt-BR')
        });
        this.notify();
    }

    atualizarCliente(index, cliente) {
        if (index < 0 || index >= this.state.clientes.length) {
            throw new Error('Cliente não encontrado.');
        }
        this.state.clientes[index] = {
            ...this.state.clientes[index],
            ...cliente
        };
        this.notify();
    }

    excluirCliente(index) {
        if (index < 0 || index >= this.state.clientes.length) {
            throw new Error('Cliente não encontrado.');
        }
        this.state.clientes.splice(index, 1);
        this.notify();
    }

    setClienteAtualVenda(cliente) {
        this.state.clienteAtualVenda = cliente;
        this.state.carrinhoVenda = {};
        this.notify();
    }

    atualizarCarrinho(index, quantidade) {
        this.state.carrinhoVenda[index] = Math.max(0, parseInt(quantidade) || 0);
        this.notify();
    }

    atualizarEstoque(index, quantidade) {
        if (index < 0 || index >= this.state.estoque.length) {
            throw new Error('Item de estoque não encontrado.');
        }
        this.state.estoque[index].quantidade = Math.max(0, parseInt(quantidade) || 0);
        this.notify();
    }

    registrarVenda(venda) {
        this.state.historico.push(venda);
        this.state.clienteAtualVenda = null;
        this.state.carrinhoVenda = {};
        this.notify();
    }

    alterarStatusVenda(index) {
        if (index < 0 || index >= this.state.historico.length) {
            throw new Error('Venda não encontrada.');
        }
        const venda = this.state.historico[index];
        venda.status = venda.status === 'pendente' ? 'entregue' : 'pendente';
        this.notify();
    }

    atualizarCalculadora(index, quantidade) {
        this.state.calculadoraQuantidades[index] = Math.max(0, parseInt(quantidade) || 0);
        this.notify();
    }
}

export default new Store(); 