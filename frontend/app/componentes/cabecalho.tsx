'use client';

import { useId, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import estilos from './estrutura.module.css';

type LinkMenu = { href: string; texto: string; destaque?: boolean };

const MENU = {
  acesso: [
    { href: '/', texto: 'Entrar' },
    { href: '/cadastro', texto: 'Cadastre-se', destaque: true },
  ],
  paciente: [
    { href: '/inicio', texto: 'Início' },
    { href: '/horarios', texto: 'Horários' },
    { href: '/solicitacoes', texto: 'Minhas solicitações', destaque: true },
    { href: '/', texto: 'Sair' },
  ],
  secretaria: [
    { href: '/inicio', texto: 'Início' },
    { href: '/gerenciamento/horarios', texto: 'Horários' },
    { href: '/gerenciamento/solicitacoes', texto: 'Solicitações' },
    { href: '/', texto: 'Sair' },
  ],
  administracao: [
    { href: '/inicio', texto: 'Início' },
    { href: '/administracao/equipe', texto: 'Equipe' },
    { href: '/', texto: 'Sair' },
  ],
} satisfies Record<string, LinkMenu[]>;

export type Area = keyof typeof MENU;

// O menu mostra apenas os atalhos da área que a pessoa está usando.
export default function Cabecalho({ area }: { area: Area }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const idMenu = useId();
  const caminho = usePathname();
  const links: LinkMenu[] = MENU[area];

  return (
    <header className={estilos.cabecalho}>
      <div className={`largura-pagina ${estilos.cabecalhoConteudo}`}>
        <Link
          href={area === 'acesso' ? '/' : '/inicio'}
          className={estilos.logo}
          aria-label="Agenda+, ir para o início"
        >
          <span>Agenda</span>
          <Image src="/agenda-plus-transparent.png" alt="" width={34} height={34} />
        </Link>

        <button
          type="button"
          className={estilos.botaoMenu}
          aria-expanded={menuAberto}
          aria-controls={idMenu}
          onClick={() => setMenuAberto((aberto) => !aberto)}
        >
          {menuAberto ? 'Fechar' : 'Menu'}
        </button>

        <nav
          id={idMenu}
          className={`${estilos.menu} ${menuAberto ? estilos.menuAberto : ''}`}
          aria-label="Navegação principal"
        >
          {links.map(({ href, texto, destaque }) => (
            <Link
              key={href}
              href={href}
              className={destaque ? estilos.botaoDestaque : estilos.menuLink}
              aria-current={caminho === href ? 'page' : undefined}
              onClick={() => setMenuAberto(false)}
            >
              {texto}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
