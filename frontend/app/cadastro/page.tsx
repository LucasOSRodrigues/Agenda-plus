'use client';

// Tela de cadastro do paciente (/cadastro)
// O paciente informa seus dados e cria uma senha para acessar o sistema (H02)

import { useState, type ChangeEvent, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cadastrarPaciente } from '../../services/pacientes';

type Aviso = { texto: string; sucesso: boolean };
type Formulario = {
  Nome: string;
  CPF: string;
  Email: string;
  Telefone: string;
  DataNascimento: string;
  Senha: string;
  ConfirmarSenha: string;
};

const FORMULARIO_VAZIO: Formulario = {
  Nome: '',
  CPF: '',
  Email: '',
  Telefone: '',
  DataNascimento: '',
  Senha: '',
  ConfirmarSenha: '',
};

const TAMANHO_MINIMO_SENHA = 8;

export default function CadastroPage() {
  const [formulario, setFormulario] = useState<Formulario>(FORMULARIO_VAZIO);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  // CPF e telefone aceitam só números
  function atualizar(campo: keyof Formulario, somenteNumeros = false) {
    return (evento: ChangeEvent<HTMLInputElement>) => {
      const valor = somenteNumeros ? evento.target.value.replace(/\D/g, '') : evento.target.value;
      setFormulario((atual) => ({ ...atual, [campo]: valor }));
    };
  }

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setAviso(null);

    if (formulario.Senha !== formulario.ConfirmarSenha) {
      setAviso({ texto: 'As senhas não são iguais.', sucesso: false });
      return;
    }

    setEnviando(true);
    try {
      await cadastrarPaciente({
        Nome: formulario.Nome,
        CPF: formulario.CPF,
        'E-mail': formulario.Email,
        Telefone: formulario.Telefone,
        DataNascimento: formulario.DataNascimento,
        Senha: formulario.Senha,
      });
      setFormulario(FORMULARIO_VAZIO);
      setAviso({ texto: 'Cadastro realizado com sucesso!', sucesso: true });
    } catch (erro) {
      setAviso({
        texto: erro instanceof Error ? erro.message : 'Não foi possível realizar o cadastro.',
        sucesso: false,
      });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="cadastro-title">
        <div className="brand">
          <span className="brand-name">Agenda</span>
          <Image src="/agenda-plus-transparent.png" alt="" width={38} height={38} />
        </div>
        <h1 id="cadastro-title">Crie sua conta</h1>
        <p className="description">Informe seus dados para acessar os serviços da clínica.</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="nome">Nome completo</label>
            <input
              id="nome"
              type="text"
              autoComplete="name"
              value={formulario.Nome}
              onChange={atualizar('Nome')}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="cpf">CPF</label>
            <input
              id="cpf"
              type="text"
              inputMode="numeric"
              placeholder="Somente números"
              maxLength={11}
              pattern="[0-9]{11}"
              title="Informe os 11 números do CPF, sem pontos ou traço."
              value={formulario.CPF}
              onChange={atualizar('CPF', true)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={formulario.Email}
              onChange={atualizar('Email')}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="telefone">Telefone</label>
            <input
              id="telefone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="DDD + número"
              maxLength={11}
              pattern="[0-9]{10,11}"
              title="Informe o DDD e o número, somente números."
              value={formulario.Telefone}
              onChange={atualizar('Telefone', true)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="nascimento">Data de nascimento</label>
            <input
              id="nascimento"
              type="date"
              autoComplete="bday"
              value={formulario.DataNascimento}
              onChange={atualizar('DataNascimento')}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              autoComplete="new-password"
              placeholder={`Mínimo de ${TAMANHO_MINIMO_SENHA} caracteres`}
              minLength={TAMANHO_MINIMO_SENHA}
              value={formulario.Senha}
              onChange={atualizar('Senha')}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="confirmar-senha">Confirmar senha</label>
            <input
              id="confirmar-senha"
              type="password"
              autoComplete="new-password"
              value={formulario.ConfirmarSenha}
              onChange={atualizar('ConfirmarSenha')}
              required
            />
          </div>

          <button type="submit" disabled={enviando}>
            {enviando ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>

        {aviso && (
          <p className={aviso.sucesso ? 'aviso' : 'aviso aviso-erro'} role={aviso.sucesso ? 'status' : 'alert'}>
            {aviso.texto}
            {aviso.sucesso && (
              <>
                {' '}
                <Link href="/">Ir para o login</Link>
              </>
            )}
          </p>
        )}

        <p className="form-message">
          Já tem conta? <Link href="/">Entrar</Link>
        </p>
      </section>
    </main>
  );
}