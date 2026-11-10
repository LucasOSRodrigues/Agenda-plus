// Rota de cadastro da equipe da clínica: médicos e secretários (H14)
//
// Provisório: ainda não há login, então qualquer pessoa que saiba o endereço consegue
// cadastrar. Quando a autenticação existir, esta rota deve aceitar só o administrador (RNF03).
import { Router } from 'express';
import { ErroHttp } from '../erros.js';
import { cadastrarMembroEquipe } from '../services/equipe.js';
import {
  cpfValido,
  FORMATO_EMAIL,
  soNumeros,
  TAMANHO_MINIMO_SENHA,
  texto,
} from '../validacoes.js';
import type { DadosCadastroEquipe, PapelEquipe } from '@shared/agenda';

const router = Router();

const PAPEIS: PapelEquipe[] = ['Médico', 'Secretário'];
const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

// Papel do novo usuário: só médico ou secretário (administrador e paciente não passam por aqui)
function lerPapel(valor: unknown): PapelEquipe {
  const papel = PAPEIS.find((item) => item === valor);
  if (!papel) throw new ErroHttp(400, 'Papel inválido. Informe Médico ou Secretário.');
  return papel;
}

// Confere os dados do cadastro e já devolve CPF, telefone e CRM só com números
function lerDadosCadastro(corpo: unknown): DadosCadastroEquipe {
  const bruto = (corpo ?? {}) as Record<string, unknown>;
  const Papel = lerPapel(bruto.Papel);
  const Nome = texto(bruto.Nome);
  const CPF = soNumeros(texto(bruto.CPF));
  const email = texto(bruto['E-mail']);
  const Telefone = soNumeros(texto(bruto.Telefone));
  // A senha não leva trim: espaços fazem parte dela
  const Senha = typeof bruto.Senha === 'string' ? bruto.Senha : '';

  if (!Nome || !CPF || !email || !Telefone || !Senha) {
    throw new ErroHttp(400, 'Preencha todos os campos obrigatórios.');
  }
  if (!cpfValido(CPF)) throw new ErroHttp(400, 'CPF inválido.');
  if (!FORMATO_EMAIL.test(email)) throw new ErroHttp(400, 'E-mail inválido.');
  if (Telefone.length < 10 || Telefone.length > 11) {
    throw new ErroHttp(400, 'Telefone inválido. Informe o DDD e o número.');
  }
  if (Senha.length < TAMANHO_MINIMO_SENHA) {
    throw new ErroHttp(400, `A senha deve ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`);
  }

  const base = { Nome, CPF, 'E-mail': email, Telefone, Senha };
  if (Papel === 'Secretário') return { ...base, Papel };

  // Só o médico tem CRM, UF do CRM e especialidade
  const CRM = soNumeros(texto(bruto.CRM));
  const UFCRM = texto(bruto.UFCRM).toUpperCase();
  const Especialidade = texto(bruto.Especialidade);
  if (!CRM || !UFCRM || !Especialidade) {
    throw new ErroHttp(400, 'Para médicos, informe o CRM, a UF do CRM e a especialidade.');
  }
  if (!UFS.includes(UFCRM)) throw new ErroHttp(400, 'UF do CRM inválida.');

  return { ...base, Papel, CRM, UFCRM, Especialidade };
}

// POST /equipe: cadastra um médico ou secretário
// Corpo: { "Papel": "Médico" | "Secretário", "Nome", "CPF", "E-mail", "Telefone", "Senha" }
// Para médico, também: "CRM", "UFCRM" e "Especialidade"
router.post('/equipe', async (req, res) => {
  const membro = await cadastrarMembroEquipe(lerDadosCadastro(req.body));
  res.status(201).json(membro);
});

export default router;
