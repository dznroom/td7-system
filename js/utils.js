// Funções Utilitárias
export function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

export function formatarData(data, periodo) {
    const options = {
        dia: { day: '2-digit', month: '2-digit' },
        semana: { week: 'numeric', year: 'numeric' },
        mes: { month: 'short', year: 'numeric' }
    };

    if (typeof data === 'string') {
        data = new Date(data.split(' ')[0].split('/').reverse().join('-'));
    }

    return data.toLocaleDateString('pt-BR', options[periodo]);
}

export function calcularSemanaAno(data) {
    if (typeof data === 'string') {
        data = new Date(data.split(' ')[0].split('/').reverse().join('-'));
    }

    const primeiroDiaAno = new Date(data.getFullYear(), 0, 1);
    return Math.ceil(((data - primeiroDiaAno) / 86400000 + primeiroDiaAno.getDay() + 1) / 7);
}

export function validarQuantidade(quantidade) {
    return Math.max(0, parseInt(quantidade) || 0);
}

export function agruparDadosPorPeriodo(dados, periodo) {
    const agrupado = {};
    
    dados.forEach(venda => {
        const data = new Date(venda.data.split(' ')[0].split('/').reverse().join('-'));
        let chave;
        
        switch(periodo) {
            case 'dia':
                chave = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                break;
            case 'semana':
                const primeiroDiaAno = new Date(data.getFullYear(), 0, 1);
                const semana = Math.ceil(((data - primeiroDiaAno) / 86400000 + primeiroDiaAno.getDay() + 1) / 7);
                chave = `Semana ${semana}, ${data.getFullYear()}`;
                break;
            case 'mes':
                chave = data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
                break;
        }

        if (!agrupado[chave]) {
            agrupado[chave] = {
                total: 0,
                produtos: {
                    'Munição de Pistola': 0,
                    'Munição de Sub': 0,
                    'Munição de Fuzil': 0,
                    'Munição de Escopeta': 0,
                    'Colete': 0
                }
            };
        }

        agrupado[chave].total += venda.total;
        venda.itens.forEach(item => {
            if (agrupado[chave].produtos[item.produto] !== undefined) {
                agrupado[chave].produtos[item.produto] += item.quantidade;
            }
        });
    });

    return agrupado;
}

export function verificarPermissao(usuario, venda) {
    if (!usuario || !venda) return false;

    return usuario.cargo === 'gerente' || 
           usuario.cargo === 'lider' || 
           (venda.vendedor.id === usuario.id && venda.vendedor.cargo === usuario.cargo);
}

export function calcularMaterialNecessario(produto, quantidade) {
    const lotesNecessarios = Math.ceil(quantidade / produto.loteQuantidade);
    const materiaisNecessarios = {};
    
    produto.materiais.forEach(material => {
        const qtdMaterialNecessario = material.quantidade * lotesNecessarios;
        materiaisNecessarios[material.nome] = qtdMaterialNecessario;
    });
    
    return materiaisNecessarios;
}

export function verificarEstoqueSuficiente(materiaisNecessarios, estoque) {
    for (const [material, quantidade] of Object.entries(materiaisNecessarios)) {
        const itemEstoque = estoque.find(e => e.nome === material);
        if (!itemEstoque || itemEstoque.quantidade < quantidade) {
            return {
                suficiente: false,
                material,
                necessario: quantidade,
                disponivel: itemEstoque ? itemEstoque.quantidade : 0
            };
        }
    }
    return { suficiente: true };
}

export function calcularGanhos(total, comParceria = true) {
    return total * 0.3; // 30% de comissão
}

export function calcularLotesNecessarios(quantidade, loteQuantidade) {
    return Math.ceil(quantidade / loteQuantidade);
}

window.utils = {
    formatarMoeda(valor) {
        return valor.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    },

    verificarEstoqueSuficiente(materiaisNecessarios, estoque) {
        for (const [material, quantidade] of Object.entries(materiaisNecessarios)) {
            const itemEstoque = estoque.find(e => e.nome === material);
            if (!itemEstoque || itemEstoque.quantidade < quantidade) {
                return {
                    suficiente: false,
                    material,
                    necessario: quantidade,
                    disponivel: itemEstoque ? itemEstoque.quantidade : 0
                };
            }
        }
        return { suficiente: true };
    }
}; 