// Endereço e caminhos da API do backend
// O endereço vem de NEXT_PUBLIC_API_URL (ver .env.example)

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const ROTAS = {
  horarios: `${API_URL}/horarios`,
  horariosGerenciamento: `${API_URL}/gerenciamento/horarios`,
  statusHorarioGerenciamento: `${API_URL}/gerenciamento/horarios/status`,
  clinicas: `${API_URL}/clinicas`,
  medicos: `${API_URL}/medicos`,
  especialidades: `${API_URL}/especialidades`,
  pacientes: `${API_URL}/pacientes`,
  equipe: `${API_URL}/equipe`,
  solicitacoes: `${API_URL}/solicitacoes`,
  chavesSolicitadas: `${API_URL}/solicitacoes/chaves`,
  solicitacao: (codigo: number) => `${API_URL}/solicitacoes/${codigo}`,
};
