// Ponto de entrada: sobe o servidor HTTP
import app from './app.js';

const porta = Number(process.env.PORT) || 3001;

app.listen(porta, (erro?: Error) => {
  if (erro) throw erro;
  console.log(`API rodando em http://localhost:${porta}`);
});
