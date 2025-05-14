# Voz do Bairro - Backend

API RESTful para o sistema Voz do Bairro, desenvolvida com Node.js, Express e MySQL.

## Requisitos

- Node.js 18 ou superior
- MySQL 5.7 ou superior

## Instalação

1. Clone o repositório:
\`\`\`bash
git clone https://github.com/seu-usuario/voz-do-bairro-backend.git
cd voz-do-bairro-backend
\`\`\`

2. Instale as dependências:
\`\`\`bash
npm install
\`\`\`

3. Configure as variáveis de ambiente:
\`\`\`bash
cp .env.example .env
\`\`\`
Edite o arquivo `.env` com suas configurações.

4. Certifique-se de que o banco de dados MySQL esteja criado conforme o script SQL fornecido.

5. Inicie o servidor:
\`\`\`bash
npm run dev
\`\`\`

## Estrutura do Projeto

\`\`\`
/src
  /config       - Configurações (banco de dados, etc.)
  /controllers  - Controladores para cada entidade
  /middleware   - Middleware (autenticação, etc.)
  /routes       - Rotas da API
  server.js     - Ponto de entrada da aplicação
\`\`\`

## Endpoints da API

### Usuários

- `POST /api/usuarios/cadastro` - Cadastrar um novo usuário
- `POST /api/usuarios/login` - Fazer login
- `GET /api/usuarios/perfil` - Obter perfil do usuário (requer autenticação)
- `GET /api/usuarios/verificar-login` - Verificar status de login (requer autenticação)

### Relatórios

- `POST /api/relatorios` - Criar um novo relatório (requer autenticação)
- `GET /api/relatorios` - Obter todos os relatórios (com paginação e filtros)
- `GET /api/relatorios/recentes` - Obter os 3 relatórios mais recentes
- `GET /api/relatorios/:id` - Obter um relatório específico
- `PATCH /api/relatorios/:id/status` - Atualizar o status de um relatório (requer autenticação)

### Comentários

- `POST /api/comentarios` - Adicionar um comentário a um relatório (requer autenticação)
- `GET /api/comentarios/relatorio/:relatorio_id` - Obter comentários de um relatório
- `DELETE /api/comentarios/:id` - Excluir um comentário (requer autenticação)

## Autenticação

A API utiliza autenticação baseada em tokens JWT. Para acessar rotas protegidas, inclua o token no cabeçalho da requisição:

\`\`\`
Authorization: Bearer seu_token_jwt
\`\`\`

## Implantação

Este projeto está configurado para ser facilmente implantado em serviços como Railway ou similares.
