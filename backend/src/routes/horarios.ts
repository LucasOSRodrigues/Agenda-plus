// Rotas de consulta de horários e das opções dos filtros
import { Router } from 'express';
import {
  buscarHorariosDisponiveis,
  listarClinicas,
  listarEspecialidades,
} from '../services/horarios.js';

const router = Router();

// Parâmetro de query como texto; repetido ou ausente conta como "não filtra"
function textoDaQuery(valor: unknown): string | undefined {
  return typeof valor === 'string' && valor !== '' ? valor : undefined;
}

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
