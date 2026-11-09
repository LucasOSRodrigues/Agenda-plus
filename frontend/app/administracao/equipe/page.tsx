'use client';

// Tela de cadastro da equipe (/administracao/equipe)
// O administrador cadastra médicos e secretários, informando seus dados e o papel (H14)
//
// Provisório: ainda não há login, então qualquer pessoa que souber o endereço acessa a tela.
// Quando a autenticação existir, ela deve ser liberada só para o administrador.

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cadastrarMembroEquipe } from '../../../services/equipe';
import { listarEspecialidades } from '../../../services/horarios';
import type { DadosCadastroEquipe, PapelEquipe } from '@shared/agenda';

type Aviso = { texto: string; sucesso: boolean };
type Formulario = {
  Papel: PapelEquipe;
  Nome: string;
  CPF: string;
  Email: string;
  Telefone: string;
  CRM: string;
  UFCRM: string;
  Especialidade: string;
  Senha: string;
  ConfirmarSenha: string;
};

const FORMULARIO_VAZIO: Formulario = {
  Papel: 'Secretário',
  Nome: '',
  CPF: '',
  Email: '',
  Telefone: '',
  CRM: '',
  UFCRM: '',
  Especialidade: '',
  Senha: '',
  ConfirmarSenha: '',
};

const PAPEIS: PapelEquipe[] = ['Secretário', 'Médico'];
const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];
const TAMANHO_MINIMO_SENHA = 8;

export default function CadastroEquipePage() {
  const [formulario, setFormulario] = useState<Formulario>(FORMULARIO_VAZIO);
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  const ehMedico = formulario.Papel === 'Médico';

  // Especialidades já existentes, só como sugestão no campo (a pessoa pode digitar outra)
  async function carregarEspecialidades() {
    try {
      setEspecialidades(await listarEspecialidades());
    } catch {
      // Sem sugestões, o campo continua funcionando normalmente
    }
  }

  useEffect(() => {
    carregarEspecialidades();
  }, []);

  // CPF, telefone e CRM aceitam só números
  function atualizar(campo: keyof Formulario, somenteNumeros = false) {
    return (evento: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

    const base = {
      Nome: formulario.Nome,
      CPF: formulario.CPF,
      'E-mail': formulario.Email,
      Telefone: formulario.Telefone,
      Senha: formulario.Senha,
    };
    // CRM, UF do CRM e especialidade só existem para médicos
    const dados: DadosCadastroEquipe = ehMedico
      ? {
          ...base,
          Papel: 'Médico',
          CRM: formulario.CRM,
          UFCRM: formulario.UFCRM,
          Especialidade: formulario.Especialidade,
        }
      : { ...base, Papel: 'Secretário' };

    setEnviando(true);
    try {
      const membro = await cadastrarMembroEquipe(dados);
      // Mantém o papel escolhido, para facilitar cadastrar várias pessoas seguidas
      setFormulario({ ...FORMULARIO_VAZIO, Papel: formulario.Papel });
      setAviso({
        texto: `${membro.Nome} foi cadastrado(a) como ${membro.Papel.toLowerCase()}.`,
        sucesso: true,
      });
      if (membro.Papel === 'Médico') carregarEspecialidades();
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
      <section className="login-card" aria-labelledby="equipe-title">
        <div className="brand">
          <span className="brand-name">Agenda</span>
          <Image src="/agenda-plus-transparent.png" alt="" width={38} height={38} />
        </div>
        <h1 id="equipe-title">Cadastrar equipe</h1>
        <p className="description">
          Cadastre médicos e secretários para que a equipe acesse o sistema.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="papel">Papel</label>
            <select id="papel" value={formulario.Papel} onChange={atualizar('Papel')} required>
              {PAPEIS.map((papel) => (
                <option key={papel} value={papel}>
                  {papel}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="nome">Nome completo</label>
            <input
              id="nome"
              type="text"
              autoComplete="off"
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
              autoComplete="off"
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
              autoComplete="off"
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
              autoComplete="off"
              placeholder="DDD + número"
              maxLength={11}
              pattern="[0-9]{10,11}"
              title="Informe o DDD e o número, somente números."
              value={formulario.Telefone}
              onChange={atualizar('Telefone', true)}
              required
            />
          </div>

          {ehMedico && (
            <>
              <div className="field">
                <label htmlFor="crm">CRM</label>
                <input
                  id="crm"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Somente números"
                  value={formulario.CRM}
                  onChange={atualizar('CRM', true)}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="ufcrm">UF do CRM</label>
                <select id="ufcrm" value={formulario.UFCRM} onChange={atualizar('UFCRM')} required>
                  <option value="">Selecione</option>
                  {UFS.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="especialidade">Especialidade</label>
                <input
                  id="especialidade"
                  type="text"
                  list="especialidades-sugeridas"
                  autoComplete="off"
                  value={formulario.Especialidade}
                  onChange={atualizar('Especialidade')}
                  required
                />
                <datalist id="especialidades-sugeridas">
                  {especialidades.map((especialidade) => (
                    <option key={especialidade} value={especialidade} />
                  ))}
                </datalist>
              </div>
            </>
          )}

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
          <p
            className={aviso.sucesso ? 'aviso' : 'aviso aviso-erro'}
            role={aviso.sucesso ? 'status' : 'alert'}
          >
            {aviso.texto}
          </p>
        )}

        <p className="form-message">
          <Link href="/inicio">Voltar ao início</Link>
        </p>
      </section>
    </main>
  );
}
