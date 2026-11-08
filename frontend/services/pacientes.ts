// Serviço de cadastro de pacientes usado pela tela /cadastro (H02)
// Os dados vão para a API do backend (caminhos em services/rotas.ts)
// Em caso de erro, a API responde { erro: "mensagem" }, que é mostrada na tela

import type { DadosCadastroPaciente, Paciente } from '@shared/agenda';
import { ROTAS } from './rotas';

// Cadastra o paciente. A resposta não traz a senha
export async function cadastrarPaciente(dados: DadosCadastroPaciente): Promise<Paciente> {
  const resposta = await fetch(ROTAS.pacientes, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  if (!resposta.ok) throw new Error((await resposta.json()).erro);
  return resposta.json();
}