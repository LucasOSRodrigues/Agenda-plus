// Ponto de entrada: sobe o servidor HTTP
import app from './app.js';

const porta = process.env.PORT || 3001;

app.listen(porta, (erro) => {
  if (erro) throw erro;
  console.log(`API rodando em http://localhost:${porta}`);
});
