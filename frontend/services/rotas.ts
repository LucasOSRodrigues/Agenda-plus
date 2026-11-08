// Endereço e caminhos da API do backend
// O endereço vem de NEXT_PUBLIC_API_URL (ver .env.example)

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const ROTAS = {
  horarios: `${API_URL}/horarios`,
  clinicas: `${API_URL}/clinicas`,
  especialidades: `${API_URL}/especialidades`,
  solicitacoes: `${API_URL}/solicitacoes`,
  chavesSolicitadas: `${API_URL}/solicitacoes/chaves`,
  solicitacao: (codigo: number) => `${API_URL}/solicitacoes/${codigo}`,
};
