# TD7 System

Sistema de gerenciamento de vendas com interface moderna e funcionalidades avançadas.

## Características

- Interface escura com detalhes em ciano
- Sistema de login com diferentes níveis de acesso (vendedor/gerente/líder)
- Dashboard funcional
- Gerenciamento de vendas e estoque
- Calculadora de orçamentos
- Histórico e estatísticas

## Deploy no Vercel

1. Instale a CLI do Vercel:
```bash
npm i -g vercel
```

2. Faça login na sua conta Vercel:
```bash
vercel login
```

3. Deploy do projeto:
```bash
vercel
```

4. Para fazer deploy em produção:
```bash
vercel --prod
```

## Estrutura do Projeto

- `index.html`: Interface principal
- `css/styles.css`: Estilos do sistema
- `js/`
  - `app.js`: Lógica principal e inicialização
  - `config.js`: Configurações do sistema
  - `services.js`: Serviços de autenticação, vendas, etc.
  - `store.js`: Gerenciamento de estado
  - `ui.js`: Componentes de interface
  - `utils.js`: Funções utilitárias

## Credenciais de Acesso

- Vendedor: senha 1510
- Gerente: senha 0987
- Líder: senha 1357

## Funcionalidades

- Sistema de login com diferentes níveis de acesso
- Gestão de clientes
- Controle de estoque
- Registro de vendas
- Dashboard com estatísticas
- Histórico de vendas
- Calculadora de orçamentos

## Tecnologias Utilizadas

- HTML5
- CSS3 com variáveis CSS
- JavaScript ES6+ com módulos
- Chart.js para gráficos
- Font Awesome para ícones

## Instalação Local

1. Clone este repositório
```bash
git clone https://github.com/dznroom/td7-system.git
cd td7-system
```

2. Instale as dependências
```bash
npm install
```

3. Inicie o servidor de desenvolvimento
```bash
npm run dev
```

4. Acesse http://localhost:3000 no seu navegador

## Credenciais de Teste

- Vendedor: senha 1510
- Gerente: senha 0987
- Líder: senha 1357

## Estrutura do Projeto

```
td7-system/
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── config.js
│   ├── services.js
│   ├── store.js
│   ├── ui.js
│   └── utils.js
├── index.html
├── package.json
├── vercel.json
└── README.md 