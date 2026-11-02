// Serviço de consulta de horários usado pela tela /horarios.
// Por enquanto as funções utilizam os dados fictícios de mocks/banco.js

import { clinicas, horarios, medicos, STATUS_HORARIO } from '../mocks/banco';

function compararTexto(a, b) {
  return a.localeCompare(b, 'pt-BR');
}

// Momento em que o horário começa, no fuso do navegador
function inicioDoHorario(horario) {
  return new Date(`${horario.Data}T${horario.HoraInicio}`);
}

// Busca os horários que o paciente pode escolher
// Cada horário volta com o Médico e a Clinica completos, para a tela
// mostrar nome, especialidade e endereço
export async function buscarHorariosDisponiveis({ CNPJ, Especialidade, Data } = {}) {
  const agora = new Date();

  return horarios
    // O paciente vê apenas horários liberados e ainda não ocupados
    // Horários bloqueados, reservados ou que já começaram ficam de fora
    .filter((horario) => horario.Status === STATUS_HORARIO.LIBERADO)
    .filter((horario) => inicioDoHorario(horario) > agora)
    .map((horario) => ({
      ...horario,
      Médico: medicos.find((medico) => medico.Código === horario.Médico.Código),
      Clinica: clinicas.find((clinica) => clinica.CNPJ === horario.Clinica.CNPJ),
    }))
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
export async function listarClinicas() {
  return [...clinicas].sort((a, b) => compararTexto(a.Nome, b.Nome));
}

// Opções do filtro de especialidade, sem repetição
export async function listarEspecialidades() {
  const especialidades = new Set(medicos.map((medico) => medico.Especialidade));
  return [...especialidades].sort(compararTexto);
}
