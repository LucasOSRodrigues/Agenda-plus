// Dados fixos usados nos testes da busca de horários
// Nos testes, eles substituem os dados fictícios de src/mocks/banco.ts (mock).
// Assim os testes não dependem da data de hoje e não quebram quando alguém
// mudar os dados fictícios do projeto e/ou quando o banco de dados for implementado
// Os nomes das entidades e dos atributos seguem o diagrama ERE do TP1 de BD1.

import type { Clinica, Horario, Medico } from '@shared/agenda';

// Momento "agora" usado nos testes (10/11/2026 às 09:00)
export const AGORA = '2026-11-10T09:00:00';

export const CLINICA_ALFA: Clinica = {
  CNPJ: '11111111000111',
  Nome: 'Clínica Alfa',
  Endereço: { Logradouro: 'Rua A', Número: '1', Bairro: 'Centro', Cidade: 'Ouro Preto' },
  'E-mail': ['contato@alfa.example.com'],
};

export const CLINICA_BETA: Clinica = {
  CNPJ: '22222222000122',
  Nome: 'Clínica Beta',
  Endereço: { Logradouro: 'Rua B', Número: '2', Bairro: 'Bauxita', Cidade: 'Ouro Preto' },
  'E-mail': ['contato@beta.example.com'],
};

// Fora de ordem de propósito, para testar a ordenação
export const clinicas: Clinica[] = [CLINICA_BETA, CLINICA_ALFA];

// Cada médico trabalha em uma clínica (relacionamento Trabalha do diagrama de BD1)
// Bruno na Alfa (Cardiologia), Ana na Beta (Pediatria) e Carla na Alfa (Pediatria)
export const medicos: Medico[] = [
  { Código: 1, Nome: 'Bruno Souza', CRM: '10001', UFCRM: 'MG', Especialidade: 'Cardiologia' },
  { Código: 2, Nome: 'Ana Lima', CRM: '10002', UFCRM: 'MG', Especialidade: 'Pediatria' },
  { Código: 3, Nome: 'Carla Dias', CRM: '10003', UFCRM: 'SP', Especialidade: 'Pediatria' },
];

const ALFA = { CNPJ: CLINICA_ALFA.CNPJ };
const BETA = { CNPJ: CLINICA_BETA.CNPJ };

export const horarios: Horario[] = [
  // Disponíveis (fora de ordem de propósito, para testar a ordenação)
  { Médico: { Código: 2 }, Clinica: BETA, Data: '2026-11-12', HoraInicio: '14:00', HoraFim: '14:30', Status: 'Liberado' },
  { Médico: { Código: 3 }, Clinica: ALFA, Data: '2026-11-11', HoraInicio: '09:00', HoraFim: '09:30', Status: 'Liberado' },
  { Médico: { Código: 1 }, Clinica: ALFA, Data: '2026-11-10', HoraInicio: '10:00', HoraFim: '10:30', Status: 'Liberado' },
  { Médico: { Código: 2 }, Clinica: BETA, Data: '2026-11-10', HoraInicio: '10:00', HoraFim: '10:30', Status: 'Liberado' },

  // Liberados, mas já começaram em relação a AGORA, então não podem aparecer
  { Médico: { Código: 1 }, Clinica: ALFA, Data: '2026-11-10', HoraInicio: '08:00', HoraFim: '08:30', Status: 'Liberado' },
  { Médico: { Código: 1 }, Clinica: ALFA, Data: '2026-11-10', HoraInicio: '09:00', HoraFim: '09:30', Status: 'Liberado' },

  // Futuros, mas não liberados, então não podem aparecer
  { Médico: { Código: 2 }, Clinica: BETA, Data: '2026-11-11', HoraInicio: '08:00', HoraFim: '08:30', Status: 'Bloqueado' },
  { Médico: { Código: 3 }, Clinica: ALFA, Data: '2026-11-11', HoraInicio: '08:00', HoraFim: '08:30', Status: 'Reservado' },
];

// Os quatro horários disponíveis em AGORA, na ordem esperada (data, hora e nome do médico),
// no formato de resumirHorarios (tests/ajudantes.ts)
export const DISPONIVEIS_EM_ORDEM = [
  '2026-11-10 10:00 Ana Lima',
  '2026-11-10 10:00 Bruno Souza',
  '2026-11-11 09:00 Carla Dias',
  '2026-11-12 14:00 Ana Lima',
];
