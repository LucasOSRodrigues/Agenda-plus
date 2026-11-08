// Configuração da API: middlewares e rotas
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { ErroHttp } from './erros.js';
import rotasHorarios from './routes/horarios.js';
import rotasSolicitacoes from './routes/solicitacoes.js';
import rotasPacientes from './routes/pacientes.js';

const app = express();



// Não revela o framework no cabeçalho X-Powered-By
app.disable('x-powered-by');

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

// Usada para verificar se a API está no ar
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(rotasHorarios);
app.use(rotasSolicitacoes);
app.use(rotasPacientes);

// Nenhuma rota atendeu à requisição
app.use((_req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' });
});


app.use((erro: unknown, _req: Request, res: Response, _next: NextFunction) => {
  // Erros esperados (regra de negócio, validação) voltam com a mensagem para o cliente
  if (erro instanceof ErroHttp) {
    res.status(erro.status).json({ erro: erro.message });
    return;
  }
  // JSON malformado no corpo da requisição
  if (erro instanceof SyntaxError && 'body' in erro) {
    res.status(400).json({ erro: 'Corpo da requisição não é um JSON válido.' });
    return;
  }
  console.error(erro);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

export default app;
