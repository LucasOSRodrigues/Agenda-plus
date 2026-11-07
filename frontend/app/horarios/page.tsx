'use client';

// Tela de consulta de horários (/horarios)
// Mostra os horários disponíveis e os filtros por clínica, especialidade e data
// O paciente também pode solicitar o agendamento de um horário (H04)

import { useEffect, useState, type ChangeEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  buscarHorariosDisponiveis,
  listarClinicas,
  listarEspecialidades,
} from '../../services/horarios';
import { listarChavesSolicitadas, solicitarAgendamento } from '../../services/solicitacoes';
import type { ChaveHorario, Clinica, HorarioDetalhado } from '../../types/agenda';

type Filtros = { CNPJ: string; Especialidade: string; Data: string };
type Aviso = { texto: string; sucesso: boolean };

// Valores iniciais dos filtros (vazio = não filtra)
const FILTROS_VAZIOS: Filtros = { CNPJ: '', Especialidade: '', Data: '' };

// Data de hoje no formato do campo de data (AAAA-MM-DD)
function dataDeHoje(): string {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

// Transforma a data em texto
function formatarData(data: string): string {
  const texto = new Date(`${data}T00:00`).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Separa os horários (já ordenados) em grupos por Data
function agruparPorData(horarios: HorarioDetalhado[]): [string, HorarioDetalhado[]][] {
  const grupos = new Map<string, HorarioDetalhado[]>();
  for (const horario of horarios) {
    if (!grupos.has(horario.Data)) {
      grupos.set(horario.Data, []);
    }
    grupos.get(horario.Data)!.push(horario);
  }
  return [...grupos.entries()];
}

// Horário é entidade fraca, então é identificado por Médico + Data + HoraInicio
function chaveDoHorario(horario: ChaveHorario): string {
  return `${horario.Médico.Código}-${horario.Data}-${horario.HoraInicio}`;
}

export default function ConsultaHorariosPage() {
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VAZIOS);
  const [clinicas, setClinicas] = useState<Clinica[]>([]);
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [horarios, setHorarios] = useState<HorarioDetalhado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [hoje, setHoje] = useState('');
  // Chaves dos horários que o paciente já solicitou
  const [solicitados, setSolicitados] = useState<string[]>([]);
  // Chave do horário cuja solicitação está sendo enviada
  const [enviando, setEnviando] = useState('');
  // Resultado da última solicitação: { texto, sucesso }
  const [aviso, setAviso] = useState<Aviso | null>(null);

  // Quando a tela abre, carrega a data de hoje e as opções dos filtros
  useEffect(() => {
    setHoje(dataDeHoje());
    listarClinicas().then(setClinicas);
    listarEspecialidades().then(setEspecialidades);
    listarChavesSolicitadas().then(setSolicitados);
  }, []);

  // Busca os horários de novo sempre que algum filtro muda
  useEffect(() => {
    // Se o filtro mudar antes da busca terminar, o resultado dela é ignorado
    let ativo = true;
    setCarregando(true);
    setErro('');

    buscarHorariosDisponiveis(filtros)
      .then((resultado) => {
        if (ativo) setHorarios(resultado);
      })
      .catch(() => {
        if (ativo) {
          setHorarios([]);
          setErro('Não foi possível carregar os horários. Tente novamente.');
        }
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [filtros]);

  // Atualiza só o filtro que foi alterado e mantém os outros
  function alterarFiltro(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setFiltros((atuais) => ({ ...atuais, [name]: value }));
  }

  // Envia a solicitação de agendamento do horário escolhido
  async function solicitar(horario: HorarioDetalhado) {
    setEnviando(chaveDoHorario(horario));
    setAviso(null);
    try {
      await solicitarAgendamento(horario);
      setAviso({ texto: 'Solicitação enviada! Agora é só aguardar a confirmação.', sucesso: true });
    } catch (e) {
      setAviso({ texto: (e as Error).message, sucesso: false });
    } finally {
      setSolicitados(await listarChavesSolicitadas());
      setEnviando('');
    }
  }

  const temFiltro = Object.values(filtros).some(Boolean);
  const grupos = agruparPorData(horarios);

  // Mensagem que aparece logo abaixo dos filtros
  let mensagem = '';
  if (carregando) {
    mensagem = 'Carregando horários...';
  } else if (erro) {
    mensagem = erro;
  } else if (horarios.length === 1) {
    mensagem = '1 horário disponível.';
  } else if (horarios.length > 1) {
    mensagem = `${horarios.length} horários disponíveis.`;
  }

  return (
    <main className="horarios-page">
      <section className="horarios-card" aria-labelledby="horarios-title">
        <div className="brand">
          <span className="brand-name">Agenda</span>
          <Image src="/agenda-plus-transparent.png" alt="" width={28} height={28} />
        </div>
        <h1 id="horarios-title">Horários disponíveis</h1>
        <p className="description">
          Veja os horários livres para consulta. Use os filtros para escolher a clínica, a
          especialidade ou o dia.
        </p>

        <nav className="links-nav" aria-label="Navegação">
          <Link href="/inicio" className="link-nav">
            Início
          </Link>
          <Link href="/solicitacoes" className="link-nav">
            Minhas solicitações
          </Link>
        </nav>

        {/* Filtros: a busca acontece assim que um campo muda, sem botão de enviar */}
        <form className="filtros" onSubmit={(event) => event.preventDefault()}>
          <div className="field">
            <label htmlFor="filtro-clinica">Clínica</label>
            <select
              id="filtro-clinica"
              name="CNPJ"
              value={filtros.CNPJ}
              onChange={alterarFiltro}
            >
              <option value="">Todas</option>
              {clinicas.map((clinica) => (
                <option key={clinica.CNPJ} value={clinica.CNPJ}>
                  {clinica.Nome}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="filtro-especialidade">Especialidade</label>
            <select
              id="filtro-especialidade"
              name="Especialidade"
              value={filtros.Especialidade}
              onChange={alterarFiltro}
            >
              <option value="">Todas</option>
              {especialidades.map((especialidade) => (
                <option key={especialidade} value={especialidade}>
                  {especialidade}
                </option>
              ))}
            </select>
          </div>

          {/* Não deixa escolher dias que já passaram */}
          <div className="field">
            <label htmlFor="filtro-data">Data</label>
            <input
              id="filtro-data"
              name="Data"
              type="date"
              min={hoje || undefined}
              value={filtros.Data}
              onChange={alterarFiltro}
            />
          </div>
        </form>

        {/* Só aparece quando tem algum filtro escolhido */}
        {temFiltro && (
          <button
            type="button"
            className="botao-secundario"
            onClick={() => setFiltros(FILTROS_VAZIOS)}
          >
            Limpar filtros
          </button>
        )}

        <p className="form-message" role="status">
          {mensagem}
        </p>

        {/* Resultado da solicitação (sucesso ou erro) */}
        <p className={`aviso${aviso && !aviso.sucesso ? ' aviso-erro' : ''}`} role="status">
          {aviso && aviso.texto}
          {aviso && aviso.sucesso && (
            <>
              {' '}
              <Link href="/solicitacoes">Ver minhas solicitações</Link>
            </>
          )}
        </p>

        {/* Aviso quando não tem nenhum horário disponível */}
        {!carregando && !erro && horarios.length === 0 && (
          <p className="sem-horarios">
            Nenhum horário disponível
            {temFiltro ? ' para os filtros escolhidos. Tente outra clínica, especialidade ou data.' : ' no momento.'}
          </p>
        )}

        {/* Lista dos horários, separada por dia */}
        {!carregando &&
          grupos.map(([data, horariosDoDia]) => (
            <section className="dia" key={data} aria-labelledby={`dia-${data}`}>
              <h2 id={`dia-${data}`}>{formatarData(data)}</h2>
              <ul className="lista-horarios">
                {horariosDoDia.map((horario) => (
                  <li className="horario" key={chaveDoHorario(horario)}>
                    <span className="horario-hora">
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
                      {solicitados.includes(chaveDoHorario(horario)) ? (
                        <span className="solicitado">Solicitado</span>
                      ) : (
                        <button
                          type="button"
                          className="botao-solicitar"
                          disabled={enviando === chaveDoHorario(horario)}
                          onClick={() => solicitar(horario)}
                        >
                          {enviando === chaveDoHorario(horario) ? 'Enviando...' : 'Solicitar consulta'}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
      </section>
    </main>
  );
}