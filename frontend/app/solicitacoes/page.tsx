'use client';

// Tela de acompanhamento das solicitações (/solicitacoes)
// Mostra a lista de solicitações do paciente com o status atual de cada uma (H05)
// O paciente pode cancelar as solicitações que ainda estão pendentes (H04)

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cancelarSolicitacao, listarSolicitacoesDoPaciente } from '../../services/solicitacoes';
import type { SolicitacaoDetalhada, StatusSolicitacao } from '@shared/agenda';

type Aviso = { texto: string; sucesso: boolean };

// Classe de cor de cada status (ver .status-* no globals.css)
const CLASSE_STATUS: Record<StatusSolicitacao, string> = {
  Pendente: 'status-pendente',
  Confirmada: 'status-confirmada',
  Recusada: 'status-recusada',
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

export default function MinhasSolicitacoesPage() {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoDetalhada[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  // Resultado do último cancelamento: { texto, sucesso }
  const [aviso, setAviso] = useState<Aviso | null>(null);

  async function carregar() {
    try {
      setSolicitacoes(await listarSolicitacoesDoPaciente());
    } catch {
      setSolicitacoes([]);
      setErro('Não foi possível carregar as solicitações. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  // Quando a tela abre, carrega as solicitações do paciente
  useEffect(() => {
    carregar();
  }, []);

  // Cancela a solicitação depois de o paciente confirmar
  async function cancelar(solicitacao: SolicitacaoDetalhada) {
    if (!window.confirm('Cancelar esta solicitação de consulta?')) return;
    setAviso(null);
    try {
      await cancelarSolicitacao(solicitacao.Código);
      setAviso({ texto: 'Solicitação cancelada.', sucesso: true });
    } catch (e) {
      setAviso({ texto: (e as Error).message, sucesso: false });
    }
    await carregar();
  }

  // Mensagem que aparece logo abaixo da navegação
  let mensagem = '';
  if (carregando) {
    mensagem = 'Carregando solicitações...';
  } else if (erro) {
    mensagem = erro;
  } else if (solicitacoes.length === 1) {
    mensagem = '1 solicitação.';
  } else if (solicitacoes.length > 1) {
    mensagem = `${solicitacoes.length} solicitações.`;
  }

  return (
    <main className="horarios-page">
      <section className="horarios-card" aria-labelledby="solicitacoes-title">
        <div className="brand">
          <span className="brand-name">Agenda</span>
          <Image src="/agenda-plus-transparent.png" alt="" width={28} height={28} />
        </div>
        <h1 id="solicitacoes-title">Minhas solicitações</h1>
        <p className="description">
          Acompanhe se suas consultas estão pendentes, confirmadas ou recusadas.
        </p>

        <nav className="links-nav" aria-label="Navegação">
          <Link href="/inicio" className="link-nav">
            Início
          </Link>
          <Link href="/horarios" className="link-nav">
            Horários disponíveis
          </Link>
        </nav>

        <p className="form-message" role="status">
          {mensagem}
        </p>

        {/* Resultado do cancelamento (sucesso ou erro) */}
        <p className={`aviso${aviso && !aviso.sucesso ? ' aviso-erro' : ''}`} role="status">
          {aviso && aviso.texto}
        </p>

        {/* Aviso quando o paciente ainda não pediu nenhuma consulta */}
        {!carregando && !erro && solicitacoes.length === 0 && (
          <p className="sem-horarios">
            Você ainda não solicitou nenhuma consulta.{' '}
            <Link href="/horarios">Ver horários disponíveis</Link>
          </p>
        )}

        {!carregando && solicitacoes.length > 0 && (
          <ul className="lista-horarios" style={{ marginTop: 16 }}>
            {solicitacoes.map((solicitacao) => (
              <li className="horario" key={solicitacao.Código}>
                <span className="horario-hora horario-hora-solicitacao">
                  {formatarData(solicitacao.Data)}
                  <br />
                  {solicitacao.HoraInicio} – {solicitacao.HoraFim}
                </span>

                <div className="horario-detalhes">
                  <strong>{solicitacao.Médico.Nome}</strong>
                  <span>
                    {solicitacao.Médico.Especialidade} · CRM-{solicitacao.Médico.UFCRM}{' '}
                    {solicitacao.Médico.CRM}
                  </span>
                  {solicitacao.Clinica && (
                    <span>
                      {solicitacao.Clinica.Nome} · {solicitacao.Clinica.Endereço.Logradouro},{' '}
                      {solicitacao.Clinica.Endereço.Número} – {solicitacao.Clinica.Endereço.Bairro},{' '}
                      {solicitacao.Clinica.Endereço.Cidade}
                    </span>
                  )}

                  {/* Solicitações recusadas mostram a justificativa do secretário */}
                  {solicitacao.Status === 'Recusada' && (
                    <p className="justificativa">
                      <strong>Motivo da recusa:</strong>{' '}
                      {solicitacao.Justificativa || 'Nenhuma justificativa foi informada.'}
                    </p>
                  )}
                </div>

                <div className="horario-acao">
                  <span className={`status ${CLASSE_STATUS[solicitacao.Status]}`}>
                    {solicitacao.Status}
                  </span>
                  {/* Só solicitações pendentes podem ser canceladas */}
                  {solicitacao.Status === 'Pendente' && (
                    <button
                      type="button"
                      className="botao-secundario"
                      onClick={() => cancelar(solicitacao)}
                    >
                      Cancelar solicitação
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}