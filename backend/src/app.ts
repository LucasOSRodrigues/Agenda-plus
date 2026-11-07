// Configuração da API: middlewares e rotas
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';

const app = express();

// Não revela o framework no cabeçalho X-Powered-By
app.disable('x-powered-by');

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

// Usada para verificar se a API está no ar
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Nenhuma rota atendeu à requisição
app.use((_req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' });
});

// O Express identifica o tratador de erros pelos 4 parâmetros
app.use((erro: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(erro);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

export default app;
