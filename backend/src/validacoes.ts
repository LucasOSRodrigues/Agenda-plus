// Validações compartilhadas pelas rotas de cadastro (pacientes e equipe)

export const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const TAMANHO_MINIMO_SENHA = 8;

export function soNumeros(valor: string): string {
  return valor.replace(/\D/g, '');
}

// Confere os dois dígitos verificadores do CPF
export function cpfValido(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const digito = (tamanho: number): number => {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(cpf[i]) * (tamanho + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(9) === Number(cpf[9]) && digito(10) === Number(cpf[10]);
}

// Texto do corpo da requisição, sem espaços nas pontas ("" se ausente ou de outro tipo)
export function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}
