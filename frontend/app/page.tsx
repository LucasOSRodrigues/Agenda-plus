'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';

export default function LoginPage() {
  const router = useRouter();

  // Provisório: ainda não há autenticação, qualquer valor entra
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push('/inicio');
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="brand">
          <span className="brand-name">Agenda</span>
          <Image src="/agenda-plus-transparent.png" alt="" width={38} height={38}/>
        </div>
        <h1 id="login-title">Entre na sua conta</h1>
        <p className="description">Bem-vindo! Acesse o sistema para continuar.</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="cpf">CPF</label>
            <input
              id="cpf"
              name="cpf"
              type="text"
              inputMode="numeric"
              autoComplete="username"
              placeholder="CPF"
              maxLength={11}
              pattern="[0-9]{11}"
              title="Informe os 11 números do CPF, sem pontos ou traço."
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Digite sua senha"
              required
            />
          </div>

          <button type="submit">Entrar</button>
        </form>
      </section>
    </main>
  );
}