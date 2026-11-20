// Rotas das solicitações de agendamento: as do paciente logado e as do gerenciamento da secretária
import { Router } from 'express';
import { ErroHttp } from '../erros.js';
import {
  cancelarSolicitacao,
  confirmarOuRecusarSolicitacao,
  listarChavesSolicitadas,
  listarSolicitacoesDoPaciente,
  listarSolicitacoesGerenciamento,
  solicitarAgendamento,
} from '../services/solicitacoes.js';
import { texto } from '../validacoes.js';
import type { ChaveHorario, DecisaoSolicitacao, StatusSolicitacao } from '@shared/agenda';

const router = Router();

const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;
const FORMATO_HORA = /^\d{2}:\d{2}$/;

// Confere se o corpo da requisição identifica um horário (Médico + Data + HoraInicio)
function lerChaveHorario(corpo: unknown): ChaveHorario {
  const { Médico, Data, HoraInicio } = (corpo ?? {}) as Record<string, unknown>;
  const codigoMedico = (Médico as { Código?: unknown } | undefined)?.Código;

  if (
    !Number.isInteger(codigoMedico) ||
    typeof Data !== 'string' ||
    !FORMATO_DATA.test(Data) ||
    typeof HoraInicio !== 'string' ||
    !FORMATO_HORA.test(HoraInicio)
  ) {
    throw new ErroHttp(
      400,
      'Informe o horário: Médico.Código (número), Data (AAAA-MM-DD) e HoraInicio (HH:MM).',
    );
  }

  return { Médico: { Código: codigoMedico as number }, Data, HoraInicio };
}

const STATUS_VALIDOS: StatusSolicitacao[] = ['Pendente', 'Confirmada', 'Recusada'];

// Código da solicitação que vem na URL (/:codigo)
function lerCodigo(valor: string): number {
  const codigo = Number(valor);
  if (!Number.isInteger(codigo)) {
    throw new ErroHttp(400, 'Código da solicitação inválido.');
  }
  return codigo;
}

// Confere a decisão da secretária: confirmar, ou recusar com justificativa
function lerDecisao(corpo: unknown): DecisaoSolicitacao {
  const { Status, Justificativa } = (corpo ?? {}) as Record<string, unknown>;

  if (Status === 'Confirmada') {
    return { Status };
  }
  if (Status === 'Recusada') {
    const justificativa = texto(Justificativa);
    if (justificativa === '') {
      throw new ErroHttp(400, 'Informe a justificativa da recusa.');
    }
    return { Status, Justificativa: justificativa };
  }
  throw new ErroHttp(400, 'Informe o Status (Confirmada ou Recusada).');
}

// GET /solicitacoes: solicitações do paciente, com Médico, Clinica e HoraFim
router.get('/solicitacoes', async (_req, res) => {
  res.json(await listarSolicitacoesDoPaciente());
});

// GET /solicitacoes/chaves: chaves ("Médico-Data-HoraInicio") dos horários já solicitados
router.get('/solicitacoes/chaves', async (_req, res) => {
  res.json(await listarChavesSolicitadas());
});

// POST /solicitacoes: cria uma solicitação pendente
// Corpo: { "Médico": { "Código": 1 }, "Data": "AAAA-MM-DD", "HoraInicio": "HH:MM" }
router.post('/solicitacoes', async (req, res) => {
  const nova = await solicitarAgendamento(lerChaveHorario(req.body));
  res.status(201).json(nova);
});

// DELETE /solicitacoes/:codigo: cancela uma solicitação pendente
router.delete('/solicitacoes/:codigo', async (req, res) => {
  await cancelarSolicitacao(lerCodigo(req.params.codigo));
  res.status(204).end();
});

// GET /gerenciamento/solicitacoes?Status=Pendente
// Solicitações de todos os pacientes para a secretária. Sem Status, devolve todas
router.get('/gerenciamento/solicitacoes', async (req, res) => {
  const { Status } = req.query;
  if (Status === undefined || Status === '') {
    res.json(await listarSolicitacoesGerenciamento());
    return;
  }
  if (!STATUS_VALIDOS.includes(Status as StatusSolicitacao)) {
    throw new ErroHttp(400, 'Status inválido. Use Pendente, Confirmada ou Recusada.');
  }
  res.json(await listarSolicitacoesGerenciamento(Status as StatusSolicitacao));
});

// PATCH /gerenciamento/solicitacoes/:codigo: a secretária confirma ou recusa uma solicitação pendente
// Corpo: { "Status": "Confirmada" } ou { "Status": "Recusada", "Justificativa": "..." }
router.patch('/gerenciamento/solicitacoes/:codigo', async (req, res) => {
  const codigo = lerCodigo(req.params.codigo);
  res.json(await confirmarOuRecusarSolicitacao(codigo, lerDecisao(req.body)));
});

export default router;
