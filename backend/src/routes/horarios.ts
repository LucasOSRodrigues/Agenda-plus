// Rotas de consulta de horários e das opções dos filtros
import { Router } from 'express';
import { ErroHttp } from '../erros.js';
import {
  buscarHorariosDisponiveis,
  cadastrarHorario,
  listarClinicas,
  listarEspecialidades,
  listarHorariosGerenciamento,
} from '../services/horarios.js';
import type { DadosCadastroHorario } from '@shared/agenda';

const router = Router();

const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;
const FORMATO_HORA = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

// Parâmetro de query como texto; repetido ou ausente conta como "não filtra"
function textoDaQuery(valor: unknown): string | undefined {
  return typeof valor === 'string' && valor !== '' ? valor : undefined;
}

// Confere os dados necessários para cadastrar um horário
function lerDadosCadastro(corpo: unknown): DadosCadastroHorario {
  const { Médico, Clinica, Data, HoraInicio, HoraFim } = (corpo ?? {}) as Record<
    string,
    unknown
  >;
  const codigoMedico = (Médico as { Código?: unknown } | undefined)?.Código;
  const cnpjClinica = (Clinica as { CNPJ?: unknown } | undefined)?.CNPJ;

  if (
    !Number.isInteger(codigoMedico) ||
    typeof cnpjClinica !== 'string' ||
    cnpjClinica === '' ||
    typeof Data !== 'string' ||
    !FORMATO_DATA.test(Data) ||
    typeof HoraInicio !== 'string' ||
    !FORMATO_HORA.test(HoraInicio) ||
    typeof HoraFim !== 'string' ||
    !FORMATO_HORA.test(HoraFim)
  ) {
    throw new ErroHttp(
      400,
      'Informe Médico.Código (número), Clinica.CNPJ, Data (AAAA-MM-DD), HoraInicio e HoraFim (HH:MM).',
    );
  }

  return {
    Médico: { Código: codigoMedico as number },
    Clinica: { CNPJ: cnpjClinica },
    Data,
    HoraInicio,
    HoraFim,
  };
}

// GET /gerenciamento/horarios: todos os horários para o gerenciamento da secretária
router.get('/gerenciamento/horarios', async (_req, res) => {
  res.json(await listarHorariosGerenciamento());
});

// POST /gerenciamento/horarios: cadastra um horário inicialmente bloqueado
router.post('/gerenciamento/horarios', async (req, res) => {
  const novo = await cadastrarHorario(lerDadosCadastro(req.body));
  res.status(201).json(novo);
});

// GET /horarios?CNPJ=...&Especialidade=...&Data=AAAA-MM-DD
// Horários disponíveis, com Médico e Clinica completos. Todos os filtros são opcionais
router.get('/horarios', async (req, res) => {
  const horarios = await buscarHorariosDisponiveis({
    CNPJ: textoDaQuery(req.query.CNPJ),
    Especialidade: textoDaQuery(req.query.Especialidade),
    Data: textoDaQuery(req.query.Data),
  });
  res.json(horarios);
});

// GET /clinicas: opções do filtro de clínica
router.get('/clinicas', async (_req, res) => {
  res.json(await listarClinicas());
});

// GET /especialidades: opções do filtro de especialidade
router.get('/especialidades', async (_req, res) => {
  res.json(await listarEspecialidades());
});

export default router;
