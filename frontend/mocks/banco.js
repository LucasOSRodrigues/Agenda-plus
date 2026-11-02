// Dados fictícios usados enquanto o banco de dados não é implementado
// Os nomes das entidades e dos atributos seguem o diagrama ERE do TP1 de BD1

// Valores do atributo Status de Horário
export const STATUS_HORARIO = {
  LIBERADO: 'Liberado',
  BLOQUEADO: 'Bloqueado',
  RESERVADO: 'Reservado',
};

// Clinica: CNPJ (chave), Nome, Endereço (Logradouro, Número, Bairro, Cidade)
// e E-mail (multivalorado)
export const clinicas = [
  {
    CNPJ: '11222333000181',
    Nome: 'Clínica Centro',
    Endereço: {
      Logradouro: 'Rua São José',
      Número: '120',
      Bairro: 'Centro',
      Cidade: 'Ouro Preto',
    },
    'E-mail': ['contato@clinicacentro.example.com'],
  },
  {
    CNPJ: '44555666000172',
    Nome: 'Clínica Bauxita',
    Endereço: {
      Logradouro: 'Rua Quatro',
      Número: '45',
      Bairro: 'Bauxita',
      Cidade: 'Ouro Preto',
    },
    'E-mail': [
      'contato@clinicabauxita.example.com',
      'recepcao@clinicabauxita.example.com',
    ],
  },
];

// Médico (subclasse de Usuário)
// De Usuário: Código (chave) e Nome. De Médico: CRM, UFCRM e Especialidade
export const medicos = [
  { Código: 1, Nome: 'Ana Paula Ribeiro', CRM: '45821', UFCRM: 'MG', Especialidade: 'Clínica Geral' },
  { Código: 2, Nome: 'Carlos Eduardo Lima', CRM: '38107', UFCRM: 'MG', Especialidade: 'Cardiologia' },
  { Código: 3, Nome: 'Fernanda Costa', CRM: '51234', UFCRM: 'MG', Especialidade: 'Pediatria' },
  { Código: 4, Nome: 'Rodrigo Almeida', CRM: '29876', UFCRM: 'SP', Especialidade: 'Clínica Geral' },
];

// Data no formato AAAA-MM-DD, contando a partir de hoje
// Assim os horários fictícios nunca ficam todos no passado
function diasAPartirDeHoje(dias) {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

const CLINICA_CENTRO = { CNPJ: '11222333000181' };
const CLINICA_BAUXITA = { CNPJ: '44555666000172' };

// Horário (entidade fraca): Data e HoraInicio (chaves parciais), HoraFim e Status
// Médico: dono do horário, pelo relacionamento identificador "Tem"
// A chave completa do horário é Médico + Data + HoraInicio
// Clinica: clínica que fornece o horário, pelo relacionamento "Fornece"
const { LIBERADO, BLOQUEADO, RESERVADO } = STATUS_HORARIO;

export const horarios = [
  { Médico: { Código: 1 }, Clinica: CLINICA_CENTRO, Data: diasAPartirDeHoje(1), HoraInicio: '08:00', HoraFim: '08:30', Status: LIBERADO },
  { Médico: { Código: 1 }, Clinica: CLINICA_CENTRO, Data: diasAPartirDeHoje(1), HoraInicio: '08:30', HoraFim: '09:00', Status: RESERVADO },
  { Médico: { Código: 1 }, Clinica: CLINICA_CENTRO, Data: diasAPartirDeHoje(1), HoraInicio: '09:00', HoraFim: '09:30', Status: LIBERADO },
  { Médico: { Código: 1 }, Clinica: CLINICA_CENTRO, Data: diasAPartirDeHoje(2), HoraInicio: '14:00', HoraFim: '14:30', Status: LIBERADO },
  { Médico: { Código: 1 }, Clinica: CLINICA_CENTRO, Data: diasAPartirDeHoje(2), HoraInicio: '14:30', HoraFim: '15:00', Status: BLOQUEADO },

  { Médico: { Código: 2 }, Clinica: CLINICA_CENTRO, Data: diasAPartirDeHoje(1), HoraInicio: '10:00', HoraFim: '10:40', Status: LIBERADO },
  { Médico: { Código: 2 }, Clinica: CLINICA_CENTRO, Data: diasAPartirDeHoje(3), HoraInicio: '10:00', HoraFim: '10:40', Status: RESERVADO },
  { Médico: { Código: 2 }, Clinica: CLINICA_CENTRO, Data: diasAPartirDeHoje(3), HoraInicio: '10:40', HoraFim: '11:20', Status: LIBERADO },
  { Médico: { Código: 2 }, Clinica: CLINICA_CENTRO, Data: diasAPartirDeHoje(5), HoraInicio: '15:00', HoraFim: '15:40', Status: LIBERADO },

  { Médico: { Código: 3 }, Clinica: CLINICA_BAUXITA, Data: diasAPartirDeHoje(2), HoraInicio: '08:00', HoraFim: '08:30', Status: LIBERADO },
  { Médico: { Código: 3 }, Clinica: CLINICA_BAUXITA, Data: diasAPartirDeHoje(2), HoraInicio: '08:30', HoraFim: '09:00', Status: LIBERADO },
  { Médico: { Código: 3 }, Clinica: CLINICA_BAUXITA, Data: diasAPartirDeHoje(4), HoraInicio: '13:00', HoraFim: '13:30', Status: BLOQUEADO },
  { Médico: { Código: 3 }, Clinica: CLINICA_BAUXITA, Data: diasAPartirDeHoje(4), HoraInicio: '13:30', HoraFim: '14:00', Status: LIBERADO },

  { Médico: { Código: 4 }, Clinica: CLINICA_BAUXITA, Data: diasAPartirDeHoje(1), HoraInicio: '16:00', HoraFim: '16:30', Status: RESERVADO },
  { Médico: { Código: 4 }, Clinica: CLINICA_BAUXITA, Data: diasAPartirDeHoje(3), HoraInicio: '09:00', HoraFim: '09:30', Status: LIBERADO },
  { Médico: { Código: 4 }, Clinica: CLINICA_BAUXITA, Data: diasAPartirDeHoje(5), HoraInicio: '09:30', HoraFim: '10:00', Status: LIBERADO },
];
