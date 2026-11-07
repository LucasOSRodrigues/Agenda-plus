// Rotas das solicitações de agendamento do paciente logado
import { Router } from 'express';
import { ErroHttp } from '../erros.js';
import {
  cancelarSolicitacao,
  listarChavesSolicitadas,
  listarSolicitacoesDoPaciente,
  solicitarAgendamento,
} from '../services/solicitacoes.js';
import type { ChaveHorario } from '@shared/agenda';

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
  const codigo = Number(req.params.codigo);
  if (!Number.isInteger(codigo)) {
    throw new ErroHttp(400, 'Código da solicitação inválido.');
  }
  await cancelarSolicitacao(codigo);
  res.status(204).end();
});

export default router;
