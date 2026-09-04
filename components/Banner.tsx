/**
 * Faixa de identificação no topo de toda página.
 *
 * O fundo é o cinza escuro do texto, não o verde. Verde, vermelho e âmbar
 * carregam significado neste site (docs/STACK.md) — verde quer dizer "o SUS
 * entrega". Usá-lo como cor de marca gastaria o sinal justamente onde ele
 * precisa ser lido de relance.
 */
export default function Banner({ municipioNome }: { municipioNome?: string }) {
  return (
    <div className="bg-texto text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-4 py-4 md:px-8 md:py-5">
        <a
          href="/"
          className="text-[22px] font-bold tracking-tight text-white no-underline md:text-[26px]"
        >
          Tem no SUS
        </a>
        <p className="max-w-[52ch] text-[#E8E8E8]">
          {municipioNome
            ? `O que o SUS entrega em ${municipioNome}, onde retirar e o que levar.`
            : "O que o SUS entrega, onde retirar e o que levar."}
        </p>
      </div>
    </div>
  );
}
