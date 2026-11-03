// Serviço de solicitações de agendamento usado pela tela /horarios.
// Por enquanto as funções utilizam os dados fictícios de mocks/banco.js
// As solicitações ficam só em memória: recarregar a página (F5) volta ao estado inicial.
// Quando o banco existir, basta trocar o corpo destas funções e manter as assinaturas.

import {
  horarios,
  solicitacoes as solicitacoesIniciais,
  PACIENTE_LOGADO,
  STATUS_HORARIO,
  STATUS_SOLICITACAO,
} from '../mocks/banco';

// Cópia do mock, para poder criar solicitações sem alterar o arquivo original
let solicitacoes = solicitacoesIniciais.map((solicitacao) => ({ ...solicitacao }));
let proximoCodigo = Math.max(0, ...solicitacoes.map((s) => s.Código)) + 1;

// Mesmo formato de chave usado na tela de horários: Médico + Data + HoraInicio
function chaveDoHorario(horario) {
  return `${horario.Médico.Código}-${horario.Data}-${horario.HoraInicio}`;
}

function inicioDoHorario(horario) {
  return new Date(`${horario.Data}T${horario.HoraInicio}`);
}

// Solicitação que ainda ocupa o horário: pendente ou confirmada
// (recusada libera o horário para uma nova solicitação)
function estaAtiva(solicitacao) {
  return solicitacao.Status !== STATUS_SOLICITACAO.RECUSADA;
}

function doPacienteLogado(solicitacao) {
  return solicitacao.Paciente.Código === PACIENTE_LOGADO.Código;
}

// Chaves dos horários que o paciente já solicitou (pendentes ou confirmadas)
// A tela de horários usa isso para trocar o botão "Solicitar" por "Solicitado"
export async function listarChavesSolicitadas() {
  return solicitacoes.filter(doPacienteLogado).filter(estaAtiva).map(chaveDoHorario);
}

// Cria uma solicitação pendente para o horário escolhido
// O horário só muda para Reservado quando o secretário confirmar (sub-issue #8, depende do banco)
export async function solicitarAgendamento(horario) {
  const chave = chaveDoHorario(horario);

  const horarioAtual = horarios.find((h) => chaveDoHorario(h) === chave);
  if (
    !horarioAtual ||
    horarioAtual.Status !== STATUS_HORARIO.LIBERADO ||
    inicioDoHorario(horarioAtual) <= new Date()
  ) {
    throw new Error('Este horário não está mais disponível. Escolha outro.');
  }

  const jaSolicitado = solicitacoes
    .filter(doPacienteLogado)
    .filter(estaAtiva)
    .some((solicitacao) => chaveDoHorario(solicitacao) === chave);
  if (jaSolicitado) {
    throw new Error('Você já solicitou este horário.');
  }

  const nova = {
    Código: proximoCodigo++,
    Paciente: { Código: PACIENTE_LOGADO.Código },
    Médico: { Código: horario.Médico.Código },
    Data: horario.Data,
    HoraInicio: horario.HoraInicio,
    DataSolicitacao: new Date().toISOString(),
    Status: STATUS_SOLICITACAO.PENDENTE,
    Justificativa: '',
  };
  solicitacoes = [...solicitacoes, nova];
  return nova;
}