import Image from 'next/image';
import estilos from './estrutura.module.css';

// Marca d'água usada na faixa de abertura das telas.
export default function MarcaAbertura() {
  return (
    <Image
      src="/agenda-plus-transparent.png"
      alt=""
      width={320}
      height={320}
      className={estilos.aberturaEnfeite}
    />
  );
}
