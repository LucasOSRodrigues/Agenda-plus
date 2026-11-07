// Serviço de consulta de horários usado pela tela /horarios
// Os dados vêm da API do backend (caminhos em services/rotas.ts)

import type { Clinica, FiltrosHorarios, HorarioDetalhado } from '@shared/agenda';
import { ROTAS } from './rotas';

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

// Opções do filtro de especialidade, sem repetição
export async function listarEspecialidades(): Promise<string[]> {
  const resposta = await fetch(ROTAS.especialidades);
  if (!resposta.ok) throw new Error((await resposta.json()).erro);
  return resposta.json();
}
