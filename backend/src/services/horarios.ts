// Serviço de consulta de horários, usado pelas rotas de routes/horarios.ts
// Por enquanto as funções utilizam os dados fictícios de mocks/banco.ts

import { clinicas, horarios, medicos, STATUS_HORARIO } from '../mocks/banco.js';
import type {
  Clinica,
  FiltrosHorarios,
  Horario,
  HorarioDetalhado,
  Medico,
} from '@shared/agenda';

function compararTexto(a: string, b: string): number {
  return a.localeCompare(b, 'pt-BR');
}

// Momento em que o horário começa, no fuso do servidor
function inicioDoHorario(horario: Pick<Horario, 'Data' | 'HoraInicio'>): Date {
  return new Date(`${horario.Data}T${horario.HoraInicio}`);
}

// Busca os horários que o paciente pode escolher
// Cada horário volta com o Médico e a Clinica completos, para a tela
// mostrar nome, especialidade e endereço
export async function buscarHorariosDisponiveis({
  CNPJ,
  Especialidade,
  Data,
}: FiltrosHorarios = {}): Promise<HorarioDetalhado[]> {
  const agora = new Date();

  return horarios
    // O paciente vê apenas horários liberados e ainda não ocupados
    // Horários bloqueados, reservados ou que já começaram ficam de fora
    .filter((horario) => horario.Status === STATUS_HORARIO.LIBERADO)
    .filter((horario) => inicioDoHorario(horario) > agora)
    .map(
      (horario): HorarioDetalhado => ({
        ...horario,
        // Todo horário do mock aponta para um médico e uma clínica existentes
        Médico: medicos.find((medico) => medico.Código === horario.Médico.Código) as Medico,
        Clinica: clinicas.find((clinica) => clinica.CNPJ === horario.Clinica.CNPJ) as Clinica,
      }),
    )
    // Filtros opcionais (vazio = não filtra):
    // - CNPJ: só horários fornecidos por esta clínica
    // - Especialidade: só horários de médicos desta especialidade
    // - Data: só horários deste dia (AAAA-MM-DD)
    .filter((horario) => !CNPJ || horario.Clinica.CNPJ === CNPJ)
    .filter((horario) => !Especialidade || horario.Médico.Especialidade === Especialidade)
    .filter((horario) => !Data || horario.Data === Data)
    .sort(
      (a, b) =>
        compararTexto(a.Data, b.Data) ||
        compararTexto(a.HoraInicio, b.HoraInicio) ||
        compararTexto(a.Médico.Nome, b.Médico.Nome),
    );
}

// Opções do filtro de clínica
export async function listarClinicas(): Promise<Clinica[]> {
  return [...clinicas].sort((a, b) => compararTexto(a.Nome, b.Nome));
}

// Opções do filtro de especialidade, sem repetição
export async function listarEspecialidades(): Promise<string[]> {
  const especialidades = new Set(medicos.map((medico) => medico.Especialidade));
  return [...especialidades].sort(compararTexto);
}
