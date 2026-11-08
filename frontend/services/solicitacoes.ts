// Serviço de solicitações de agendamento usado pelas telas /horarios e /solicitacoes
// Os dados vêm da API do backend (caminhos em services/rotas.ts)
// Em caso de erro, a API responde { erro: "mensagem" }, que é mostrada na tela

import type { ChaveHorario, Solicitacao, SolicitacaoDetalhada } from '@shared/agenda';
import { ROTAS } from './rotas';

// Solicitações do paciente, da consulta mais próxima para a mais distante
// Cada uma volta com Médico, Clinica e HoraFim, para a tela mostrar os detalhes
export async function listarSolicitacoesDoPaciente(): Promise<SolicitacaoDetalhada[]> {
  const resposta = await fetch(ROTAS.solicitacoes);
  if (!resposta.ok) throw new Error((await resposta.json()).erro);
  return resposta.json();
}

// Chaves ("Médico-Data-HoraInicio") dos horários que o paciente já solicitou
// A tela de horários usa isso para trocar o botão "Solicitar" por "Solicitado"
export async function listarChavesSolicitadas(): Promise<string[]> {
  const resposta = await fetch(ROTAS.chavesSolicitadas);
  if (!resposta.ok) throw new Error((await resposta.json()).erro);
  return resposta.json();
}

// Cria uma solicitação pendente para o horário escolhido
// Envia só a chave do horário (Médico + Data + HoraInicio), que é o que a API precisa
export async function solicitarAgendamento(horario: ChaveHorario): Promise<Solicitacao> {
  const resposta = await fetch(ROTAS.solicitacoes, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Médico: { Código: horario.Médico.Código },
      Data: horario.Data,
      HoraInicio: horario.HoraInicio,
    }),
  });
  if (!resposta.ok) throw new Error((await resposta.json()).erro);
  return resposta.json();
}

// Cancela uma solicitação que ainda está pendente
export async function cancelarSolicitacao(codigo: number): Promise<void> {
  const resposta = await fetch(ROTAS.solicitacao(codigo), { method: 'DELETE' });
  if (!resposta.ok) throw new Error((await resposta.json()).erro);
}
