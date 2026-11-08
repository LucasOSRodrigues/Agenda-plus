// Serviço de consulta de horários, usado pelas rotas de routes/horarios.ts
// Por enquanto as funções utilizam os dados fictícios de mocks/banco.ts

import { clinicas, horarios, medicos, STATUS_HORARIO } from '../mocks/banco.js';
import { ErroHttp } from '../erros.js';
import type {
  AlteracaoStatusHorario,
  Clinica,
  DadosCadastroHorario,
  FiltrosHorarios,
  Horario,
  HorarioDetalhado,
  Medico,
} from '@shared/agenda';

function compararTexto(a: string, b: string): number {
  return a.localeCompare(b, 'pt-BR');
}

// Troca as referências pelas informações completas do médico e da clínica
function detalharHorario(horario: Horario): HorarioDetalhado {
  return {
    ...horario,
    // Todo horário do mock aponta para um médico e uma clínica existentes
    Médico: medicos.find((medico) => medico.Código === horario.Médico.Código) as Medico,
    Clinica: clinicas.find((clinica) => clinica.CNPJ === horario.Clinica.CNPJ) as Clinica,
  };
}

// Momento em que o horário começa, no fuso do servidor
function inicioDoHorario(horario: Pick<Horario, 'Data' | 'HoraInicio'>): Date {
  return new Date(`${horario.Data}T${horario.HoraInicio}`);
}

// Lista todos os horários para o gerenciamento da secretária
// Diferente da consulta do paciente, inclui liberados, bloqueados e reservados
export async function listarHorariosGerenciamento(): Promise<HorarioDetalhado[]> {
  return horarios
    .map(detalharHorario)
    .sort(
      (a, b) =>
        compararTexto(a.Data, b.Data) ||
        compararTexto(a.HoraInicio, b.HoraInicio) ||
        compararTexto(a.Médico.Nome, b.Médico.Nome),
    );
}

// Cadastra um horário bloqueado, que só aparece para o paciente depois de liberado
export async function cadastrarHorario(
  dados: DadosCadastroHorario,
): Promise<HorarioDetalhado> {
  const medico = medicos.find((item) => item.Código === dados.Médico.Código);
  if (!medico) {
    throw new ErroHttp(404, 'Médico não encontrado.');
  }

  const clinica = clinicas.find((item) => item.CNPJ === dados.Clinica.CNPJ);
  if (!clinica) {
    throw new ErroHttp(404, 'Clínica não encontrada.');
  }

  if (dados.HoraFim <= dados.HoraInicio) {
    throw new ErroHttp(400, 'A hora final deve ser posterior à hora inicial.');
  }

  // Dois horários do mesmo médico conflitam quando os seus intervalos se sobrepõem
  const temConflito = horarios.some(
    (horario) =>
      horario.Médico.Código === dados.Médico.Código &&
      horario.Data === dados.Data &&
      dados.HoraInicio < horario.HoraFim &&
      dados.HoraFim > horario.HoraInicio,
  );
  if (temConflito) {
    throw new ErroHttp(409, 'O médico já possui um horário neste período.');
  }

  const novo: Horario = {
    ...dados,
    Status: STATUS_HORARIO.BLOQUEADO,
  };
  horarios.push(novo);
  return detalharHorario(novo);
}

// Libera ou bloqueia um horário existente
export async function alterarStatusHorario(
  alteracao: AlteracaoStatusHorario,
): Promise<HorarioDetalhado> {
  const horario = horarios.find(
    (item) =>
      item.Médico.Código === alteracao.Médico.Código &&
      item.Data === alteracao.Data &&
      item.HoraInicio === alteracao.HoraInicio,
  );
  if (!horario) {
    throw new ErroHttp(404, 'Horário não encontrado.');
  }

  if (horario.Status === STATUS_HORARIO.RESERVADO) {
    throw new ErroHttp(409, 'Horários reservados não podem ser liberados ou bloqueados.');
  }

  horario.Status = alteracao.Status;
  return detalharHorario(horario);
}

// Busca os horários que o paciente pode escolher
// Cada horário volta com o Médico e a Clinica completos, para a tela
// mostrar nome, especialidade e endereço
export async function buscarHorariosDisponiveis({
  CNPJ,
  Especialidade,
  Data,
}: FiltrosHorarios = {}): Promise<HorarioDetalhado[]> {
  const agora = new Date();

  return horarios
    // O paciente vê apenas horários liberados e ainda não ocupados
    // Horários bloqueados, reservados ou que já começaram ficam de fora
    .filter((horario) => horario.Status === STATUS_HORARIO.LIBERADO)
    .filter((horario) => inicioDoHorario(horario) > agora)
    .map(detalharHorario)
    // Filtros opcionais (vazio = não filtra):
    // - CNPJ: só horários fornecidos por esta clínica
    // - Especialidade: só horários de médicos desta especialidade
    // - Data: só horários deste dia (AAAA-MM-DD)
    .filter((horario) => !CNPJ || horario.Clinica.CNPJ === CNPJ)
    .filter((horario) => !Especialidade || horario.Médico.Especialidade === Especialidade)
    .filter((horario) => !Data || horario.Data === Data)
    .sort(
      (a, b) =>
        compararTexto(a.Data, b.Data) ||
        compararTexto(a.HoraInicio, b.HoraInicio) ||
        compararTexto(a.Médico.Nome, b.Médico.Nome),
    );
}

// Opções do filtro de clínica
export async function listarClinicas(): Promise<Clinica[]> {
  return [...clinicas].sort((a, b) => compararTexto(a.Nome, b.Nome));
}

// Opções do filtro de especialidade, sem repetição
export async function listarEspecialidades(): Promise<string[]> {
  const especialidades = new Set(medicos.map((medico) => medico.Especialidade));
  return [...especialidades].sort(compararTexto);
}
