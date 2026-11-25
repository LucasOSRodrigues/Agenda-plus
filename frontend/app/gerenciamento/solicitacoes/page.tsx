'use client';

// Tela de gerenciamento de solicitações (/gerenciamento/solicitacoes)
// A secretária vê as solicitações dos pacientes e confirma ou recusa as pendentes (H08)
// Recusar exige uma justificativa, que aparece para o paciente em /solicitacoes

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import Pagina from '../../componentes/pagina';
import {
  confirmarOuRecusarSolicitacao,
  listarSolicitacoesGerenciamento,
} from '../../../services/solicitacoes';
import type {
  DecisaoSolicitacao,
  SolicitacaoGerenciamento,
  StatusSolicitacao,
} from '@shared/agenda';

type Aviso = { texto: string; sucesso: boolean };
// '' = todas as solicitações
type FiltroStatus = StatusSolicitacao | '';

// Classe de cor de cada status (ver .status-* no globals.css)
const CLASSE_STATUS: Record<StatusSolicitacao, string> = {
  Pendente: 'status-pendente',
  Confirmada: 'status-confirmada',
  Recusada: 'status-recusada',
};

const OPCOES_FILTRO: { valor: FiltroStatus; texto: string }[] = [
  { valor: 'Pendente', texto: 'Pendentes' },
  { valor: 'Confirmada', texto: 'Confirmadas' },
  { valor: 'Recusada', texto: 'Recusadas' },
  { valor: '', texto: 'Todas' },
];

