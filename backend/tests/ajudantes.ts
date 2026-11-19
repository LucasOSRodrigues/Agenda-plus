// Funções de apoio usadas pelos testes

import { vi } from 'vitest';
import type { HorarioDetalhado } from '@shared/agenda';

// Congela a data e a hora atuais
// Sem isso, a regra "horário que já começou não aparece" faria o resultado do teste depender do momento em que ele roda
export function congelarRelogioEm(dataHora: string): void {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(dataHora));
}

// Volta o relógio ao normal depois do teste
export function soltarRelogio(): void {
  vi.useRealTimers();
}

// Resume cada horário em um texto ("2026-11-10 10:00 Ana Lima"), para comparar listas de horários de forma fácil de ler quando o teste falha
export function resumirHorarios(horarios: HorarioDetalhado[]): string[] {
  return horarios.map((horario) => `${horario.Data} ${horario.HoraInicio} ${horario.Médico.Nome}`);
}
