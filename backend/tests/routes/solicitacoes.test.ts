// Testes de integração das rotas de gerenciamento de solicitações (história H08)
// Chamam a API de verdade (rota + serviço), sem ligar o servidor, usando o supertest
// Os dados fictícios do back-end são trocados pelos dados fixos de tests/fixtures (mock)

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { congelarRelogioEm, soltarRelogio } from '../ajudantes.js';
import { AGORA, PENDENTES_EM_ORDEM, criarHorarios } from '../fixtures/solicitacoes.js';

// Mock: as rotas passam a usar os dados fixos
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

// O serviço guarda as alterações em memória, então cada teste carrega a API de novo
async function carregarApp() {
  vi.resetModules();
  const banco = await import('../../src/mocks/banco.js');
  banco.horarios.splice(0, banco.horarios.length, ...criarHorarios());
  return (await import('../../src/app.js')).default;
}

beforeEach(() => congelarRelogioEm(AGORA));
afterEach(() => soltarRelogio());

describe('GET /gerenciamento/solicitacoes', () => {
  it('responde 200 com todas as solicitações', async () => {
    const resposta = await request(await carregarApp()).get('/gerenciamento/solicitacoes');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toHaveLength(6);
  });

  it('filtra pelo status informado na URL', async () => {
    const resposta = await request(await carregarApp())
      .get('/gerenciamento/solicitacoes')
      .query({ Status: 'Pendente' });

    expect(resposta.body.map((s: { Código: number }) => s.Código)).toEqual(PENDENTES_EM_ORDEM);
  });

  it('responde 400 para um status inválido', async () => {
    const resposta = await request(await carregarApp())
      .get('/gerenciamento/solicitacoes')
      .query({ Status: 'Aprovada' });

    expect(resposta.status).toBe(400);
  });
});

describe('PATCH /gerenciamento/solicitacoes/:codigo', () => {
  it('confirma a solicitação e o horário some da busca do paciente', async () => {
    const app = await carregarApp();

    const resposta = await request(app)
      .patch('/gerenciamento/solicitacoes/3')
      .send({ Status: 'Confirmada' });

    expect(resposta.status).toBe(200);
    expect(resposta.body.Status).toBe('Confirmada');
    expect(resposta.body.Paciente.Nome).toBe('João Pereira');

    const busca = await request(app).get('/horarios').query({ Data: '2026-11-12' });
    expect(busca.body).toEqual([]);
  });

  it('recusa a solicitação com a justificativa', async () => {
    const resposta = await request(await carregarApp())
      .patch('/gerenciamento/solicitacoes/3')
      .send({ Status: 'Recusada', Justificativa: 'O médico estará em congresso.' });

    expect(resposta.status).toBe(200);
    expect(resposta.body.Status).toBe('Recusada');
    expect(resposta.body.Justificativa).toBe('O médico estará em congresso.');
  });

  it('responde 400 ao recusar sem justificativa', async () => {
    const resposta = await request(await carregarApp())
      .patch('/gerenciamento/solicitacoes/3')
      .send({ Status: 'Recusada' });

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({ erro: 'Informe a justificativa da recusa.' });
  });

  it('responde 400 para um status que não é Confirmada nem Recusada', async () => {
    const resposta = await request(await carregarApp())
      .patch('/gerenciamento/solicitacoes/3')
      .send({ Status: 'Pendente' });

    expect(resposta.status).toBe(400);
  });

  it('responde 400 para um código inválido', async () => {
    const resposta = await request(await carregarApp())
      .patch('/gerenciamento/solicitacoes/abc')
      .send({ Status: 'Confirmada' });

    expect(resposta.status).toBe(400);
  });

  it('responde 404 para uma solicitação que não existe', async () => {
    const resposta = await request(await carregarApp())
      .patch('/gerenciamento/solicitacoes/999')
      .send({ Status: 'Confirmada' });

    expect(resposta.status).toBe(404);
  });

  it('responde 409 ao decidir uma solicitação já decidida', async () => {
    const resposta = await request(await carregarApp())
      .patch('/gerenciamento/solicitacoes/6')
      .send({ Status: 'Confirmada' });

    expect(resposta.status).toBe(409);
  });
});