// Transforma a data (AAAA-MM-DD) em texto, ex.: "Quarta-feira, 5 de novembro"
function formatarData(data: string): string {
  const texto = new Date(`${data}T00:00`).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Data e hora em que o paciente fez a solicitação, ex.: "18/11/2026 às 14:05"
function formatarMomento(iso: string): string {
  const momento = new Date(iso);
  const data = momento.toLocaleDateString('pt-BR');
  const hora = momento.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${data} às ${hora}`;
}

export default function GerenciamentoSolicitacoesPage() {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoGerenciamento[]>([]);
  const [filtro, setFiltro] = useState<FiltroStatus>('Pendente');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  // Código da solicitação que está sendo confirmada ou recusada
  const [enviando, setEnviando] = useState<number | null>(null);
  // Código da solicitação com o campo de justificativa aberto, e o texto digitado
  const [recusando, setRecusando] = useState<number | null>(null);
  const [justificativa, setJustificativa] = useState('');
  // Resultado da última decisão: { texto, sucesso }
  const [aviso, setAviso] = useState<Aviso | null>(null);

  async function carregar(status: FiltroStatus) {
    setCarregando(true);
    setErro('');
    try {
      setSolicitacoes(await listarSolicitacoesGerenciamento(status || undefined));
    } catch {
      setSolicitacoes([]);
      setErro('Não foi possível carregar as solicitações. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  // Carrega a lista quando a tela abre e sempre que o filtro muda
  useEffect(() => {
    carregar(filtro);
  }, [filtro]);

  function alterarFiltro(event: ChangeEvent<HTMLSelectElement>) {
    setFiltro(event.target.value as FiltroStatus);
    setRecusando(null);
    setAviso(null);
  }

  function abrirRecusa(codigo: number) {
    setRecusando(codigo);
    setJustificativa('');
    setAviso(null);
  }

  // Envia a decisão e recarrega a lista, porque confirmar uma solicitação
  // também recusa as outras pendentes do mesmo horário
  async function decidir(solicitacao: SolicitacaoGerenciamento, decisao: DecisaoSolicitacao) {
    setEnviando(solicitacao.Código);
    setAviso(null);
    try {
      await confirmarOuRecusarSolicitacao(solicitacao.Código, decisao);
      setRecusando(null);
      setAviso({
        texto:
          decisao.Status === 'Confirmada'
            ? `Consulta de ${solicitacao.Paciente.Nome} confirmada.`
            : `Solicitação de ${solicitacao.Paciente.Nome} recusada.`,
        sucesso: true,
      });
    } catch (e) {
      setAviso({ texto: (e as Error).message, sucesso: false });
    } finally {
      setEnviando(null);
    }
    await carregar(filtro);
  }

  function recusar(event: FormEvent<HTMLFormElement>, solicitacao: SolicitacaoGerenciamento) {
    event.preventDefault();
    if (justificativa.trim() === '') {
      setAviso({ texto: 'Informe a justificativa da recusa.', sucesso: false });
      return;
    }
    decidir(solicitacao, { Status: 'Recusada', Justificativa: justificativa.trim() });
  }

  // Mensagem que aparece no início da lista
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
    <Pagina
      area="secretaria"
      titulo="Solicitações de consulta"
      descricao="Confirme ou recuse os pedidos de consulta dos pacientes."
      className="gerenciamento-conteudo"
    >
      <section className="painel" aria-labelledby="filtro-title">
        <h2 id="filtro-title" className="titulo-secao">Filtros</h2>
        <div className="field filtro-solicitacoes">
          <label htmlFor="filtro-status">Status da solicitação</label>
          <select id="filtro-status" value={filtro} onChange={alterarFiltro}>
            {OPCOES_FILTRO.map((opcao) => (
              <option key={opcao.texto} value={opcao.valor}>
                {opcao.texto}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section aria-labelledby="gerenciamento-solicitacoes-title">
        <h2 id="gerenciamento-solicitacoes-title" className="titulo-secao">Pedidos de consulta</h2>
        <p className="form-message" role="status">
          {mensagem}
        </p>

        {/* Resultado da última decisão (sucesso ou erro) */}
        <p className={`aviso${aviso && !aviso.sucesso ? ' aviso-erro' : ''}`} role="status">
          {aviso && aviso.texto}
        </p>

        {!carregando && !erro && solicitacoes.length === 0 && (
          <p className="sem-horarios">
            {filtro === 'Pendente'
              ? 'Nenhuma solicitação aguardando resposta.'
              : 'Nenhuma solicitação encontrada.'}
          </p>
        )}

        {!carregando && solicitacoes.length > 0 && (
          <ul className="lista-horarios">
            {solicitacoes.map((solicitacao) => {
              const estaEnviando = enviando === solicitacao.Código;
              const idJustificativa = `justificativa-${solicitacao.Código}`;

              return (
                <li className="horario" key={solicitacao.Código}>
                  <span className="horario-hora">
                    {formatarData(solicitacao.Data)}
                    <br />
                    {solicitacao.HoraInicio} – {solicitacao.HoraFim}
                  </span>

                  <div className="horario-detalhes">
                    <strong>{solicitacao.Paciente.Nome}</strong>
                    <span>
                      {solicitacao.Médico.Nome} · {solicitacao.Médico.Especialidade}
                    </span>
                    {solicitacao.Clinica && <span>{solicitacao.Clinica.Nome}</span>}
                    <span>Pedido em {formatarMomento(solicitacao.DataSolicitacao)}</span>

                    {solicitacao.Status === 'Recusada' && (
                      <p className="justificativa">
                        <strong>Motivo da recusa:</strong>{' '}
                        {solicitacao.Justificativa || 'Nenhuma justificativa foi informada.'}
                      </p>
                    )}

                    {/* Campo da justificativa, aberto pelo botão "Recusar" */}
                    {recusando === solicitacao.Código && (
                      <form
                        className="formulario-recusa"
                        onSubmit={(event) => recusar(event, solicitacao)}
                        noValidate
                      >
                        <label htmlFor={idJustificativa}>Justificativa da recusa</label>
                        <textarea
                          id={idJustificativa}
                          value={justificativa}
                          onChange={(event) => setJustificativa(event.target.value)}
                          placeholder="Ex.: o médico não atenderá neste dia. Escolha outro horário."
                          rows={3}
                          required
                          autoFocus
                        />
                        <div className="formulario-recusa-acoes">
                          <button
                            type="button"
                            className="botao-secundario"
                            disabled={estaEnviando}
                            onClick={() => setRecusando(null)}
                          >
                            Voltar
                          </button>
                          <button type="submit" className="botao-recusar" disabled={estaEnviando}>
                            {estaEnviando ? 'Recusando...' : 'Confirmar recusa'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  <div className="horario-acao">
                    <span className={`status ${CLASSE_STATUS[solicitacao.Status]}`}>
                      {solicitacao.Status}
                    </span>

                    {/* Só solicitações pendentes podem ser confirmadas ou recusadas */}
                    {solicitacao.Status === 'Pendente' && recusando !== solicitacao.Código && (
                      <>
                        <button
                          type="button"
                          className="botao-solicitar"
                          disabled={estaEnviando}
                          onClick={() => decidir(solicitacao, { Status: 'Confirmada' })}
                        >
                          {estaEnviando ? 'Confirmando...' : 'Confirmar'}
                        </button>
                        <button
                          type="button"
                          className="botao-secundario"
                          disabled={estaEnviando}
                          onClick={() => abrirRecusa(solicitacao.Código)}
                        >
                          Recusar
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </Pagina>
  );
}
