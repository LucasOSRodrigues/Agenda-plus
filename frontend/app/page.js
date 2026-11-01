'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function LoginPage() {
  const [message, setMessage] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    setMessage('A entrada no sistema ainda está em desenvolvimento.');
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

        <form onSubmit={handleSubmit}>
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
          <p className="form-message" role="status">{message}</p>
        </form>
      </section>
    </main>
  );
}
