// Testes de unidade do serviço de busca de horários (issue #16, história H03)
// Os dados fictícios do back-end são trocados pelos dados fixos de tests/fixtures (mock)

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buscarHorariosDisponiveis,
  listarClinicas,
  listarEspecialidades,
} from '../../src/services/horarios.js';
import { congelarRelogioEm, resumirHorarios, soltarRelogio } from '../ajudantes.js';
import {
  AGORA,
  CLINICA_ALFA,
  CLINICA_BETA,
  DISPONIVEIS_EM_ORDEM,
  medicos,
} from '../fixtures/horarios.js';

// Mock: o serviço passa a ler clínicas, médicos e horários dos dados fixos
vi.mock('../../src/mocks/banco.js', async (importOriginal) => {
  const fixture = await import('../fixtures/horarios.js');
  return {
    ...(await importOriginal<typeof import('../../src/mocks/banco.js')>()),
    clinicas: fixture.clinicas,
    medicos: fixture.medicos,
    horarios: fixture.horarios,
  };
});

describe('buscarHorariosDisponiveis', () => {
  beforeEach(() => congelarRelogioEm(AGORA));
  afterEach(() => soltarRelogio());

  describe('quais horários aparecem', () => {
    it('devolve só horários liberados', async () => {
      const horarios = await buscarHorariosDisponiveis();

      expect(horarios).toHaveLength(4);
      expect(horarios.every((horario) => horario.Status === 'Liberado')).toBe(true);
    });

    it('não devolve horários bloqueados nem reservados', async () => {
      const horarios = await buscarHorariosDisponiveis();

      const resumo = resumirHorarios(horarios);
      expect(resumo).not.toContain('2026-11-11 08:00 Ana Lima'); // bloqueado
      expect(resumo).not.toContain('2026-11-11 08:00 Carla Dias'); // reservado
    });

    it('não devolve horários que já começaram', async () => {
      const horarios = await buscarHorariosDisponiveis();

      expect(resumirHorarios(horarios)).not.toContain('2026-11-10 08:00 Bruno Souza');
    });

    it('não devolve o horário que começa exatamente agora', async () => {
      const horarios = await buscarHorariosDisponiveis();

      expect(resumirHorarios(horarios)).not.toContain('2026-11-10 09:00 Bruno Souza');
    });

    it('ordena por data, hora e nome do médico', async () => {
      const horarios = await buscarHorariosDisponiveis();

      expect(resumirHorarios(horarios)).toEqual(DISPONIVEIS_EM_ORDEM);
    });

    it('devolve o médico e a clínica completos, para a tela mostrar os detalhes', async () => {
      const [primeiro] = await buscarHorariosDisponiveis();

      expect(primeiro.Médico).toEqual(medicos.find((medico) => medico.Nome === 'Ana Lima'));
      expect(primeiro.Clinica).toEqual(CLINICA_BETA);
    });
  });

  describe('filtros', () => {
    it('filtra pela clínica (CNPJ)', async () => {
      const horarios = await buscarHorariosDisponiveis({ CNPJ: CLINICA_ALFA.CNPJ });

      expect(resumirHorarios(horarios)).toEqual([
        '2026-11-10 10:00 Bruno Souza',
        '2026-11-11 09:00 Carla Dias',
      ]);
    });

    it('filtra pela especialidade do médico', async () => {
      const horarios = await buscarHorariosDisponiveis({ Especialidade: 'Pediatria' });

      expect(resumirHorarios(horarios)).toEqual([
        '2026-11-10 10:00 Ana Lima',
        '2026-11-11 09:00 Carla Dias',
        '2026-11-12 14:00 Ana Lima',
      ]);
    });

    it('filtra pela data', async () => {
      const horarios = await buscarHorariosDisponiveis({ Data: '2026-11-11' });

      expect(resumirHorarios(horarios)).toEqual(['2026-11-11 09:00 Carla Dias']);
    });

    it('combina os filtros', async () => {
      const horarios = await buscarHorariosDisponiveis({
        CNPJ: CLINICA_ALFA.CNPJ,
        Especialidade: 'Pediatria',
      });

      expect(resumirHorarios(horarios)).toEqual(['2026-11-11 09:00 Carla Dias']);
    });

    it('trata filtro vazio como "não filtra"', async () => {
      const horarios = await buscarHorariosDisponiveis({ CNPJ: '', Especialidade: '', Data: '' });

      expect(resumirHorarios(horarios)).toEqual(DISPONIVEIS_EM_ORDEM);
    });
  });

  describe('quando não há horários disponíveis', () => {
    it('devolve lista vazia quando nenhum horário combina com os filtros', async () => {
      const horarios = await buscarHorariosDisponiveis({
        CNPJ: CLINICA_BETA.CNPJ,
        Especialidade: 'Cardiologia',
      });

      expect(horarios).toEqual([]);
    });

    it('devolve lista vazia para uma data sem horários', async () => {
      const horarios = await buscarHorariosDisponiveis({ Data: '2026-11-20' });

      expect(horarios).toEqual([]);
    });

    it('devolve lista vazia quando todos os horários já passaram', async () => {
      congelarRelogioEm('2026-12-01T00:00:00');

      const horarios = await buscarHorariosDisponiveis();

      expect(horarios).toEqual([]);
    });
  });
});

describe('listarClinicas', () => {
  it('devolve as clínicas em ordem alfabética', async () => {
    const clinicas = await listarClinicas();

    expect(clinicas.map((clinica) => clinica.Nome)).toEqual(['Clínica Alfa', 'Clínica Beta']);
  });
});

describe('listarEspecialidades', () => {
  it('devolve as especialidades sem repetição e em ordem alfabética', async () => {
    const especialidades = await listarEspecialidades();

    expect(especialidades).toEqual(['Cardiologia', 'Pediatria']);
  });
});
