// Configurações do Sistema
window.CONFIG = {
    // Configurações de Autenticação
    AUTH: {
        CARGOS: ['vendedor', 'gerente', 'lider'],
        SENHAS: {
            vendedor: '1510',
            gerente: '0987',
            lider: '1357'
        },
        SESSAO_TIMEOUT: 3600 // 1 hora em segundos
    },

    // Configurações de Produtos
    PRODUTOS: [
        {
            nome: 'Munição de Pistola',
            precoComParceria: 400,
            precoSemParceria: 600,
            loteQuantidade: 100,
            materiais: [
                { nome: 'Pólvora', quantidade: 35 },
                { nome: 'Cápsula Pequena', quantidade: 35 }
            ]
        },
        {
            nome: 'Munição de Sub',
            precoComParceria: 600,
            precoSemParceria: 800,
            loteQuantidade: 100,
            materiais: [
                { nome: 'Pólvora', quantidade: 40 },
                { nome: 'Cápsula Pequena', quantidade: 40 }
            ]
        },
        {
            nome: 'Munição de Fuzil',
            precoComParceria: 800,
            precoSemParceria: 1100,
            loteQuantidade: 100,
            materiais: [
                { nome: 'Pólvora', quantidade: 50 },
                { nome: 'Cápsula Pequena', quantidade: 50 }
            ]
        },
        {
            nome: 'Munição de Escopeta',
            precoComParceria: 1000,
            precoSemParceria: 1200,
            loteQuantidade: 100,
            materiais: [
                { nome: 'Pólvora', quantidade: 50 },
                { nome: 'Cápsula Pequena', quantidade: 50 }
            ]
        },
        {
            nome: 'Colete',
            precoComParceria: 7500,
            precoSemParceria: 12500,
            loteQuantidade: 3,
            materiais: [
                { nome: 'Carbono', quantidade: 10 },
                { nome: 'Malha', quantidade: 10 }
            ]
        }
    ],

    // Configurações de Estoque
    ESTOQUE: {
        INICIAL: [
            { nome: 'Pólvora', quantidade: 0 },
            { nome: 'Cápsula Pequena', quantidade: 0 },
            { nome: 'Cápsula Grande', quantidade: 0 },
            { nome: 'Carbono', quantidade: 0 },
            { nome: 'Malha', quantidade: 0 }
        ],
        LIMITE_BAIXO: 1000,
        ALERTA_CRITICO: 500
    },

    // Configurações de Vendas
    VENDAS: {
        COMISSAO_VENDEDOR: 0.3,
        TEMPO_LIMITE_VENDA: 1800, // 30 minutos em segundos
        STATUS: {
            PENDENTE: 'pendente',
            ENTREGUE: 'entregue',
            CANCELADO: 'cancelado'
        }
    },

    // Configurações de UI
    UI: {
        TEMA: {
            CORES: {
                primaria: '#00ffff',
                secundaria: '#ffffff',
                fundo: '#000000',
                fundoClaro: '#111111',
                texto: '#ffffff',
                sucesso: '#00ff00',
                erro: '#ff4444',
                alerta: '#ffff00'
            },
            FONTES: {
                principal: 'Poppins, Arial, sans-serif',
                tamanhos: {
                    pequeno: '0.875rem',
                    normal: '1rem',
                    grande: '1.25rem',
                    titulo: '2rem'
                }
            }
        },
        MENSAGENS: {
            TIMEOUT: 3000, // 3 segundos
            TIPOS: {
                ERRO: 'error',
                SUCESSO: 'success',
                INFO: 'info',
                ALERTA: 'warning'
            }
        }
    },

    // Validações
    VALIDACOES: {
        NOME: {
            MIN_LENGTH: 3,
            MAX_LENGTH: 50
        },
        ID: {
            MIN_LENGTH: 3,
            MAX_LENGTH: 20
        },
        TELEFONE: {
            MIN_LENGTH: 10,
            MAX_LENGTH: 11
        }
    }
};

// Congelar o objeto de configuração para prevenir modificações acidentais
Object.freeze(window.CONFIG);
Object.freeze(window.CONFIG.AUTH);
Object.freeze(window.CONFIG.AUTH.SENHAS);
Object.freeze(window.CONFIG.PRODUTOS);
Object.freeze(window.CONFIG.ESTOQUE);
Object.freeze(window.CONFIG.VENDAS);
Object.freeze(window.CONFIG.UI);
Object.freeze(window.CONFIG.VALIDACOES); 