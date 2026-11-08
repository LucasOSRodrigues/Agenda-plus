'use client';

// Tela de gerenciamento de horários (/gerenciamento/horarios)
// Mostra todos os horários e permite que a secretária libere ou bloqueie cada um (H09)

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  alterarStatusHorario,
  cadastrarHorario,
  listarClinicas,
  listarHorariosGerenciamento,
  listarMedicos,
} from '../../../services/horarios';
import type {
  ChaveHorario,
  Clinica,
  HorarioDetalhado,
  Medico,
  StatusGerenciamentoHorario,
  StatusHorario,
} from '@shared/agenda';

type Aviso = { texto: string; sucesso: boolean };
type FormularioHorario = {
  CodigoMedico: string;
  CNPJ: string;
  Data: string;
  HoraInicio: string;
  HoraFim: string;
};

const FORMULARIO_VAZIO: FormularioHorario = {
  CodigoMedico: '',
  CNPJ: '',
  Data: '',
  HoraInicio: '',
  HoraFim: '',
};

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

// Data de hoje no formato do campo de data (AAAA-MM-DD)
function dataDeHoje(): string {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

// Horário é entidade fraca, então é identificado por Médico + Data + HoraInicio
function chaveDoHorario(horario: ChaveHorario): string {
  return `${horario.Médico.Código}-${horario.Data}-${horario.HoraInicio}`;
}

function compararHorarios(a: HorarioDetalhado, b: HorarioDetalhado): number {
  return (
    a.Data.localeCompare(b.Data) ||
    a.HoraInicio.localeCompare(b.HoraInicio) ||
    a.Médico.Nome.localeCompare(b.Médico.Nome, 'pt-BR')
  );
}

export default function GerenciamentoHorariosPage() {
  const [horarios, setHorarios] = useState<HorarioDetalhado[]>([]);
  const [clinicas, setClinicas] = useState<Clinica[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [formulario, setFormulario] = useState<FormularioHorario>(FORMULARIO_VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [hoje, setHoje] = useState('');
  const [cadastrando, setCadastrando] = useState(false);
  // Chave do horário cujo status está sendo alterado
  const [alterando, setAlterando] = useState('');
  // Resultado da última alteração: { texto, sucesso }
  const [aviso, setAviso] = useState<Aviso | null>(null);

  async function carregar() {
    try {
      const [horariosCarregados, clinicasCarregadas, medicosCarregados] = await Promise.all([
        listarHorariosGerenciamento(),
        listarClinicas(),
        listarMedicos(),
      ]);
      setHorarios(horariosCarregados);
      setClinicas(clinicasCarregadas);
      setMedicos(medicosCarregados);
    } catch {
      setHorarios([]);
      setErro('Não foi possível carregar os horários. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  // Quando a tela abre, carrega todos os horários para gerenciamento
  useEffect(() => {
    setHoje(dataDeHoje());
    carregar();
  }, []);

  // Atualiza só o campo do formulário que foi alterado e mantém os outros
  function alterarCampo(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setFormulario((atual) => ({ ...atual, [name]: value }));
  }

  // Envia o novo horário e inclui o resultado na lista de gerenciamento
  async function cadastrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAviso(null);

    if (Object.values(formulario).some((valor) => valor === '')) {
      setAviso({ texto: 'Preencha todos os campos do horário.', sucesso: false });
      return;
    }
    if (formulario.Data < hoje) {
      setAviso({ texto: 'A data do horário não pode estar no passado.', sucesso: false });
      return;
    }
    if (formulario.HoraFim <= formulario.HoraInicio) {
      setAviso({ texto: 'A hora final deve ser posterior à hora inicial.', sucesso: false });
      return;
    }

    setCadastrando(true);
    try {
      const novo = await cadastrarHorario({
        Médico: { Código: Number(formulario.CodigoMedico) },
        Clinica: { CNPJ: formulario.CNPJ },
        Data: formulario.Data,
        HoraInicio: formulario.HoraInicio,
        HoraFim: formulario.HoraFim,
      });
      setHorarios((atuais) => [...atuais, novo].sort(compararHorarios));
      setFormulario(FORMULARIO_VAZIO);
      setAviso({ texto: 'Horário cadastrado com sucesso.', sucesso: true });
    } catch (e) {
      setAviso({ texto: (e as Error).message, sucesso: false });
    } finally {
      setCadastrando(false);
    }
  }

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

        <section className="cadastro-horario" aria-labelledby="cadastro-horario-title">
          <h2 id="cadastro-horario-title">Cadastrar horário</h2>
          <form className="formulario-horario" onSubmit={cadastrar} noValidate>
            <div className="field">
              <label htmlFor="cadastro-medico">Médico</label>
              <select
                id="cadastro-medico"
                name="CodigoMedico"
                value={formulario.CodigoMedico}
                onChange={alterarCampo}
                required
              >
                <option value="">Selecione</option>
                {medicos.map((medico) => (
                  <option key={medico.Código} value={medico.Código}>
                    {medico.Nome} — {medico.Especialidade}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="cadastro-clinica">Clínica</label>
              <select
                id="cadastro-clinica"
                name="CNPJ"
                value={formulario.CNPJ}
                onChange={alterarCampo}
                required
              >
                <option value="">Selecione</option>
                {clinicas.map((clinica) => (
                  <option key={clinica.CNPJ} value={clinica.CNPJ}>
                    {clinica.Nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="cadastro-data">Data</label>
              <input
                id="cadastro-data"
                name="Data"
                type="date"
                min={hoje || undefined}
                value={formulario.Data}
                onChange={alterarCampo}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="cadastro-hora-inicio">Hora inicial</label>
              <input
                id="cadastro-hora-inicio"
                name="HoraInicio"
                type="time"
                value={formulario.HoraInicio}
                onChange={alterarCampo}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="cadastro-hora-fim">Hora final</label>
              <input
                id="cadastro-hora-fim"
                name="HoraFim"
                type="time"
                value={formulario.HoraFim}
                onChange={alterarCampo}
                required
              />
            </div>

            <div className="cadastro-acoes">
              <button type="submit" className="botao-cadastrar" disabled={cadastrando}>
                {cadastrando ? 'Cadastrando...' : 'Cadastrar horário'}
              </button>
            </div>
          </form>
        </section>

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
