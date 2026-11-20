// Testes de unidade do gerenciamento de solicitações pela secretária (história H08)
// Os dados fictícios do back-end são trocados pelos dados fixos de tests/fixtures (mock)

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { congelarRelogioEm, soltarRelogio } from '../ajudantes.js';
import { AGORA, PENDENTES_EM_ORDEM, criarHorarios } from '../fixtures/solicitacoes.js';

// Mock: o serviço passa a ler os dados fixos
vi.mock('../../src/mocks/banco.js', async (importOriginal) => {
  const fixture = await import('../fixtures/solicitacoes.js');
  return {
    ...(await importOriginal<typeof import('../../src/mocks/banco.js')>()),
    clinicas: fixture.clinicas,
    medicos: fixture.medicos,
    pacientes: fixture.pacientes,
    horarios: fixture.horarios,
    solicitacoes: fixture.solicitacoes,
  };
});

// O serviço guarda as alterações em memória, então cada teste carrega tudo de novo
async function carregar() {
  vi.resetModules();
  const banco = await import('../../src/mocks/banco.js');
  banco.horarios.splice(0, banco.horarios.length, ...criarHorarios());
  const servico = await import('../../src/services/solicitacoes.js');
  return { servico, banco };
}

function statusDoHorario(
  banco: Awaited<ReturnType<typeof carregar>>['banco'],
  codigoMedico: number,
  data: string,
  horaInicio: string,
) {
  return banco.horarios.find(
    (h) => h.Médico.Código === codigoMedico && h.Data === data && h.HoraInicio === horaInicio,
  )?.Status;
}

beforeEach(() => congelarRelogioEm(AGORA));
afterEach(() => soltarRelogio());

describe('listarSolicitacoesGerenciamento', () => {
  it('lista as solicitações de todos os pacientes', async () => {
    const { servico } = await carregar();

    const lista = await servico.listarSolicitacoesGerenciamento();

    expect(lista).toHaveLength(6);
  });

  it('filtra pelo status e ordena pela data e hora da consulta', async () => {
    const { servico } = await carregar();

    const pendentes = await servico.listarSolicitacoesGerenciamento('Pendente');

    expect(pendentes.map((s) => s.Código)).toEqual(PENDENTES_EM_ORDEM);
  });

  it('traz o nome do paciente e os detalhes do horário', async () => {
    const { servico } = await carregar();

    const [primeira] = await servico.listarSolicitacoesGerenciamento('Confirmada');

    expect(primeira.Paciente).toEqual({ Código: 100, Nome: 'Mariana Alves' });
    expect(primeira.Médico.Nome).toBe('Ana Lima');
    expect(primeira.Clinica?.Nome).toBe('Clínica Beta');
    expect(primeira.HoraFim).toBe('09:30');
  });
});

describe('confirmarOuRecusarSolicitacao', () => {
  describe('confirmar', () => {
    it('confirma a solicitação e reserva o horário', async () => {
      const { servico, banco } = await carregar();

      const confirmada = await servico.confirmarOuRecusarSolicitacao(3, { Status: 'Confirmada' });

      expect(confirmada.Status).toBe('Confirmada');
      expect(statusDoHorario(banco, 2, '2026-11-12', '14:00')).toBe('Reservado');
    });

    it('recusa as outras solicitações pendentes do mesmo horário', async () => {
      const { servico } = await carregar();

      await servico.confirmarOuRecusarSolicitacao(1, { Status: 'Confirmada' });

      const todas = await servico.listarSolicitacoesGerenciamento();
      const outra = todas.find((s) => s.Código === 2);
      expect(outra?.Status).toBe('Recusada');
      expect(outra?.Justificativa).toBe(servico.JUSTIFICATIVA_HORARIO_PREENCHIDO);
      // Solicitações de outros horários não mudam
      expect(todas.find((s) => s.Código === 3)?.Status).toBe('Pendente');
    });

    it('não confirma quando o horário está bloqueado', async () => {
      const { servico } = await carregar();

      await expect(
        servico.confirmarOuRecusarSolicitacao(4, { Status: 'Confirmada' }),
      ).rejects.toMatchObject({ status: 409 });
    });

    it('não confirma quando o horário já começou', async () => {
      const { servico } = await carregar();

      await expect(
        servico.confirmarOuRecusarSolicitacao(5, { Status: 'Confirmada' }),
      ).rejects.toMatchObject({ status: 409 });
    });
  });

  describe('recusar', () => {
    it('recusa com a justificativa, sem mudar o horário', async () => {
      const { servico, banco } = await carregar();

      const recusada = await servico.confirmarOuRecusarSolicitacao(3, {
        Status: 'Recusada',
        Justificativa: '  O médico estará em congresso.  ',
      });

      expect(recusada.Status).toBe('Recusada');
      expect(recusada.Justificativa).toBe('O médico estará em congresso.');
      expect(statusDoHorario(banco, 2, '2026-11-12', '14:00')).toBe('Liberado');
    });

    it('exige a justificativa', async () => {
      const { servico } = await carregar();

      await expect(
        servico.confirmarOuRecusarSolicitacao(3, { Status: 'Recusada', Justificativa: '   ' }),
      ).rejects.toMatchObject({ status: 400 });
    });

    it('permite recusar mesmo quando o horário já começou', async () => {
      const { servico } = await carregar();

      const recusada = await servico.confirmarOuRecusarSolicitacao(5, {
        Status: 'Recusada',
        Justificativa: 'Horário expirado.',
      });

      expect(recusada.Status).toBe('Recusada');
    });
  });

  it('não altera uma solicitação que já foi decidida', async () => {
    const { servico } = await carregar();

    await expect(
      servico.confirmarOuRecusarSolicitacao(6, { Status: 'Recusada', Justificativa: 'Teste' }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it('responde 404 para uma solicitação que não existe', async () => {
    const { servico } = await carregar();

    await expect(
      servico.confirmarOuRecusarSolicitacao(999, { Status: 'Confirmada' }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('a decisão aparece para o paciente', async () => {
    const { servico } = await carregar();

    await servico.confirmarOuRecusarSolicitacao(1, { Status: 'Confirmada' });

    const doPaciente = await servico.listarSolicitacoesDoPaciente();
    expect(doPaciente.find((s) => s.Código === 1)?.Status).toBe('Confirmada');
  });
});
