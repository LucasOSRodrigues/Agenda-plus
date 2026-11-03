'use client';

// Tela de acompanhamento das solicitações (/solicitacoes)
// Mostra a lista de solicitações do paciente com o status atual de cada uma (H05)

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { listarSolicitacoesDoPaciente } from '../../services/solicitacoes';
import { STATUS_SOLICITACAO } from '../../mocks/banco';

// Classe de cor de cada status (ver .status-* no globals.css)
const CLASSE_STATUS = {
  [STATUS_SOLICITACAO.PENDENTE]: 'status-pendente',
  [STATUS_SOLICITACAO.CONFIRMADA]: 'status-confirmada',
  [STATUS_SOLICITACAO.RECUSADA]: 'status-recusada',
};

// Transforma a data (AAAA-MM-DD) em texto, ex.: "Quarta-feira, 5 de novembro"
function formatarData(data) {
  const texto = new Date(`${data}T00:00`).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default function MinhasSolicitacoesPage() {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  // Quando a tela abre, carrega as solicitações do paciente
  useEffect(() => {
    listarSolicitacoesDoPaciente()
      .then(setSolicitacoes)
      .catch(() => setErro('Não foi possível carregar as solicitações. Tente novamente.'))
      .finally(() => setCarregando(false));
  }, []);

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
                  {solicitacao.Status === STATUS_SOLICITACAO.RECUSADA && (
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
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}