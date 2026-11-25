'use client';

// Tela inicial (/inicio)
// Painel que o paciente vê depois do login, com atalhos para as funções do sistema

import Link from 'next/link';
import Pagina from '../componentes/pagina';

// Atalhos do portal do paciente (H03 a H06)
// disponivel = false: a tela ainda não existe, então o card aparece desabilitado
const ATALHOS = [
  {
    titulo: 'Horários disponíveis',
    descricao: 'Veja os horários livres e filtre por clínica, especialidade ou dia.',
    href: '/horarios',
    disponivel: true,
  },
  {
    titulo: 'Minhas solicitações',
    descricao: 'Acompanhe se suas consultas estão pendentes, confirmadas ou recusadas.',
    href: '/solicitacoes',
    disponivel: true,
  },
  {
    titulo: 'Reservar medicamento',
    descricao: 'Reserve um medicamento em estoque e anexe a receita quando precisar.',
    href: '/medicamentos',
    disponivel: false,
  },
];

export default function InicioPage() {
  return (
    <Pagina area="paciente" titulo="Olá, bem-vindo!" descricao="O que você quer fazer hoje?">
      <section aria-labelledby="atalhos-title">
        <h2 id="atalhos-title" className="titulo-secao">Serviços</h2>
        <ul className="atalhos">
          {ATALHOS.map((atalho) => (
            <li key={atalho.href}>
              {atalho.disponivel ? (
                <Link href={atalho.href} className="atalho">
                  <strong>{atalho.titulo}</strong>
                  <span>{atalho.descricao}</span>
                </Link>
              ) : (
                <div className="atalho atalho-desabilitado" aria-disabled="true">
                  <strong>{atalho.titulo}</strong>
                  <span>{atalho.descricao}</span>
                  <em>Em breve</em>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </Pagina>
  );
}
