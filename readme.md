# Agenda+

Projeto da disciplina de Engenharia de Software 2, UFOP.

## Ideia geral

O Agenda+ é um sistema web que apoia o processo de marcação de consultas em clínicas e consultórios. O paciente consulta datas e horários disponíveis e envia solicitações de agendamento, além de poder reservar medicamentos disponíveis no estoque. A secretaria analisa, confirma ou recusa solicitações, organiza a agenda, disponibiliza novos horários e gerencia o estoque de medicamentos.

O objetivo é reduzir a dependência de ligações e mensagens manuais, para que a secretaria possa dar mais atenção a quem já está presente na clínica.

## Descrição geral do sistema

O sistema é dividido em quatro portais:

- **Portal do Paciente:** visualiza horários disponíveis, solicita agendamentos, acompanha o status dos pedidos (pendente, confirmado ou recusado) e reserva medicamentos, anexando receita quando necessário.
- **Portal da Secretária:** gerencia solicitações de agendamento, disponibilidade de horários, estoque de medicamentos e validação de receitas.
- **Portal do Médico:** consulta sua agenda de atendimentos e as informações básicas dos pacientes vinculados.
- **Portal do Administrador:** cadastra e remove usuários internos, associa papéis e controla o acesso ao sistema.

**Serviços:** agendamento, gestão de atendimentos, gestão de medicamentos, autenticação e gestão de usuários.

## Tecnologias e estrutura inicial

- **Front-end:** Next.js com React e TypeScript.
- **Back-end:** Node.js com Express e TypeScript, em uma aplicação separada do front-end.

```text
frontend/   Front-end e seu package.json
backend/    Back-end e seu package.json
shared/     Tipos TypeScript compartilhados entre front-end e back-end
docs/       Documentação do projeto
```

Os tipos das entidades (Clinica, Medico, Horario, Solicitacao...) ficam em `shared/agenda.ts` e são importados nos dois projetos com `import type { ... } from '@shared/agenda'`. Esse arquivo só pode ter tipos, sem código que roda.

Para o desenvolvimento, é necessário ter npm e Node.js 22.9 ou superior instalados.

## Como rodar o back-end

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

O `npm run dev` roda o TypeScript direto com o `tsx` e reinicia a cada alteração. Para produção, use `npm run build` (gera o JavaScript em `dist/`) e depois `npm start`. Para só verificar os tipos, use `npm run typecheck`.

A API fica disponível em `http://localhost:3001`. Para testar, acesse `http://localhost:3001/health`, que deve responder `{"status":"ok"}`.

O arquivo `.env` guarda as configurações locais e não vai para o Git. Sem ele, o `npm run dev` falha com o erro `ENOENT`. Ao adicionar uma variável nova, inclua-a também no `.env.example`, sem valores reais de senhas ou chaves.

### Testes do back-end

Os testes usam o Vitest e ficam em `backend/tests/`, separados do código em `src/`. Não precisam do `.env` nem do servidor rodando:

```bash
cd backend
npm test
```

Para rodar os testes de novo a cada alteração salva, use `npm run test:watch`. Para ver a cobertura (quanto do código os testes executam), use `npm run test:coverage`.

- `tests/services/`: testes de unidade dos serviços.
- `tests/routes/`: testes de integração das rotas, que chamam a API sem ligar o servidor (supertest).
- `tests/fixtures/`: dados fixos que substituem os dados fictícios durante os testes (mock), para eles não dependerem da data de hoje nem quebrarem quando os dados fictícios mudarem.

### Rotas da API

