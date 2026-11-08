// Serviço de cadastro de pacientes (H02), usado pelas rotas de routes/pacientes.ts
// Os pacientes ficam só em memória: reiniciar o servidor apaga os cadastros.
// Quando o banco existir, basta trocar o corpo desta função e manter a assinatura.

import { randomBytes, scryptSync } from 'node:crypto';
import { PACIENTE_LOGADO } from '../mocks/banco.js';
import { ErroHttp } from '../erros.js';
import type { DadosCadastroPaciente, Paciente } from '@shared/agenda';

// A senha nunca é guardada em texto puro: só o hash (formato "sal:hash")
type PacienteArmazenado = Paciente & { SenhaHash: string };

let pacientes: PacienteArmazenado[] = [];
// O 100 já é usado pelo paciente fictício dos mocks, então os novos começam depois dele
let proximoCodigo = PACIENTE_LOGADO.Código + 1;

function gerarHashSenha(senha: string): string {
  const sal = randomBytes(16).toString('hex');
  return `${sal}:${scryptSync(senha, sal, 64).toString('hex')}`;
}

// Cadastra o paciente, recusando CPF ou e-mail que já existem
export async function cadastrarPaciente(dados: DadosCadastroPaciente): Promise<Paciente> {
  if (pacientes.some((p) => p.CPF === dados.CPF)) {
    throw new ErroHttp(409, 'Já existe um cadastro com este CPF.');
  }
  // E-mail não diferencia maiúsculas de minúsculas
  const email = dados['E-mail'].toLowerCase();
  if (pacientes.some((p) => p['E-mail'].toLowerCase() === email)) {
    throw new ErroHttp(409, 'Já existe um cadastro com este e-mail.');
  }

  const { Senha, ...dadosPessoais } = dados;
  const novo: PacienteArmazenado = {
    Código: proximoCodigo++,
    ...dadosPessoais,
    SenhaHash: gerarHashSenha(Senha),
  };
  pacientes = [...pacientes, novo];

  // Devolve sem o hash da senha
  const { SenhaHash: _senhaHash, ...paciente } = novo;
  return paciente;
}