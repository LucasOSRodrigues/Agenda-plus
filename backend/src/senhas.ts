// A senha nunca é guardada em texto puro: só o hash (formato "sal:hash")
import { randomBytes, scryptSync } from 'node:crypto';

export function gerarHashSenha(senha: string): string {
  const sal = randomBytes(16).toString('hex');
  return `${sal}:${scryptSync(senha, sal, 64).toString('hex')}`;
}
