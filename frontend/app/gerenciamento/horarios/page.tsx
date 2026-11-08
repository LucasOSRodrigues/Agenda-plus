'use client';

// Tela de gerenciamento de horários (/gerenciamento/horarios)
// Mostra todos os horários e permite que a secretária libere ou bloqueie cada um (H09)

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  alterarStatusHorario,
  listarHorariosGerenciamento,
} from '../../../services/horarios';
import type {
  ChaveHorario,
  HorarioDetalhado,
  StatusGerenciamentoHorario,
  StatusHorario,
} from '@shared/agenda';

type Aviso = { texto: string; sucesso: boolean };

// Classe de cor de cada status (ver .status-* no globals.css)
const CLASSE_STATUS: Record<StatusHorario, string> = {
  Liberado: 'status-liberado',
  Bloqueado: 'status-bloqueado',
  Reservado: 'status-reservado',
};

// Transforma a data (AAAA-MM-DD) em texto, ex.: "Quarta-feira, 5 de novembro"
function formatarData(data: string): string {
  const texto = new Date(`${data}T00:00`).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Horário é entidade fraca, então é identificado por Médico + Data + HoraInicio
function chaveDoHorario(horario: ChaveHorario): string {
  return `${horario.Médico.Código}-${horario.Data}-${horario.HoraInicio}`;
}

export default function GerenciamentoHorariosPage() {
  const [horarios, setHorarios] = useState<HorarioDetalhado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  // Chave do horário cujo status está sendo alterado
  const [alterando, setAlterando] = useState('');
  // Resultado da última alteração: { texto, sucesso }
  const [aviso, setAviso] = useState<Aviso | null>(null);

  async function carregar() {
    try {
      setHorarios(await listarHorariosGerenciamento());
    } catch {
      setHorarios([]);
      setErro('Não foi possível carregar os horários. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  // Quando a tela abre, carrega todos os horários para gerenciamento
  useEffect(() => {
    carregar();
  }, []);

  // Atualiza o status do horário e substitui o item correspondente na lista
  async function alterar(horario: HorarioDetalhado, Status: StatusGerenciamentoHorario) {
    const chave = chaveDoHorario(horario);
    setAlterando(chave);
    setAviso(null);

    try {
      const atualizado = await alterarStatusHorario({
        Médico: { Código: horario.Médico.Código },
        Data: horario.Data,
        HoraInicio: horario.HoraInicio,
        Status,
      });
      setHorarios((atuais) =>
        atuais.map((item) => (chaveDoHorario(item) === chave ? atualizado : item)),
      );
      setAviso({
        texto: `Horário ${Status === 'Liberado' ? 'liberado' : 'bloqueado'} com sucesso.`,
        sucesso: true,
      });
    } catch (e) {
      setAviso({ texto: (e as Error).message, sucesso: false });
    } finally {
      setAlterando('');
    }
  }

  // Mensagem que aparece logo abaixo da navegação
  let mensagem = '';
  if (carregando) {
    mensagem = 'Carregando horários...';
  } else if (erro) {
    mensagem = erro;
  } else if (horarios.length === 1) {
    mensagem = '1 horário cadastrado.';
  } else if (horarios.length > 1) {
    mensagem = `${horarios.length} horários cadastrados.`;
  }

  return (
    <main className="horarios-page">
      <section
        className="horarios-card gerenciamento-card"
        aria-labelledby="gerenciamento-horarios-title"
      >
        <div className="brand">
          <span className="brand-name">Agenda</span>
          <Image src="/agenda-plus-transparent.png" alt="" width={28} height={28} />
        </div>
        <h1 id="gerenciamento-horarios-title">Gerenciamento de horários</h1>
        <p className="description">
          Consulte os horários cadastrados e controle quais estão disponíveis para os
          pacientes.
        </p>

        <nav className="links-nav" aria-label="Navegação">
          <Link href="/inicio" className="link-nav">
            Início
          </Link>
        </nav>

        <p className="form-message" role="status">
          {mensagem}
        </p>

        {/* Resultado da última alteração de status */}
        <p className={`aviso${aviso && !aviso.sucesso ? ' aviso-erro' : ''}`} role="status">
          {aviso && aviso.texto}
        </p>

        {/* Aviso quando ainda não existe nenhum horário cadastrado */}
        {!carregando && !erro && horarios.length === 0 && (
          <p className="sem-horarios">Nenhum horário cadastrado.</p>
        )}

        {!carregando && horarios.length > 0 && (
          <ul className="lista-horarios" style={{ marginTop: 16 }}>
            {horarios.map((horario) => {
              const chave = chaveDoHorario(horario);
              const estaAlterando = alterando === chave;
              const proximoStatus: StatusGerenciamentoHorario =
                horario.Status === 'Liberado' ? 'Bloqueado' : 'Liberado';

              return (
                <li className="horario" key={chave}>
                  <span className="horario-hora horario-hora-gerenciamento">
                    {formatarData(horario.Data)}
                    <br />
                    {horario.HoraInicio} – {horario.HoraFim}
                  </span>

                  <div className="horario-detalhes">
                    <strong>{horario.Médico.Nome}</strong>
                    <span>
                      {horario.Médico.Especialidade} · CRM-{horario.Médico.UFCRM}{' '}
                      {horario.Médico.CRM}
                    </span>
                    <span>
                      {horario.Clinica.Nome} · {horario.Clinica.Endereço.Logradouro},{' '}
                      {horario.Clinica.Endereço.Número} – {horario.Clinica.Endereço.Bairro},{' '}
                      {horario.Clinica.Endereço.Cidade}
                    </span>
                  </div>

                  <div className="horario-acao">
                    <span className={`status ${CLASSE_STATUS[horario.Status]}`}>
                      {horario.Status}
                    </span>

                    {horario.Status === 'Reservado' ? (
                      <span className="gerenciamento-sem-acao">Sem ações disponíveis</span>
                    ) : (
                      <button
                        type="button"
                        className="botao-secundario"
                        disabled={estaAlterando}
                        onClick={() => alterar(horario, proximoStatus)}
                      >
                        {estaAlterando
                          ? proximoStatus === 'Liberado'
                            ? 'Liberando...'
                            : 'Bloqueando...'
                          : proximoStatus === 'Liberado'
                            ? 'Liberar horário'
                            : 'Bloquear horário'}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
