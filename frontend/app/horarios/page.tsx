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
  listarMedicos,
} from '../../services/horarios';
import { listarChavesSolicitadas, solicitarAgendamento } from '../../services/solicitacoes';
import type { ChaveHorario, Clinica, HorarioDetalhado } from '@shared/agenda';
import Cabecalho from '../componentes/cabecalho';
import MarcaAbertura from '../componentes/marca-abertura';
import estilos from './horarios.module.css';

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

// Mostra a quantidade
function mostrarTotal(total: number | null): string {
  return total === null ? '–' : String(total);
}

// Escolhe a palavra no singular ou no plural
function palavra(quantidade: number, singular: string, plural: string): string {
  return quantidade === 1 ? singular : plural;
}

// Horário é entidade fraca, então é identificado por Médico + Data + HoraInicio
function chaveDoHorario(horario: ChaveHorario): string {
  return `${horario.Médico.Código}-${horario.Data}-${horario.HoraInicio}`;
}

export default function ConsultaHorariosPage() {
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VAZIOS);
  const [clinicas, setClinicas] = useState<Clinica[]>([]);
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  // Quantidades mostradas na faixa de abertura
  // null = ainda carregando (ou o backend não respondeu), então a tela mostra um traço em vez de 0
  const [totalClinicas, setTotalClinicas] = useState<number | null>(null);
  const [totalEspecialidades, setTotalEspecialidades] = useState<number | null>(null);
  const [totalMedicos, setTotalMedicos] = useState<number | null>(null);
  const [horarios, setHorarios] = useState<HorarioDetalhado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [hoje, setHoje] = useState('');
  // Chaves dos horários que o paciente já solicitou
  const [solicitados, setSolicitados] = useState<string[]>([]);
  // Chave do horário que está sendo solicitado
  const [enviando, setEnviando] = useState('');
  // Resultado da última solicitação: { texto, sucesso }
  const [aviso, setAviso] = useState<Aviso | null>(null);

  // Quando a tela abre, carrega a data de hoje e as opções dos filtros
  useEffect(() => {
    setHoje(dataDeHoje());
    // Se o backend estiver fora do ar, mostra os números com traço
    // e o aviso de erro aparece na busca de horários
    listarClinicas()
      .then((lista) => {
        setClinicas(lista);
        setTotalClinicas(lista.length);
      })
      .catch(() => {});
    listarEspecialidades()
      .then((lista) => {
        setEspecialidades(lista);
        setTotalEspecialidades(lista.length);
      })
      .catch(() => {});
    listarMedicos()
      .then((medicos) => setTotalMedicos(medicos.length))
      .catch(() => {});
    listarChavesSolicitadas().then(setSolicitados).catch(() => {});
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
    <div className={estilos.pagina}>
      <Cabecalho area="paciente" />

      <main>
        {/* Faixa de abertura */}
        <section className={estilos.abertura}>
          <MarcaAbertura />
          <div className={estilos.container}>
            <p className={estilos.aberturaRotulo}>Portal do Paciente</p>
            <h1>Horários disponíveis</h1>
            <p className={estilos.aberturaTexto}>
              Veja os horários livres para consulta. Use os filtros para escolher a clínica, a
              especialidade ou o dia.
            </p>
            <ul className={estilos.destaques}>
              <li>
                <strong>{mostrarTotal(totalClinicas)}</strong>
                <span>{palavra(totalClinicas ?? 0, 'clínica', 'clínicas')}</span>
              </li>
              <li>
                <strong>{mostrarTotal(totalEspecialidades)}</strong>
                <span>{palavra(totalEspecialidades ?? 0, 'especialidade', 'especialidades')}</span>
              </li>
              <li>
                <strong>{mostrarTotal(totalMedicos)}</strong>
                <span>{palavra(totalMedicos ?? 0, 'médico', 'médicos')}</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Filtros: a busca acontece assim que um campo muda, sem botão de enviar */}
        <section className={estilos.busca} aria-labelledby="busca-title">
          <div className={estilos.container}>
            <form className={estilos.buscaPainel} onSubmit={(event) => event.preventDefault()}>
              <h2 id="busca-title" className={estilos.buscaTitulo}>
                Encontre um horário
              </h2>

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

              {/* Só aparece quando tem algum filtro escolhido */}
              {temFiltro && (
                <button
                  type="button"
                  className={estilos.limpar}
                  onClick={() => setFiltros(FILTROS_VAZIOS)}
                >
                  Limpar filtros
                </button>
              )}
            </form>
          </div>
        </section>

        {/* Horários encontrados */}
        <section className={estilos.resultados} aria-labelledby="resultados-title">
          <div className={estilos.container}>
            <div className={estilos.resultadosTopo}>
              <h2 id="resultados-title">Horários encontrados</h2>
              <p className="form-message" role="status">
                {mensagem}
              </p>
            </div>

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

            {/* Lista dos horários, separada por dia, em formato de tabela */}
            {!carregando &&
              grupos.map(([data, horariosDoDia]) => (
                <section className={estilos.dia} key={data} aria-labelledby={`dia-${data}`}>
                  <div className={estilos.diaTitulo}>
                    <h3 id={`dia-${data}`}>{formatarData(data)}</h3>
                    <span>
                      {horariosDoDia.length} {palavra(horariosDoDia.length, 'horário', 'horários')}
                    </span>
                  </div>

                  <div className={estilos.tabela}>
                    {/* Títulos das colunas (computador) */}
                    <div className={estilos.linhaTitulos} aria-hidden="true">
                      <span>Horário</span>
                      <span>Médico</span>
                      <span>Especialidade</span>
                      <span>Local</span>
                      <span />
                    </div>

                    <ul className={estilos.listaLinhas}>
                      {horariosDoDia.map((horario) => (
                        <li className={estilos.linha} key={chaveDoHorario(horario)}>
                          <span className={estilos.hora}>
                            {horario.HoraInicio} – {horario.HoraFim}
                          </span>
                          <div className={estilos.coluna}>
                            <strong>{horario.Médico.Nome}</strong>
                            <span>
                              CRM-{horario.Médico.UFCRM} {horario.Médico.CRM}
                            </span>
                          </div>
                          <div className={estilos.coluna}>
                            <span className={estilos.etiqueta}>{horario.Médico.Especialidade}</span>
                          </div>
                          <div className={estilos.coluna}>
                            <strong>{horario.Clinica.Nome}</strong>
                            <span>
                              {horario.Clinica.Endereço.Logradouro}, {horario.Clinica.Endereço.Número} –{' '}
                              {horario.Clinica.Endereço.Bairro}, {horario.Clinica.Endereço.Cidade}
                            </span>
                          </div>
                          <div className={estilos.acao}>
                            {solicitados.includes(chaveDoHorario(horario)) ? (
                              <span className={estilos.solicitado}>Solicitado</span>
                            ) : (
                              <button
                                type="button"
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
                  </div>
                </section>
              ))}
          </div>
        </section>

        {/* Como funciona o agendamento */}
        <section className={estilos.comoFunciona} aria-labelledby="como-funciona-title">
          <div className={estilos.container}>
            <h2 id="como-funciona-title" className={estilos.secaoTitulo}>
              Como funciona
            </h2>
            <p className={estilos.secaoTexto}>Agende sua consulta em três passos, sem precisar ligar.</p>
            <ol className={estilos.passos}>
              <li className={estilos.passo}>
                <span className={estilos.passoNumero}>1</span>
                <h3>Escolha um horário</h3>
                <p>Use os filtros para encontrar um horário livre na clínica, especialidade e dia que preferir.</p>
              </li>
              <li className={estilos.passo}>
                <span className={estilos.passoNumero}>2</span>
                <h3>Solicite a consulta</h3>
                <p>Clique em “Solicitar consulta”. A solicitação fica pendente até a secretaria analisar.</p>
              </li>
              <li className={estilos.passo}>
                <span className={estilos.passoNumero}>3</span>
                <h3>Aguarde a confirmação</h3>
                <p>A secretaria confirma ou recusa, e você acompanha tudo em “Minhas solicitações”.</p>
              </li>
            </ol>
          </div>
        </section>

        {/* As clínicas que fornecem os horários */}
        {clinicas.length > 0 && (
          <section className={estilos.unidades} aria-labelledby="unidades-title">
            <div className={estilos.container}>
              <h2 id="unidades-title" className={estilos.secaoTitulo}>
                Nossas unidades
              </h2>
              <p className={estilos.secaoTexto}>Clínicas onde as consultas acontecem.</p>
              <ul className={estilos.listaUnidades}>
                {clinicas.map((clinica) => (
                  <li className={estilos.unidade} key={clinica.CNPJ}>
                    <h3>{clinica.Nome}</h3>
                    <p>
                      {clinica.Endereço.Logradouro}, {clinica.Endereço.Número} – {clinica.Endereço.Bairro},{' '}
                      {clinica.Endereço.Cidade}
                    </p>
                    <p>{clinica['E-mail'].join(' · ')}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>

      {/* Rodapé */}
      <footer className={estilos.rodape}>
        <div className={`${estilos.container} ${estilos.rodapeConteudo}`}>
          <div>
            <Link href="/inicio" className={estilos.logo} aria-label="Agenda+, ir para o início">
              <span>Agenda</span>
              <Image src="/agenda-plus-transparent.png" alt="" width={30} height={30} />
            </Link>
            <p className={estilos.rodapeTexto}>
              Agendamento de consultas em clínicas e consultórios, sem depender de ligações.
            </p>
          </div>
          <nav className={estilos.rodapeLinks} aria-label="Links do rodapé">
            <Link href="/inicio">Início</Link>
            <Link href="/horarios">Horários</Link>
            <Link href="/solicitacoes">Minhas solicitações</Link>
          </nav>
        </div>
        <p className={`${estilos.container} ${estilos.rodapeFim}`}>
          Agenda+ · Projeto da disciplina de Engenharia de Software 2, UFOP
        </p>
      </footer>
    </div>
  );
}
