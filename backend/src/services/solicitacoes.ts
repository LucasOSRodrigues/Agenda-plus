// Serviço de solicitações de agendamento, usado pelas rotas de routes/solicitacoes.ts
// Por enquanto as funções utilizam os dados fictícios de mocks/banco.ts
// As solicitações ficam só em memória: reiniciar o servidor volta ao estado inicial.
// Quando o banco existir, basta trocar o corpo destas funções e manter as assinaturas.

import {
  clinicas,
  horarios,
  medicos,
  pacientes,
  solicitacoes as solicitacoesIniciais,
  PACIENTE_LOGADO,
  STATUS_HORARIO,
  STATUS_SOLICITACAO,
} from '../mocks/banco.js';
import { ErroHttp } from '../erros.js';
import type {
  ChaveHorario,
  DecisaoSolicitacao,
  Horario,
  Medico,
  Solicitacao,
  SolicitacaoDetalhada,
  SolicitacaoGerenciamento,
  StatusSolicitacao,
} from '@shared/agenda';

// Cópia do mock, para poder criar solicitações sem alterar o arquivo original
let solicitacoes: Solicitacao[] = solicitacoesIniciais.map((solicitacao) => ({ ...solicitacao }));
let proximoCodigo = Math.max(0, ...solicitacoes.map((s) => s.Código)) + 1;

// Mesmo formato de chave usado na tela de horários: Médico + Data + HoraInicio
function chaveDoHorario(horario: ChaveHorario): string {
  return `${horario.Médico.Código}-${horario.Data}-${horario.HoraInicio}`;
}

function inicioDoHorario(horario: Pick<Horario, 'Data' | 'HoraInicio'>): Date {
  return new Date(`${horario.Data}T${horario.HoraInicio}`);
}

// Solicitação que ainda ocupa o horário: pendente ou confirmada
// (recusada libera o horário para uma nova solicitação)
function estaAtiva(solicitacao: Solicitacao): boolean {
  return solicitacao.Status !== STATUS_SOLICITACAO.RECUSADA;
}

function doPacienteLogado(solicitacao: Solicitacao): boolean {
  return solicitacao.Paciente.Código === PACIENTE_LOGADO.Código;
}

function horarioDaSolicitacao(solicitacao: Solicitacao): Horario | undefined {
  return horarios.find((h) => chaveDoHorario(h) === chaveDoHorario(solicitacao));
}

// Acrescenta Médico, Clinica e HoraFim, para a tela mostrar os detalhes
function detalharSolicitacao(solicitacao: Solicitacao): SolicitacaoDetalhada {
  const horario = horarioDaSolicitacao(solicitacao);
  return {
    ...solicitacao,
    HoraFim: horario?.HoraFim ?? '',
    // Toda solicitação do mock aponta para um médico existente
    Médico: medicos.find((medico) => medico.Código === solicitacao.Médico.Código) as Medico,
    Clinica: clinicas.find((clinica) => clinica.CNPJ === horario?.Clinica.CNPJ),
  };
}

// Além dos detalhes do horário, traz o nome do paciente para a secretária
function detalharParaGerenciamento(solicitacao: Solicitacao): SolicitacaoGerenciamento {
  const paciente = pacientes.find((p) => p.Código === solicitacao.Paciente.Código);
  return {
    ...detalharSolicitacao(solicitacao),
    Paciente: {
      Código: solicitacao.Paciente.Código,
      Nome: paciente?.Nome ?? `Paciente ${solicitacao.Paciente.Código}`,
    },
  };
}

// Da consulta mais próxima para a mais distante
function compararPorConsulta(a: Solicitacao, b: Solicitacao): number {
  return (
    a.Data.localeCompare(b.Data) ||
    a.HoraInicio.localeCompare(b.HoraInicio) ||
    a.Código - b.Código
  );
}

// Lista as solicitações do paciente, da consulta mais próxima para a mais distante
// Cada uma volta com Médico, Clinica e HoraFim, para a tela mostrar os detalhes
export async function listarSolicitacoesDoPaciente(): Promise<SolicitacaoDetalhada[]> {
  return solicitacoes
    .filter(doPacienteLogado)
    .sort(compararPorConsulta)
    .map(detalharSolicitacao);
}

// Chaves dos horários que o paciente já solicitou (pendentes ou confirmadas)
// A tela de horários usa isso para trocar o botão "Solicitar" por "Solicitado"
export async function listarChavesSolicitadas(): Promise<string[]> {
  return solicitacoes.filter(doPacienteLogado).filter(estaAtiva).map(chaveDoHorario);
}

