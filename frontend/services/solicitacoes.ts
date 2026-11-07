// Serviço de solicitações de agendamento usado pelas telas /horarios e /solicitacoes.
// Por enquanto as funções utilizam os dados fictícios de mocks/banco.ts
// As solicitações ficam só em memória: recarregar a página (F5) volta ao estado inicial.
// Quando o banco existir, basta trocar o corpo destas funções e manter as assinaturas.

import {
  clinicas,
  horarios,
  medicos,
  solicitacoes as solicitacoesIniciais,
  PACIENTE_LOGADO,
  STATUS_HORARIO,
  STATUS_SOLICITACAO,
} from '../mocks/banco';
import type {
  ChaveHorario,
  Horario,
  Medico,
  Solicitacao,
  SolicitacaoDetalhada,
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

// Lista as solicitações do paciente, da consulta mais próxima para a mais distante
// Cada uma volta com Médico, Clinica e HoraFim, para a tela mostrar os detalhes
export async function listarSolicitacoesDoPaciente(): Promise<SolicitacaoDetalhada[]> {
  return solicitacoes
    .filter(doPacienteLogado)
    .map((solicitacao): SolicitacaoDetalhada => {
      const horario = horarios.find(
        (h) => chaveDoHorario(h) === chaveDoHorario(solicitacao),
      );
      return {
        ...solicitacao,
        HoraFim: horario?.HoraFim ?? '',
        // Toda solicitação do mock aponta para um médico existente
        Médico: medicos.find((medico) => medico.Código === solicitacao.Médico.Código) as Medico,
        Clinica: clinicas.find((clinica) => clinica.CNPJ === horario?.Clinica.CNPJ),
      };
    })
    .sort(
      (a, b) =>
        a.Data.localeCompare(b.Data) ||
        a.HoraInicio.localeCompare(b.HoraInicio) ||
        a.Código - b.Código,
    );
}

// Chaves dos horários que o paciente já solicitou (pendentes ou confirmadas)
// A tela de horários usa isso para trocar o botão "Solicitar" por "Solicitado"
export async function listarChavesSolicitadas(): Promise<string[]> {
  return solicitacoes.filter(doPacienteLogado).filter(estaAtiva).map(chaveDoHorario);
}

// Cria uma solicitação pendente para o horário escolhido
// O horário só muda para Reservado quando o secretário confirmar (sub-issue #8, depende do banco)
export async function solicitarAgendamento(horario: ChaveHorario): Promise<Solicitacao> {
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
    throw new Error('Solicitação não encontrada.');
  }
  if (solicitacao.Status !== STATUS_SOLICITACAO.PENDENTE) {
    throw new Error('Só é possível cancelar solicitações pendentes.');
  }
  solicitacoes = solicitacoes.filter((s) => s.Código !== codigo);
}