Por enquanto a API usa dados fictícios em memória (`backend/src/mocks/banco.ts`). Reiniciar o servidor volta tudo ao estado inicial.

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/gerenciamento/horarios` | Todos os horários para gerenciamento, incluindo liberados, bloqueados e reservados |
| POST | `/gerenciamento/horarios` | Cadastra um horário bloqueado. Corpo: `{ "Médico": { "Código": 1 }, "Clinica": { "CNPJ": "..." }, "Data": "AAAA-MM-DD", "HoraInicio": "HH:MM", "HoraFim": "HH:MM" }` |
| PATCH | `/gerenciamento/horarios/status` | Libera ou bloqueia um horário. Corpo: `{ "Médico": { "Código": 1 }, "Data": "AAAA-MM-DD", "HoraInicio": "HH:MM", "Status": "Liberado" }` |
| GET | `/horarios?CNPJ=&Especialidade=&Data=` | Horários disponíveis (filtros opcionais, `Data` em AAAA-MM-DD) |
| GET | `/clinicas` | Opções do filtro de clínica |
| GET | `/medicos` | Opções do campo de médico no cadastro de horários |
| GET | `/especialidades` | Opções do filtro de especialidade |
| POST | `/pacientes` | Cadastra um paciente (H02). Corpo: `{ "Nome": "...", "CPF": "11 números", "E-mail": "...", "Telefone": "DDD + número", "DataNascimento": "AAAA-MM-DD", "Senha": "mín. 8 caracteres" }`. Responde 201 sem a senha; 400 (dados inválidos) ou 409 (CPF/e-mail já cadastrado) |
| POST | `/equipe` | Cadastra um médico ou secretário (H14). Corpo: `{ "Papel": "Médico" ou "Secretário", "Nome": "...", "CPF": "11 números", "E-mail": "...", "Telefone": "DDD + número", "Senha": "mín. 8 caracteres" }`. Para médico, também `"CRM"` (números), `"UFCRM"` (ex.: `"MG"`) e `"Especialidade"`. Responde 201 sem a senha; 400 (dados inválidos) ou 409 (CPF, e-mail ou CRM já cadastrado). O médico cadastrado passa a aparecer em `/medicos`. Provisório: ainda sem login, qualquer pessoa pode chamar; deve ficar restrita ao administrador |
| GET | `/solicitacoes` | Solicitações do paciente logado |
| GET | `/solicitacoes/chaves` | Chaves (`Médico-Data-HoraInicio`) dos horários já solicitados |
| POST | `/solicitacoes` | Cria uma solicitação. Corpo: `{ "Médico": { "Código": 1 }, "Data": "AAAA-MM-DD", "HoraInicio": "HH:MM" }` |
| DELETE | `/solicitacoes/:codigo` | Cancela uma solicitação pendente |
| GET | `/gerenciamento/solicitacoes?Status=` | Solicitações de todos os pacientes para a secretária, com o nome do paciente (H08). `Status` opcional: `Pendente`, `Confirmada` ou `Recusada` |
| PATCH | `/gerenciamento/solicitacoes/:codigo` | A secretária confirma ou recusa uma solicitação pendente (H08). Corpo: `{ "Status": "Confirmada" }` ou `{ "Status": "Recusada", "Justificativa": "..." }`. Confirmar reserva o horário e recusa as outras solicitações pendentes dele. Responde 400 (recusa sem justificativa), 404 ou 409 (já decidida, horário bloqueado, reservado ou que já passou). Provisório: ainda sem login, qualquer pessoa pode chamar; deve ficar restrita à secretária |

Os erros voltam no formato `{ "erro": "mensagem" }`, com status 400 (dados inválidos), 404 (não encontrado) ou 409 (regra de negócio, ex.: horário indisponível).

## Como rodar o front-end

Com o back-end já rodando, em outro terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

O site fica disponível em `http://localhost:3000`. A variável `NEXT_PUBLIC_API_URL` do `.env` indica onde está a API (padrão `http://localhost:3001`). Se mudar a porta do back-end, atualize essa variável e o `FRONTEND_URL` do back-end.

A tela de cadastro da equipe fica em `http://localhost:3000/administracao/equipe` (por enquanto sem link nem proteção, até existir o login).

A tela em que a secretária confirma ou recusa as solicitações fica em `http://localhost:3000/gerenciamento/solicitacoes`, com link a partir do gerenciamento de horários (também sem proteção até existir o login).

As chamadas à API ficam em `frontend/services/`, e os caminhos ficam em `frontend/services/rotas.ts`. As páginas só usam as funções dos services.

## Quadro Kanban

(https://github.com/users/LucasOSRodrigues/projects/5)

## Integrantes

- Arthur Mendes Torres
- Felipe Guedes
- Guilherme Nogueira Zanon
- João Lucas Oliveira Silva Rodrigues
- Luiz Fernando
- Pedro Vitor
- Rafael Granato
- Thiago Linhares Lage