// Cria uma solicitação pendente para o horário escolhido
// O horário só muda para Reservado quando a secretária confirmar (confirmarOuRecusarSolicitacao)
export async function solicitarAgendamento(horario: ChaveHorario): Promise<Solicitacao> {
  const chave = chaveDoHorario(horario);

  const horarioAtual = horarios.find((h) => chaveDoHorario(h) === chave);
  if (
    !horarioAtual ||
    horarioAtual.Status !== STATUS_HORARIO.LIBERADO ||
    inicioDoHorario(horarioAtual) <= new Date()
  ) {
    throw new ErroHttp(409, 'Este horário não está mais disponível. Escolha outro.');
  }

  const jaSolicitado = solicitacoes
    .filter(doPacienteLogado)
    .filter(estaAtiva)
    .some((solicitacao) => chaveDoHorario(solicitacao) === chave);
  if (jaSolicitado) {
    throw new ErroHttp(409, 'Você já solicitou este horário.');
  }

  const nova: Solicitacao = {
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

// Cancela (remove) uma solicitação que ainda está pendente
export async function cancelarSolicitacao(codigo: number): Promise<void> {
  const solicitacao = solicitacoes.find((s) => s.Código === codigo && doPacienteLogado(s));
  if (!solicitacao) {
    throw new ErroHttp(404, 'Solicitação não encontrada.');
  }
  if (solicitacao.Status !== STATUS_SOLICITACAO.PENDENTE) {
    throw new ErroHttp(409, 'Só é possível cancelar solicitações pendentes.');
  }
  solicitacoes = solicitacoes.filter((s) => s.Código !== codigo);
}

// ---------------------------------------------------------------------------
// Gerenciamento das solicitações pela secretária (H08)
// Provisório: ainda não há login, então qualquer pessoa consegue chamar estas funções
// ---------------------------------------------------------------------------

// Justificativa usada quando outra solicitação do mesmo horário é confirmada
export const JUSTIFICATIVA_HORARIO_PREENCHIDO =
  'Este horário foi preenchido por outro paciente. Escolha outro horário.';

// Lista as solicitações de todos os pacientes, da consulta mais próxima para a mais distante
// Status filtra pela situação da solicitação (sem Status = todas)
export async function listarSolicitacoesGerenciamento(
  status?: StatusSolicitacao,
): Promise<SolicitacaoGerenciamento[]> {
  return solicitacoes
    .filter((solicitacao) => !status || solicitacao.Status === status)
    .sort(compararPorConsulta)
    .map(detalharParaGerenciamento);
}

// Confirma ou recusa uma solicitação pendente
// Confirmar reserva o horário e recusa as outras solicitações pendentes dele,
// já que um horário só atende um paciente
export async function confirmarOuRecusarSolicitacao(
  codigo: number,
  decisao: DecisaoSolicitacao,
): Promise<SolicitacaoGerenciamento> {
  const solicitacao = solicitacoes.find((s) => s.Código === codigo);
  if (!solicitacao) {
    throw new ErroHttp(404, 'Solicitação não encontrada.');
  }
  if (solicitacao.Status !== STATUS_SOLICITACAO.PENDENTE) {
    throw new ErroHttp(409, 'Esta solicitação já foi confirmada ou recusada.');
  }

  if (decisao.Status === STATUS_SOLICITACAO.RECUSADA) {
    const justificativa = decisao.Justificativa.trim();
    if (justificativa === '') {
      throw new ErroHttp(400, 'Informe a justificativa da recusa.');
    }
    const recusada: Solicitacao = {
      ...solicitacao,
      Status: STATUS_SOLICITACAO.RECUSADA,
      Justificativa: justificativa,
    };
    solicitacoes = solicitacoes.map((s) => (s.Código === codigo ? recusada : s));
    return detalharParaGerenciamento(recusada);
  }

  const horario = horarioDaSolicitacao(solicitacao);
  if (!horario) {
    throw new ErroHttp(404, 'O horário desta solicitação não existe mais.');
  }
  if (inicioDoHorario(horario) <= new Date()) {
    throw new ErroHttp(409, 'Este horário já passou. Recuse a solicitação.');
  }
  if (horario.Status !== STATUS_HORARIO.LIBERADO) {
    throw new ErroHttp(
      409,
      horario.Status === STATUS_HORARIO.RESERVADO
        ? 'Este horário já está reservado para outro paciente.'
        : 'Este horário está bloqueado. Libere-o antes de confirmar.',
    );
  }

  // O horário passa a ser do paciente e deixa de aparecer na busca
  horario.Status = STATUS_HORARIO.RESERVADO;

  const chave = chaveDoHorario(solicitacao);
  solicitacoes = solicitacoes.map((s): Solicitacao => {
    if (s.Código === codigo) {
      return { ...s, Status: STATUS_SOLICITACAO.CONFIRMADA, Justificativa: '' };
    }
    if (s.Status === STATUS_SOLICITACAO.PENDENTE && chaveDoHorario(s) === chave) {
      return {
        ...s,
        Status: STATUS_SOLICITACAO.RECUSADA,
        Justificativa: JUSTIFICATIVA_HORARIO_PREENCHIDO,
      };
    }
    return s;
  });

  return detalharParaGerenciamento(solicitacoes.find((s) => s.Código === codigo) as Solicitacao);
}
