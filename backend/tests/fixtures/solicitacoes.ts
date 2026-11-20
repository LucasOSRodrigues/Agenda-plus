// Dados fixos usados nos testes do gerenciamento de solicitações (H08)
// Nos testes, eles substituem os dados fictícios de src/mocks/banco.ts (mock).
// As clínicas e os médicos são os mesmos dos testes de horários.
// O serviço altera horários e solicitações, então cada teste carrega o serviço de novo
// (vi.resetModules) e volta os horários do mock ao estado inicial (criarHorarios).

import type { Horario, Paciente, Solicitacao } from '@shared/agenda';
import { CLINICA_ALFA, CLINICA_BETA } from './horarios.js';

export { AGORA, clinicas, medicos } from './horarios.js';

const ALFA = { CNPJ: CLINICA_ALFA.CNPJ };
const BETA = { CNPJ: CLINICA_BETA.CNPJ };

export const pacientes: Paciente[] = [
  { Código: 100, Nome: 'Mariana Alves', CPF: '52998224725', 'E-mail': 'mariana@example.com', Telefone: '31988887777', DataNascimento: '1994-03-12' },
  { Código: 101, Nome: 'João Pereira', CPF: '12345678909', 'E-mail': 'joao@example.com', Telefone: '31977776666', DataNascimento: '1987-08-25' },
];

const HORARIOS_INICIAIS: Horario[] = [
  // Liberado e futuro, pedido por dois pacientes (solicitações 1 e 2)
  { Médico: { Código: 1 }, Clinica: ALFA, Data: '2026-11-11', HoraInicio: '10:00', HoraFim: '10:30', Status: 'Liberado' },
  // Liberado e futuro, pedido só pela solicitação 3
  { Médico: { Código: 2 }, Clinica: BETA, Data: '2026-11-12', HoraInicio: '14:00', HoraFim: '14:30', Status: 'Liberado' },
  // Bloqueado pela secretária depois de solicitado (solicitação 4)
  { Médico: { Código: 3 }, Clinica: ALFA, Data: '2026-11-11', HoraInicio: '08:00', HoraFim: '08:30', Status: 'Bloqueado' },
  // Já começou em relação a AGORA (solicitação 5)
  { Médico: { Código: 1 }, Clinica: ALFA, Data: '2026-11-10', HoraInicio: '08:00', HoraFim: '08:30', Status: 'Liberado' },
  // Reservado, com a solicitação confirmada 6
  { Médico: { Código: 2 }, Clinica: BETA, Data: '2026-11-13', HoraInicio: '09:00', HoraFim: '09:30', Status: 'Reservado' },
];

// O serviço muda o Status dos horários, então cada teste recebe uma cópia nova (criarHorarios)
export function criarHorarios(): Horario[] {
  return HORARIOS_INICIAIS.map((horario) => ({ ...horario }));
}

export const horarios = criarHorarios();

const base = { DataSolicitacao: '2026-11-09T12:00:00.000Z', Justificativa: '' };

export const solicitacoes: Solicitacao[] = [
  { ...base, Código: 1, Paciente: { Código: 100 }, Médico: { Código: 1 }, Data: '2026-11-11', HoraInicio: '10:00', Status: 'Pendente' },
  { ...base, Código: 2, Paciente: { Código: 101 }, Médico: { Código: 1 }, Data: '2026-11-11', HoraInicio: '10:00', Status: 'Pendente' },
  { ...base, Código: 3, Paciente: { Código: 101 }, Médico: { Código: 2 }, Data: '2026-11-12', HoraInicio: '14:00', Status: 'Pendente' },
  { ...base, Código: 4, Paciente: { Código: 100 }, Médico: { Código: 3 }, Data: '2026-11-11', HoraInicio: '08:00', Status: 'Pendente' },
  { ...base, Código: 5, Paciente: { Código: 100 }, Médico: { Código: 1 }, Data: '2026-11-10', HoraInicio: '08:00', Status: 'Pendente' },
  { ...base, Código: 6, Paciente: { Código: 100 }, Médico: { Código: 2 }, Data: '2026-11-13', HoraInicio: '09:00', Status: 'Confirmada' },
];

// Códigos das solicitações pendentes, na ordem da consulta (data e hora)
export const PENDENTES_EM_ORDEM = [5, 4, 1, 2, 3];
