// Serviço de cadastro da equipe (médicos e secretários) usado pela tela /administracao/equipe (H14)
// Os dados vão para a API do backend (caminhos em services/rotas.ts)
// Em caso de erro, a API responde { erro: "mensagem" }, que é mostrada na tela

import type { DadosCadastroEquipe, MembroEquipe } from '@shared/agenda';
import { ROTAS } from './rotas';

// Cadastra o médico ou secretário. A resposta não traz a senha
export async function cadastrarMembroEquipe(dados: DadosCadastroEquipe): Promise<MembroEquipe> {
  const resposta = await fetch(ROTAS.equipe, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  if (!resposta.ok) throw new Error((await resposta.json()).erro);
  return resposta.json();
}
