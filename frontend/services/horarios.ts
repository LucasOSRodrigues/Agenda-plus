// Serviço de consulta de horários usado pela tela /horarios
// Os dados vêm da API do backend (caminhos em services/rotas.ts)

import type {
  AlteracaoStatusHorario,
  Clinica,
  DadosCadastroHorario,
  FiltrosHorarios,
  HorarioDetalhado,
  Medico,
} from '@shared/agenda';
import { ROTAS } from './rotas';

// Todos os horários usados pela tela de gerenciamento da secretária
export async function listarHorariosGerenciamento(): Promise<HorarioDetalhado[]> {
  const resposta = await fetch(ROTAS.horariosGerenciamento);
  if (!resposta.ok) throw new Error((await resposta.json()).erro);
  return resposta.json();
}

// Libera ou bloqueia um horário existente
export async function alterarStatusHorario(
  alteracao: AlteracaoStatusHorario,
): Promise<HorarioDetalhado> {
  const resposta = await fetch(ROTAS.statusHorarioGerenciamento, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(alteracao),
  });
  if (!resposta.ok) throw new Error((await resposta.json()).erro);
  return resposta.json();
}

// Cadastra um horário inicialmente bloqueado
export async function cadastrarHorario(
  dados: DadosCadastroHorario,
): Promise<HorarioDetalhado> {
  const resposta = await fetch(ROTAS.horariosGerenciamento, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  if (!resposta.ok) throw new Error((await resposta.json()).erro);
  return resposta.json();
}

// Horários que o paciente pode escolher, já ordenados e com Médico e Clinica completos
// Filtros vazios não são enviados (vazio = não filtra)
export async function buscarHorariosDisponiveis(
  filtros: FiltrosHorarios = {},
): Promise<HorarioDetalhado[]> {
  const query = new URLSearchParams();
  for (const [nome, valor] of Object.entries(filtros)) {
    if (valor) query.set(nome, valor);
  }

  const resposta = await fetch(`${ROTAS.horarios}?${query}`);
  if (!resposta.ok) throw new Error((await resposta.json()).erro);
  return resposta.json();
}

// Opções do filtro de clínica
export async function listarClinicas(): Promise<Clinica[]> {
  const resposta = await fetch(ROTAS.clinicas);
  if (!resposta.ok) throw new Error((await resposta.json()).erro);
  return resposta.json();
}

// Opções do campo de médico no cadastro de horários
export async function listarMedicos(): Promise<Medico[]> {
  const resposta = await fetch(ROTAS.medicos);
  if (!resposta.ok) throw new Error((await resposta.json()).erro);
  return resposta.json();
}

// Opções do filtro de especialidade, sem repetição
export async function listarEspecialidades(): Promise<string[]> {
  const resposta = await fetch(ROTAS.especialidades);
  if (!resposta.ok) throw new Error((await resposta.json()).erro);
  return resposta.json();
}
