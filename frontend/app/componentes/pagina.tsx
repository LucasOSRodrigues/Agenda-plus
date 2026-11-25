import type { ReactNode } from 'react';
import Cabecalho, { type Area } from './cabecalho';
import MarcaAbertura from './marca-abertura';
import estilos from './estrutura.module.css';

type Propriedades = {
  area: Area;
  titulo: string;
  descricao: string;
  className?: string;
  children: ReactNode;
};

const ROTULO_AREA: Record<Area, string> = {
  acesso: '',
  paciente: 'Portal do paciente',
  secretaria: 'Secretaria',
  administracao: 'Administração',
};

// Estrutura comum das telas, com navegação, faixa de abertura e conteúdo.
export default function Pagina({ area, titulo, descricao, className = '', children }: Propriedades) {
  return (
    <>
      <Cabecalho area={area} />
      <main>
        <header className={estilos.abertura}>
          <MarcaAbertura />
          <div className="largura-pagina">
            {ROTULO_AREA[area] && <p className={estilos.rotulo}>{ROTULO_AREA[area]}</p>}
            <h1>{titulo}</h1>
            <p className={estilos.descricao}>{descricao}</p>
          </div>
        </header>

        <div className={`largura-pagina ${estilos.conteudo} ${className}`}>{children}</div>
      </main>
    </>
  );
}
