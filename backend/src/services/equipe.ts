// Serviço de cadastro da equipe da clínica: médicos e secretários (H14)
// Os membros ficam só em memória: reiniciar o servidor apaga os cadastros.
// Quando o banco existir, basta trocar o corpo desta função e manter a assinatura.

import { medicos } from '../mocks/banco.js';
import { ErroHttp } from '../erros.js';
import { gerarHashSenha } from '../senhas.js';
import { existePacienteComCpf, existePacienteComEmail } from './pacientes.js';
import type { DadosCadastroEquipe, MembroEquipe } from '@shared/agenda';

// A senha nunca é guardada em texto puro: só o hash (formato "sal:hash")
// O login (H01) vai usar o CPF, o hash e o Papel guardados aqui
type MembroArmazenado = MembroEquipe & { SenhaHash: string };

let equipe: MembroArmazenado[] = [];
// Os médicos fictícios dos mocks já usam os primeiros códigos, então os novos começam depois
// (os pacientes usam códigos a partir de 100, então não se misturam)
let proximoCodigo = Math.max(0, ...medicos.map((medico) => medico.Código)) + 1;

// Cadastra o membro da equipe, recusando CPF ou e-mail que já existem (inclusive de pacientes)
// Médico também entra na lista de médicos, para a secretária poder criar horários para ele
export async function cadastrarMembroEquipe(dados: DadosCadastroEquipe): Promise<MembroEquipe> {
  if (equipe.some((m) => m.CPF === dados.CPF) || existePacienteComCpf(dados.CPF)) {
    throw new ErroHttp(409, 'Já existe um cadastro com este CPF.');
  }
  // E-mail não diferencia maiúsculas de minúsculas
  const email = dados['E-mail'].toLowerCase();
  if (equipe.some((m) => m['E-mail'].toLowerCase() === email) || existePacienteComEmail(email)) {
    throw new ErroHttp(409, 'Já existe um cadastro com este e-mail.');
  }
  if (
    dados.Papel === 'Médico' &&
    medicos.some((m) => m.CRM === dados.CRM && m.UFCRM === dados.UFCRM)
  ) {
    throw new ErroHttp(409, 'Já existe um médico cadastrado com este CRM.');
  }

  const Código = proximoCodigo++;
  const membro: MembroEquipe = {
    Código,
    Nome: dados.Nome,
    CPF: dados.CPF,
    'E-mail': dados['E-mail'],
    Telefone: dados.Telefone,
    Papel: dados.Papel,
  };
  equipe = [...equipe, { ...membro, SenhaHash: gerarHashSenha(dados.Senha) }];

  if (dados.Papel === 'Médico') {
    medicos.push({
      Código,
      Nome: dados.Nome,
      CRM: dados.CRM,
      UFCRM: dados.UFCRM,
      Especialidade: dados.Especialidade,
    });
  }

  // Devolve sem o hash da senha
  return membro;
}
