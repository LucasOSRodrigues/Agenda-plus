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

### Rotas da API

Por enquanto a API usa dados fictícios em memória (`backend/src/mocks/banco.ts`). Reiniciar o servidor volta tudo ao estado inicial.

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/horarios?CNPJ=&Especialidade=&Data=` | Horários disponíveis (filtros opcionais, `Data` em AAAA-MM-DD) |
| GET | `/clinicas` | Opções do filtro de clínica |
| GET | `/especialidades` | Opções do filtro de especialidade |
| GET | `/solicitacoes` | Solicitações do paciente logado |
| GET | `/solicitacoes/chaves` | Chaves (`Médico-Data-HoraInicio`) dos horários já solicitados |
| POST | `/solicitacoes` | Cria uma solicitação. Corpo: `{ "Médico": { "Código": 1 }, "Data": "AAAA-MM-DD", "HoraInicio": "HH:MM" }` |
| DELETE | `/solicitacoes/:codigo` | Cancela uma solicitação pendente |

Os erros voltam no formato `{ "erro": "mensagem" }`, com status 400 (dados inválidos), 404 (não encontrado) ou 409 (regra de negócio, ex.: horário indisponível).

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
