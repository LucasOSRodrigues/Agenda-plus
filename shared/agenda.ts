// Tipos das entidades do Agenda+, compartilhados entre frontend e backend
// Os nomes das entidades e dos atributos seguem o diagrama ERE do TP1 de BD1
// Este arquivo só pode ter tipos: ele é importado com "import type" e some no build

export type StatusHorario = 'Liberado' | 'Bloqueado' | 'Reservado';
export type StatusSolicitacao = 'Pendente' | 'Confirmada' | 'Recusada';

// Referências por chave, usadas nos relacionamentos
export type RefMedico = { Código: number };
export type RefClinica = { CNPJ: string };
export type RefPaciente = { Código: number };

export type Endereco = {
  Logradouro: string;
  Número: string;
  Bairro: string;
  Cidade: string;
};

export type Clinica = {
  CNPJ: string;
  Nome: string;
  Endereço: Endereco;
  'E-mail': string[];
};

export type Medico = {
  Código: number;
  Nome: string;
  CRM: string;
  UFCRM: string;
  Especialidade: string;
};

// Horário como fica guardado: Médico e Clinica são só as chaves
export type Horario = {
  Médico: RefMedico;
  Clinica: RefClinica;
  Data: string; // AAAA-MM-DD
  HoraInicio: string; // HH:MM
  HoraFim: string; // HH:MM
  Status: StatusHorario;
};

// Dados informados pela secretária ao cadastrar um horário
// O status é definido pelo sistema
export type DadosCadastroHorario = Omit<Horario, 'Status'>;

// Horário como volta para a tela: com Médico e Clinica completos
export type HorarioDetalhado = Omit<Horario, 'Médico' | 'Clinica'> & {
  Médico: Medico;
  Clinica: Clinica;
};

// Dados mínimos para identificar um horário (Médico + Data + HoraInicio)
export type ChaveHorario = {
  Médico: RefMedico;
  Data: string;
  HoraInicio: string;
};

export type Solicitacao = ChaveHorario & {
  Código: number;
  Paciente: RefPaciente;
  DataSolicitacao: string; // ISO
  Status: StatusSolicitacao;
  Justificativa: string;
};

// Solicitação como volta para a tela: com Médico, Clinica e HoraFim
export type SolicitacaoDetalhada = Omit<Solicitacao, 'Médico'> & {
  HoraFim: string;
  Médico: Medico;
  Clinica: Clinica | undefined;
};

// Filtros da busca de horários (vazio = não filtra)
export type FiltrosHorarios = {
  CNPJ?: string;
  Especialidade?: string;
  Data?: string;
};
