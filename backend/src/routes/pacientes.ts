// Rota de cadastro de pacientes (H02)
import { Router } from 'express';
import { ErroHttp } from '../erros.js';
import { cadastrarPaciente } from '../services/pacientes.js';
import {
  cpfValido,
  FORMATO_EMAIL,
  soNumeros,
  TAMANHO_MINIMO_SENHA,
  texto,
} from '../validacoes.js';
import type { DadosCadastroPaciente } from '@shared/agenda';

const router = Router();

const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;

// Data real (ex.: 2000-02-30 não vale) e que não está no futuro
function dataNascimentoValida(data: string): boolean {
  if (!FORMATO_DATA.test(data)) return false;
  const d = new Date(`${data}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === data && d <= new Date();
}

// Confere os dados do cadastro e já devolve CPF e telefone só com números
function lerDadosCadastro(corpo: unknown): DadosCadastroPaciente {
  const bruto = (corpo ?? {}) as Record<string, unknown>;
  const Nome = texto(bruto.Nome);
  const CPF = soNumeros(texto(bruto.CPF));
  const email = texto(bruto['E-mail']);
  const Telefone = soNumeros(texto(bruto.Telefone));
  const DataNascimento = texto(bruto.DataNascimento);
  // A senha não leva trim: espaços fazem parte dela
  const Senha = typeof bruto.Senha === 'string' ? bruto.Senha : '';

  if (!Nome || !CPF || !email || !Telefone || !DataNascimento || !Senha) {
    throw new ErroHttp(400, 'Preencha todos os campos obrigatórios.');
  }
  if (!cpfValido(CPF)) throw new ErroHttp(400, 'CPF inválido.');
  if (!FORMATO_EMAIL.test(email)) throw new ErroHttp(400, 'E-mail inválido.');
  if (Telefone.length < 10 || Telefone.length > 11) {
    throw new ErroHttp(400, 'Telefone inválido. Informe o DDD e o número.');
  }
  if (!dataNascimentoValida(DataNascimento)) {
    throw new ErroHttp(400, 'Data de nascimento inválida.');
  }
  if (Senha.length < TAMANHO_MINIMO_SENHA) {
    throw new ErroHttp(400, `A senha deve ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`);
  }

  return { Nome, CPF, 'E-mail': email, Telefone, DataNascimento, Senha };
}

// POST /pacientes: cadastra um paciente
// Corpo: { "Nome", "CPF", "E-mail", "Telefone", "DataNascimento": "AAAA-MM-DD", "Senha" }
router.post('/pacientes', async (req, res) => {
  const paciente = await cadastrarPaciente(lerDadosCadastro(req.body));
  res.status(201).json(paciente);
});

export default router;