// Testes de integração das rotas de busca de horários (issue #16, história H03)
// Chamam a API de verdade (rota + serviço), sem ligar o servidor, usando o supertest
// Os dados fictícios do back-end são trocados pelos dados fixos de tests/fixtures (mock)

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { congelarRelogioEm, resumirHorarios, soltarRelogio } from '../ajudantes.js';
import {
  AGORA,
  CLINICA_ALFA,
  CLINICA_BETA,
  DISPONIVEIS_EM_ORDEM,
} from '../fixtures/horarios.js';

// Mock: as rotas passam a usar clínicas, médicos e horários dos dados fixos
vi.mock('../../src/mocks/banco.js', async (importOriginal) => {
  const fixture = await import('../fixtures/horarios.js');
  return {
    ...(await importOriginal<typeof import('../../src/mocks/banco.js')>()),
    clinicas: fixture.clinicas,
    medicos: fixture.medicos,
    horarios: fixture.horarios,
  };
});

describe('GET /horarios', () => {
  beforeEach(() => congelarRelogioEm(AGORA));
  afterEach(() => soltarRelogio());

  it('responde 200 com os horários disponíveis em JSON', async () => {
    const resposta = await request(app).get('/horarios');

    expect(resposta.status).toBe(200);
    expect(resposta.headers['content-type']).toMatch(/application\/json/);
    expect(resumirHorarios(resposta.body)).toEqual(DISPONIVEIS_EM_ORDEM);
  });

  it('só devolve horários liberados', async () => {
    const resposta = await request(app).get('/horarios');

    expect(resposta.body.every((horario: { Status: string }) => horario.Status === 'Liberado')).toBe(
      true,
    );
  });

  it('aplica os filtros passados na URL', async () => {
    const resposta = await request(app)
      .get('/horarios')
      .query({ CNPJ: CLINICA_ALFA.CNPJ, Especialidade: 'Pediatria' });

    expect(resposta.status).toBe(200);
    expect(resumirHorarios(resposta.body)).toEqual(['2026-11-11 09:00 Carla Dias']);
  });

  it('filtra pela data informada na URL', async () => {
    const resposta = await request(app).get('/horarios').query({ Data: '2026-11-12' });

    expect(resumirHorarios(resposta.body)).toEqual(['2026-11-12 14:00 Ana Lima']);
  });

  it('responde 200 com lista vazia quando nenhum horário combina com os filtros', async () => {
    const resposta = await request(app)
      .get('/horarios')
      .query({ CNPJ: CLINICA_BETA.CNPJ, Especialidade: 'Cardiologia' });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual([]);
  });

  it('ignora filtros vazios na URL', async () => {
    const resposta = await request(app).get('/horarios?CNPJ=&Especialidade=&Data=');

    expect(resumirHorarios(resposta.body)).toEqual(DISPONIVEIS_EM_ORDEM);
  });

  it('ignora um filtro repetido na URL', async () => {
    const resposta = await request(app).get(
      `/horarios?CNPJ=${CLINICA_ALFA.CNPJ}&CNPJ=${CLINICA_BETA.CNPJ}`,
    );

    expect(resumirHorarios(resposta.body)).toEqual(DISPONIVEIS_EM_ORDEM);
  });
});

describe('GET /clinicas', () => {
  it('responde 200 com as clínicas em ordem alfabética', async () => {
    const resposta = await request(app).get('/clinicas');

    expect(resposta.status).toBe(200);
    expect(resposta.body.map((clinica: { Nome: string }) => clinica.Nome)).toEqual([
      'Clínica Alfa',
      'Clínica Beta',
    ]);
  });
});

describe('GET /especialidades', () => {
  it('responde 200 com as especialidades sem repetição', async () => {
    const resposta = await request(app).get('/especialidades');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual(['Cardiologia', 'Pediatria']);
  });
});

describe('rota que não existe', () => {
  it('responde 404 com a mensagem de erro', async () => {
    const resposta = await request(app).get('/rota-que-nao-existe');

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual({ erro: 'Rota não encontrada.' });
  });
});
